import uuid
from datetime import datetime, timezone, timedelta
from typing import Dict, Any
from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer
from app.core.security import get_password_hash, verify_password, create_access_token, decode_access_token
from app.schemas.user import UserCreate, UserLogin, UserResponse, Token
from app.db.mongodb import db_manager

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


from app.schemas.user import UserCreate, UserLogin, UserResponse, Token, OTPRequest, OTPVerify

# In-memory OTP storage: phone -> {otp, expires_at}
_active_otps: Dict[str, Dict[str, Any]] = {}


@router.post("/otp/send")
async def send_login_otp(req: OTPRequest):
    # Standard demo OTP: 123456 for instant testing convenience
    otp = "123456"
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=5)
    _active_otps[req.phone] = {
        "otp": otp,
        "expires_at": expires_at
    }

    from app.services.notification_service import notification_service
    await notification_service.send_notification(
        recipient_phone=req.phone,
        title="Your Hospital OP Login OTP",
        message=f"Your one-time login verification code is {otp}. Valid for 5 minutes. Do not share this with anyone.",
        category="LOGIN_OTP"
    )

    return {
        "success": True,
        "message": f"OTP code successfully sent to +91 {req.phone}",
        "otp_preview": otp,
        "expires_in_seconds": 300
    }


@router.post("/otp/verify", response_model=Token)
async def verify_login_otp(credentials: OTPVerify):
    stored = _active_otps.get(credentials.phone)
    # Accept stored OTP or fallback demo 123456
    is_valid = (stored and stored.get("otp") == credentials.otp) or credentials.otp == "123456"
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP. Please enter the 6-digit code or use 123456."
        )

    # Find existing patient or auto-provision new patient profile
    user_doc = None
    if not db_manager.is_mock and db_manager.db is not None:
        user_doc = await db_manager.db.users.find_one({"phone": credentials.phone})
    else:
        user_doc = _mock_users.get(credentials.phone)

    now_iso = datetime.now(timezone.utc).isoformat()
    if not user_doc:
        # Auto-create patient account on first OTP login
        user_id = str(uuid.uuid4())
        patient_name = credentials.name or f"Patient ({credentials.phone[-4:]})"
        user_doc = {
            "_id": user_id,
            "id": user_id,
            "name": patient_name,
            "phone": credentials.phone,
            "email": f"{credentials.phone}@patient.hospitalop.com",
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
            _mock_users[credentials.phone] = user_doc

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
