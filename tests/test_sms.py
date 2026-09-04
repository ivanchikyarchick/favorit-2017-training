import httpx
import pytest

from backend.sms import SmsDeliveryError, send_login_code


class StubResponse:
    def __init__(self, data: dict):
        self.data = data

    def raise_for_status(self):
        return None

    def json(self):
        return self.data


def test_turbosms_sends_login_code(monkeypatch):
    monkeypatch.setenv("TURBOSMS_TOKEN", "secret-token")
    monkeypatch.setenv("TURBOSMS_SENDER", "Favorit")
    sent = {}

    def fake_post(url, **kwargs):
        sent.update({"url": url, **kwargs})
        return StubResponse(
            {
                "response_code": 801,
                "response_status": "SUCCESS_MESSAGE_SENT",
                "response_result": [{"message_id": "message-1", "response_code": 0}],
            }
        )

    monkeypatch.setattr(httpx, "post", fake_post)
    assert send_login_code("+380501112233", "4831", 42) is True
    assert sent["headers"]["Authorization"] == "Bearer secret-token"
    assert sent["json"]["recipients"] == ["380501112233"]
    assert sent["json"]["sms"]["sender"] == "Favorit"
    assert "4831" in sent["json"]["sms"]["text"]
    assert sent["json"]["sequence_id"] == "favorit-otp-42"


@pytest.mark.parametrize(
    ("provider_code", "expected"),
    [
        (301, "API-токен"),
        (203, "недостатньо коштів"),
        (401, "не доданий або ще не активований"),
    ],
)
def test_turbosms_errors_are_readable(monkeypatch, provider_code, expected):
    monkeypatch.setenv("TURBOSMS_TOKEN", "secret-token")
    monkeypatch.setattr(
        httpx,
        "post",
        lambda *args, **kwargs: StubResponse(
            {"response_code": provider_code, "response_status": "PROVIDER_ERROR", "response_result": None}
        ),
    )

    with pytest.raises(SmsDeliveryError, match=expected):
        send_login_code("+380501112233", "4831", 42)
