import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Date, Table, Text
from sqlalchemy.orm import relationship
from app.database import Base

# Junction table for Project Combo Kits
combo_items = Table(
    "combo_items",
    Base.metadata,
    Column("combo_id", String(36), ForeignKey("combos.id", ondelete="CASCADE"), primary_key=True),
    Column("product_id", String(36), ForeignKey("products.id", ondelete="CASCADE"), primary_key=True),
)

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone = Column(String(20), unique=True, index=True, nullable=True)
    full_name = Column(String(255), nullable=False)
    password_hash = Column(String(255), nullable=True)
    role = Column(String(50), default="student")  # "student" or "admin"
    wallet_balance = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)


    # Relationships
    products = relationship("Product", back_populates="seller", foreign_keys="Product.seller_id")
    orders_bought = relationship("Order", back_populates="buyer", foreign_keys="Order.buyer_id")
    rentals = relationship("Rental", back_populates="renter", foreign_keys="Rental.renter_id")

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(String(255), nullable=True)

    products = relationship("Product", back_populates="category")

class Product(Base):
    __tablename__ = "products"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    seller_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(String(1000), nullable=True)
    condition = Column(String(50), nullable=False)  # "new", "gently_used", "heavily_used"
    price = Column(Float, nullable=False)
    market_price = Column(Float, nullable=False)  # Original brand-new market price
    age_months = Column(Integer, default=0)
    verification_status = Column(String(50), default="unverified")  # "unverified", "verified"
    listing_type = Column(String(50), default="sale")  # "sale", "rent", "both"
    rent_price_per_day = Column(Float, nullable=True)
    status = Column(String(50), default="available")  # "available", "pending_escrow", "sold", "rented"
    image_url = Column(Text, nullable=True)
    amazon_url = Column(String(555), nullable=True)
    flipkart_url = Column(String(555), nullable=True)
    other_url = Column(String(555), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    seller = relationship("User", back_populates="products", foreign_keys=[seller_id])
    category = relationship("Category", back_populates="products")
    orders = relationship("Order", back_populates="product")
    rentals = relationship("Rental", back_populates="product")

class Order(Base):
    __tablename__ = "orders"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    buyer_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    product_id = Column(String(36), ForeignKey("products.id"), nullable=False)
    order_type = Column(String(50), nullable=False)  # "buy" or "rent"
    total_amount = Column(Float, nullable=False)
    payment_status = Column(String(50), default="pending")  # "pending", "paid", "failed"
    payment_method = Column(String(50), default="upi")  # "upi", "card", "cod"
    order_status = Column(String(50), default="placed")  # "placed", "dropped_at_hub", "verified_by_admin", "completed", "cancelled"
    delivery_type = Column(String(50), default="hub_pickup")  # "hub_pickup", "p2p"
    hub_location = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    buyer = relationship("User", back_populates="orders_bought", foreign_keys=[buyer_id])
    product = relationship("Product", back_populates="orders")
    escrow_transaction = relationship("EscrowTransaction", back_populates="order", uselist=False)
    rental = relationship("Rental", back_populates="order", uselist=False)

class EscrowTransaction(Base):
    __tablename__ = "escrow_transactions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id = Column(String(36), ForeignKey("orders.id"), nullable=False)
    amount = Column(Float, nullable=False)
    status = Column(String(50), default="held")  # "held", "released", "refunded"
    admin_notes = Column(String(1000), nullable=True)
    verified_at = Column(DateTime, nullable=True)
    released_at = Column(DateTime, nullable=True)

    # Relationships
    order = relationship("Order", back_populates="escrow_transaction")

class Rental(Base):
    __tablename__ = "rentals"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id = Column(String(36), ForeignKey("orders.id"), nullable=False)
    product_id = Column(String(36), ForeignKey("products.id"), nullable=False)
    renter_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    return_status = Column(String(50), default="active")  # "active", "returned", "overdue"
    returned_at = Column(DateTime, nullable=True)

    # Relationships
    order = relationship("Order", back_populates="rental")
    product = relationship("Product", back_populates="rentals")
    renter = relationship("User", back_populates="rentals", foreign_keys=[renter_id])

class Combo(Base):
    __tablename__ = "combos"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(255), nullable=False)
    description = Column(String(1000), nullable=True)
    price = Column(Float, nullable=False)
    image_url = Column(Text, nullable=True)
    components = Column(Text, nullable=True)
    created_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    products = relationship("Product", secondary=combo_items, backref="combos")

class OTPVerification(Base):
    __tablename__ = "otp_verifications"

    id = Column(Integer, primary_key=True, autoincrement=True)
    target = Column(String(255), unique=True, index=True, nullable=False)  # email or phone number
    otp = Column(String(6), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    verified = Column(Boolean, default=False)
