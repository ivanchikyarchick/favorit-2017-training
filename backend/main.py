import os
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from pathlib import Path

from apscheduler.schedulers.background import BackgroundScheduler
from fastapi import Depends, FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy import func
from sqlalchemy.orm import Session

from .auth import code_hash, create_access_token, current_user, generate_code, normalize_phone, require_coach
from .database import Base, SessionLocal, engine, get_db
from .models import (
    Attendance,
    Chat,
    Event,
    Message,
    Notification,
    OtpCode,
    Player,
    PushSubscription,
    Team,
    TelegramAccount,
    Tournament,
    User,
)
from .reminders import run_attendance_reminders, send_event_reminders_now
from .telegram import configure_webhook, router as telegram_router, telegram_call
from .schemas import (
    AttendancePayload,
    EventPayload,
    MessagePayload,
    PhoneRequest,
    PlayerPayload,
    PollPayload,
    PushSubscriptionPayload,
    SettingsPayload,
    TeamPayload,
    TournamentPayload,
    VerifyRequest,
)
from .seed import seed_database


ROOT = Path(__file__).resolve().parent.parent
APP_ENV = os.getenv("APP_ENV", "development").lower()
ENABLE_DEMO = os.getenv("ENABLE_DEMO", "true" if APP_ENV != "production" else "false").lower() == "true"
VAPID_PUBLIC_KEY = os.getenv("VAPID_PUBLIC_KEY", "")


def _start_scheduler() -> BackgroundScheduler | None:
    if os.getenv("ENABLE_REMINDER_WORKER", "true").lower() != "true":
        return None
    scheduler = BackgroundScheduler(timezone="UTC")
    scheduler.add_job(run_attendance_reminders, "interval", minutes=1, id="attendance-reminders", max_instances=1)
    scheduler.start()
    return scheduler


@asynccontextmanager
async def lifespan(_: FastAPI):
    if APP_ENV == "production" and os.getenv("JWT_SECRET", "development-only-change-me-not-for-production") == "development-only-change-me-not-for-production":
        raise RuntimeError("JWT_SECRET must be configured in production")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    configure_webhook()
    scheduler = _start_scheduler()
    yield
    if scheduler:
        scheduler.shutdown(wait=False)


app = FastAPI(
    title="ФК Фаворит API",
    version="1.0.0",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

app.include_router(telegram_router)

origins = [origin.strip() for origin in os.getenv("ALLOWED_ORIGINS", "https://ivanchikyarchick.github.io").split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)


def utc_iso(value: datetime) -> str:
    return value.replace(tzinfo=None).isoformat(timespec="seconds") + "Z"


def as_id(value: int | str) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        raise HTTPException(status_code=422, detail="Некоректний ідентифікатор")


def team_ids_for(db: Session, user: User) -> list[int]:
    if user.role == "coach":
        return [team_id for (team_id,) in db.query(Team.id).filter(Team.coach_id == user.id).all()]
    return sorted({child.team_id for child in user.children})


def ensure_team_access(db: Session, user: User, team_id: int) -> Team:
    team = db.get(Team, team_id)
    if not team or team_id not in team_ids_for(db, user):
        raise HTTPException(status_code=404, detail="Команду не знайдено")
    return team


def ensure_coach_team(db: Session, coach: User, team_id: int) -> Team:
    team = db.get(Team, team_id)
    if not team or team.coach_id != coach.id:
        raise HTTPException(status_code=404, detail="Команду не знайдено")
    return team


def can_access_chat(db: Session, user: User, chat: Chat) -> bool:
    if chat.team_id not in team_ids_for(db, user):
        return False
    return user.role == "coach" or chat.kind == "team" or chat.parent_user_id == user.id


def team_guardians(db: Session, team_id: int) -> list[User]:
    players = db.query(Player).filter(Player.team_id == team_id).all()
    unique = {}
    for player in players:
        for guardian in player.guardians:
            unique[guardian.id] = guardian
    return list(unique.values())


def notify_team(db: Session, team_id: int, title: str, text: str, kind: str = "schedule") -> None:
    for guardian in team_guardians(db, team_id):
        if kind == "schedule" and not guardian.schedule_changes:
            continue
        db.add(Notification(user_id=guardian.id, type=kind, title=title, text=text))


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "favorit-platform"}


