import os
from datetime import datetime
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel, Field, ConfigDict
from sqlalchemy.orm import Session

from .auth import normalize_phone, require_admin
from .database import get_db
from .models import (Attendance, Chat, ClubSettings, Event, Message, Player,
                     ScheduleRule, Team, TelegramAccount, Tournament, User)

router = APIRouter(prefix="/api/admin", dependencies=[Depends(require_admin)])


def initialize_admin(db: Session):
    """Reserve the operator's configured number, including on existing databases."""
    phone = os.getenv("INITIAL_ADMIN_PHONE", "").strip()
    if phone and not db.query(User.id).filter(User.role == "admin", User.active.is_(True)).first():
        phone = normalize_phone(phone)
        user = db.query(User).filter(User.phone == phone).first()
        if user:
            if not user.active:
                raise RuntimeError("INITIAL_ADMIN_PHONE belongs to a blocked user")
            user.role = "admin"
        else:
            db.add(User(phone=phone, name=os.getenv("INITIAL_ADMIN_NAME", "Адміністратор")[:120], role="admin"))
    if not db.get(ClubSettings, 1):
        db.add(ClubSettings(id=1))
    db.commit()


def admin_snapshot(db: Session):
    linked = {row.user_id for row in db.query(TelegramAccount).all()}
    settings = db.get(ClubSettings, 1)
    return {
        "users": [{"id": str(u.id), "name": u.name, "phone": u.phone, "role": u.role,
                   "active": u.active, "telegram": u.id in linked} for u in db.query(User).order_by(User.name).all()],
        "teams": [{"id": str(t.id), "name": t.name, "birthYear": t.birth_year,
                   "coachId": str(t.coach_id)} for t in db.query(Team).order_by(Team.name).all()],
        "settings": {"name": settings.name, "welcome": settings.welcome},
    }


class UserEdit(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    name: str = Field(min_length=2, max_length=120)
    role: Literal["parent", "coach", "admin"]
    active: bool


class TeamEdit(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    name: str = Field(min_length=3, max_length=100)
    birthYear: int = Field(ge=2005, le=2100)
    coachId: int


class ClubEdit(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    name: str = Field(min_length=2, max_length=100)
    welcome: str = Field(max_length=500)


@router.get("")
def overview(db: Session = Depends(get_db)):
    return admin_snapshot(db)


@router.patch("/users/{user_id}")
def edit_user(user_id: int, payload: UserEdit, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    # Serialize administrator changes, including concurrent attempts to remove the last one.
    admins = db.query(User).filter(User.role == "admin", User.active.is_(True)).order_by(User.id).with_for_update().all()
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(404, "Користувача не знайдено")
    removes_admin = user.role == "admin" and (payload.role != "admin" or not payload.active)
    if removes_admin and (user.id == admin.id or len(admins) <= 1):
        raise HTTPException(409, "Не можна забрати власний доступ або доступ останнього адміністратора")
    if (payload.role == "parent" or not payload.active) and db.query(Team.id).filter(Team.coach_id == user.id).first():
        raise HTTPException(409, "Спочатку передайте команди іншому тренеру")
    user.name, user.role, user.active = payload.name, payload.role, payload.active
    db.commit()
    return {"ok": True}


def validate_coach(db: Session, coach_id: int):
    coach = db.get(User, coach_id)
    if not coach or not coach.active or coach.role not in {"coach", "admin"}:
        raise HTTPException(422, "Оберіть активного тренера або адміністратора")
    return coach


@router.post("/teams")
def add_team(payload: TeamEdit, db: Session = Depends(get_db)):
    validate_coach(db, payload.coachId)
    team = Team(name=payload.name, birth_year=payload.birthYear, coach_id=payload.coachId)
    db.add(team)
    db.flush()
    db.add(Chat(team_id=team.id, title=f"{team.name} — батьки", kind="team"))
    db.commit()
    return {"id": str(team.id)}


@router.put("/teams/{team_id}")
def edit_team(team_id: int, payload: TeamEdit, db: Session = Depends(get_db)):
    coach = validate_coach(db, payload.coachId)
    team = db.get(Team, team_id)
    if not team:
        raise HTTPException(404, "Команду не знайдено")
    team.name, team.birth_year, team.coach_id = payload.name, payload.birthYear, coach.id
    for chat in db.query(Chat).filter(Chat.team_id == team.id):
        chat.title = f"{team.name} — батьки" if chat.kind == "team" else f"Тренер {coach.name}"
    db.commit()
    return {"ok": True}


@router.delete("/teams/{team_id}", status_code=204)
def remove_team(team_id: int, db: Session = Depends(get_db)):
    team = db.get(Team, team_id)
    if not team:
        raise HTTPException(404, "Команду не знайдено")
    # Explicit dependent deletion works for both existing SQLite and PostgreSQL installs.
    event_ids = [i for (i,) in db.query(Event.id).filter(Event.team_id == team_id)]
    chat_ids = [i for (i,) in db.query(Chat.id).filter(Chat.team_id == team_id)]
    db.query(Message).filter(Message.chat_id.in_(chat_ids)).delete(synchronize_session=False)
    db.query(Message).filter(Message.event_id.in_(event_ids)).update({"event_id": None}, synchronize_session=False)
    db.query(Attendance).filter(Attendance.event_id.in_(event_ids)).delete(synchronize_session=False)
    for player in list(team.players):
        db.query(Attendance).filter(Attendance.player_id == player.id).delete(synchronize_session=False)
    for model in (Chat, Event, ScheduleRule, Tournament):
        db.query(model).filter(model.team_id == team_id).delete(synchronize_session=False)
    db.delete(team)
    db.commit()
    return Response(status_code=204)


@router.put("/settings")
def edit_club(payload: ClubEdit, db: Session = Depends(get_db)):
    settings = db.get(ClubSettings, 1)
    settings.name, settings.welcome = payload.name, payload.welcome
    db.commit()
    return {"ok": True}


@router.delete("/messages/{message_id}", status_code=204)
def remove_message(message_id: int, db: Session = Depends(get_db)):
    message = db.get(Message, message_id)
    if not message:
        raise HTTPException(404, "Повідомлення не знайдено")
    db.delete(message)
    db.commit()
    return Response(status_code=204)
