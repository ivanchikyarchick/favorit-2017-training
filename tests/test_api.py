import os
import tempfile
from pathlib import Path


TEST_DB = Path(tempfile.gettempdir()) / f"favorit-platform-{os.getpid()}.db"
TEST_DB.unlink(missing_ok=True)
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB.as_posix()}"
os.environ["APP_ENV"] = "test"
os.environ["ENABLE_DEMO"] = "true"
os.environ["ENABLE_REMINDER_WORKER"] = "false"
os.environ["JWT_SECRET"] = "test-secret-that-is-long-enough-for-api-tests"

from fastapi.testclient import TestClient

from backend.database import engine
from backend.main import app


def auth_headers(client: TestClient, role: str) -> dict[str, str]:
    response = client.post(f"/api/auth/demo/{role}")
    assert response.status_code == 200
    return {"Authorization": f"Bearer {response.json()['token']}"}


def test_health_and_role_scoped_bootstrap():
    with TestClient(app) as client:
        assert client.get("/api/health").json()["status"] == "ok"
        coach = client.get("/api/bootstrap", headers=auth_headers(client, "coach"))
        parent = client.get("/api/bootstrap", headers=auth_headers(client, "parent"))
        assert coach.status_code == 200
        assert coach.json()["user"]["role"] == "coach"
        assert len(coach.json()["teams"]) == 2
        assert parent.status_code == 200
        assert parent.json()["user"]["role"] == "parent"
        assert len(parent.json()["teams"]) == 1
        assert len(parent.json()["players"]) == 1


def test_coach_crud_parent_attendance_and_chat():
    with TestClient(app) as client:
        coach_headers = auth_headers(client, "coach")
        parent_headers = auth_headers(client, "parent")
        bootstrap = client.get("/api/bootstrap", headers=coach_headers).json()
        team_id = bootstrap["teams"][0]["id"]

        event_response = client.post(
            "/api/events",
            headers=coach_headers,
            json={
                "team_id": team_id,
                "type": "training",
                "title": "Тестове тренування",
                "start": "2030-09-10T16:15:00Z",
                "end": "2030-09-10T17:30:00Z",
                "place": "Ліцей «Основа»",
                "address": "Соборна, 3",
                "notes": "Взяти воду",
                "poll": True,
            },
        )
        assert event_response.status_code == 200
        event_id = event_response.json()["id"]
        assert client.post("/api/events", headers=parent_headers, json={}).status_code == 403

        parent_state = client.get("/api/bootstrap", headers=parent_headers).json()
        player_id = parent_state["players"][0]["id"]
        attendance = client.put(
            f"/api/events/{event_id}/attendance",
            headers=parent_headers,
            json={"value": "yes", "player_id": player_id},
        )
        assert attendance.status_code == 200
        refreshed = client.get("/api/bootstrap", headers=parent_headers).json()
        assert refreshed["attendance"][event_id][player_id] == "yes"

        chat_id = refreshed["chats"][0]["id"]
        message = client.post(
            f"/api/chats/{chat_id}/messages",
            headers=parent_headers,
            json={"text": "Максим буде вчасно."},
        )
        assert message.status_code == 200
        refreshed = client.get("/api/bootstrap", headers=parent_headers).json()
        assert refreshed["messages"][chat_id][-1]["text"] == "Максим буде вчасно."


def test_invited_parent_can_sign_in_with_otp():
    with TestClient(app) as client:
        coach_headers = auth_headers(client, "coach")
        team_id = client.get("/api/bootstrap", headers=coach_headers).json()["teams"][0]["id"]
        phone = "+380501112233"
        player = client.post(
            "/api/players",
            headers=coach_headers,
            json={
                "team_id": team_id,
                "name": "Тестовий Гравець",
                "number": 22,
                "position": "Захисник",
                "birth": "01.01.2017",
                "parent": "Тестові Батьки",
                "phone": phone,
            },
        )
        assert player.status_code == 200
        player_id = player.json()["id"]
        updated = client.put(
            f"/api/players/{player_id}",
            headers=coach_headers,
            json={
                "team_id": team_id,
                "name": "Тестовий Гравець",
                "number": 23,
                "position": "Півзахисник",
                "birth": "01.01.2017",
                "parent": "Тестові Батьки",
                "phone": phone,
            },
        )
        assert updated.status_code == 200
        code_response = client.post("/api/auth/request-code", json={"phone": phone})
        assert code_response.status_code == 200
        code = code_response.json()["devCode"]
        verify = client.post("/api/auth/verify", json={"phone": phone, "code": code})
        assert verify.status_code == 200
        headers = {"Authorization": f"Bearer {verify.json()['token']}"}
        parent_state = client.get("/api/bootstrap", headers=headers).json()
        assert parent_state["user"]["name"] == "Тестові Батьки"
        assert any(item["name"] == "Тестовий Гравець" and item["number"] == 23 for item in parent_state["players"])


