import json
import logging
import os
from datetime import datetime, timedelta

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .database import SessionLocal
from .models import Attendance, Event, Notification, PushSubscription, TelegramAccount, User
from .telegram import send_telegram_message


logger = logging.getLogger(__name__)


def _send_push(db: Session, user_id: int, title: str, body: str) -> None:
    private_key = os.getenv("VAPID_PRIVATE_KEY")
    subject = os.getenv("VAPID_SUBJECT", "mailto:admin@example.com")
    if not private_key:
        return
    try:
        from pywebpush import WebPushException, webpush
    except ImportError:
        return

    subscriptions = db.query(PushSubscription).filter(PushSubscription.user_id == user_id).all()
    for subscription in subscriptions:
        try:
            webpush(
                subscription_info={
                    "endpoint": subscription.endpoint,
                    "keys": {"p256dh": subscription.p256dh, "auth": subscription.auth},
                },
                data=json.dumps({"title": title, "body": body, "url": "/#dashboard"}, ensure_ascii=False),
                vapid_private_key=private_key,
                vapid_claims={"sub": subject},
                ttl=1800,
            )
        except WebPushException as exc:
            status_code = getattr(getattr(exc, "response", None), "status_code", None)
            if status_code in {404, 410}:
                db.delete(subscription)
            else:
                logger.warning("Push delivery failed: %s", exc)
    db.commit()


def _send_channels(db: Session, user: User, title: str, body: str) -> None:
    _send_push(db, user.id, title, body)
    account = db.get(TelegramAccount, user.id)
    if account:
        send_telegram_message(account.telegram_id, f"{title}\n{body}")


def run_attendance_reminders() -> None:
    now = datetime.utcnow()
    horizon = now + timedelta(hours=48)
    slot = now.replace(minute=(now.minute // 30) * 30, second=0, microsecond=0)
    db = SessionLocal()
    try:
        events = (
            db.query(Event)
            .filter(Event.poll_enabled.is_(True), Event.cancelled.is_(False), Event.starts_at > now, Event.starts_at <= horizon)
            .all()
        )
        for event in events:
            for player in event_team_players(db, event.team_id):
                answered = db.query(Attendance.id).filter(Attendance.event_id == event.id, Attendance.player_id == player.id).first()
                if answered:
                    continue
                for guardian in player.guardians:
                    if not guardian.active or not guardian.attendance_reminders:
                        continue
                    dedupe_key = f"attendance:{event.id}:{guardian.id}:{slot.isoformat()}"
                    notice = Notification(
                        user_id=guardian.id,
                        type="poll",
                        title="Потрібна відповідь",
                        text=f"Чи буде {player.name} на події «{event.title}»?",
                        dedupe_key=dedupe_key,
                    )
                    db.add(notice)
                    try:
                        db.commit()
                    except IntegrityError:
                        db.rollback()
                        continue
                    _send_channels(db, guardian, notice.title, notice.text)
    finally:
        db.close()


def event_team_players(db: Session, team_id: int):
    from .models import Player

    return db.query(Player).filter(Player.team_id == team_id).all()


def send_event_reminders_now(db: Session, event: Event) -> int:
    sent = 0
    stamp = datetime.utcnow().isoformat()
    for player in event_team_players(db, event.team_id):
        answered = db.query(Attendance.id).filter(Attendance.event_id == event.id, Attendance.player_id == player.id).first()
        if answered:
            continue
        for guardian in player.guardians:
            notice = Notification(
                user_id=guardian.id,
                type="poll",
                title="Нагадування про присутність",
                text=f"Чи буде {player.name} на події «{event.title}»?",
                dedupe_key=f"manual:{event.id}:{guardian.id}:{stamp}",
            )
            db.add(notice)
            db.commit()
            _send_channels(db, guardian, notice.title, notice.text)
            sent += 1
    return sent
