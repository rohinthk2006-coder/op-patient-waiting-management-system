import os
import uuid
import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, Any
from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer
from app.core.security import get_password_hash, verify_password, create_access_token, decode_access_token
from app.core.config import settings
from app.schemas.user import UserCreate, UserLogin, UserResponse, Token
from app.db.mongodb import db_manager

logger = logging.getLogger("app.api.auth")


router = APIRouter(prefix="/auth", tags=["Authentication"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

_mock_users: Dict[str, Dict[str, Any]] = {
    # Default demo doctor and receptionist
    "9876543210": {
        "_id": "user-doc-01",
        "id": "user-doc-01",
        "name": "Dr. R. Anand",
        "phone": "9876543210",
        "email": "anand.cardio@apollo.com",
        "role": "DOCTOR",
        "hospital_id": "hosp-apollo-01",
        "hashed_password": get_password_hash("doctor123"),
        "created_at": "2026-10-23T08:00:00Z"
    },
    "9876543211": {
        "_id": "user-recep-01",
        "id": "user-recep-01",
        "name": "Reception Desk - Apollo",
        "phone": "9876543211",
        "email": "opd.desk@apollo.com",
        "role": "RECEPTIONIST",
        "hospital_id": "hosp-apollo-01",
        "hashed_password": get_password_hash("recep123"),
        "created_at": "2026-10-23T08:00:00Z"
    },
    "9840112233": {
        "_id": "user-patient-01",
        "id": "user-patient-01",
        "name": "Rajesh Kumar",
        "phone": "9840112233",
        "email": "rajesh.k@gmail.com",
        "role": "PATIENT",
        "age": 38,
        "gender": "Male",
        "hashed_password": get_password_hash("patient123"),
        "created_at": "2026-10-23T08:00:00Z"
    },
    "9876543299": {
        "_id": "user-admin-01",
        "id": "user-admin-01",
        "name": "Super Admin - Apollo Health",
        "phone": "9876543299",
        "email": "admin@apollo.com",
        "role": "ADMIN",
        "hospital_id": "hosp-apollo-01",
        "hashed_password": get_password_hash("admin123"),
        "created_at": "2026-10-23T08:00:00Z"
    }
}


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserCreate):
    # Check if user already exists
    if not db_manager.is_mock and db_manager.db is not None:
        existing = await db_manager.db.users.find_one({"phone": user_in.phone})
        if existing:
            raise HTTPException(status_code=400, detail="Phone number already registered.")
    else:
        if user_in.phone in _mock_users:
            raise HTTPException(status_code=400, detail="Phone number already registered.")

    user_id = str(uuid.uuid4())
    now_iso = datetime.now(timezone.utc).isoformat()
    hashed_pwd = get_password_hash(user_in.password)

    user_doc = {
        "_id": user_id,
        "id": user_id,
        "name": user_in.name,
        "phone": user_in.phone,
        "email": user_in.email,
        "age": user_in.age,
        "gender": user_in.gender,
        "role": user_in.role.value,
        "hospital_id": user_in.hospital_id,
        "hashed_password": hashed_pwd,
        "created_at": now_iso
    }

    if not db_manager.is_mock and db_manager.db is not None:
        await db_manager.db.users.insert_one(user_doc)
    else:
        _mock_users[user_in.phone] = user_doc

    token = create_access_token({"sub": user_id, "role": user_in.role.value, "phone": user_in.phone})
    return Token(
        access_token=token,
        token_type="bearer",
        user=UserResponse(**user_doc)
    )


@router.post("/login", response_model=Token)
async def login(credentials: UserLogin):
    identifier = credentials.username or credentials.phone or credentials.email
    if not identifier:
        raise HTTPException(status_code=400, detail="Please enter your email ID or mobile number.")
    identifier = identifier.strip()

    user_doc = None
    if not db_manager.is_mock and db_manager.db is not None:
        user_doc = await db_manager.db.users.find_one({
            "$or": [{"phone": identifier}, {"email": identifier.lower()}]
        })
    else:
        for u in _mock_users.values():
            if u.get("phone") == identifier or (u.get("email") and u.get("email").lower() == identifier.lower()):
                user_doc = u
                break

    if not user_doc or not verify_password(credentials.password, user_doc["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials. Please verify your username and password.")

    user_id = user_doc.get("id") or user_doc.get("_id")
    token = create_access_token({"sub": user_id, "role": user_doc["role"], "phone": user_doc["phone"]})
    return Token(
        access_token=token,
        token_type="bearer",
        user=UserResponse(
            id=user_id,
            name=user_doc["name"],
            phone=user_doc["phone"],
            email=user_doc.get("email"),
            age=user_doc.get("age"),
            gender=user_doc.get("gender"),
            role=user_doc["role"],
            hospital_id=user_doc.get("hospital_id"),
            created_at=user_doc["created_at"]
        )
    )


from app.schemas.user import UserCreate, UserLogin, UserResponse, Token, OTPRequest, OTPVerify
from app.services.fast2sms_service import fast2sms_service


@router.post("/otp/send")
async def send_login_otp(req: OTPRequest):
    result = await fast2sms_service.send_otp(req.phone)
    if not result.get("success"):
        # In development, if Fast2SMS returns 996 (website verification) or 999 (account activation recharge),
        # return response with informative message and preview for local testing convenience
        if settings.ENVIRONMENT == "development" and result.get("fast2sms_code") in [996, 999]:
            from app.services.notification_service import notification_service
            dev_otp = result.get("otp_preview") or "123456"
            await notification_service.send_notification(
                recipient_phone=req.phone,
                title="Hospital OP Login OTP",
                message=f"Fast2SMS notice: {result['message']}",
                category="LOGIN_OTP"
            )
            return {
                "success": True,
                "real_sms_sent": False,
                "message": result["message"],
                "otp_preview": dev_otp,
                "fast2sms_code": result.get("fast2sms_code"),
                "expires_in_seconds": 300
            }

        raise HTTPException(
            status_code=result.get("status_code", status.HTTP_400_BAD_REQUEST),
            detail=result.get("message", "Failed to send OTP.")
        )

    # In-app notification record
    from app.services.notification_service import notification_service
    await notification_service.send_notification(
        recipient_phone=req.phone,
        title="Your Hospital OP Login OTP",
        message=f"Your one-time login verification code was sent via Fast2SMS to +91 {req.phone[-10:]}.",
        category="LOGIN_OTP"
    )

    return {
        "success": True,
        "real_sms_sent": True,
        "message": result["message"],
        "expires_in_seconds": result.get("expires_in_seconds", 300)
    }


@router.post("/otp/verify", response_model=Token)
async def verify_login_otp(credentials: OTPVerify):
    verify_res = await fast2sms_service.verify_otp(credentials.phone, credentials.otp)
    if not verify_res.get("valid"):
        raise HTTPException(
            status_code=verify_res.get("status_code", status.HTTP_400_BAD_REQUEST),
            detail=verify_res.get("message", "Invalid or expired OTP.")
        )

    # Clean 10-digit phone for user profile
    _, clean_phone, _ = fast2sms_service.normalize_and_validate_phone(credentials.phone)
    phone_key = clean_phone or credentials.phone

    # Find existing patient or auto-provision new patient profile
    user_doc = None
    if not db_manager.is_mock and db_manager.db is not None:
        user_doc = await db_manager.db.users.find_one({"phone": phone_key})
    else:
        user_doc = _mock_users.get(phone_key)

    now_iso = datetime.now(timezone.utc).isoformat()
    if not user_doc:
        # Auto-create patient account on first OTP login
        user_id = str(uuid.uuid4())
        patient_name = credentials.name or f"Patient ({phone_key[-4:]})"
        user_doc = {
            "_id": user_id,
            "id": user_id,
            "name": patient_name,
            "phone": phone_key,
            "email": f"{phone_key}@patient.hospitalop.com",
            "age": 32,
            "gender": "Unspecified",
            "role": "PATIENT",
            "hospital_id": None,
            "hashed_password": get_password_hash("otp-auto-login"),
            "created_at": now_iso
        }
        if not db_manager.is_mock and db_manager.db is not None:
            await db_manager.db.users.insert_one(user_doc)
        else:
            _mock_users[phone_key] = user_doc

    user_id = user_doc.get("id") or user_doc.get("_id")
    token = create_access_token({"sub": user_id, "role": user_doc["role"], "phone": user_doc["phone"]})
    return Token(
        access_token=token,
        token_type="bearer",
        user=UserResponse(
            id=user_id,
            name=user_doc["name"],
            phone=user_doc["phone"],
            email=user_doc.get("email"),
            age=user_doc.get("age"),
            gender=user_doc.get("gender"),
            role=user_doc["role"],
            hospital_id=user_doc.get("hospital_id"),
            created_at=user_doc["created_at"]
        )
    )


async def get_current_user(token: str = Depends(oauth2_scheme)) -> Dict[str, Any]:
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token.")
    user_id = payload.get("sub")
    phone = payload.get("phone")

    user_doc = None
    if not db_manager.is_mock and db_manager.db is not None:
        user_doc = await db_manager.db.users.find_one({"_id": user_id})
    else:
        user_doc = _mock_users.get(phone)

    if not user_doc:
        raise HTTPException(status_code=401, detail="User account not found.")
    return user_doc
