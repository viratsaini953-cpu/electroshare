import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database import Base, get_db

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_lpu_marketplace.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="module")
def db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    # Seed default categories
    from app import models
    categories = [
        models.Category(id=1, name="Microcontrollers & Development Boards", description="Arduino, ESP32, Raspberry Pi, STM32 etc."),
        models.Category(id=2, name="Sensors & Modules", description="Ultrasonic, IR, MPU6050, DHT11 etc."),
        models.Category(id=3, name="Actuators, Motors & Drivers", description="Servos, DC Motors etc."),
        models.Category(id=4, name="Power, Cables & Prototyping", description="Li-Po batteries, breadboards etc."),
        models.Category(id=5, name="Pre-built Semester Projects", description="Complete semester projects")
    ]
    db.add_all(categories)
    
    # Seed admin user
    admin_user = models.User(
        email="admin@electroshare.com",
        full_name="ElectroShare Hub Admin",
        role="admin",
        wallet_balance=10000.0
    )
    db.add(admin_user)
    db.commit()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="module")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

def test_auth_validation(client):
    # Should reject invalid phone format
    response = client.post("/api/v1/auth/check-phone", json={"phone": "123"})
    assert response.status_code == 400
    assert "10-digit" in response.json()["detail"]

def test_auth_login(client):
    # Registering a new phone user
    response = client.post("/api/v1/auth/register", json={"phone": "9999999999", "password": "password123"})
    assert response.status_code == 200
    assert "access_token" in response.json()
    token = response.json()["access_token"]
    
    # Try logging in with correct credentials
    login_res = client.post("/api/v1/auth/login", json={"phone": "9999999999", "password": "password123"})
    assert login_res.status_code == 200
    assert "access_token" in login_res.json()
    
    # Try logging in with incorrect credentials
    login_fail = client.post("/api/v1/auth/login", json={"phone": "9999999999", "password": "wrongpassword"})
    assert login_fail.status_code == 400
    assert "Incorrect password" in login_fail.json()["detail"]

    # Retrieve profile
    headers = {"Authorization": f"Bearer {token}"}
    res_me = client.get("/api/v1/auth/me", headers=headers)
    assert res_me.status_code == 200
    assert res_me.json()["phone"] == "9999999999"
    assert res_me.json()["wallet_balance"] == 0.0

def test_price_suggestion(client):
    payload = {
        "category_id": 1,
        "condition": "gently_used",
        "market_price": 500.0,
        "age_months": 5
    }
    response = client.post("/api/v1/products/suggest-price", json=payload)
    assert response.status_code == 200
    res_data = response.json()
    assert "suggested_price_min" in res_data
    assert "recommended_price" in res_data
    assert res_data["recommended_price"] == 270.0

def test_end_to_end_transaction(client):
    # Set passwords/log in admin, seller, buyer
    admin_login = client.post("/api/v1/auth/login", json={"phone": "admin@electroshare.com", "password": "adminpassword"})
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    
    seller_reg = client.post("/api/v1/auth/register", json={"phone": "9876543210", "password": "sellerpassword"})
    seller_token = seller_reg.json()["access_token"]
    seller_headers = {"Authorization": f"Bearer {seller_token}"}
    
    buyer_reg = client.post("/api/v1/auth/register", json={"phone": "9876543211", "password": "buyerpassword"})
    buyer_token = buyer_reg.json()["access_token"]
    buyer_headers = {"Authorization": f"Bearer {buyer_token}"}
    
    # Create product listing
    prod_data = {
        "title": "ESP32 Dev Board",
        "description": "Like new microcontroller board.",
        "category_id": 1,
        "condition": "new",
        "price": 300.0,
        "market_price": 400.0,
        "age_months": 1,
        "listing_type": "sale"
    }
    prod_res = client.post("/api/v1/products/create", json=prod_data, headers=seller_headers)
    assert prod_res.status_code == 201
    product_id = prod_res.json()["id"]
    
    # Purchase listing
    order_data = {
        "product_id": product_id,
        "order_type": "buy",
        "delivery_type": "hub_pickup",
        "hub_location": "Block 34 Hub",
        "payment_method": "upi"
    }
    order_res = client.post("/api/v1/orders/create", json=order_data, headers=buyer_headers)
    assert order_res.status_code == 201
    order_id = order_res.json()["id"]
    
    # Buyer's wallet should be untouched (remains 0.0)
    me_res = client.get("/api/v1/auth/me", headers=buyer_headers)
    assert me_res.json()["wallet_balance"] == 0.0
    
    # Seller's wallet should NOT have received funds yet (still at 0.0)
    seller_me = client.get("/api/v1/auth/me", headers=seller_headers)
    assert seller_me.json()["wallet_balance"] == 0.0
    
    # Admin verifies hardware condition at Hub
    status_res = client.post(
        f"/api/v1/admin/orders/{order_id}/update-status?order_status=verified_by_admin&admin_notes=Tested: All Pins Operational.", 
        headers=admin_headers
    )
    assert status_res.status_code == 200
    assert status_res.json()["order_status"] == "verified_by_admin"
    
    # Buyer confirms receipt
    confirm_res = client.post(f"/api/v1/orders/{order_id}/confirm-receipt", headers=buyer_headers)
    assert confirm_res.status_code == 200
    assert confirm_res.json()["order_status"] == "completed"
    
    # Seller's wallet should now receive payment (0.0 + 300 = 300.0)
    seller_me_after = client.get("/api/v1/auth/me", headers=seller_headers)
    assert seller_me_after.json()["wallet_balance"] == 300.0