def test_telegram_binding_and_login(monkeypatch):
    from backend import telegram, main
    from backend.database import SessionLocal
    from backend.models import User, TelegramAccount

    sent = []
    monkeypatch.setenv("TELEGRAM_WEBHOOK_SECRET", "x" * 32)
    monkeypatch.setattr(telegram, "telegram_call", lambda method, payload: sent.append(payload))
    monkeypatch.setattr(main, "telegram_call", lambda method, payload: sent.append(payload))
    with TestClient(app) as client:
        with SessionLocal() as db:
            user = User(phone="+380501112299", name="Telegram parent", role="parent")
            db.add(user)
            db.commit()
            user_id = user.id
        headers = {"X-Telegram-Bot-Api-Secret-Token": "x" * 32}
        message = {"chat": {"id": 900001, "type": "private"}, "from": {"id": 900001},
                   "contact": {"user_id": 900002, "phone_number": "380501112299"}}
        assert client.post("/api/telegram/webhook", json={"message": message}).status_code == 403
        assert client.post("/api/telegram/webhook", headers=headers, json={"message": message}).status_code == 200
        with SessionLocal() as db:
            assert db.get(TelegramAccount, user_id) is None
        message["contact"]["user_id"] = 900001
        message["forward_origin"] = {"type": "user"}
        client.post("/api/telegram/webhook", headers=headers, json={"message": message})
        with SessionLocal() as db:
            assert db.get(TelegramAccount, user_id) is None
        del message["forward_origin"]
        client.post("/api/telegram/webhook", headers=headers, json={"message": message})
        monkeypatch.setenv("TELEGRAM_BOT_TOKEN", "test-only")
        response = client.post("/api/auth/request-code", json={"phone": "0501112299"})
        assert response.status_code == 200
        assert "devCode" not in response.json()
        assert sent[-1]["chat_id"] == "900001"
        code = sent[-1]["text"].split(": ")[1].split(".")[0]
        assert client.post("/api/auth/request-code", json={"phone": "0501112299"}).status_code == 429
        assert client.post("/api/auth/verify", json={"phone": "0501112299", "code": code}).status_code == 200
        assert client.post("/api/auth/verify", json={"phone": "0501112299", "code": code}).status_code == 400


def test_new_telegram_user_registers_as_parent_and_cannot_self_promote(monkeypatch):
    from backend import telegram, main
    from backend.database import SessionLocal
    from backend.models import PendingTelegram, TelegramAccount, User

    sent = []
    monkeypatch.setenv("TELEGRAM_BOT_TOKEN", "test-only")
    monkeypatch.setenv("TELEGRAM_WEBHOOK_SECRET", "y" * 32)
    monkeypatch.setattr(telegram, "telegram_call", lambda method, payload: sent.append((method, payload)))
    monkeypatch.setattr(main, "telegram_call", lambda method, payload: sent.append((method, payload)))
    with TestClient(app) as client:
        headers = {"X-Telegram-Bot-Api-Secret-Token": "y" * 32}
        message = {"chat": {"id": 900002, "type": "private"}, "from": {"id": 900002, "first_name": "Новий", "last_name": "Тренер"},
                   "contact": {"user_id": 900002, "phone_number": "380501113344"}}
        response = client.post("/api/telegram/webhook", headers=headers, json={"message": message})
        assert response.status_code == 200
        with SessionLocal() as db:
            assert db.get(PendingTelegram, "900002") is None
        callback = {"id": "callback-1", "from": {"id": 900002}, "data": "register:coach",
                    "message": {"chat": {"id": 900002, "type": "private"}}}
        assert client.post("/api/telegram/webhook", headers=headers, json={"callback_query": callback}).status_code == 200
        with SessionLocal() as db:
            user = db.query(User).filter(User.phone == "+380501113344").one()
            assert user.role == "parent"
            assert db.get(PendingTelegram, "900002") is None
            assert db.query(TelegramAccount).filter(TelegramAccount.user_id == user.id).one().telegram_id == "900002"
        login = client.post("/api/auth/request-code", json={"phone": "0501113344"})
        assert login.status_code == 200
        assert any(method == "sendMessage" and payload.get("chat_id") == "900002" for method, payload in sent)


def teardown_module():
    engine.dispose()
    TEST_DB.unlink(missing_ok=True)


