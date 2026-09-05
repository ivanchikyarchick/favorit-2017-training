import hmac
import os

import httpx
from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from .auth import normalize_phone
from .database import get_db
from .models import TelegramAccount, User

router = APIRouter()


def telegram_call(method: str, payload: dict):
    token = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
    if not token:
        raise HTTPException(503, "Telegram-бот ще не налаштований")
    try:
        response = httpx.post(f"https://api.telegram.org/bot{token}/{method}", json=payload, timeout=20)
        response.raise_for_status()
        data = response.json()
        if not isinstance(data, dict) or not data.get("ok"):
            raise ValueError("Telegram rejected request")
        return data.get("result")
    except (httpx.HTTPError, ValueError):
        raise HTTPException(503, "Не вдалося зв’язатися з Telegram. Спробуйте пізніше") from None


def configure_webhook():
    if not os.getenv("TELEGRAM_BOT_TOKEN"):
        return
    url = os.getenv("PUBLIC_BASE_URL", "").rstrip("/")
    secret = os.getenv("TELEGRAM_WEBHOOK_SECRET", "")
    if not url.startswith("https://") or len(secret) < 32:
        raise RuntimeError("Set HTTPS PUBLIC_BASE_URL and TELEGRAM_WEBHOOK_SECRET (32+ characters)")
    telegram_call("setWebhook", {"url": url + "/api/telegram/webhook", "secret_token": secret,
        "allowed_updates": ["message"], "max_connections": 1})


@router.post("/api/telegram/webhook")
def webhook(update: dict, x_telegram_bot_api_secret_token: str = Header(default=""), db: Session = Depends(get_db)):
    secret = os.getenv("TELEGRAM_WEBHOOK_SECRET", "")
    if not secret or not hmac.compare_digest(secret, x_telegram_bot_api_secret_token):
        raise HTTPException(403, "Forbidden")
    message = update.get("message") or {}
    chat = message.get("chat") or {}
    sender = message.get("from") or {}
    if chat.get("type") != "private" or not sender.get("id") or chat.get("id") != sender["id"]:
        return {"ok": True}
    contact = message.get("contact") or {}
    text = "ФК Фаворит. Підтвердьте свій номер, щоб отримувати коди входу."
    keyboard = {"keyboard": [[{"text": "Поділитися номером", "request_contact": True}]], "resize_keyboard": True, "one_time_keyboard": True}
    if contact:
        if message.get("forward_origin") or contact.get("user_id") != sender["id"]:
            text = "Надішліть власний номер кнопкою «Поділитися номером»."
        else:
            try:
                phone = normalize_phone(contact.get("phone_number", ""))
            except HTTPException:
                phone = ""
            user = db.query(User).filter(User.phone == phone, User.active.is_(True)).first()
            if not user:
                text = "Цей номер ще не доданий до клубу. Зверніться до тренера, потім повторіть підтвердження."
            else:
                account = db.get(TelegramAccount, user.id)
                other = db.query(TelegramAccount).filter(TelegramAccount.telegram_id == str(sender["id"])).first()
                if (account and account.telegram_id != str(sender["id"])) or (other and other.user_id != user.id):
                    text = "Вже існує інша прив’язка. Зверніться до адміністратора клубу."
                else:
                    if not account:
                        db.add(TelegramAccount(user_id=user.id, telegram_id=str(sender["id"]), phone=phone))
                    else:
                        account.phone = phone
                    db.commit()
                    text = "Номер підтверджено. Поверніться на сайт і натисніть «Отримати код». Код прийде сюди."
                    keyboard = {"remove_keyboard": True}
    telegram_call("sendMessage", {"chat_id": chat["id"], "text": text, "reply_markup": keyboard})
    return {"ok": True}
