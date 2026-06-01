from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.database import get_db
from app import models, schemas
from app.auth_service import get_current_user, get_current_admin

router = APIRouter(prefix="/kit-requests", tags=["kit-requests"])

@router.post("/create", response_model=schemas.KitRequestResponse, status_code=status.HTTP_201_CREATED)
def create_kit_request(
    payload: schemas.KitRequestCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    req = models.KitRequest(
        user_id=current_user.id,
        project_name=payload.project_name,
        components=payload.components,
        target_budget=payload.target_budget,
        notes=payload.notes,
        status="pending"
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    
    # Attach helper details for schema response mapping
    req.user_phone = current_user.phone
    req.user_name = current_user.full_name
    return req

@router.get("/my-requests", response_model=List[schemas.KitRequestResponse])
def get_my_requests(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    requests = db.query(models.KitRequest).filter(models.KitRequest.user_id == current_user.id).order_by(models.KitRequest.created_at.desc()).all()
    for r in requests:
        r.user_phone = current_user.phone
        r.user_name = current_user.full_name
    return requests

@router.get("/admin-all", response_model=List[schemas.KitRequestResponse])
def admin_get_all_requests(
    admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    requests = db.query(models.KitRequest).order_by(models.KitRequest.created_at.desc()).all()
    for r in requests:
        r.user_phone = r.user.phone
        r.user_name = r.user.full_name
    return requests

@router.post("/{id}/update-status", response_model=schemas.KitRequestResponse)
def update_request_status(
    id: str,
    new_status: str,  # "pending", "assembling", "ready", "cancelled"
    admin: models.User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    req = db.query(models.KitRequest).filter(models.KitRequest.id == id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Kit request not found")
        
    valid_statuses = ["pending", "assembling", "ready", "cancelled"]
    if new_status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
        
    req.status = new_status
    db.commit()
    db.refresh(req)
    
    req.user_phone = req.user.phone
    req.user_name = req.user.full_name
    return req
