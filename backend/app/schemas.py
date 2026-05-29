from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, date

class SendOTPRequest(BaseModel):
    target: str  # Email ending in @lpu.in or phone number

class VerifyOTPRequest(BaseModel):
    target: str
    otp: str

class PhoneCheckRequest(BaseModel):
    phone: str

class PhoneCheckResponse(BaseModel):
    registered: bool

class RegisterRequest(BaseModel):
    phone: str
    password: str

class LoginRequest(BaseModel):
    phone: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserResponse(BaseModel):
    id: str
    email: str
    phone: Optional[str] = None
    full_name: str
    role: str
    wallet_balance: float
    created_at: datetime

    class Config:
        from_attributes = True

class CategoryResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None

    class Config:
        from_attributes = True

class ProductCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category_id: int
    condition: str  # "new", "gently_used", "heavily_used"
    price: float
    market_price: float
    age_months: int = 0
    listing_type: str = "sale"  # "sale", "rent", "both"
    rent_price_per_day: Optional[float] = None
    image_url: Optional[str] = None
    amazon_url: Optional[str] = None
    flipkart_url: Optional[str] = None
    other_url: Optional[str] = None

class ProductResponse(BaseModel):
    id: str
    seller_id: str
    seller_name: Optional[str] = None
    category: CategoryResponse
    title: str
    description: Optional[str] = None
    condition: str
    price: float
    market_price: float
    age_months: int
    verification_status: str
    listing_type: str
    rent_price_per_day: Optional[float] = None
    status: str
    image_url: Optional[str] = None
    amazon_url: Optional[str] = None
    flipkart_url: Optional[str] = None
    other_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class PriceSuggestionRequest(BaseModel):
    category_id: int
    condition: str
    market_price: float
    age_months: int

class PriceSuggestionResponse(BaseModel):
    suggested_price_min: float
    suggested_price_max: float
    recommended_price: float
    explanation: str

class OrderCreate(BaseModel):
    product_id: str
    order_type: str  # "buy" or "rent"
    delivery_type: str = "hub_pickup"  # "hub_pickup" or "p2p"
    hub_location: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    payment_method: str = "upi"  # "upi", "card", "cod"

class EscrowTransactionResponse(BaseModel):
    id: str
    amount: float
    status: str
    admin_notes: Optional[str] = None
    verified_at: Optional[datetime] = None
    released_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class RentalResponse(BaseModel):
    id: str
    start_date: date
    end_date: date
    return_status: str
    returned_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class OrderResponse(BaseModel):
    id: str
    buyer_id: str
    product_id: str
    product_title: Optional[str] = None
    seller_name: Optional[str] = None
    order_type: str
    total_amount: float
    payment_status: str
    payment_method: str
    order_status: str
    delivery_type: str
    hub_location: Optional[str] = None
    created_at: datetime
    escrow_transaction: Optional[EscrowTransactionResponse] = None
    rental: Optional[RentalResponse] = None

    class Config:
        from_attributes = True

class ComboCreate(BaseModel):
    title: str
    description: Optional[str] = None
    price: float
    product_ids: List[str]

class ComboResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    price: float
    created_by: str
    created_at: datetime
    products: List[ProductResponse]

    class Config:
        from_attributes = True

class WalletTopupRequest(BaseModel):
    amount: float

class ProfileUpdateRequest(BaseModel):
    full_name: str
    email: str
