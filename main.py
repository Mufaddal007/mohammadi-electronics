from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from datetime import datetime, timedelta
from passlib.context import CryptContext
import sqlite3
import jwt
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
import os
import shutil
from fastapi import File, UploadFile


UPLOAD_DIR = "/var/www/mohammadiElectronics/media"
# --- NEW DATA MODELS FOR INVENTORY ---

class FeedbackCreate(BaseModel):
    name: str
    email: str
    message: str

class ServiceRequestCreate(BaseModel):
    customer_name: str
    phone: str
    appliance_type: str
    issue_description: str

class ProductDemandCreate(BaseModel):
    customer_name: str
    contact_info: str
    requested_item_name: str
    specifications: Optional[str] = None

class SpecItem(BaseModel):
    spec_key: str
    spec_value: str

class ProductSaveRequest(BaseModel):
    id: Optional[int] = None  # If provided, we update; if None, we insert a new product
    category_id: int
    name: str
    slug: str
    description: Optional[str] = None
    price: float
    image_url: Optional[str] = None
    stock_qty: int
    low_stock_threshold: int = 2
    specs: List[SpecItem] = []




app = FastAPI(title="Mohammadi Electronics API")


origins = [
    "http://localhost:4200",  # Your local Angular development environment
    "http://127.0.0.1:4200",
    "https://www.mohammadielectronics.com"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Allows GET, POST, OPTIONS, etc.
    allow_headers=["*"],  # Allows Authorization headers, Content-Type, etc.
)


DB_FILE = "database.db"
SECRET_KEY = "YOUR_SUPER_SECRET_EMBEDDED_KEY_CHANGE_THIS" 
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/login")

