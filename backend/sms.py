import os

import httpx


TURBOSMS_URL = "https://api.turbosms.ua/message/send.json"
SUCCESS_CODES = {800, 801}


class SmsDeliveryError(RuntimeError):
    pass


def _error_message(code: int | None, status: str) -> str:
    if code in {103, 105, 301}:
        return "Неправильний TurboSMS API-токен"
    if code == 203:
        return "На балансі TurboSMS недостатньо коштів"
    if code in {200, 302, 400, 401}:
        return "Відправник TurboSMS не доданий або ще не активований"
    if code == 404:
        return "Цей номер не може отримати SMS"
    if code == 406:
        return "У TurboSMS не дозволена відправка в цю країну"
    if code == 438:
        return "TurboSMS тимчасово обмежив запити. Спробуйте за хвилину"
    if status:
        return f"TurboSMS не прийняв повідомлення ({status})"
    return "Не вдалося надіслати SMS. Спробуйте ще раз"


def send_login_code(phone: str, code: str, request_id: int) -> bool:
    token = os.getenv("TURBOSMS_TOKEN", "").strip()
    sender = os.getenv("TURBOSMS_SENDER", "TurboSMS").strip()
    if not token:
        if os.getenv("APP_ENV", "development").lower() == "production":
            raise SmsDeliveryError("SMS-сервіс ще не налаштований")
        return False

    payload = {
        "sequence_id": f"favorit-otp-{request_id}",
        "recipients": [phone.removeprefix("+")],
        "sms": {
            "sender": sender,
            "text": f"Код входу до ФК Фаворит: {code}. Діє 10 хвилин.",
        },
    }
    try:
        response = httpx.post(
            TURBOSMS_URL,
            headers={"Authorization": f"Bearer {token}"},
            json=payload,
            timeout=30,
        )
        response.raise_for_status()
        result = response.json()
    except (httpx.HTTPError, ValueError) as exc:
        raise SmsDeliveryError("TurboSMS зараз недоступний. Спробуйте ще раз") from exc

    response_code = result.get("response_code")
    response_status = str(result.get("response_status", ""))
    recipient_results = result.get("response_result")
    if response_code in SUCCESS_CODES and isinstance(recipient_results, list):
        recipient = recipient_results[0] if recipient_results else {}
        if recipient.get("message_id"):
            return True
        response_code = recipient.get("response_code", response_code)
        response_status = str(recipient.get("response_status", response_status))

    raise SmsDeliveryError(_error_message(response_code, response_status))
