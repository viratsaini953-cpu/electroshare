import random
import httpx
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.auth_service import create_access_token, get_current_user
from app.config import settings

def send_real_sms(phone: str, otp: str):
    # Log the OTP in the server console for debugging
    print(f"\n======================================")
    print(f"OTP generated for {phone}: {otp}")
    print(f"======================================\n")
    
    # 1. Try Fast2SMS (Indian SMS gateway)
    if settings.FAST2SMS_API_KEY:
        try:
            url = "https://www.fast2sms.com/dev/bulkV2"
            headers = {
                "authorization": settings.FAST2SMS_API_KEY,
                "Content-Type": "application/json"
            }
            payload = {
                "route": "otp",
                "variables_values": otp,
                "numbers": phone
            }
            res = httpx.post(url, json=payload, headers=headers, timeout=5.0)
            if res.status_code == 200:
                print(f"SMS successfully dispatched via Fast2SMS to +91{phone}")
                return True
            else:
                print(f"Fast2SMS failed with status {res.status_code}: {res.text}")
        except Exception as e:
            print(f"Fast2SMS error: {e}")
            
    # 2. Try Twilio (International SMS gateway)
    if settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN:
        try:
            url = f"https://api.twilio.com/2010-04-01/Accounts/{settings.TWILIO_ACCOUNT_SID}/Messages.json"
            auth = (settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
            to_number = f"+91{phone}" if not phone.startswith("+") else phone
            payload = {
                "To": to_number,
                "From": settings.TWILIO_FROM_NUMBER or "+18559990192",
                "Body": f"ElectroShare Verification Code: {otp}. Valid for 5 minutes."
            }
            res = httpx.post(url, data=payload, auth=auth, timeout=5.0)
            if res.status_code in [200, 201]:
                print(f"SMS successfully dispatched via Twilio to {to_number}")
                return True
            else:
                print(f"Twilio SMS failed with status {res.status_code}: {res.text}")
        except Exception as e:
            print(f"Twilio SMS error: {e}")
            
    # 3. Try Twilio WhatsApp API
    if settings.TWILIO_ACCOUNT_SID and settings.TWILIO_AUTH_TOKEN:
        try:
            url = f"https://api.twilio.com/2010-04-01/Accounts/{settings.TWILIO_ACCOUNT_SID}/Messages.json"
            auth = (settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
            
            to_number = f"whatsapp:+91{phone}" if not phone.startswith("+") and not phone.startswith("whatsapp:") else (phone if phone.startswith("whatsapp:") else f"whatsapp:{phone}")
            from_val = settings.TWILIO_FROM_NUMBER or "+14155238886"
            from_number = f"whatsapp:{from_val}" if not from_val.startswith("whatsapp:") else from_val
            
            payload = {
                "To": to_number,
                "From": from_number,
                "Body": f"Your ElectroShare verification code is: {otp}"
            }
            res = httpx.post(url, data=payload, auth=auth, timeout=5.0)
            if res.status_code in [200, 201]:
                print(f"WhatsApp OTP successfully dispatched via Twilio to {to_number}")
                return True
            else:
                print(f"Twilio WhatsApp failed with status {res.status_code}: {res.text}")
        except Exception as e:
            print(f"Twilio WhatsApp error: {e}")
            
    return False

import hashlib

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

def verify_password(password: str, hashed_password: str) -> bool:
    return hash_password(password) == hashed_password

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/check-phone", response_model=schemas.PhoneCheckResponse)
def check_phone(payload: schemas.PhoneCheckRequest, db: Session = Depends(get_db)):
    phone = payload.phone.strip()
    is_email = "@" in phone
    if is_email:
        user = db.query(models.User).filter(models.User.email == phone.lower()).first()
    else:
        clean_phone = "".join(filter(str.isdigit, phone))
        if len(clean_phone) != 10:
            raise HTTPException(status_code=400, detail="Please enter a valid 10-digit mobile number")
        user = db.query(models.User).filter(models.User.phone == clean_phone).first()
    return {"registered": user is not None}

@router.post("/register", response_model=schemas.TokenResponse)
def register_user(payload: schemas.RegisterRequest, db: Session = Depends(get_db)):
    phone = payload.phone.strip()
    password = payload.password
    
    clean_phone = "".join(filter(str.isdigit, phone))
    if len(clean_phone) != 10:
        raise HTTPException(status_code=400, detail="Please enter a valid 10-digit mobile number")
        
    if len(password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long")
        
    # Check if OTP is verified for this number
    otp_record = db.query(models.OTPVerification).filter(
        models.OTPVerification.target == clean_phone,
        models.OTPVerification.verified == True
    ).first()
    
    # Universal bypass for admin / test flows if needed, but enforce standard verification
    if not otp_record and clean_phone != "9389047361":
        raise HTTPException(
            status_code=400,
            detail="Phone number not verified. Please request and verify the SMS OTP first."
        )
        
    existing = db.query(models.User).filter(models.User.phone == clean_phone).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this phone number already registered")
        
    role = "admin" if (clean_phone == "9389047361" or db.query(models.User).count() == 0) else "student"
    full_name = "Admin Vansh Saini" if clean_phone == "9389047361" else f"User {clean_phone[-4:]}"
    
    user = models.User(
        email=f"{clean_phone}@electroshare.com",
        phone=clean_phone,
        full_name=full_name,
        role=role,
        wallet_balance=0.0,
        password_hash=hash_password(password)
    )
    db.add(user)
    if otp_record:
        db.delete(otp_record)
    db.commit()
    db.refresh(user)
    
    token = create_access_token(subject=user.id)
    return {"access_token": token, "token_type": "bearer"}

@router.post("/login", response_model=schemas.TokenResponse)
def login_user(payload: schemas.LoginRequest, db: Session = Depends(get_db)):
    phone = payload.phone.strip()
    password = payload.password
    
    is_email = "@" in phone
    if is_email:
        user = db.query(models.User).filter(models.User.email == phone.lower()).first()
    else:
        clean_phone = "".join(filter(str.isdigit, phone))
        if len(clean_phone) != 10:
            raise HTTPException(status_code=400, detail="Please enter a valid 10-digit mobile number")
        user = db.query(models.User).filter(models.User.phone == clean_phone).first()
        
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Force promote all 3 admin numbers to admin role
    if user.phone in ["9389047361", "9389047261", "9259558081"]:
        user.role = "admin"
        if password in ["Saini@321", "saini@321"]:
            user.password_hash = hash_password("Saini@321")
        db.commit()
        
    if not user.password_hash:
        user.password_hash = hash_password(password)
        db.commit()
    elif not verify_password(password, user.password_hash) and not (user.phone in ["9389047361", "9389047261", "9259558081"] and password.lower() == "saini@321"):
        raise HTTPException(status_code=400, detail="Incorrect password")
        
    token = create_access_token(subject=user.id)
    return {"access_token": token, "token_type": "bearer"}


@router.post("/send-otp")
def send_otp(payload: schemas.SendOTPRequest, db: Session = Depends(get_db)):
    target = payload.target.strip()
    
    # 1. Validation
    is_email = "@" in target
    if is_email:
        if "." not in target.split("@")[1]:
            raise HTTPException(
                status_code=400,
                detail="Please enter a valid email address"
            )
    else:
        # Check phone number format (standard 10-digit)
        clean_phone = "".join(filter(str.isdigit, target))
        if len(clean_phone) != 10:
            raise HTTPException(
                status_code=400,
                detail="Please enter a valid 10-digit mobile number"
            )
        target = clean_phone

    # 2. Generate OTP (6 digits)
    otp_code = str(random.randint(100000, 999999))
    expires_at = datetime.utcnow() + timedelta(minutes=5)
    
    # 3. Store OTP
    otp_record = db.query(models.OTPVerification).filter(models.OTPVerification.target == target).first()
    if otp_record:
        otp_record.otp = otp_code
        otp_record.expires_at = expires_at
        otp_record.verified = False
    else:
        otp_record = models.OTPVerification(
            target=target,
            otp=otp_code,
            expires_at=expires_at,
            verified=False
        )
        db.add(otp_record)
    
    db.commit()
    
    # 4. Dispatch SMS OTP if target is a phone number
    if "@" not in target:
        send_real_sms(target, otp_code)
        
    return {
        "message": f"OTP sent to {target}",
        "expires_at": expires_at
    }

@router.post("/verify-otp", response_model=schemas.TokenResponse)
def verify_otp(payload: schemas.VerifyOTPRequest, db: Session = Depends(get_db)):
    target = payload.target.strip()
    otp = payload.otp.strip()
    
    if "@" not in target:
        target = "".join(filter(str.isdigit, target))
        
    # Universal master key '123456' for rapid testing
    is_master_otp = (otp == "123456")
    
    if is_master_otp:
        otp_record = db.query(models.OTPVerification).filter(
            models.OTPVerification.target == target
        ).first()
        if not otp_record:
            otp_record = models.OTPVerification(
                target=target,
                otp="123456",
                expires_at=datetime.utcnow() + timedelta(minutes=5),
                verified=True
            )
            db.add(otp_record)
        else:
            otp_record.verified = True
            otp_record.expires_at = datetime.utcnow() + timedelta(minutes=5)
        db.commit()
    else:
        otp_record = db.query(models.OTPVerification).filter(
            models.OTPVerification.target == target,
            models.OTPVerification.otp == otp
        ).first()
        
        if not otp_record:
            raise HTTPException(status_code=400, detail="Invalid OTP code")
            
        if otp_record.expires_at < datetime.utcnow():
            raise HTTPException(status_code=400, detail="OTP has expired")
            
        otp_record.verified = True
        db.commit()
        
    # Get or create user
    is_email = "@" in target
    if is_email:
        user = db.query(models.User).filter(models.User.email == target.lower()).first()
        if not user:
            return {"access_token": "pending_registration", "token_type": "bearer"}
    else:
        user = db.query(models.User).filter(models.User.phone == target).first()
        if user and target == "9389047361" and user.role != "admin":
            user.role = "admin"
            db.commit()
            db.refresh(user)
        elif not user:
            return {"access_token": "pending_registration", "token_type": "bearer"}
            
    # Generate JWT
    token = create_access_token(subject=user.id)
    return {"access_token": token, "token_type": "bearer"}

@router.get("/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@router.post("/wallet/topup", response_model=schemas.UserResponse)
def topup_wallet(payload: schemas.WalletTopupRequest, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if payload.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")
    
    current_user.wallet_balance += payload.amount
    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/update-phone", response_model=schemas.UserResponse)
def update_phone(phone: str, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    clean_phone = "".join(filter(str.isdigit, phone))
    if len(clean_phone) != 10:
        raise HTTPException(status_code=400, detail="Please enter a valid 10-digit mobile number")
        
    # Check if this phone is taken
    taken = db.query(models.User).filter(models.User.phone == clean_phone, models.User.id != current_user.id).first()
    if taken:
        raise HTTPException(status_code=400, detail="Phone number already linked to another account")
        
    current_user.phone = clean_phone
    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/update-profile", response_model=schemas.UserResponse)
def update_profile(payload: schemas.ProfileUpdateRequest, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not payload.full_name.strip():
        raise HTTPException(status_code=400, detail="Name cannot be empty")
        
    email = payload.email.strip().lower()
    if email and ("@" not in email or "." not in email.split("@")[1]):
        raise HTTPException(status_code=400, detail="Invalid email format")
        
    if email and email != current_user.email:
        taken = db.query(models.User).filter(models.User.email == email, models.User.id != current_user.id).first()
        if taken:
            raise HTTPException(status_code=400, detail="Email is already in use by another account")
        current_user.email = email
        
    current_user.full_name = payload.full_name.strip()
    db.commit()
    db.refresh(current_user)
    return current_user
