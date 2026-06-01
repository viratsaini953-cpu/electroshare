from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.database import engine, Base, SessionLocal
from app import models
from app.routers import auth, products, orders, admin, kit_requests

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create all tables on startup if they don't exist
    # Base.metadata.drop_all(bind=engine)  # Kept commented out for reference/future schema updates
    Base.metadata.create_all(bind=engine)
    # Seed default categories and admin user
    db = SessionLocal()
    try:
        from sqlalchemy import text
        try:
            db.execute(text("ALTER TABLE combos ADD COLUMN image_url TEXT;"))
            db.commit()
            print("Added image_url column to combos table.")
        except Exception as e:
            db.rollback()
            print(f"Skipping alter image_url column: {e}")

        try:
            db.execute(text("ALTER TABLE combos ADD COLUMN components TEXT;"))
            db.commit()
            print("Added components column to combos table.")
        except Exception as e:
            db.rollback()
            print(f"Skipping alter components column: {e}")

        try:
            db.execute(text("ALTER TABLE combos ADD COLUMN product_id TEXT;"))
            db.commit()
            print("Added product_id column to combos table.")
        except Exception as e:
            db.rollback()
            print(f"Skipping alter product_id column: {e}")

        # Backfill existing combos with a virtual product
        try:
            unlinked_combos = db.query(models.Combo).filter(models.Combo.product_id == None).all()
            if unlinked_combos:
                admin_user = db.query(models.User).filter(models.User.role == "admin").first()
                admin_id = admin_user.id if admin_user else None
                if not admin_id:
                    # Fallback to any user if no admin found
                    any_user = db.query(models.User).first()
                    admin_id = any_user.id if any_user else "admin_seed"
                for combo in unlinked_combos:
                    vp = models.Product(
                        title=f"📦 [Combo Kit] {combo.title}",
                        description=combo.description or f"Curated Combo Kit including components: {combo.components or ''}",
                        category_id=5,
                        condition="new",
                        price=combo.price,
                        market_price=combo.price * 1.25,
                        age_months=0,
                        listing_type="sale",
                        status="available",
                        seller_id=admin_id,
                        image_url=combo.image_url or "https://images.unsplash.com/photo-1553406830-ef2513450d76?w=400"
                    )
                    db.add(vp)
                    db.commit()
                    db.refresh(vp)
                    combo.product_id = vp.id
                    db.commit()
                print(f"Backfilled {len(unlinked_combos)} combos with virtual product listings.")
        except Exception as e:
            db.rollback()
            print(f"Failed to backfill combos: {e}")
            
        if db.query(models.Category).count() == 0:
            categories = [
                models.Category(
                    name="Microcontrollers & Development Boards", 
                    description="Arduino, ESP32, Raspberry Pi, STM32, NodeMCU boards."
                ),
                models.Category(
                    name="Sensors & Modules", 
                    description="Ultrasonic, IR, MPU6050 accelerometer, DHT11 temperature, LiDAR, GPS, Gas sensors."
                ),
                models.Category(
                    name="Actuators, Motors & Drivers", 
                    description="Servo motors, DC geared motors, Steppers, L298N drivers, relay boards."
                ),
                models.Category(
                    name="Power, Cables & Prototyping", 
                    description="Li-Po batteries, breadboards, male/female jumper wires, step-down buck converters."
                ),
                models.Category(
                    name="Pre-built Semester Projects", 
                    description="Completed Major/Minor academic projects ready for demonstration or reference."
                )
            ]
            db.add_all(categories)
            db.commit()
            
            # Default admin account
            admin_user = models.User(
                email="admin@electroshare.com",
                full_name="ElectroShare Hub Admin",
                role="admin",
                wallet_balance=0.0
            )
            db.add(admin_user)
            db.commit()
            
        # Seed/Update specific admin user with phone 9389047361 and password saini@321
        from app.routers.auth import hash_password
        target_phone = "9389047361"
        admin_pass_hash = hash_password("saini@321")
        
        # Ensure default admin@electroshare.com exists too, if not seeded above
        admin_email = "admin@electroshare.com"
        admin_by_email = db.query(models.User).filter(models.User.email == admin_email).first()
        if not admin_by_email:
            admin_user = models.User(
                email=admin_email,
                full_name="ElectroShare Hub Admin",
                role="admin",
                wallet_balance=0.0
            )
            db.add(admin_user)
            db.commit()

        phone_user = db.query(models.User).filter(models.User.phone == target_phone).first()
        if not phone_user:
            phone_user = models.User(
                email="9389047361@electroshare.com",
                phone=target_phone,
                full_name="Admin Vansh Saini",
                role="admin",
                password_hash=admin_pass_hash,
                wallet_balance=0.0
            )
            db.add(phone_user)
            db.commit()
            print(f"Successfully seeded admin user with phone {target_phone}")
        else:
            phone_user.role = "admin"
            phone_user.full_name = "Admin Vansh Saini"
            phone_user.password_hash = admin_pass_hash
            db.commit()
            print(f"Successfully updated admin user with phone {target_phone} to role admin")
            
    finally:
        db.close()
        
    yield

app = FastAPI(
    title="ElectroShare Hyperlocal Hardware Marketplace API",
    description="FastAPI backend providing authentication, listing, escrow, rental and admin services.",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allowed for local testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(auth.router, prefix="/api/v1")
app.include_router(products.router, prefix="/api/v1")
app.include_router(orders.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")
app.include_router(kit_requests.router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "ElectroShare Hardware Hub API is running. Go to /docs for Swagger documentation."
    }
