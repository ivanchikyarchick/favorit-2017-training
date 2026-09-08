"""Browser-bound, short-lived Telegram sign-in challenges. No OTP entry."""
import hashlib
import hmac
import os
import re
import secrets
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from .auth import create_access_token
from .database import get_db
from .models import TelegramLogin, User

router = APIRouter()


def digest(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()


class LoginPoll(BaseModel):
    id: str = Field(min_length=20, max_length=64)
    secret: str = Field(min_length=20, max_length=64)


@router.post("/api/auth/telegram/start")
def start_login(response: Response, db: Session = Depends(get_db)):
    username = os.getenv("TELEGRAM_BOT_USERNAME", "sms_favoryt_bot").lstrip("@")
    token = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
    secret = os.getenv("TELEGRAM_WEBHOOK_SECRET", "")
    public_url = os.getenv("PUBLIC_BASE_URL", "").rstrip("/")
    if not token or not re.fullmatch(r"[A-Za-z0-9_]{5,32}", username) or len(secret) < 32 or not public_url.startswith("https://"):
        raise HTTPException(503, "Вхід через Telegram ще не налаштовано. Зверніться до адміністратора.")
    now = datetime.utcnow()
    db.query(TelegramLogin).filter(TelegramLogin.expires_at < now).delete()
    # Bound storage even if clients create challenges without completing them.
    if db.query(TelegramLogin).count() >= 1000:
        raise HTTPException(429, "Забагато запитів на вхід. Спробуйте трохи пізніше.")
    browser_secret, start_secret = secrets.token_urlsafe(32), secrets.token_urlsafe(32)
    item = TelegramLogin(id=secrets.token_urlsafe(24), browser_hash=digest(browser_secret),
                         start_hash=digest(start_secret), expires_at=now + timedelta(minutes=10))
    db.add(item)
    db.commit()
    response.headers["Cache-Control"] = "no-store"
    return {"id": item.id, "secret": browser_secret, "expiresIn": 600,
            "url": f"https://t.me/{username}?start={start_secret}"}


@router.post("/api/auth/telegram/poll")
def poll_login(payload: LoginPoll, response: Response, db: Session = Depends(get_db)):
    response.headers["Cache-Control"] = "no-store"
    item = db.get(TelegramLogin, payload.id)
    if not item or not hmac.compare_digest(item.browser_hash, digest(payload.secret)):
        raise HTTPException(404, "Сеанс входу не знайдено")
    now = datetime.utcnow()
    if item.expires_at <= now or item.consumed:
        return {"status": "expired"}
    if not item.user_id:
        return {"status": "pending"}
    user = db.get(User, item.user_id)
    if not user or not user.active:
        return {"status": "blocked"}
    # Conditional update makes exchange single-use across processes and tabs.
    changed = db.query(TelegramLogin).filter(TelegramLogin.id == item.id,
        TelegramLogin.consumed.is_(False), TelegramLogin.expires_at > now).update({"consumed": True})
    db.commit()
    if not changed:
        return {"status": "expired"}
    return {"status": "approved", "token": create_access_token(user),
            "user": {"id": str(user.id), "name": user.name, "role": user.role}}
