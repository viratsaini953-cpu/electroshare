from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from app.database import get_db
from app import models, schemas
from app.auth_service import get_current_user
from app.pricing_service import suggest_product_price

router = APIRouter(prefix="/products", tags=["products"])

@router.get("", response_model=List[schemas.ProductResponse])
def list_products(
    category_id: Optional[int] = None,
    condition: Optional[str] = None,
    verification_status: Optional[str] = None,
    listing_type: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Product).filter(models.Product.status == "available")
    
    if category_id is not None:
        query = query.filter(models.Product.category_id == category_id)
        
    if condition:
        query = query.filter(models.Product.condition == condition)
        
    if verification_status:
        query = query.filter(models.Product.verification_status == verification_status)
        
    if listing_type:
        query = query.filter(models.Product.listing_type == listing_type)
        
    if search:
        query = query.filter(
            or_(
                models.Product.title.ilike(f"%{search}%"),
                models.Product.description.ilike(f"%{search}%")
            )
        )
        
    products = query.order_by(models.Product.created_at.desc()).all()
    
    for p in products:
        p.seller_name = p.seller.full_name
        
    return products

@router.get("/categories", response_model=List[schemas.CategoryResponse])
def get_categories(db: Session = Depends(get_db)):
    return db.query(models.Category).all()

@router.post("/suggest-price", response_model=schemas.PriceSuggestionResponse)
def suggest_price(payload: schemas.PriceSuggestionRequest):
    result = suggest_product_price(
        market_price=payload.market_price,
        condition=payload.condition,
        age_months=payload.age_months
    )
    return result

@router.post("/create", response_model=schemas.ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    payload: schemas.ProductCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    category = db.query(models.Category).filter(models.Category.id == payload.category_id).first()
    if not category:
        raise HTTPException(status_code=400, detail="Invalid Category ID")
        
    if payload.listing_type in ["rent", "both"] and not payload.rent_price_per_day:
        raise HTTPException(
            status_code=400,
            detail="Rent price per day must be specified for rentable components"
        )
        
    product = models.Product(
        seller_id=current_user.id,
        category_id=payload.category_id,
        title=payload.title,
        description=payload.description,
        condition=payload.condition,
        price=payload.price,
        market_price=payload.market_price,
        age_months=payload.age_months,
        listing_type=payload.listing_type,
        rent_price_per_day=payload.rent_price_per_day,
        image_url=payload.image_url,
        amazon_url=payload.amazon_url,
        flipkart_url=payload.flipkart_url,
        other_url=payload.other_url,
        status="available",
        verification_status="verified" if current_user.role == "admin" else "unverified"
    )
    
    db.add(product)
    db.commit()
    db.refresh(product)
    
    product.seller_name = current_user.full_name
    return product

@router.get("/{id}", response_model=schemas.ProductResponse)
def get_product(id: str, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    product.seller_name = product.seller.full_name
    return product