def test_admin_delete_product(client):
    # Get tokens
    admin_login = client.post("/api/v1/auth/login", json={"phone": "admin@electroshare.com", "password": "adminpassword"})
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    
    seller_login = client.post("/api/v1/auth/login", json={"phone": "9876543210", "password": "sellerpassword"})
    seller_token = seller_login.json()["access_token"]
    seller_headers = {"Authorization": f"Bearer {seller_token}"}
    
    # Create product listing
    prod_data = {
        "title": "Arduino to Delete",
        "description": "This component was listed wrong",
        "category_id": 1,
        "condition": "new",
        "price": 100.0,
        "market_price": 150.0,
        "age_months": 1,
        "listing_type": "sale"
    }
    prod_res = client.post("/api/v1/products/create", json=prod_data, headers=seller_headers)
    assert prod_res.status_code == 201
    product_id = prod_res.json()["id"]
    
    # Attempt to delete listing using regular seller token -> Should fail with 403
    del_fail_res = client.delete(f"/api/v1/admin/products/{product_id}", headers=seller_headers)
    assert del_fail_res.status_code == 403
    
    # Delete listing using admin token -> Should succeed
    del_res = client.delete(f"/api/v1/admin/products/{product_id}", headers=admin_headers)
    assert del_res.status_code == 200
    assert del_res.json()["message"] == "Product listing deleted successfully"
    
    # Attempt to fetch deleted listing -> Should fail or verify not in active list
    prod_get = client.get(f"/api/v1/products")
    assert prod_get.status_code == 200
    ids = [p["id"] for p in prod_get.json()]
    assert product_id not in ids

def test_admin_delete_combo(client):
    # Setup login header for admin
    admin_login = client.post("/api/v1/auth/login", json={"phone": "admin@electroshare.com", "password": "adminpassword"})
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Create combo kit using admin
    combo_data = {
        "title": "Combo to Delete",
        "description": "Wrong combo kit",
        "price": 250.0,
        "product_ids": [],
        "image_url": "http://example.com/combo.jpg",
        "components": "Arduino, Jumper cables"
    }
    combo_res = client.post("/api/v1/admin/combos/create", json=combo_data, headers=admin_headers)
    assert combo_res.status_code == 200
    combo_id = combo_res.json()["id"]
    
    # Delete combo kit using admin
    del_res = client.delete(f"/api/v1/admin/combos/{combo_id}", headers=admin_headers)
    assert del_res.status_code == 200
    assert del_res.json()["message"] == "Combo kit deleted successfully"
    
    # Verify it is deleted from list
    get_res = client.get("/api/v1/admin/combos", headers=admin_headers)
    assert get_res.status_code == 200
    combo_ids = [c["id"] for c in get_res.json()]
    assert combo_id not in combo_ids


