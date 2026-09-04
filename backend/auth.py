import hashlib
import hmac
import os
import random
import re
from datetime import datetime, timedelta

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from .database import get_db
from .models import User


JWT_SECRET = os.getenv("JWT_SECRET", "development-only-change-me-not-for-production")
JWT_ALGORITHM = "HS256"
TOKEN_DAYS = int(os.getenv("TOKEN_DAYS", "30"))
security = HTTPBearer(auto_error=False)


def normalize_phone(raw: str) -> str:
    digits = re.sub(r"\D", "", raw)
    if digits.startswith("380") and len(digits) == 12:
        return f"+{digits}"
    if digits.startswith("0") and len(digits) == 10:
        return f"+38{digits}"
    if len(digits) == 9:
        return f"+380{digits}"
    raise HTTPException(status_code=422, detail="Введіть коректний український номер телефону")


def generate_code() -> str:
    return f"{random.SystemRandom().randint(0, 9999):04d}"


def code_hash(phone: str, code: str, otp_id: int) -> str:
    message = f"{phone}:{code}:{otp_id}".encode()
    return hmac.new(JWT_SECRET.encode(), message, hashlib.sha256).hexdigest()


def create_access_token(user: User) -> str:
    now = datetime.utcnow()
    return jwt.encode(
        {"sub": str(user.id), "role": user.role, "iat": now, "exp": now + timedelta(days=TOKEN_DAYS)},
        JWT_SECRET,
        algorithm=JWT_ALGORITHM,
    )


def current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Потрібно увійти")
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = int(payload["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Сеанс завершився")
    user = db.get(User, user_id)
    if not user or not user.active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Обліковий запис недоступний")
    return user


def require_coach(user: User = Depends(current_user)) -> User:
    if user.role != "coach":
        raise HTTPException(status_code=403, detail="Ця дія доступна лише тренеру")
    return user
