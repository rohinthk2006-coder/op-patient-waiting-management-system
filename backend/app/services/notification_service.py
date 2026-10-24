import uuid
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
import httpx
from app.core.config import settings

logger = logging.getLogger("app.service.notifications")

_mock_notifications: List[Dict[str, Any]] = []

# Dynamic in-memory override for SMS API Key (allows instant configuration from UI without restart)
_dynamic_sms_config: Dict[str, str] = {
    "provider": settings.SMS_PROVIDER,
    "fast2sms_api_key": settings.FAST2SMS_API_KEY,
    "twilio_account_sid": settings.TWILIO_ACCOUNT_SID,
    "twilio_auth_token": settings.TWILIO_AUTH_TOKEN,
    "twilio_phone_number": settings.TWILIO_PHONE_NUMBER,
}


class NotificationService:
    def __init__(self):
        pass

    def get_config(self) -> Dict[str, Any]:
        key = _dynamic_sms_config.get("fast2sms_api_key") or settings.FAST2SMS_API_KEY
        masked_key = ""
        if key:
            masked_key = key[:4] + "*" * (len(key) - 8) + key[-4:] if len(key) > 8 else "***"
        return {
            "provider": _dynamic_sms_config.get("provider") or settings.SMS_PROVIDER,
            "has_fast2sms_key": bool(key),
            "masked_key": masked_key,
            "has_twilio_sid": bool(_dynamic_sms_config.get("twilio_account_sid") or settings.TWILIO_ACCOUNT_SID),
        }

    def set_config(self, provider: str, fast2sms_api_key: Optional[str] = None, **kwargs):
        if provider:
            _dynamic_sms_config["provider"] = provider
        if fast2sms_api_key is not None:
            _dynamic_sms_config["fast2sms_api_key"] = fast2sms_api_key.strip()
        for k, v in kwargs.items():
            if v is not None:
                _dynamic_sms_config[k] = v.strip()
        logger.info(f"SMS configuration updated. Provider: {_dynamic_sms_config.get('provider')}, Key configured: {bool(_dynamic_sms_config.get('fast2sms_api_key'))}")

    async def send_real_sms(self, phone: str, message: str, otp: Optional[str] = None) -> Dict[str, Any]:
        """
        Dispatches real SMS to physical phone number via configured gateway.
        Primary provider: Fast2SMS (India).
        """
        provider = _dynamic_sms_config.get("provider") or settings.SMS_PROVIDER
        fast2sms_key = _dynamic_sms_config.get("fast2sms_api_key") or settings.FAST2SMS_API_KEY

        # Clean 10-digit Indian phone number
        digits = "".join(filter(str.isdigit, phone))
        clean_phone = digits[-10:] if len(digits) >= 10 else digits

        if provider == "fast2sms" and fast2sms_key:
            try:
                headers = {
                    "authorization": fast2sms_key,
                    "Content-Type": "application/json",
                }

                async with httpx.AsyncClient(timeout=10.0) as client:
                    # If OTP route
                    if otp:
                        payload = {
                            "variables_values": str(otp),
                            "route": "otp",
                            "numbers": clean_phone,
                        }
                    else:
                        payload = {
                            "route": "q",
                            "message": message,
                            "language": "english",
                            "flash": 0,
                            "numbers": clean_phone,
                        }

                    logger.info(f"Dispatching SMS via Fast2SMS to +91 {clean_phone}...")
                    response = await client.post(
                        "https://www.fast2sms.com/dev/bulkV2",
                        json=payload,
                        headers=headers,
                    )
                    res_data = response.json()
                    logger.info(f"Fast2SMS Response: {res_data}")

                    if response.is_success and res_data.get("return") is True:
                        return {
                            "success": True,
                            "provider": "fast2sms",
                            "phone": clean_phone,
                            "message": "SMS dispatched to your mobile phone via Fast2SMS.",
                            "data": res_data
                        }
                    else:
                        error_msg = res_data.get("message") or str(res_data)
                        logger.error(f"Fast2SMS error: {error_msg}")
                        return {
                            "success": False,
                            "provider": "fast2sms",
                            "phone": clean_phone,
                            "message": f"Fast2SMS error: {error_msg}",
                            "data": res_data
                        }
            except Exception as e:
                logger.exception(f"Exception connecting to Fast2SMS: {e}")
                return {
                    "success": False,
                    "provider": "fast2sms",
                    "phone": clean_phone,
                    "message": f"Connection error to Fast2SMS: {str(e)}"
                }

        # Twilio provider fallback
        twilio_sid = _dynamic_sms_config.get("twilio_account_sid") or settings.TWILIO_ACCOUNT_SID
        twilio_token = _dynamic_sms_config.get("twilio_auth_token") or settings.TWILIO_AUTH_TOKEN
        twilio_num = _dynamic_sms_config.get("twilio_phone_number") or settings.TWILIO_PHONE_NUMBER

        if provider == "twilio" and twilio_sid and twilio_token and twilio_num:
            try:
                formatted_phone = f"+91{clean_phone}" if not phone.startswith("+") else phone
                async with httpx.AsyncClient(timeout=10.0) as client:
                    url = f"https://api.twilio.com/2010-04-01/Accounts/{twilio_sid}/Messages.json"
                    response = await client.post(
                        url,
                        auth=(twilio_sid, twilio_token),
                        data={"From": twilio_num, "To": formatted_phone, "Body": message}
                    )
                    res_data = response.json()
                    if response.is_success:
                        return {
                            "success": True,
                            "provider": "twilio",
                            "phone": formatted_phone,
                            "message": "SMS dispatched via Twilio",
                            "data": res_data
                        }
                    else:
                        return {
                            "success": False,
                            "provider": "twilio",
                            "phone": formatted_phone,
                            "message": res_data.get("message", "Twilio dispatch error"),
                            "data": res_data
                        }
            except Exception as e:
                logger.exception(f"Twilio exception: {e}")
                return {"success": False, "provider": "twilio", "message": str(e)}

        # If no key is set yet
        logger.warning(f"No active SMS Gateway key configured. Falling back to local logging. (Target: {clean_phone})")
        return {
            "success": False,
            "provider": "mock",
            "phone": clean_phone,
            "message": "No SMS Gateway API key configured yet. Please configure your Fast2SMS API key.",
            "requires_key": True
        }

    async def send_notification(
        self,
        recipient_phone: str,
        title: str,
        message: str,
        category: str = "QUEUE_UPDATE",
        booking_ref: Optional[str] = None
    ) -> Dict[str, Any]:
        notif_id = str(uuid.uuid4())
        record = {
            "id": notif_id,
            "recipient_phone": recipient_phone,
            "title": title,
            "message": message,
            "category": category,
            "booking_ref": booking_ref,
            "status": "DELIVERED",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        _mock_notifications.insert(0, record)
        logger.info(f"[NOTIFICATION RECORDED] To: {recipient_phone} | {title}: {message}")
        return record

    async def get_patient_notifications(self, phone: str) -> List[Dict[str, Any]]:
        return [n for n in _mock_notifications if n["recipient_phone"] == phone]

    async def get_recent_notifications(self, limit: int = 20) -> List[Dict[str, Any]]:
        return _mock_notifications[:limit]


notification_service = NotificationService()
