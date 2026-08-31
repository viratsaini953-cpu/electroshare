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
            
        # Seed/Update specific admin user with phone 9389047361 and password Saini@321
        from app.routers.auth import hash_password
        admin_phones = ["9389047361"]
        admin_pass_hash = hash_password("Saini@321")
        
        # Ensure default admin@electroshare.com exists
        admin_email = "admin@electroshare.com"
        admin_by_email = db.query(models.User).filter(models.User.email == admin_email).first()
        if not admin_by_email:
            admin_user = models.User(
                email=admin_email,
                full_name="ElectroShare Hub Admin",
                role="admin",
                password_hash=admin_pass_hash,
                wallet_balance=0.0
            )
            db.add(admin_user)
            db.commit()

        for target_phone in admin_phones:
            phone_user = db.query(models.User).filter(models.User.phone == target_phone).first()
            if not phone_user:
                phone_user = models.User(
                    email=f"{target_phone}@electroshare.com",
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

        # Seed initial sample student component listings if product count is 0
        if db.query(models.Product).count() == 0:
            student_user = db.query(models.User).filter(models.User.email == "student@electroshare.com").first()
            if not student_user:
                student_user = models.User(
                    email="student@electroshare.com",
                    phone="9876543210",
                    full_name="Rohan Verma (LPU Student)",
                    role="user",
                    password_hash=admin_pass_hash,
                    wallet_balance=0.0
                )
                db.add(student_user)
                db.commit()

            sample_products = [
                models.Product(
                    title="Arduino Uno R3 Board (Original Rev3)",
                    description="Used for 1 semester project in Block 34 lab. All digital and analog pins tested and working 100%. Comes with USB cable.",
                    category_id=1,
                    condition="gently_used",
                    price=450.0,
                    market_price=650.0,
                    age_months=4,
                    listing_type="sale",
                    status="available",
                    seller_id=student_user.id,
                    verification_status="verified",
                    image_url="https://images.unsplash.com/photo-1553406830-ef2513450d76?w=400",
                    amazon_url="https://www.amazon.in/dp/B008GRTSV6",
                    flipkart_url="https://www.flipkart.com/search?q=arduino+uno"
                ),
                models.Product(
                    title="Ultrasonic Sensor HC-SR04 + Jumper Wires",
                    description="Distance measuring sensor for obstacle avoidance robotics projects. Includes 10 female-to-female jumper wires.",
                    category_id=2,
                    condition="like_new",
                    price=120.0,
                    market_price=200.0,
                    age_months=2,
                    listing_type="sale",
                    status="available",
                    seller_id=student_user.id,
                    verification_status="verified",
                    image_url="https://images.unsplash.com/photo-1518770660439-4636190af475?w=400"
                ),
                models.Product(
                    title="L298N Dual Motor Driver Module",
                    description="Heavy duty motor driver module capable of driving 2 DC motors. Tested at Block 34 Hub.",
                    category_id=3,
                    condition="gently_used",
                    price=180.0,
                    market_price=300.0,
                    age_months=3,
                    listing_type="sale",
                    status="available",
                    seller_id=student_user.id,
                    verification_status="verified",
                    image_url="https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400"
                ),
                models.Product(
                    title="SG90 Micro Servo Motors (Pack of 2)",
                    description="9g mini micro servo motors for RC robot arm project. Brand new in box.",
                    category_id=3,
                    condition="new",
                    price=220.0,
                    market_price=380.0,
                    age_months=1,
                    listing_type="sale",
                    status="available",
                    seller_id=student_user.id,
                    verification_status="verified",
                    image_url="https://images.unsplash.com/photo-1563770660941-20978e870e26?w=400"
                ),
                models.Product(
                    title="0.96 inch I2C OLED Display Module (128x64)",
                    description="Blue/Yellow dual color OLED screen module for microcontrollers. Crisp display output.",
                    category_id=2,
                    condition="like_new",
                    price=250.0,
                    market_price=420.0,
                    age_months=2,
                    listing_type="sale",
                    status="available",
                    seller_id=student_user.id,
                    verification_status="verified",
                    image_url="https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400"
                ),
                models.Product(
                    title="Breadboard + 65 Pcs Jumper Wires Combo",
                    description="Solderless MB-102 breadboard with 830 tie points and full pack of male-to-male jumper wires.",
                    category_id=4,
                    condition="gently_used",
                    price=190.0,
                    market_price=350.0,
                    age_months=5,
                    listing_type="sale",
                    status="available",
                    seller_id=student_user.id,
                    verification_status="verified",
                    image_url="https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=400"
                ),
                models.Product(
                    title="Smart Home Automation System (IoT & Bluetooth Control)",
                    description="Complete pre-built 4th semester major project. Features NodeMCU ESP8266, 4-channel Relay board, Bluetooth HC-05 module, custom android app source code, circuit schematic diagram, and PPT presentation slides included!",
                    category_id=5,
                    condition="like_new",
                    price=2499.0,
                    market_price=3800.0,
                    age_months=3,
                    listing_type="sale",
                    status="available",
                    seller_id=student_user.id,
                    verification_status="verified",
                    image_url="https://images.unsplash.com/photo-1558002038-1055907df827?w=400"
                ),
                models.Product(
                    title="Automatic Obstacle Avoiding & Line Follower Robot",
                    description="Pre-assembled final semester robotics project with Arduino Uno, L298N driver, 2x IR sensors, HC-SR04 Ultrasonic sensor, acrylic chassis, and tested C++ source code.",
                    category_id=5,
                    condition="gently_used",
                    price=1850.0,
                    market_price=2900.0,
                    age_months=2,
                    listing_type="sale",
                    status="available",
                    seller_id=student_user.id,
                    verification_status="verified",
                    image_url="https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400"
                ),
                models.Product(
                    title="Automatic Smart Irrigation Controller System (Soil Moisture + Water Pump)",
                    description="Complete pre-assembled 3rd/4th semester major project. Automatically detects soil dryness using capacitive soil moisture sensor and triggers 5V mini submersible water pump via relay module. Includes Arduino Uno board, soil sensor, 1-channel relay, 5V water pump + pipe, 16x2 LCD status display, tested C++ source code, circuit schematic diagram, and lab report documentation!",
                    category_id=5,
                    condition="like_new",
                    price=1650.0,
                    market_price=2500.0,
                    age_months=2,
                    listing_type="sale",
                    status="available",
                    seller_id=student_user.id,
                    verification_status="verified",
                    image_url="https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=400"
                )
            ]
            db.add_all(sample_products)
            db.commit()
            print(f"Successfully seeded {len(sample_products)} sample component listings.")

        # Seed initial starter combos if combo count is 0
        if db.query(models.Combo).count() == 0:
            admin_user_obj = db.query(models.User).filter(models.User.role == "admin").first()
            admin_id_val = admin_user_obj.id if admin_user_obj else "admin_seed"
            
            vp1 = models.Product(
                title="📦 [Combo Kit] Basic Robotics Starter Kit",
                description="Curated starter kit for 1st/2nd year robotics lab projects.",
                category_id=5,
                condition="new",
                price=850.0,
                market_price=1100.0,
                age_months=0,
                listing_type="sale",
                status="available",
                seller_id=admin_id_val,
                image_url="https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400"
            )
            db.add(vp1)
            db.commit()
            db.refresh(vp1)

            combo1 = models.Combo(
                title="Basic Robotics Starter Kit",
                description="Includes Arduino Uno R3, L298N Motor Driver, 2x BO Motors, Robotic Chassis, and Jumper Wires package.",
                price=850.0,
                created_by=admin_id_val,
                product_id=vp1.id,
                image_url="https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400",
                components="1x Arduino Uno R3\n1x L298N Motor Driver Module\n2x Dual-Shaft BO Motors + Wheels\n1x 2WD Robot Chassis\n1x 40-pin Jumper Wire Ribbon"
            )
            db.add(combo1)

            vp2 = models.Product(
                title="📦 [Combo Kit] IoT Weather Station Starter Kit",
                description="Complete starter kit for Wi-Fi enabled IoT weather monitoring.",
                category_id=5,
                condition="new",
                price=1150.0,
                market_price=1500.0,
                age_months=0,
                listing_type="sale",
                status="available",
                seller_id=admin_id_val,
                image_url="https://images.unsplash.com/photo-1518770660439-4636190af475?w=400"
            )
            db.add(vp2)
            db.commit()
            db.refresh(vp2)

            combo2 = models.Combo(
                title="IoT Weather Station Starter Kit",
                description="Includes NodeMCU ESP8266 board, DHT11 temperature/humidity sensor, 0.96 OLED screen, and prototyping wires.",
                price=1150.0,
                created_by=admin_id_val,
                product_id=vp2.id,
                image_url="https://images.unsplash.com/photo-1518770660439-4636190af475?w=400",
                components="1x NodeMCU ESP8266 Wi-Fi Module\n1x DHT11 Temperature & Humidity Sensor\n1x 0.96 inch I2C OLED Display\n1x 830-point Breadboard\n1x USB Cable + Jumper Wires Pack"
            )
            db.add(combo2)
            db.commit()
            print("Successfully seeded sample combo kits.")
            
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