def telegram_setup(monkeypatch):
    from backend import telegram
    monkeypatch.setenv("TELEGRAM_BOT_TOKEN", "test-only")
    monkeypatch.setenv("TELEGRAM_WEBHOOK_SECRET", "z" * 32)
    monkeypatch.setattr(telegram, "telegram_call", lambda *args: True)
    return {"X-Telegram-Bot-Api-Secret-Token": "z" * 32}


def challenge(client):
    result = client.post("/api/auth/telegram/start")
    assert result.status_code == 200
    assert result.headers["cache-control"] == "no-store"
    data = result.json()
    assert len(data["url"].split("start=")[1]) <= 64
    assert data["secret"] not in data["url"]
    return data, {"id": data["id"], "secret": data["secret"]}


def tg_message(client, headers, sender, *, text=None, phone=None, update_id=100):
    message = {"chat": {"id": sender, "type": "private"}, "from": {"id": sender, "first_name": "New user"}}
    if text:
        message["text"] = text
    if phone:
        message["contact"] = {"user_id": sender, "phone_number": phone}
    result = client.post("/api/telegram/webhook", headers=headers, json={"update_id": update_id, "message": message})
    assert result.status_code == 200


def test_passwordless_signup_browser_binding_and_replay(monkeypatch):
    from backend.database import SessionLocal
    from backend.models import TelegramLogin
    headers = telegram_setup(monkeypatch)
    with TestClient(app) as client:
        data, poll = challenge(client)
        start = data["url"].split("start=")[1]
        assert client.post("/api/auth/telegram/poll", json=poll).json() == {"status": "pending"}
        assert client.post("/api/auth/telegram/poll", json={**poll, "secret": start}).status_code == 404
        tg_message(client, headers, 910001, text=f"/start {start}")
        # Another Telegram user cannot claim an already bound challenge.
        tg_message(client, headers, 910002, text=f"/start {start}")
        with SessionLocal() as db:
            row = db.get(TelegramLogin, data["id"])
            assert row.telegram_id == "910001"
            assert row.start_hash != start and row.browser_hash != poll["secret"]
        tg_message(client, headers, 910001, phone="380507770001", update_id=101)
        result = client.post("/api/auth/telegram/poll", json=poll).json()
        assert result["status"] == "approved" and result["user"]["role"] == "parent"
        user_headers = {"Authorization": f"Bearer {result['token']}"}
        state = client.get("/api/bootstrap", headers=user_headers).json()
        assert state["teams"] == [] and state["players"] == [] and state["admin"] is None
        assert client.post("/api/auth/telegram/poll", json=poll).json() == {"status": "expired"}
        # Existing user signs in again without creating a duplicate profile.
        next_data, next_poll = challenge(client)
        tg_message(client, headers, 910001, text="/start " + next_data["url"].split("start=")[1], update_id=102)
        tg_message(client, headers, 910001, phone="380507770001", update_id=103)
        assert client.post("/api/auth/telegram/poll", json=next_poll).json()["user"]["id"] == result["user"]["id"]


def test_expired_replaced_and_out_of_order_telegram_requests(monkeypatch):
    from datetime import datetime, timedelta
    from backend.database import SessionLocal
    from backend.models import TelegramLogin
    headers = telegram_setup(monkeypatch)
    with TestClient(app) as client:
        first, first_poll = challenge(client)
        tg_message(client, headers, 920001, text="/start " + first["url"].split("start=")[1])
        second, second_poll = challenge(client)
        tg_message(client, headers, 920001, text="/start " + second["url"].split("start=")[1], update_id=105)
        tg_message(client, headers, 920001, phone="380507770002", update_id=101)
        assert client.post("/api/auth/telegram/poll", json=first_poll).json()["status"] == "expired"
        assert client.post("/api/auth/telegram/poll", json=second_poll).json()["status"] == "pending"
        with SessionLocal() as db:
            db.get(TelegramLogin, second["id"]).expires_at = datetime.utcnow() - timedelta(seconds=1)
            db.commit()
        tg_message(client, headers, 920001, phone="380507770002", update_id=106)
        assert client.post("/api/auth/telegram/poll", json=second_poll).json()["status"] == "expired"


def test_invalid_contact_and_blocked_user_cannot_sign_in(monkeypatch):
    from backend.database import SessionLocal
    from backend.models import User
    headers = telegram_setup(monkeypatch)
    with TestClient(app) as client:
        data, poll = challenge(client)
        tg_message(client, headers, 930001, text="/start " + data["url"].split("start=")[1])
        tg_message(client, headers, 930001, phone="123", update_id=101)
        assert client.post("/api/auth/telegram/poll", json=poll).json()["status"] == "pending"
        with SessionLocal() as db:
            assert not db.query(User).filter(User.phone == "").first()
            db.add(User(phone="+380507770003", name="Blocked", role="parent", active=False))
            db.commit()
        tg_message(client, headers, 930001, phone="380507770003", update_id=102)
        assert client.post("/api/auth/telegram/poll", json=poll).json()["status"] == "pending"