# --- DATABASE INITIALIZATION ---
def init_db():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            hashed_password TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'user'
        )
    """)
    conn.commit()
    conn.close()

# Run database setup on startup
init_db()

# --- PYDANTIC MODEL FOR SIGNUP ---
class SignUpRequest(BaseModel):
    username: str
    password: str

# --- HELPER SECURITY FUNCTIONS ---
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        role: str = payload.get("role")
        if username is None:
            raise credentials_exception
        return {"username": username, "role": role}
    except jwt.PyJWTError:
        raise credentials_exception

def verify_admin_role(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: You do not have administrator privileges!"
        )
    return current_user

# --- API ROUTES ---


@app.delete("/api/admin/products/{product_id}", status_code=status.HTTP_200_OK)
def delete_product(product_id: int, admin_user: dict = Depends(verify_admin_role)):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("PRAGMA foreign_keys = ON;")
    
    # Check if product exists
    cursor.execute("SELECT id FROM products WHERE id = ?", (product_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Product not found in inventory")
        
    try:
        # Cascades automatically to inventory and product_specs tables
        cursor.execute("DELETE FROM products WHERE id = ?", (product_id,))
        conn.commit()
        return {"status": "Success", "message": f"Product ID {product_id} fully deleted from catalog."}
    except sqlite3.Error as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=f"Database execution error: {e}")
    finally:
        conn.close()


# =====================================================================
# 💬 FEEDBACK MANAGEMENT PIPELINES
# =====================================================================
@app.post("/api/feedback", status_code=status.HTTP_201_CREATED)
def submit_feedback(payload: FeedbackCreate):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO customer_feedback (name, email, message) VALUES (?, ?, ?)",
        (payload.name, payload.email, payload.message)
    )
    conn.commit()
    conn.close()
    return {"status": "Success", "message": "Feedback recorded successfully!"}

@app.get("/api/admin/feedback")
def get_all_feedback(admin_user: dict = Depends(verify_admin_role)):
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM customer_feedback ORDER BY created_at DESC")
    records = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return records


# =====================================================================
# 🛠️ APPLIANCE SERVICE REQUESTS MANAGEMENT
# =====================================================================
@app.post("/api/service-requests", status_code=status.HTTP_201_CREATED)
def raise_service_request(payload: ServiceRequestCreate):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO service_requests (customer_name, phone, appliance_type, issue_description) VALUES (?, ?, ?, ?)",
        (payload.customer_name, payload.phone, payload.appliance_type, payload.issue_description)
    )
    conn.commit()
    conn.close()
    return {"status": "Success", "message": "Service ticket opened successfully!"}

@app.get("/api/admin/service-requests")
def view_service_requests(admin_user: dict = Depends(verify_admin_role)):
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM service_requests ORDER BY created_at DESC")
    records = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return records


# =====================================================================
# 📋 UNAVAILABLE MARKET ITEM DEMANDS LOG
# =====================================================================
@app.post("/api/product-demands", status_code=status.HTTP_201_CREATED)
def log_product_demand(payload: ProductDemandCreate):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO product_demands (customer_name, contact_info, requested_item_name, specifications) VALUES (?, ?, ?, ?)",
        (payload.customer_name, payload.contact_info, payload.requested_item_name, payload.specifications)
    )
    conn.commit()
    conn.close()
    return {"status": "Success", "message": "Your market item sourcing request has been tracked!"}


@app.get("/api/admin/users", status_code=status.HTTP_200_OK)
def get_all_registered_users(admin_user: dict = Depends(verify_admin_role)):
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row  # Maps columns directly by name string
    cursor = conn.cursor()
    
    try:
        # Retrieve directory safely without touching hashed password bytes
        cursor.execute("SELECT id, username, role FROM users ORDER BY id ASC")
        user_list = [dict(row) for row in cursor.fetchall()]
        return user_list
    except sqlite3.Error as e:
        raise HTTPException(status_code=500, detail=f"Database fetch breakdown: {e}")
    finally:
        conn.close()


@app.post("/api/admin/products/upload-image")
def upload_product_image(
    file: UploadFile = File(...), 
    admin_user: dict = Depends(verify_admin_role)
):
    # Sanitize file extension to prevent security exploits
    allowed_extensions = [".jpg", ".jpeg", ".png", ".webp"]
    file_extension = os.path.splitext(file.filename)[1].lower()
    
    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported file type. Allowed types: {', '.join(allowed_extensions)}"
        )
    
    # Generate a unique clean filename using timestamp to prevent name collisions
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    clean_filename = f"prod_{timestamp}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, clean_filename)
    
    try:
        # Stream file block by block into disk memory (low-RAM safe for Pi Zero)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Return the public web relative path to save inside the products table
        return {
            "status": "Success",
            "message": "Image saved to resource server",
            "relative_url": f"media/{clean_filename}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to write file to disk: {e}")



@app.get("/api/admin/product-demands")
def view_product_demands(admin_user: dict = Depends(verify_admin_role)):
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM product_demands ORDER BY created_at DESC")
    records = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return records



# 1. PUBLIC ROUTE: Fetch all products with their specs and stock counts
@app.get("/api/products")
def get_all_products():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row  # Enables fetching columns by name like a dictionary
    cursor = conn.cursor()
    
    # Fetch core product details along with current stock
    cursor.execute("""
        SELECT p.*, c.name AS category_name, i.stock_qty, i.low_stock_threshold 
        FROM products p
        JOIN categories c ON p.category_id = c.id
        LEFT JOIN inventory i ON p.id = i.product_id
        WHERE p.is_active = 1
    """)
    products = [dict(row) for row in cursor.fetchall()]
    
    # Attach specifications to each product mapping
    for prod in products:
        cursor.execute(
            "SELECT spec_key, spec_value FROM product_specs WHERE product_id = ?", 
            (prod["id"],)
        )
        prod["specs"] = [dict(row) for row in cursor.fetchall()]
        
    conn.close()
    return products


# 2. ADMIN SECURE ROUTE: Save (Insert) or Update an Inventory Item
@app.post("/api/admin/products", status_code=status.HTTP_200_OK)
def save_or_update_product(payload: ProductSaveRequest, admin_user: dict = Depends(verify_admin_role)):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("PRAGMA foreign_keys = ON;")
    
    try:
        if payload.id:
            # --- UPDATE MODE ---
            product_id = payload.id
            cursor.execute("""
                UPDATE products 
                SET category_id = ?, name = ?, slug = ?, description = ?, price = ?, image_url = ?
                WHERE id = ?
            """, (payload.category_id, payload.name, payload.slug, payload.description, payload.price, payload.image_url, product_id))
            
            # Clear existing specifications to re-write fresh updates easily
            cursor.execute("DELETE FROM product_specs WHERE product_id = ?", (product_id,))
        else:
            # --- INSERT MODE ---
            cursor.execute("""
                INSERT INTO products (category_id, name, slug, description, price, image_url)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (payload.category_id, payload.name, payload.slug, payload.description, payload.price, payload.image_url))
            product_id = cursor.lastrowid

        # Update Inventory quantities
        cursor.execute("""
            INSERT OR REPLACE INTO inventory (product_id, stock_qty, low_stock_threshold, updated_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        """, (product_id, payload.stock_qty, payload.low_stock_threshold))

        # Re-populate technical specifications
        for spec in payload.specs:
            cursor.execute("""
                INSERT OR REPLACE INTO product_specs (product_id, spec_key, spec_value)
                VALUES (?, ?, ?)
            """, (product_id, spec.spec_key, spec.spec_value))

        conn.commit()
        return {"status": "Success", "message": f"Product ID {product_id} successfully saved/updated!", "product_id": product_id}

    except sqlite3.Error as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=f"Database transaction failure: {e}")
    finally:
        conn.close()




# 1. NEW: User Registration Endpoint (JSON Input)
@app.post("/api/signup", status_code=status.HTTP_201_CREATED)
def signup(user_data: SignUpRequest):
    hashed = pwd_context.hash(user_data.password)
    
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    try:
        # Defaulting first user or manual entries to 'user' role
        cursor.execute(
            "INSERT INTO users (username, hashed_password, role) VALUES (?, ?, ?)",
            (user_data.username, hashed, "user")
        )
        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        raise HTTPException(status_code=400, detail="Username already registered")
    
    conn.close()
    return {"status": "Success", "message": "User registered successfully!"}

# 2. UPDATED: Authentication Endpoint (Form Input -> DB Checked)
@app.post("/api/login")
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("SELECT username, hashed_password, role FROM users WHERE username = ?", (form_data.username,))
    user = cursor.fetchone()
    conn.close()
    
    if not user or not pwd_context.verify(form_data.password, user[1]):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    
    access_token = create_access_token(data={"sub": user[0], "role": user[2]})
    return {"access_token": access_token, "token_type": "bearer"}

# 3. Public Testing Route
@app.get("/api/public-test")
def public_test():
    return {"status": "Success", "message": "Welcome to Mohammadi Electronics API!"}

# 4. Secure Admin Route
@app.get("/api/admin/dashboard")
def admin_dashboard(admin_user: dict = Depends(verify_admin_role)):
    return {
        "status": "Secure Access Granted",
        "message": f"Hello Manager {admin_user['username']}! Here is your secure data panel."
    }
