from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.database import get_db
from app import models, schemas
from app.auth_service import get_current_admin

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/orders", response_model=List[schemas.OrderResponse])
def get_all_orders(
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin)
):
    orders = db.query(models.Order).order_by(models.Order.created_at.desc()).all()
    for o in orders:
        o.product_title = o.product.title
        o.seller_name = o.product.seller.full_name
        o.seller_phone = o.product.seller.phone
        o.seller_email = o.product.seller.email
        o.buyer_name = o.buyer.full_name
        o.buyer_phone = o.buyer.phone
        o.buyer_email = o.buyer.email
    return orders

@router.post("/orders/{id}/update-status", response_model=schemas.OrderResponse)
def update_order_status(
    id: str,
    order_status: str,  # "dropped_at_hub", "verified_by_admin", "cancelled"
    admin_notes: Optional[str] = None,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin)
):
    order = db.query(models.Order).filter(models.Order.id == id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    if order.order_status in ["completed", "cancelled"]:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot update status of a {order.order_status} order"
        )
        
    valid_statuses = ["dropped_at_hub", "verified_by_admin", "cancelled"]
    if order_status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status. Must be one of {valid_statuses}"
        )
        
    order.order_status = order_status
    
    escrow = db.query(models.EscrowTransaction).filter(models.EscrowTransaction.order_id == order.id).first()
    if escrow:
        if admin_notes:
            escrow.admin_notes = admin_notes
            
        if order_status == "verified_by_admin":
            escrow.verified_at = datetime.utcnow()
            order.product.verification_status = "verified"
            
        elif order_status == "cancelled":
            # Refund escrowed amount to buyer
            escrow.status = "refunded"
            buyer = order.buyer
            buyer.wallet_balance += escrow.amount
            
            # Revert product status to available
            order.product.status = "available"
            
    db.commit()
    db.refresh(order)
    
    order.product_title = order.product.title
    order.seller_name = order.product.seller.full_name
    return order

@router.post("/combos/create", response_model=schemas.ComboResponse)
def create_combo_kit(
    payload: schemas.ComboCreate,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin)
):
    products = db.query(models.Product).filter(models.Product.id.in_(payload.product_ids)).all()
    if len(products) != len(payload.product_ids):
        raise HTTPException(status_code=400, detail="One or more Product IDs are invalid")
        
    for p in products:
        if p.status != "available":
            raise HTTPException(
                status_code=400,
                detail=f"Product '{p.title}' is currently unavailable (status: {p.status})"
            )
            
    # 1. Create a virtual product representing the Combo Kit
    combo_product = models.Product(
        title=f"📦 [Combo Kit] {payload.title}",
        description=payload.description or f"Curated Project Combo Kit consisting of: {payload.components or ''}",
        category_id=5,  # Pre-built Semester Projects
        condition="new",
        price=payload.price,
        market_price=payload.price * 1.25,
        age_months=0,
        listing_type="sale",
        status="available",
        seller_id=admin.id,
        image_url=payload.image_url or "https://images.unsplash.com/photo-1553406830-ef2513450d76?w=400"
    )
    db.add(combo_product)
    db.commit()
    db.refresh(combo_product)

    # 2. Create the Combo
    combo = models.Combo(
        title=payload.title,
        description=payload.description,
        price=payload.price,
        image_url=payload.image_url,
        components=payload.components,
        product_id=combo_product.id,
        created_by=admin.id
    )
    db.add(combo)
    db.commit()
    db.refresh(combo)
    
    for p in products:
        combo.products.append(p)
        
    db.commit()
    db.refresh(combo)
    return combo

@router.get("/combos", response_model=List[schemas.ComboResponse])
def get_all_combos(db: Session = Depends(get_db)):
    return db.query(models.Combo).all()

@router.delete("/products/{id}", status_code=status.HTTP_200_OK)
def delete_product(
    id: str,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin)
):
    product = db.query(models.Product).filter(models.Product.id == id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    # Check if there are active orders for this product
    active_orders = db.query(models.Order).filter(
        models.Order.product_id == id,
        models.Order.order_status.notin_(["completed", "cancelled"])
    ).first()
    if active_orders:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete a product listing with active orders"
        )
        
    # Delete associated orders, escrows, and rentals
    orders = db.query(models.Order).filter(models.Order.product_id == id).all()
    for order in orders:
        db.query(models.EscrowTransaction).filter(models.EscrowTransaction.order_id == order.id).delete()
        db.query(models.Rental).filter(models.Rental.order_id == order.id).delete()
        db.delete(order)
        
    db.query(models.Rental).filter(models.Rental.product_id == id).delete()
    
    # Delete references from combo junction table
    db.execute(
        models.combo_items.delete().where(
            models.combo_items.c.product_id == id
        )
    )
        
    db.delete(product)
    db.commit()
    return {"message": "Product listing deleted successfully"}

@router.delete("/combos/{id}", status_code=status.HTTP_200_OK)
def delete_combo(
    id: str,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin)
):
    combo = db.query(models.Combo).filter(models.Combo.id == id).first()
    if not combo:
        raise HTTPException(status_code=404, detail="Combo kit not found")
        
    db.execute(
        models.combo_items.delete().where(
            models.combo_items.c.combo_id == id
        )
    )
    
    # Cascade delete virtual product listing representing this combo
    if combo.product_id:
        order_ids = [o.id for o in db.query(models.Order).filter(models.Order.product_id == combo.product_id).all()]
        if order_ids:
            db.query(models.EscrowTransaction).filter(models.EscrowTransaction.order_id.in_(order_ids)).delete(synchronize_session=False)
        db.query(models.Rental).filter(models.Rental.product_id == combo.product_id).delete(synchronize_session=False)
        db.query(models.Order).filter(models.Order.product_id == combo.product_id).delete(synchronize_session=False)
        db.query(models.Product).filter(models.Product.id == combo.product_id).delete(synchronize_session=False)
        
    db.delete(combo)
    db.commit()
    return {"message": "Combo kit deleted successfully"}

@router.delete("/orders/{id}", status_code=status.HTTP_200_OK)
def delete_order(
    id: str,
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_admin)
):
    order = db.query(models.Order).filter(models.Order.id == id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    db.query(models.EscrowTransaction).filter(models.EscrowTransaction.order_id == id).delete(synchronize_session=False)
    db.delete(order)
    db.commit()
    return {"message": "Order deleted successfully by Admin"}

