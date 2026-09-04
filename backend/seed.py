import os
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from sqlalchemy.orm import Session

from .models import Attendance, Chat, Event, Message, Notification, Player, Team, Tournament, User


KYIV = ZoneInfo("Europe/Kyiv")


def _utc_naive(local_dt: datetime) -> datetime:
    return local_dt.astimezone(timezone.utc).replace(tzinfo=None)


def _next_weekday(day: int, hour: int, minute: int, weeks: int = 0) -> datetime:
    now = datetime.now(KYIV)
    delta = (day - now.weekday()) % 7
    result = (now + timedelta(days=delta + weeks * 7)).replace(hour=hour, minute=minute, second=0, microsecond=0)
    if result <= now and weeks == 0:
        result += timedelta(days=7)
    return _utc_naive(result)


def seed_database(db: Session) -> None:
    if db.query(User).count() or os.getenv("SEED_DEMO_DATA", "true").lower() != "true":
        return

    coach_phone = os.getenv("INITIAL_COACH_PHONE", "+380671234567").strip()
    coach_name = os.getenv("INITIAL_COACH_NAME", "Андрій Савчук").strip()
    coach = User(phone=coach_phone, name=coach_name, role="coach")
    parent_specs = [
        ("+380932345678", "Катерина Коваленко"),
        ("+380674121034", "Олена Бондар"),
        ("+380993201842", "Ірина Мельник"),
        ("+380638054127", "Олег Шевченко"),
        ("+380952514490", "Наталія Кравченко"),
        ("+380687331256", "Марина Романюк"),
        ("+380975603811", "Анна Поліщук"),
        ("+380664209362", "Віталій Лисенко"),
        ("+380731187520", "Світлана Петренко"),
        ("+380508720419", "Роман Ткаченко"),
    ]
    parents = [User(phone=phone, name=name, role="parent") for phone, name in parent_specs]
    db.add_all([coach, *parents])
    db.flush()

    team_2017 = Team(name="Фаворит 2017", birth_year=2017, coach_id=coach.id, color="#225ad6")
    team_2016 = Team(name="Фаворит 2016", birth_year=2016, coach_id=coach.id, color="#17845d")
    db.add_all([team_2017, team_2016])
    db.flush()

    player_specs = [
        (team_2017, "Максим Коваленко", 10, "Півзахисник", "17.04.2017", 0),
        (team_2017, "Олексій Бондар", 1, "Воротар", "02.08.2017", 1),
        (team_2017, "Данило Мельник", 7, "Нападник", "23.01.2017", 2),
        (team_2017, "Матвій Шевченко", 4, "Захисник", "11.10.2017", 3),
        (team_2017, "Іван Кравченко", 8, "Півзахисник", "06.06.2017", 4),
        (team_2017, "Тимофій Романюк", 11, "Нападник", "28.03.2017", 5),
        (team_2017, "Марк Поліщук", 5, "Захисник", "14.09.2017", 6),
        (team_2017, "Артем Лисенко", 9, "Нападник", "31.05.2017", 7),
        (team_2016, "Назар Петренко", 6, "Півзахисник", "08.02.2016", 8),
        (team_2016, "Богдан Ткаченко", 3, "Захисник", "19.07.2016", 9),
    ]
    players = []
    for team, name, number, position, birth, parent_index in player_specs:
        player = Player(team_id=team.id, name=name, shirt_number=number, position=position, birth_date=birth)
        player.guardians.append(parents[parent_index])
        players.append(player)
    db.add_all(players)
    db.flush()

    monday_start = _next_weekday(0, 19, 15)
    wednesday_start = _next_weekday(2, 19, 15)
    thursday_start = _next_weekday(3, 19, 30)
    tuesday_start = _next_weekday(1, 18, 0)
    friday_start = _next_weekday(4, 18, 30)
    match_start = _utc_naive((datetime.now(KYIV) + timedelta(days=10)).replace(hour=11, minute=0, second=0, microsecond=0))

    events = [
        Event(team_id=team_2017.id, type="training", title="Тренування", starts_at=monday_start, ends_at=monday_start + timedelta(minutes=75), place="Ліцей «Основа» (8 школа)", address="Соборна, 3", poll_enabled=True),
        Event(team_id=team_2017.id, type="training", title="Тренування", starts_at=wednesday_start, ends_at=wednesday_start + timedelta(minutes=75), place="Ліцей «Основа» (8 школа)", address="Соборна, 3", poll_enabled=True),
        Event(team_id=team_2017.id, type="training", title="Тренування", starts_at=thursday_start, ends_at=thursday_start + timedelta(minutes=75), place="Гімназія «Перспектива» (4 школа)", address="Київський шлях, 97", poll_enabled=True),
        Event(team_id=team_2016.id, type="training", title="Тренування", starts_at=tuesday_start, ends_at=tuesday_start + timedelta(minutes=75), place="Стадіон «Колос»", address="Київський шлях, 1", poll_enabled=True),
        Event(team_id=team_2016.id, type="training", title="Тренування", starts_at=friday_start, ends_at=friday_start + timedelta(minutes=75), place="Стадіон «Колос»", address="Київський шлях, 1", poll_enabled=True),
        Event(team_id=team_2017.id, type="match", title="Контрольна гра з ФК «Лівий Берег»", starts_at=match_start, ends_at=match_start + timedelta(minutes=90), place="Стадіон «Колос»", address="Київський шлях, 1", poll_enabled=True),
    ]
    db.add_all(events)
    db.flush()

    db.add_all([
        Attendance(event_id=events[0].id, player_id=players[1].id, answer="yes", answered_by=parents[1].id),
        Attendance(event_id=events[0].id, player_id=players[2].id, answer="yes", answered_by=parents[2].id),
        Attendance(event_id=events[0].id, player_id=players[3].id, answer="no", answered_by=parents[3].id),
        Attendance(event_id=events[0].id, player_id=players[4].id, answer="yes", answered_by=parents[4].id),
        Attendance(event_id=events[0].id, player_id=players[6].id, answer="yes", answered_by=parents[6].id),
    ])

    team_chat_2017 = Chat(team_id=team_2017.id, title="Фаворит 2017 — батьки", kind="team")
    team_chat_2016 = Chat(team_id=team_2016.id, title="Фаворит 2016 — батьки", kind="team")
    db.add_all([team_chat_2017, team_chat_2016])
    db.flush()
    direct_chats = []
    for index, parent in enumerate(parents):
        team_id = team_2017.id if index < 8 else team_2016.id
        direct_chats.append(Chat(team_id=team_id, title="Тренер Андрій", kind="direct", parent_user_id=parent.id))
    db.add_all(direct_chats)
    db.flush()

    db.add_all([
        Message(chat_id=team_chat_2017.id, author_id=coach.id, text="Добрий день! Нагадую: у понеділок тренування о 19:15 в ліцеї «Основа».", created_at=datetime.utcnow() - timedelta(hours=2)),
        Message(chat_id=team_chat_2017.id, author_id=parents[1].id, text="Дякую, Олексій буде.", created_at=datetime.utcnow() - timedelta(hours=1, minutes=50)),
        Message(chat_id=team_chat_2017.id, author_id=coach.id, text="Будь ласка, усі дайте відповідь в опитуванні до 14:00 дня тренування.", event_id=events[0].id, is_poll=True, created_at=datetime.utcnow() - timedelta(hours=1, minutes=40)),
        Message(chat_id=direct_chats[0].id, author_id=parents[0].id, text="Добрий день! Максим уже може повертатися до тренувань.", created_at=datetime.utcnow() - timedelta(days=1)),
        Message(chat_id=direct_chats[0].id, author_id=coach.id, text="Чудово, тоді чекаю в понеділок. Почніть без надмірного навантаження.", created_at=datetime.utcnow() - timedelta(days=1) + timedelta(minutes=14)),
    ])

    tournament_date = _utc_naive((datetime.now(KYIV) + timedelta(days=17)).replace(hour=9, minute=0, second=0, microsecond=0))
    db.add_all([
        Tournament(team_id=team_2017.id, title="Кубок Борисполя U-9", starts_at=tournament_date, place="Стадіон «Колос»", status="Реєстрацію підтверджено", note="Збір команди о 08:15. Форма синя."),
        Tournament(team_id=team_2017.id, title="Осінній Favorit Cup", starts_at=tournament_date + timedelta(days=21, minutes=30), place="НВК «Мрія»", status="Планується", note="Формат 5+1, склад буде оголошено пізніше."),
        Tournament(team_id=team_2016.id, title="Boryspil Junior League", starts_at=tournament_date + timedelta(days=7, hours=1), place="Стадіон «Колос»", status="Реєстрацію підтверджено", note="Груповий етап, три матчі."),
        Notification(user_id=parents[0].id, type="poll", title="Потрібна відповідь", text="Чи буде Максим на наступному тренуванні?", read=False),
    ])
    db.commit()
