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


def teardown_module():
    engine.dispose()
    TEST_DB.unlink(missing_ok=True)