def admin_headers():
    from backend.auth import create_access_token
    from backend.database import SessionLocal
    from backend.models import User
    with SessionLocal() as db:
        user = db.query(User).filter(User.phone == "+380507779999").first()
        if not user:
            user = User(phone="+380507779999", name="Admin", role="admin")
            db.add(user)
            db.commit()
        return {"Authorization": "Bearer " + create_access_token(user)}


def test_admin_permissions_assignment_and_role_revocation():
    from backend.auth import create_access_token
    from backend.database import SessionLocal
    from backend.models import User
    with TestClient(app) as client:
        admin = admin_headers()
        parent = auth_headers(client, "parent")
        coach = auth_headers(client, "coach")
        assert client.get("/api/admin").status_code == 401
        for credentials in (parent, coach):
            assert client.get("/api/admin", headers=credentials).status_code == 403
            assert client.patch("/api/admin/users/1", headers=credentials, json={}).status_code == 403
        with SessionLocal() as db:
            trainee = User(phone="+380507770004", name="Future coach", role="parent")
            db.add(trainee)
            db.commit()
            uid = trainee.id
            # This old token must follow current DB role, not its embedded role.
            trainee_headers = {"Authorization": "Bearer " + create_access_token(trainee)}
        payload = {"name": "Future coach", "role": "coach", "active": True}
        assert client.patch(f"/api/admin/users/{uid}", headers=admin, json=payload).status_code == 200
        team = client.post("/api/admin/teams", headers=admin, json={"name": "New team", "birthYear": 2019, "coachId": uid})
        assert team.status_code == 200
        tid = team.json()["id"]
        assert client.get("/api/bootstrap", headers=trainee_headers).json()["teams"][0]["id"] == tid
        assert client.get("/api/bootstrap", headers=admin).json()["admin"] is not None
        blocked = {**payload, "active": False}
        assert client.patch(f"/api/admin/users/{uid}", headers=admin, json=blocked).status_code == 409
        admin_id = int(client.get("/api/bootstrap", headers=admin).json()["user"]["id"])
        assert client.put(f"/api/admin/teams/{tid}", headers=admin, json={"name":"Reassigned", "birthYear":2019, "coachId":admin_id}).status_code == 200
        assert client.get("/api/bootstrap", headers=trainee_headers).json()["teams"] == []
        assert client.patch(f"/api/admin/users/{uid}", headers=admin, json=blocked).status_code == 200
        assert client.get("/api/bootstrap", headers=trainee_headers).status_code == 401
        assert client.patch(f"/api/admin/users/{admin_id}", headers=admin, json={"name":"Admin", "role":"parent", "active":True}).status_code == 409
        assert client.delete(f"/api/admin/teams/{tid}", headers=admin).status_code == 204


def test_admin_can_manage_other_coachs_content_and_site_settings():
    with TestClient(app) as client:
        admin = admin_headers()
        coach = auth_headers(client, "coach")
        tid = client.get("/api/bootstrap", headers=coach).json()["teams"][0]["id"]
        result = client.post("/api/events", headers=admin, json={"team_id": tid, "title":"Admin event", "start":"2031-01-01T12:00:00Z", "end":"2031-01-01T13:00:00Z", "place":"Stadium", "address":"Main street"})
        assert result.status_code == 200
        assert client.delete("/api/events/" + result.json()["id"], headers=admin).status_code == 204
        assert client.put("/api/admin/settings", headers=admin, json={"name":"Test Club", "welcome":"Welcome"}).status_code == 200
        assert client.get("/api/config").json()["clubName"] == "Test Club"
        assert client.put("/api/admin/settings", headers=coach, json={"name":"No access", "welcome":""}).status_code == 403


def test_admin_bootstrap_existing_database_is_one_time(monkeypatch):
    from backend.admin import initialize_admin
    from backend.database import SessionLocal
    from backend.models import User
    with TestClient(app):
        admin_headers()
        monkeypatch.setenv("INITIAL_ADMIN_PHONE", "+380507778888")
        with SessionLocal() as db:
            initialize_admin(db)
            # Once an administrator exists, changing the variable cannot silently grant access.
            assert not db.query(User).filter(User.phone == "+380507778888").first()
