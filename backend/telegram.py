import hmac
import os
from datetime import datetime

import httpx
from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from .auth import normalize_phone
from .database import get_db
from .models import TelegramAccount, TelegramLogin, User
from .telegram_login import digest

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


def send_telegram_message(telegram_id: str, text: str) -> bool:
    token = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
    if not token or not telegram_id:
        return False
    try:
        response = httpx.post(f"https://api.telegram.org/bot{token}/sendMessage", json={"chat_id": telegram_id, "text": text}, timeout=5)
        return response.is_success and bool(response.json().get("ok"))
    except (httpx.HTTPError, ValueError):
        return False


def configure_webhook():
    if not os.getenv("TELEGRAM_BOT_TOKEN"):
        return
    url = os.getenv("PUBLIC_BASE_URL", "https://favorit-2017-training-production.up.railway.app/").rstrip("/")
    secret = os.getenv("TELEGRAM_WEBHOOK_SECRET", "")
    if not url.startswith("https://") or len(secret) < 32:
        raise RuntimeError("Set HTTPS PUBLIC_BASE_URL and TELEGRAM_WEBHOOK_SECRET (32+ characters)")
    telegram_call("setWebhook", {"url": url + "/api/telegram/webhook", "secret_token": secret,
        "allowed_updates": ["message", "callback_query"], "max_connections": 1})


@router.post("/api/telegram/webhook")
def webhook(update: dict, x_telegram_bot_api_secret_token: str = Header(default=""), db: Session = Depends(get_db)):
    secret = os.getenv("TELEGRAM_WEBHOOK_SECRET", "")
    if not secret or not hmac.compare_digest(secret, x_telegram_bot_api_secret_token):
        raise HTTPException(403, "Forbidden")
    callback = update.get("callback_query") or {}
    if callback:
        telegram_call("answerCallbackQuery", {"callback_query_id": callback.get("id"),
            "text": "Роль тренера призначає адміністратор. Для входу відкрийте бота із сайту."})
        return {"ok": True}
    message = update.get("message") or {}
    chat, sender = message.get("chat") or {}, message.get("from") or {}
    if chat.get("type") != "private" or not sender.get("id") or chat.get("id") != sender["id"]:
        return {"ok": True}
    telegram_id = str(sender["id"])
    now = datetime.utcnow()
    keyboard = {"keyboard": [[{"text": "Поділитися номером", "request_contact": True}]],
                "resize_keyboard": True, "one_time_keyboard": True}

    def reply(text, markup=None):
        telegram_call("sendMessage", {"chat_id": chat["id"], "text": text,
                                     "reply_markup": markup if markup is not None else keyboard})
        return {"ok": True}

    text = message.get("text", "")
    if text.split(" ")[0].split("@")[0] == "/start":
        parts = text.split(maxsplit=1)
        # Opening a new link invalidates this user's earlier pending browser link.
        start_hash = digest(parts[1]) if len(parts) == 2 else ""
        item = db.query(TelegramLogin).filter(TelegramLogin.start_hash == start_hash).with_for_update().first()
        if not item or item.expires_at <= now or item.consumed or item.user_id:
            return reply("Відкрийте сайт і натисніть «Підключити Telegram-бота», щоб отримати нове посилання.", {"remove_keyboard": True})
        if item.telegram_id and item.telegram_id != telegram_id:
            return reply("Це посилання вже використовується. Створіть нове на сайті.", {"remove_keyboard": True})
        if item.start_update_id is not None and update.get("update_id", 0) < item.start_update_id:
            return {"ok": True}
        db.query(TelegramLogin).filter(TelegramLogin.telegram_id == telegram_id,
            TelegramLogin.id != item.id, TelegramLogin.user_id.is_(None)).update({"consumed": True})
        item.telegram_id = telegram_id
        item.start_update_id = update.get("update_id")
        db.commit()
        return reply("Вхід до ФК Фаворит. Поділіться власним номером — сайт увійде автоматично. Підтверджуйте лише вхід, який ви щойно почали на своєму пристрої.")

    contact = message.get("contact") or {}
    if not contact:
        return reply("Для входу відкрийте бота кнопкою на сайті та поділіться своїм номером.")
    if message.get("forward_origin") or message.get("forward_date") or contact.get("user_id") != sender["id"]:
        return reply("Надішліть власний номер кнопкою «Поділитися номером».")
    try:
        phone = normalize_phone(contact.get("phone_number", ""))
    except HTTPException:
        return reply("Потрібен коректний український номер телефону. Поділіться власним номером.")
    item = db.query(TelegramLogin).filter(TelegramLogin.telegram_id == telegram_id,
        TelegramLogin.consumed.is_(False), TelegramLogin.expires_at > now,
        TelegramLogin.user_id.is_(None)).with_for_update().first()
    if item and item.start_update_id is not None and update.get("update_id", 0) <= item.start_update_id:
        return {"ok": True}
    user = db.query(User).filter(User.phone == phone).first()
    if user and not user.active:
        return reply("Обліковий запис заблоковано. Зверніться до адміністратора.", {"remove_keyboard": True})
    other = db.query(TelegramAccount).filter(TelegramAccount.telegram_id == telegram_id).first()
    account = db.get(TelegramAccount, user.id) if user else None
    if (account and account.telegram_id != telegram_id) or (other and (not user or other.user_id != user.id)):
        return reply("Вже існує інша прив’язка. Зверніться до адміністратора клубу.", {"remove_keyboard": True})
    if not user:
        name = " ".join(filter(None, [sender.get("first_name"), sender.get("last_name")])).strip()
        user = User(phone=phone, name=(name or "Користувач Telegram")[:120], role="parent")
        db.add(user)
        db.flush()
    if not account:
        db.add(TelegramAccount(user_id=user.id, telegram_id=telegram_id, phone=phone))
    else:
        account.phone = phone
    if item:
        item.user_id = user.id
    db.commit()
    return reply("Готово! Поверніться до вкладки сайту, з якої відкрили бота — вхід відбудеться автоматично."
                 if item else "Номер підтверджено, профіль готовий. Для входу натисніть «Підключити Telegram-бота» на сайті.",
                 {"remove_keyboard": True})
