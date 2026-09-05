from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Table,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from .database import Base


player_guardians = Table(
    "player_guardians",
    Base.metadata,
    Column("player_id", ForeignKey("players.id", ondelete="CASCADE"), primary_key=True),
    Column("user_id", ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    phone = Column(String(24), nullable=False, unique=True, index=True)
    name = Column(String(120), nullable=False)
    role = Column(String(20), nullable=False, index=True)
    active = Column(Boolean, nullable=False, default=True)
    attendance_reminders = Column(Boolean, nullable=False, default=True)
    schedule_changes = Column(Boolean, nullable=False, default=True)
    chat_messages = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    children = relationship("Player", secondary=player_guardians, back_populates="guardians")
    coached_teams = relationship("Team", back_populates="coach")


class TelegramAccount(Base):
    __tablename__ = "telegram_accounts"
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    telegram_id = Column(String(24), nullable=False, unique=True)
    phone = Column(String(24), nullable=False)


class PendingTelegram(Base):
    __tablename__ = "pending_telegram"
    telegram_id = Column(String(24), primary_key=True)
    phone = Column(String(24), nullable=False)
    name = Column(String(120), nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)


class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    birth_year = Column(Integer, nullable=False)
    color = Column(String(20), nullable=False, default="#225ad6")
    coach_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    coach = relationship("User", back_populates="coached_teams")
    players = relationship("Player", back_populates="team", cascade="all, delete-orphan")


class Player(Base):
    __tablename__ = "players"

    id = Column(Integer, primary_key=True)
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(120), nullable=False)
    shirt_number = Column(Integer, nullable=False)
    position = Column(String(60), nullable=False)
    birth_date = Column(String(20), nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)

    team = relationship("Team", back_populates="players")
    guardians = relationship("User", secondary=player_guardians, back_populates="children")


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True)
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False, index=True)
    schedule_rule_id = Column(Integer, ForeignKey("schedule_rules.id", ondelete="SET NULL"), nullable=True, index=True)
    type = Column(String(30), nullable=False, default="training")
    title = Column(String(160), nullable=False)
    starts_at = Column(DateTime, nullable=False, index=True)
    ends_at = Column(DateTime, nullable=False)
    place = Column(String(180), nullable=False)
    address = Column(String(220), nullable=False)
    notes = Column(Text, nullable=False, default="")
    poll_enabled = Column(Boolean, nullable=False, default=True)
    cancelled = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)


class ScheduleRule(Base):
    __tablename__ = "schedule_rules"

    id = Column(Integer, primary_key=True)
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False, index=True)
    weekday = Column(Integer, nullable=False)
    starts_at = Column(String(5), nullable=False)
    ends_at = Column(String(5), nullable=False)
    title = Column(String(160), nullable=False, default="Тренування")
    place = Column(String(180), nullable=False)
    address = Column(String(220), nullable=False)
    poll_enabled = Column(Boolean, nullable=False, default=True)
    active = Column(Boolean, nullable=False, default=True)


class Attendance(Base):
    __tablename__ = "attendance"
    __table_args__ = (UniqueConstraint("event_id", "player_id", name="uq_attendance_event_player"),)

    id = Column(Integer, primary_key=True)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    player_id = Column(Integer, ForeignKey("players.id", ondelete="CASCADE"), nullable=False, index=True)
    answer = Column(String(12), nullable=False)
    answered_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)


class Tournament(Base):
    __tablename__ = "tournaments"

    id = Column(Integer, primary_key=True)
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(180), nullable=False)
    starts_at = Column(DateTime, nullable=False, index=True)
    place = Column(String(200), nullable=False)
    status = Column(String(80), nullable=False)
    note = Column(Text, nullable=False, default="")


class Chat(Base):
    __tablename__ = "chats"

    id = Column(Integer, primary_key=True)
    team_id = Column(Integer, ForeignKey("teams.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(180), nullable=False)
    kind = Column(String(20), nullable=False, default="team")
    parent_user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True)
    chat_id = Column(Integer, ForeignKey("chats.id", ondelete="CASCADE"), nullable=False, index=True)
    author_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    text = Column(Text, nullable=False)
    event_id = Column(Integer, ForeignKey("events.id", ondelete="SET NULL"), nullable=True)
    is_poll = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String(30), nullable=False)
    title = Column(String(180), nullable=False)
    text = Column(Text, nullable=False)
    read = Column(Boolean, nullable=False, default=False)
    dedupe_key = Column(String(220), nullable=True, unique=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)


class OtpCode(Base):
    __tablename__ = "otp_codes"

    id = Column(Integer, primary_key=True)
    phone = Column(String(24), nullable=False, index=True)
    code_hash = Column(String(128), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    attempts = Column(Integer, nullable=False, default=0)
    used = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)


class PushSubscription(Base):
    __tablename__ = "push_subscriptions"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    endpoint = Column(Text, nullable=False, unique=True)
    p256dh = Column(Text, nullable=False)
    auth = Column(Text, nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
