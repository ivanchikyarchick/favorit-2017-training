from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator


class PhoneRequest(BaseModel):
    phone: str = Field(min_length=9, max_length=32)


class VerifyRequest(PhoneRequest):
    code: str = Field(min_length=4, max_length=8)


class EventPayload(BaseModel):
    team_id: int | str
    type: Literal["training", "match", "tournament"] = "training"
    title: str = Field(min_length=2, max_length=160)
    start: datetime
    end: datetime
    place: str = Field(min_length=2, max_length=180)
    address: str = Field(min_length=2, max_length=220)
    notes: str = Field(default="", max_length=3000)
    poll: bool = True

    @field_validator("end")
    @classmethod
    def end_is_present(cls, value: datetime) -> datetime:
        return value


class PlayerPayload(BaseModel):
    team_id: int | str
    name: str = Field(min_length=3, max_length=120)
    number: int = Field(ge=1, le=99)
    position: str = Field(min_length=2, max_length=60)
    birth: str = Field(min_length=6, max_length=20)
    parent: str = Field(min_length=3, max_length=120)
    phone: str = Field(min_length=9, max_length=32)


class TeamPayload(BaseModel):
    name: str = Field(min_length=3, max_length=100)
    birthYear: int = Field(ge=2005, le=2025)
    coach: str | None = Field(default=None, max_length=120)


class TournamentPayload(BaseModel):
    team_id: int | str
    title: str = Field(min_length=3, max_length=180)
    date: datetime
    place: str = Field(min_length=2, max_length=200)
    status: str = Field(min_length=2, max_length=80)
    note: str = Field(default="", max_length=3000)


class AttendancePayload(BaseModel):
    value: Literal["yes", "no"]
    player_id: int | str | None = None


class MessagePayload(BaseModel):
    text: str = Field(min_length=1, max_length=4000)


class PollPayload(BaseModel):
    event_id: int | str


class SettingsPayload(BaseModel):
    attendanceReminders: bool | None = None
    scheduleChanges: bool | None = None
    chatMessages: bool | None = None


class PushSubscriptionPayload(BaseModel):
    endpoint: str = Field(min_length=10, max_length=4000)
    keys: dict[str, str]
