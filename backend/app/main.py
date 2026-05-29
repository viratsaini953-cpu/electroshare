from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.database import engine, Base, SessionLocal
from app import models
from app.routers import auth, products, orders, admin

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create all tables on startup if they don't exist
    Base.metadata.create_all(bind=engine)
    
    # Seed default categories and admin user
    db = SessionLocal()
    try:
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

@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "ElectroShare Hardware Hub API is running. Go to /docs for Swagger documentation."
    }