@app.get("/api/config")
def public_config():
    return {"server": True, "demo": ENABLE_DEMO, "vapidPublicKey": VAPID_PUBLIC_KEY,
            "telegramBot": os.getenv("TELEGRAM_BOT_USERNAME", "sms_favoryt_bot").lstrip("@")}


@app.post("/api/auth/request-code")
def request_code(payload: PhoneRequest, db: Session = Depends(get_db)):
    phone = normalize_phone(payload.phone)
    user = db.query(User).filter(User.phone == phone, User.active.is_(True)).first()
    if not user:
        raise HTTPException(status_code=404, detail="Цей номер ще не доданий тренером до клубу")

    minute_ago = datetime.utcnow() - timedelta(minutes=1)
    if db.query(OtpCode.id).filter(OtpCode.phone == phone, OtpCode.created_at > minute_ago).first():
        raise HTTPException(status_code=429, detail="Код уже надіслано. Спробуйте через хвилину")
    hour_ago = datetime.utcnow() - timedelta(hours=1)
    if db.query(func.count(OtpCode.id)).filter(OtpCode.phone == phone, OtpCode.created_at > hour_ago).scalar() >= 5:
        raise HTTPException(status_code=429, detail="Забагато запитів. Спробуйте пізніше")

    code = generate_code()
    otp = OtpCode(phone=phone, code_hash="pending", expires_at=datetime.utcnow() + timedelta(minutes=10))
    db.add(otp)
    db.flush()
    otp.code_hash = code_hash(phone, code, otp.id)
    if os.getenv("TELEGRAM_BOT_TOKEN") or APP_ENV == "production":
        account = db.get(TelegramAccount, user.id)
        if not account or account.phone != phone:
            raise HTTPException(409, "Відкрийте Telegram-бота та підтвердьте свій номер, потім натисніть «Отримати код» знову")
        telegram_call("sendMessage", {"chat_id": account.telegram_id,
            "text": f"Код входу до ФК Фаворит: {code}. Діє 10 хвилин. Нікому не повідомляйте код."})
    db.query(OtpCode).filter(OtpCode.phone == phone, OtpCode.id != otp.id).update({"used": True})
    db.commit()
    result = {"ok": True, "expiresIn": 600}
    if APP_ENV != "production" and not os.getenv("TELEGRAM_BOT_TOKEN"):
        result["devCode"] = code
    return result


@app.post("/api/auth/verify")
def verify_code(payload: VerifyRequest, db: Session = Depends(get_db)):
    phone = normalize_phone(payload.phone)
    otp = (
        db.query(OtpCode)
        .filter(OtpCode.phone == phone, OtpCode.used.is_(False))
        .order_by(OtpCode.created_at.desc())
        .first()
    )
    if not otp or otp.expires_at < datetime.utcnow() or otp.attempts >= 5:
        raise HTTPException(status_code=400, detail="Код недійсний або вже прострочений")
    otp.attempts += 1
    approved = __import__("hmac").compare_digest(otp.code_hash, code_hash(phone, payload.code, otp.id))
    if not approved:
        db.commit()
        raise HTTPException(status_code=400, detail="Неправильний код")
    otp.used = True
    user = db.query(User).filter(User.phone == phone, User.active.is_(True)).first()
    if not user:
        raise HTTPException(status_code=404, detail="Обліковий запис не знайдено")
    db.commit()
    return {"token": create_access_token(user), "user": {"id": str(user.id), "name": user.name, "role": user.role}}


