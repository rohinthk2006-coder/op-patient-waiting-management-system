import re
import secrets
import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional, Tuple
import httpx
from app.core.config import settings

logger = logging.getLogger("app.service.fast2sms")

# Rate limiting and session storage: phone -> session dict
# { "otp": str, "expires_at": datetime, "attempts": int, "last_sent_at": datetime, "used_smart_otp": bool }
_otp_store: Dict[str, Dict[str, Any]] = {}


class Fast2SMSService:
    @staticmethod
    def normalize_and_validate_phone(phone: str) -> Tuple[bool, str, Optional[str]]:
        """
        Validates and extracts a 10-digit Indian mobile number.
        Standard Indian mobile numbers begin with digits 6, 7, 8, or 9.
        """
        if not phone or not isinstance(phone, str):
            return False, "", "Phone number is required."

        # Strip spaces, hyphens, parentheses, plus signs
        cleaned = re.sub(r"[\s\-\(\)\+]", "", phone.strip())

        # If starts with 91 and has 12 digits, strip country code
        if cleaned.startswith("91") and len(cleaned) == 12:
            cleaned = cleaned[2:]
        elif cleaned.startswith("0") and len(cleaned) == 11:
            cleaned = cleaned[1:]

        # Validate 10-digit Indian mobile
        if not re.match(r"^[6-9]\d{9}$", cleaned):
            return False, "", "Please enter a valid 10-digit Indian mobile number (e.g. 9840112233)."

        return True, cleaned, None

    @staticmethod
    def validate_otp_format(otp: str) -> Tuple[bool, Optional[str]]:
        if not otp or not isinstance(otp, str):
            return False, "OTP code is required."
        cleaned = otp.strip()
        if not re.match(r"^\d{4,6}$", cleaned):
            return False, "OTP must be a 4 to 6 digit numeric code."
        return True, None

    async def send_otp(self, raw_phone: str) -> Dict[str, Any]:
        """
        Sends an OTP to the target phone number using Fast2SMS API.
        Enforces rate limiting, expiration, and API response verification.
        """
        # 1. Validate phone number
        is_valid, phone, error_msg = self.normalize_and_validate_phone(raw_phone)
        if not is_valid:
            return {"success": False, "status_code": 400, "message": error_msg}

        # 2. Rate limiting check (minimum 60 seconds between resends)
        now = datetime.now(timezone.utc)
        existing = _otp_store.get(phone)
        if existing and existing.get("last_sent_at"):
            elapsed = (now - existing["last_sent_at"]).total_seconds()
            if elapsed < settings.OTP_RATE_LIMIT_SECONDS:
                remaining = int(settings.OTP_RATE_LIMIT_SECONDS - elapsed)
                return {
                    "success": False,
                    "status_code": 429,
                    "message": f"Please wait {remaining} seconds before requesting a new OTP.",
                    "retry_after_seconds": remaining
                }

        api_key = settings.FAST2SMS_API_KEY.strip() if settings.FAST2SMS_API_KEY else ""
        if not api_key:
            logger.error("FAST2SMS_API_KEY environment variable is missing or empty.")
            return {
                "success": False,
                "status_code": 500,
                "message": "SMS gateway is not configured. Please set the FAST2SMS_API_KEY environment variable."
            }

        # 3. Generate secure cryptographic 6-digit OTP
        generated_otp = f"{secrets.randbelow(900000) + 100000}"
        expires_at = now + timedelta(minutes=settings.OTP_EXPIRY_MINUTES)

        otp_id = settings.FAST2SMS_OTP_ID.strip() if settings.FAST2SMS_OTP_ID else None
        used_smart_otp = False
        api_response_data: Dict[str, Any] = {}

        try:
            async with httpx.AsyncClient(timeout=12.0) as client:
                if otp_id:
                    # Method A: Fast2SMS Official Smart OTP API (/dev/otp/send)
                    url = "https://www.fast2sms.com/dev/otp/send"
                    headers = {
                        "Authorization": api_key,
                        "Content-Type": "application/json"
                    }
                    payload = {
                        "mobile": phone,
                        "otp_id": otp_id,
                        "otp_length": 6,
                        "otp_expiry": settings.OTP_EXPIRY_MINUTES,
                        "otp": generated_otp
                    }
                    logger.info(f"Dispatching OTP via Fast2SMS Smart OTP to +91 {phone}...")
                    res = await client.post(url, json=payload, headers=headers)
                    api_response_data = res.json()
                    used_smart_otp = True
                else:
                    # Method B: Fast2SMS Direct OTP Route (/dev/bulkV2)
                    url = "https://www.fast2sms.com/dev/bulkV2"
                    headers = {
                        "authorization": api_key,
                        "Content-Type": "application/json"
                    }
                    payload = {
                        "route": "otp",
                        "variables_values": generated_otp,
                        "numbers": phone
                    }
                    logger.info(f"Dispatching OTP via Fast2SMS bulkV2 route to +91 {phone}...")
                    res = await client.post(url, json=payload, headers=headers)
                    api_response_data = res.json()

            # 4. Verify Fast2SMS API Response
            is_success = (
                res.status_code == 200 and
                (api_response_data.get("return") is True or api_response_data.get("status_code") == 200)
            )

            if is_success:
                # Save session upon successful dispatch
                _otp_store[phone] = {
                    "otp": generated_otp,
                    "expires_at": expires_at,
                    "attempts": 0,
                    "last_sent_at": now,
                    "used_smart_otp": used_smart_otp
                }
                logger.info(f"Fast2SMS OTP successfully dispatched to +91 {phone}.")
                return {
                    "success": True,
                    "status_code": 200,
                    "message": f"OTP successfully sent to +91 {phone} via Fast2SMS.",
                    "expires_in_seconds": settings.OTP_EXPIRY_MINUTES * 60
                }
            else:
                raw_msg = api_response_data.get("message", "Failed to dispatch SMS via gateway.")
                status_code = api_response_data.get("status_code", res.status_code)
                logger.warning(f"Fast2SMS rejected dispatch: status={status_code}, msg={raw_msg}")

                # Provide user-friendly advice for specific Fast2SMS account validation states
                hint = ""
                if status_code == 996:
                    hint = "Fast2SMS requires website KYC verification before enabling live OTP SMS. Complete Aadhaar KYC on your Fast2SMS dashboard."
                elif status_code == 999:
                    hint = "Fast2SMS requires a minimum one-time account recharge of ₹100 before activating API route."

                full_message = f"{raw_msg}. {hint}".strip()
                if settings.ENVIRONMENT == "development":
                    _otp_store[phone] = {
                        "otp": generated_otp,
                        "expires_at": expires_at,
                        "attempts": 0,
                        "last_sent_at": now,
                        "used_smart_otp": False
                    }
                return {
                    "success": False,
                    "status_code": res.status_code if res.status_code != 200 else 400,
                    "message": full_message,
                    "fast2sms_code": status_code,
                    "otp_preview": generated_otp if settings.ENVIRONMENT == "development" else None
                }

        except httpx.TimeoutException:
            logger.error(f"Timeout while connecting to Fast2SMS for {phone}")
            return {
                "success": False,
                "status_code": 504,
                "message": "Gateway timeout connecting to Fast2SMS. Please try again."
            }
        except Exception as e:
            logger.exception("Unexpected error communicating with Fast2SMS")
            return {
                "success": False,
                "status_code": 500,
                "message": f"Network error sending SMS: {str(e)}"
            }

    async def verify_otp(self, raw_phone: str, user_otp: str) -> Dict[str, Any]:
        """
        Verifies user-provided OTP code.
        Checks expiry, attempt threshold, and calls Fast2SMS verify endpoint if Smart OTP was used.
        """
        is_valid, phone, error_msg = self.normalize_and_validate_phone(raw_phone)
        if not is_valid:
            return {"valid": False, "status_code": 400, "message": error_msg}

        is_valid_format, format_err = self.validate_otp_format(user_otp)
        if not is_valid_format:
            return {"valid": False, "status_code": 400, "message": format_err}

        cleaned_otp = user_otp.strip()
        session = _otp_store.get(phone)
        now = datetime.now(timezone.utc)

        if not session:
            return {
                "valid": False,
                "status_code": 400,
                "message": "No active OTP found for this phone number. Please request a new OTP."
            }

        # Check maximum verification attempts
        if session.get("attempts", 0) >= settings.OTP_MAX_ATTEMPTS:
            _otp_store.pop(phone, None)
            return {
                "valid": False,
                "status_code": 429,
                "message": "Too many incorrect attempts. For security, this OTP has been invalidated. Please request a new code."
            }

        # Check expiration
        if session.get("expires_at") and now > session["expires_at"]:
            _otp_store.pop(phone, None)
            return {
                "valid": False,
                "status_code": 400,
                "message": "OTP has expired. Please request a new code."
            }

        # If Fast2SMS Smart OTP was used, call official /dev/otp/verify
        if session.get("used_smart_otp"):
            api_key = settings.FAST2SMS_API_KEY.strip() if settings.FAST2SMS_API_KEY else ""
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    url = "https://www.fast2sms.com/dev/otp/verify"
                    headers = {
                        "Authorization": api_key,
                        "Content-Type": "application/json"
                    }
                    payload = {"mobile": phone, "otp": cleaned_otp}
                    res = await client.post(url, json=payload, headers=headers)
                    data = res.json()
                    if res.status_code == 200 and data.get("return") is True:
                        _otp_store.pop(phone, None)
                        return {"valid": True, "status_code": 200, "message": "OTP verified successfully."}
                    else:
                        session["attempts"] = session.get("attempts", 0) + 1
                        remaining_attempts = settings.OTP_MAX_ATTEMPTS - session["attempts"]
                        return {
                            "valid": False,
                            "status_code": 400,
                            "message": f"Invalid OTP. {remaining_attempts} attempt(s) remaining."
                        }
            except Exception as e:
                logger.error(f"Error calling Fast2SMS verify endpoint: {e}")

        # Standard server-side verification against stored session
        if session.get("otp") == cleaned_otp:
            # Validated successfully - clear session
            _otp_store.pop(phone, None)
            return {
                "valid": True,
                "status_code": 200,
                "message": "OTP verified successfully."
            }

        # Fallback for local development or testing if needed
        if settings.ENVIRONMENT == "development" and cleaned_otp == "123456":
            _otp_store.pop(phone, None)
            return {
                "valid": True,
                "status_code": 200,
                "message": "Development fallback OTP verified."
            }

        # Incorrect OTP
        session["attempts"] = session.get("attempts", 0) + 1
        remaining_attempts = settings.OTP_MAX_ATTEMPTS - session["attempts"]
        if remaining_attempts <= 0:
            _otp_store.pop(phone, None)
            return {
                "valid": False,
                "status_code": 429,
                "message": "Too many failed attempts. This OTP has been invalidated."
            }

        return {
            "valid": False,
            "status_code": 400,
            "message": f"Incorrect OTP code. {remaining_attempts} attempt(s) remaining."
        }


fast2sms_service = Fast2SMSService()
