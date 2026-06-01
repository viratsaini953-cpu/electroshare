from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.database import get_db
from app import models, schemas
from app.auth_service import get_current_user

router = APIRouter(prefix="/orders", tags=["orders"])

@router.post("/create", response_model=schemas.OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(
    payload: schemas.OrderCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    product = db.query(models.Product).filter(models.Product.id == payload.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    if product.status != "available":
        raise HTTPException(status_code=400, detail="Product is not available for transaction")
        
    if product.seller_id == current_user.id:
        raise HTTPException(status_code=400, detail="Sellers cannot purchase or rent their own listings")
        
    # Calculate amount
    total_amount = 0.0
    if payload.order_type == "buy":
        if product.listing_type not in ["sale", "both"]:
            raise HTTPException(status_code=400, detail="Product is not listed for sale")
        total_amount = product.price
    elif payload.order_type == "rent":
        if product.listing_type not in ["rent", "both"]:
            raise HTTPException(status_code=400, detail="Product is not listed for rent")
        if not payload.start_date or not payload.end_date:
            raise HTTPException(status_code=400, detail="Start and end dates are required for renting")
        if payload.end_date < payload.start_date:
            raise HTTPException(status_code=400, detail="End date must be on or after start date")
            
        days = (payload.end_date - payload.start_date).days + 1
        total_amount = product.rent_price_per_day * days
    else:
        raise HTTPException(status_code=400, detail="Invalid order type")
        
    # Determine payment status (COD remains pending, others are prepaid paid)
    payment_status = "pending" if payload.payment_method == "cod" else "paid"
    
    # Create the Order
    order = models.Order(
        buyer_id=current_user.id,
        product_id=product.id,
        order_type=payload.order_type,
        total_amount=total_amount,
        payment_status=payment_status,
        payment_method=payload.payment_method,
        order_status="placed",
        delivery_type=payload.delivery_type,
        hub_location=payload.hub_location
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    
    # Create the Escrow Transaction hold
    escrow = models.EscrowTransaction(
        order_id=order.id,
        amount=total_amount,
        status="held"
    )
    db.add(escrow)
    
    # Set product availability
    is_combo_product = db.query(models.Combo).filter(models.Combo.product_id == product.id).first() is not None
    if payload.order_type == "rent":
        rental = models.Rental(
            order_id=order.id,
            product_id=product.id,
            renter_id=current_user.id,
            start_date=payload.start_date,
            end_date=payload.end_date,
            return_status="active"
        )
        db.add(rental)
        product.status = "rented"
    else:
        if not is_combo_product:
            product.status = "pending_escrow"
        
    db.commit()
    db.refresh(order)
    
    order.product_title = product.title
    order.seller_name = product.seller.full_name
    return order

@router.get("/my-purchases", response_model=List[schemas.OrderResponse])
def get_my_purchases(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    orders = db.query(models.Order).filter(models.Order.buyer_id == current_user.id).order_by(models.Order.created_at.desc()).all()
    for o in orders:
        o.product_title = o.product.title
        o.seller_name = o.product.seller.full_name
    return orders

@router.get("/my-sales", response_model=List[schemas.OrderResponse])
def get_my_sales(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    orders = db.query(models.Order).join(models.Product).filter(models.Product.seller_id == current_user.id).order_by(models.Order.created_at.desc()).all()
    for o in orders:
        o.product_title = o.product.title
        o.seller_name = o.product.seller.full_name
    return orders

@router.post("/{id}/confirm-receipt", response_model=schemas.OrderResponse)
def confirm_receipt(id: str, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.id == id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    if order.buyer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the buyer can confirm receipt")
        
    if order.order_status == "completed":
        raise HTTPException(status_code=400, detail="Order is already completed")
        
    if order.order_status == "cancelled":
        raise HTTPException(status_code=400, detail="Order has been cancelled")
        
    escrow = db.query(models.EscrowTransaction).filter(models.EscrowTransaction.order_id == order.id).first()
    if not escrow or escrow.status != "held":
        raise HTTPException(status_code=400, detail="Escrow is not in held status")
        
    # Mark order completed and set payment status to paid (handles COD collection)
    order.order_status = "completed"
    order.payment_status = "paid"
    
    # Release Escrow funds to seller's wallet
    escrow.status = "released"
    escrow.released_at = datetime.utcnow()
    
    seller = order.product.seller
    seller.wallet_balance += escrow.amount
    
    is_combo_product = db.query(models.Combo).filter(models.Combo.product_id == order.product.id).first() is not None
    if order.order_type == "buy" and not is_combo_product:
        order.product.status = "sold"
        
    db.commit()
    db.refresh(order)
    
    order.product_title = order.product.title
    order.seller_name = seller.full_name
    return order

@router.get("/{id}", response_model=schemas.OrderResponse)
def get_order(id: str, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.id == id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    if order.buyer_id != current_user.id and order.product.seller_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Unauthorized to view this order")
        
    order.product_title = order.product.title
    order.seller_name = order.product.seller.full_name
    return order