@app.post("/api/auth/demo/{role}")
def demo_login(role: str, db: Session = Depends(get_db)):
    if not ENABLE_DEMO or role not in {"coach", "parent"}:
        raise HTTPException(status_code=404, detail="Демо-вхід вимкнено")
    user = db.query(User).filter(User.role == role, User.active.is_(True)).order_by(User.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Демо-користувача не знайдено")
    return {"token": create_access_token(user), "user": {"id": str(user.id), "name": user.name, "role": user.role, "demo": True}}


@app.get("/api/bootstrap")
def bootstrap(user: User = Depends(current_user), db: Session = Depends(get_db)):
    allowed_ids = team_ids_for(db, user)
    teams = db.query(Team).filter(Team.id.in_(allowed_ids)).order_by(Team.birth_year.desc()).all() if allowed_ids else []
    if user.role == "coach":
        players = db.query(Player).filter(Player.team_id.in_(allowed_ids)).order_by(Player.name).all() if allowed_ids else []
    else:
        players = sorted(user.children, key=lambda item: item.name)
    events = db.query(Event).filter(Event.team_id.in_(allowed_ids)).order_by(Event.starts_at).all() if allowed_ids else []
    tournaments = db.query(Tournament).filter(Tournament.team_id.in_(allowed_ids)).order_by(Tournament.starts_at).all() if allowed_ids else []
    chats_query = db.query(Chat).filter(Chat.team_id.in_(allowed_ids)) if allowed_ids else db.query(Chat).filter(False)
    if user.role == "parent":
        chats_query = chats_query.filter((Chat.kind == "team") | (Chat.parent_user_id == user.id))
    chats = chats_query.order_by(Chat.created_at).all()
    chat_ids = [chat.id for chat in chats]
    messages = db.query(Message).filter(Message.chat_id.in_(chat_ids)).order_by(Message.created_at).all() if chat_ids else []
    message_users = {item.id: item for item in db.query(User).filter(User.id.in_({message.author_id for message in messages if message.author_id})).all()}
    attendance_query = db.query(Attendance).join(Event, Attendance.event_id == Event.id).filter(Event.team_id.in_(allowed_ids)) if allowed_ids else db.query(Attendance).filter(False)
    if user.role == "parent":
        attendance_query = attendance_query.filter(Attendance.player_id.in_([child.id for child in user.children]))
    attendance_rows = attendance_query.all()
    notices = db.query(Notification).filter(Notification.user_id == user.id).order_by(Notification.created_at.desc()).limit(100).all()

    attendance = {}
    for row in attendance_rows:
        attendance.setdefault(str(row.event_id), {})[str(row.player_id)] = row.answer
    message_map = {str(chat.id): [] for chat in chats}
    for message in messages:
        author = message_users.get(message.author_id)
        message_map[str(message.chat_id)].append({
            "id": str(message.id),
            "author": author.name if author else "Користувач",
            "role": author.role if author else "system",
            "text": message.text,
            "time": message.created_at.strftime("%H:%M"),
            "poll": message.is_poll,
            "eventId": str(message.event_id) if message.event_id else None,
        })
    return {
        "user": {"id": str(user.id), "name": user.name, "phone": user.phone, "role": user.role},
        "teams": [{"id": str(item.id), "name": item.name, "birthYear": item.birth_year, "coach": item.coach.name, "color": item.color} for item in teams],
        "players": [{
            "id": str(item.id), "teamId": str(item.team_id), "name": item.name, "number": item.shirt_number,
            "position": item.position, "birth": item.birth_date,
            "parent": item.guardians[0].name if item.guardians else "Не вказано",
            "phone": item.guardians[0].phone if item.guardians else "Не вказано",
        } for item in players],
        "events": [{
            "id": str(item.id), "teamId": str(item.team_id), "type": item.type, "title": item.title,
            "start": utc_iso(item.starts_at), "end": utc_iso(item.ends_at), "place": item.place,
            "address": item.address, "notes": item.notes, "poll": item.poll_enabled, "cancelled": item.cancelled,
        } for item in events],
        "tournaments": [{
            "id": str(item.id), "teamId": str(item.team_id), "title": item.title, "date": utc_iso(item.starts_at),
            "place": item.place, "status": item.status, "note": item.note,
        } for item in tournaments],
        "attendance": attendance,
        "chats": [{"id": str(item.id), "teamId": str(item.team_id), "title": item.title, "kind": item.kind, "unread": 0} for item in chats],
        "messages": message_map,
        "notifications": [{
            "id": str(item.id), "type": item.type, "title": item.title, "text": item.text,
            "time": utc_iso(item.created_at), "read": item.read,
        } for item in notices],
        "settings": {
            "attendanceReminders": user.attendance_reminders,
            "scheduleChanges": user.schedule_changes,
            "chatMessages": user.chat_messages,
        },
    }


@app.post("/api/teams")
def create_team(payload: TeamPayload, coach: User = Depends(require_coach), db: Session = Depends(get_db)):
    item = Team(name=payload.name.strip(), birth_year=payload.birthYear, coach_id=coach.id)
    db.add(item)
    db.flush()
    db.add(Chat(team_id=item.id, title=f"{item.name} — батьки", kind="team"))
    db.commit()
    return {"id": str(item.id)}


@app.post("/api/players")
def create_player(payload: PlayerPayload, coach: User = Depends(require_coach), db: Session = Depends(get_db)):
    team_id = as_id(payload.team_id)
    ensure_coach_team(db, coach, team_id)
    phone = normalize_phone(payload.phone)
    parent = db.query(User).filter(User.phone == phone).first()
    if parent and parent.role != "parent":
        raise HTTPException(status_code=409, detail="Цей номер належить іншому типу облікового запису")
    if not parent:
        parent = User(phone=phone, name=payload.parent.strip(), role="parent")
        db.add(parent)
        db.flush()
    else:
        parent.name = payload.parent.strip()
    player = Player(team_id=team_id, name=payload.name.strip(), shirt_number=payload.number, position=payload.position, birth_date=payload.birth)
    player.guardians.append(parent)
    db.add(player)
    if not db.query(Chat.id).filter(Chat.team_id == team_id, Chat.kind == "direct", Chat.parent_user_id == parent.id).first():
        db.add(Chat(team_id=team_id, title=f"Тренер {coach.name.split()[0]}", kind="direct", parent_user_id=parent.id))
    db.commit()
    return {"id": str(player.id)}


@app.put("/api/players/{player_id}")
def update_player(player_id: int, payload: PlayerPayload, coach: User = Depends(require_coach), db: Session = Depends(get_db)):
    player = db.get(Player, player_id)
    if not player:
        raise HTTPException(status_code=404, detail="Гравця не знайдено")
    ensure_coach_team(db, coach, player.team_id)
    phone = normalize_phone(payload.phone)
    parent = db.query(User).filter(User.phone == phone).first()
    if parent and parent.role != "parent":
        raise HTTPException(status_code=409, detail="Цей номер належить іншому типу облікового запису")
    if not parent:
        parent = User(phone=phone, name=payload.parent.strip(), role="parent")
        db.add(parent)
        db.flush()
    parent.name = payload.parent.strip()
    player.name = payload.name.strip()
    player.shirt_number = payload.number
    player.position = payload.position
    player.birth_date = payload.birth
    player.guardians = [parent]
    if not db.query(Chat.id).filter(Chat.team_id == player.team_id, Chat.kind == "direct", Chat.parent_user_id == parent.id).first():
        db.add(Chat(team_id=player.team_id, title=f"Тренер {coach.name.split()[0]}", kind="direct", parent_user_id=parent.id))
    db.commit()
    return {"ok": True}


@app.delete("/api/players/{player_id}", status_code=204)
def delete_player(player_id: int, coach: User = Depends(require_coach), db: Session = Depends(get_db)):
    player = db.get(Player, player_id)
    if not player:
        raise HTTPException(status_code=404, detail="Гравця не знайдено")
    ensure_coach_team(db, coach, player.team_id)
    db.query(Attendance).filter(Attendance.player_id == player.id).delete()
    db.delete(player)
    db.commit()
    return Response(status_code=204)


def _event_from_payload(payload: EventPayload, team_id: int) -> Event:
    start = payload.start.replace(tzinfo=None)
    end = payload.end.replace(tzinfo=None)
    if end <= start:
        raise HTTPException(status_code=422, detail="Завершення має бути пізніше початку")
    return Event(team_id=team_id, type=payload.type, title=payload.title.strip(), starts_at=start, ends_at=end, place=payload.place.strip(), address=payload.address.strip(), notes=payload.notes.strip(), poll_enabled=payload.poll)


@app.post("/api/events")
def create_event(payload: EventPayload, coach: User = Depends(require_coach), db: Session = Depends(get_db)):
    team_id = as_id(payload.team_id)
    ensure_coach_team(db, coach, team_id)
    item = _event_from_payload(payload, team_id)
    db.add(item)
    notify_team(db, team_id, "Нова подія", f"{item.title}: {item.starts_at.strftime('%d.%m о %H:%M')}")
    db.commit()
    return {"id": str(item.id)}


@app.put("/api/events/{event_id}")
def update_event(event_id: int, payload: EventPayload, coach: User = Depends(require_coach), db: Session = Depends(get_db)):
    item = db.get(Event, event_id)
    if not item:
        raise HTTPException(status_code=404, detail="Подію не знайдено")
    ensure_coach_team(db, coach, item.team_id)
    updated = _event_from_payload(payload, item.team_id)
    for field in ("type", "title", "starts_at", "ends_at", "place", "address", "notes", "poll_enabled"):
        setattr(item, field, getattr(updated, field))
    notify_team(db, item.team_id, "Подію оновлено", f"{item.title}: {item.starts_at.strftime('%d.%m о %H:%M')}")
    db.commit()
    return {"ok": True}


@app.delete("/api/events/{event_id}", status_code=204)
def delete_event(event_id: int, coach: User = Depends(require_coach), db: Session = Depends(get_db)):
    item = db.get(Event, event_id)
    if not item:
        raise HTTPException(status_code=404, detail="Подію не знайдено")
    ensure_coach_team(db, coach, item.team_id)
    notify_team(db, item.team_id, "Подію скасовано", item.title)
    db.delete(item)
    db.commit()
    return Response(status_code=204)


@app.put("/api/events/{event_id}/attendance")
def set_attendance(event_id: int, payload: AttendancePayload, user: User = Depends(current_user), db: Session = Depends(get_db)):
    event = db.get(Event, event_id)
    if not event or event.team_id not in team_ids_for(db, user):
        raise HTTPException(status_code=404, detail="Подію не знайдено")
    candidates = [child for child in user.children if child.team_id == event.team_id] if user.role == "parent" else []
    if user.role == "coach" and payload.player_id is not None:
        player = db.get(Player, as_id(payload.player_id))
        candidates = [player] if player and player.team_id == event.team_id else []
    elif payload.player_id is not None:
        candidates = [child for child in candidates if child.id == as_id(payload.player_id)]
    if len(candidates) != 1:
        raise HTTPException(status_code=422, detail="Оберіть дитину для відповіді")
    player = candidates[0]
    answer = db.query(Attendance).filter(Attendance.event_id == event.id, Attendance.player_id == player.id).first()
    if answer:
        answer.answer = payload.value
        answer.answered_by = user.id
    else:
        db.add(Attendance(event_id=event.id, player_id=player.id, answer=payload.value, answered_by=user.id))
    db.add(Notification(user_id=user.id, type="poll", title="Відповідь збережено", text=f"{player.name}: {'буде' if payload.value == 'yes' else 'не буде'}"))
    db.commit()
    return {"ok": True}


@app.delete("/api/events/{event_id}/attendance", status_code=204)
def clear_attendance(event_id: int, player_id: int | None = None, user: User = Depends(current_user), db: Session = Depends(get_db)):
    event = db.get(Event, event_id)
    if not event or event.team_id not in team_ids_for(db, user):
        raise HTTPException(status_code=404, detail="Подію не знайдено")
    candidates = [child for child in user.children if child.team_id == event.team_id]
    if player_id is not None:
        candidates = [child for child in candidates if child.id == player_id]
    if user.role != "parent" or len(candidates) != 1:
        raise HTTPException(status_code=403, detail="Немає доступу до цієї відповіді")
    db.query(Attendance).filter(Attendance.event_id == event.id, Attendance.player_id == candidates[0].id).delete()
    db.commit()
    return Response(status_code=204)


@app.post("/api/events/{event_id}/remind")
def remind_event(event_id: int, coach: User = Depends(require_coach), db: Session = Depends(get_db)):
    event = db.get(Event, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Подію не знайдено")
    ensure_coach_team(db, coach, event.team_id)
    return {"sent": send_event_reminders_now(db, event)}


@app.post("/api/tournaments")
def create_tournament(payload: TournamentPayload, coach: User = Depends(require_coach), db: Session = Depends(get_db)):
    team_id = as_id(payload.team_id)
    ensure_coach_team(db, coach, team_id)
    item = Tournament(team_id=team_id, title=payload.title.strip(), starts_at=payload.date.replace(tzinfo=None), place=payload.place.strip(), status=payload.status, note=payload.note.strip())
    db.add(item)
    notify_team(db, team_id, "Новий турнір", f"{item.title}: {item.starts_at.strftime('%d.%m')}")
    db.commit()
    return {"id": str(item.id)}


@app.put("/api/tournaments/{tournament_id}")
def update_tournament(tournament_id: int, payload: TournamentPayload, coach: User = Depends(require_coach), db: Session = Depends(get_db)):
    item = db.get(Tournament, tournament_id)
    if not item:
        raise HTTPException(status_code=404, detail="Турнір не знайдено")
    ensure_coach_team(db, coach, item.team_id)
    item.title, item.starts_at, item.place, item.status, item.note = payload.title.strip(), payload.date.replace(tzinfo=None), payload.place.strip(), payload.status, payload.note.strip()
    notify_team(db, item.team_id, "Турнір оновлено", item.title)
    db.commit()
    return {"ok": True}


@app.delete("/api/tournaments/{tournament_id}", status_code=204)
def delete_tournament(tournament_id: int, coach: User = Depends(require_coach), db: Session = Depends(get_db)):
    item = db.get(Tournament, tournament_id)
    if not item:
        raise HTTPException(status_code=404, detail="Турнір не знайдено")
    ensure_coach_team(db, coach, item.team_id)
    db.delete(item)
    db.commit()
    return Response(status_code=204)


@app.post("/api/chats/{chat_id}/messages")
def create_message(chat_id: int, payload: MessagePayload, user: User = Depends(current_user), db: Session = Depends(get_db)):
    chat = db.get(Chat, chat_id)
    if not chat or not can_access_chat(db, user, chat):
        raise HTTPException(status_code=404, detail="Чат не знайдено")
    item = Message(chat_id=chat.id, author_id=user.id, text=payload.text.strip())
    db.add(item)
    if user.role == "coach":
        for guardian in team_guardians(db, chat.team_id):
            if guardian.chat_messages and (chat.kind == "team" or chat.parent_user_id == guardian.id):
                db.add(Notification(user_id=guardian.id, type="chat", title=chat.title, text=payload.text.strip()[:180]))
    db.commit()
    return {"id": str(item.id)}


@app.post("/api/chats/{chat_id}/poll")
def create_poll_message(chat_id: int, payload: PollPayload, coach: User = Depends(require_coach), db: Session = Depends(get_db)):
    chat = db.get(Chat, chat_id)
    event = db.get(Event, as_id(payload.event_id))
    if not chat or not event or chat.kind != "team" or chat.team_id != event.team_id:
        raise HTTPException(status_code=404, detail="Чат або подію не знайдено")
    ensure_coach_team(db, coach, chat.team_id)
    event.poll_enabled = True
    text = f"Чи буде ваша дитина на події «{event.title}» {event.starts_at.strftime('%d.%m о %H:%M')}?"
    db.add(Message(chat_id=chat.id, author_id=coach.id, text=text, event_id=event.id, is_poll=True))
    notify_team(db, event.team_id, "Нове опитування", text, "poll")
    db.commit()
    return {"ok": True}


@app.patch("/api/settings")
def update_settings(payload: SettingsPayload, user: User = Depends(current_user), db: Session = Depends(get_db)):
    if payload.attendanceReminders is not None:
        user.attendance_reminders = payload.attendanceReminders
    if payload.scheduleChanges is not None:
        user.schedule_changes = payload.scheduleChanges
    if payload.chatMessages is not None:
        user.chat_messages = payload.chatMessages
    db.commit()
    return {"ok": True}


@app.post("/api/notifications/read-all")
def read_all_notifications(user: User = Depends(current_user), db: Session = Depends(get_db)):
    db.query(Notification).filter(Notification.user_id == user.id).update({Notification.read: True})
    db.commit()
    return {"ok": True}


@app.post("/api/push-subscriptions")
def subscribe_push(payload: PushSubscriptionPayload, user: User = Depends(current_user), db: Session = Depends(get_db)):
    p256dh = payload.keys.get("p256dh")
    auth = payload.keys.get("auth")
    if not p256dh or not auth:
        raise HTTPException(status_code=422, detail="Некоректна push-підписка")
    item = db.query(PushSubscription).filter(PushSubscription.endpoint == payload.endpoint).first()
    if item:
        item.user_id, item.p256dh, item.auth = user.id, p256dh, auth
    else:
        db.add(PushSubscription(user_id=user.id, endpoint=payload.endpoint, p256dh=p256dh, auth=auth))
    db.commit()
    return {"ok": True}


@app.get("/")
def index():
    return FileResponse(ROOT / "index.html", headers={"Cache-Control": "no-cache"})


@app.get("/{asset_name}")
def static_asset(asset_name: str):
    allowed = {"app.js", "styles.css", "manifest.webmanifest", "sw.js", "logo.png", "image.png"}
    if asset_name not in allowed:
        raise HTTPException(status_code=404, detail="Not found")
    return FileResponse(ROOT / asset_name)
