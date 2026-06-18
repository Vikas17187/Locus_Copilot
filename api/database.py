"""
Database initialization and management for Locus Copilot
"""

import sqlite3
import hashlib
import os
import base64
import bcrypt
from pathlib import Path
from datetime import datetime

if os.getenv("VERCEL"):
    DB_PATH = Path("/tmp") / "locus_copilot.db"
else:
    DB_PATH = Path(__file__).parent / "locus_copilot.db"

MIN_PASSWORD_LENGTH = 6
MAX_PASSWORD_LENGTH = 16
MAX_BCRYPT_PASSWORD_BYTES = 72


def normalize_email(email: str) -> str:
    """Canonicalize email for uniqueness and authentication lookups."""
    return (email or "").strip().lower()


def password_exceeds_bcrypt_limit(password: str) -> bool:
    """Return True when password is too long for bcrypt (72-byte limit)."""
    if password is None:
        return False
    return len(password.encode("utf-8")) > MAX_BCRYPT_PASSWORD_BYTES


def password_length_is_valid(password: str) -> bool:
    """Return True when password length is within policy bounds (characters)."""
    if password is None:
        return False
    return MIN_PASSWORD_LENGTH <= len(password) <= MAX_PASSWORD_LENGTH


def serialize_row(row):
    """Serialize row database columns, converting datetimes to ISO format."""
    if row is None:
        return None
    d = dict(row)
    for k, v in d.items():
        if isinstance(v, datetime):
            d[k] = v.isoformat()
    return d


def translate_query(query: str) -> str:
    """Translate SQLite query syntax to PostgreSQL syntax."""
    if not query:
        return query
    
    # 1. Replace SQLite parameter placeholders (?) with Postgres (%s)
    query = query.replace("?", "%s")
    
    # 2. Convert SQLite AUTOINCREMENT to Postgres SERIAL
    query = query.replace("INTEGER PRIMARY KEY AUTOINCREMENT", "SERIAL PRIMARY KEY")
    
    # 3. Convert COLLATE NOCASE (sqlite specific)
    query = query.replace("COLLATE NOCASE", "")
    
    # 4. Remove SQLite unique index email collation
    query = query.replace("users(email COLLATE NOCASE)", "users(email)")
    
    return query


class DatabaseConnection:
    def __init__(self, conn, is_postgres=False):
        self.conn = conn
        self.is_postgres = is_postgres

    def cursor(self):
        if self.is_postgres:
            import psycopg2.extras
            cursor = self.conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            return PostgresCursorWrapper(cursor)
        else:
            return SQLiteCursorWrapper(self.conn.cursor())

    def commit(self):
        self.conn.commit()

    def close(self):
        self.conn.close()


class SQLiteCursorWrapper:
    def __init__(self, cursor):
        self.cursor = cursor

    def execute(self, query, params=None):
        if params is None:
            self.cursor.execute(query)
        else:
            self.cursor.execute(query, params)
        return self

    def fetchone(self):
        res = self.cursor.fetchone()
        return serialize_row(res)

    def fetchall(self):
        return [serialize_row(r) for r in self.cursor.fetchall()]


class PostgresCursorWrapper:
    def __init__(self, cursor):
        self.cursor = cursor

    def execute(self, query, params=None):
        translated = translate_query(query)
        if params is None:
            self.cursor.execute(translated)
        else:
            self.cursor.execute(translated, params)
        return self

    def fetchone(self):
        res = self.cursor.fetchone()
        return serialize_row(res)

    def fetchall(self):
        return [serialize_row(r) for r in self.cursor.fetchall()]


def get_db_connection():
    """Get database connection (PostgreSQL if DATABASE_URL is set, else SQLite)"""
    db_url = os.getenv("DATABASE_URL") or os.getenv("POSTGRES_URL")
    if db_url:
        import psycopg2
        conn = psycopg2.connect(db_url)
        return DatabaseConnection(conn, is_postgres=True)
    else:
        conn = sqlite3.connect(str(DB_PATH))
        conn.row_factory = sqlite3.Row
        return DatabaseConnection(conn, is_postgres=False)


def hash_password(password: str) -> str:
    """Hash password using bcrypt."""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_pbkdf2_sha256(password: str, hashed: str) -> bool:
    """Verify legacy passlib pbkdf2-sha256 hashes using standard hashlib."""
    try:
        parts = hashed.split('$')
        if len(parts) < 5 or parts[1] != 'pbkdf2-sha256':
            return False
        rounds = int(parts[2])
        salt_str = parts[3]
        checksum_str = parts[4]
        
        # Decode custom passlib ab64
        salt = base64.b64decode(salt_str.replace('.', '+') + '=' * ((4 - len(salt_str) % 4) % 4))
        checksum = base64.b64decode(checksum_str.replace('.', '+') + '=' * ((4 - len(checksum_str) % 4) % 4))
        
        return hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, rounds, dklen=32) == checksum
    except Exception:
        return False


def _legacy_sha256_hash(password: str) -> str:
    """Legacy SHA256 hash for backward compatibility with older demo data."""
    return hashlib.sha256(password.encode()).hexdigest()

def init_database():
    """Initialize database with required tables"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Users table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            full_name TEXT,
            is_admin INTEGER DEFAULT 0,
            is_active INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP
        )
    """)
    
    # Search history table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS searches (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            locality_name TEXT,
            latitude REAL,
            longitude REAL,
            search_radius REAL,
            business_type TEXT,
            weights TEXT,
            result_count INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)
    
    # Saved preferences table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS saved_preferences (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            preference_name TEXT,
            weights TEXT,
            business_type TEXT,
            search_radius REAL,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)
    
    # Favorite locations table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS favorites (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            location_id TEXT,
            location_name TEXT,
            latitude REAL,
            longitude REAL,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)
    
    conn.commit()

    # Canonical uniqueness guard for case-insensitive email handling.
    try:
        cursor.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_nocase ON users(email COLLATE NOCASE)")
        conn.commit()
    except sqlite3.IntegrityError:
        # Existing legacy duplicates may block index creation; app-level checks still enforce canonical uniqueness.
        pass
    
    # Create default admin user if not exists
    admin_email = normalize_email(os.getenv("LOCUS_ADMIN_EMAIL", "admin@locuscopilot.com"))
    admin_password = os.getenv("LOCUS_ADMIN_PASSWORD", "admin123")
    cursor.execute("SELECT * FROM users WHERE lower(trim(email)) = ?", (admin_email,))
    if not cursor.fetchone():
        admin_password_hash = hash_password(admin_password)
        cursor.execute("""
            INSERT INTO users (email, password, full_name, is_admin, is_active)
            VALUES (?, ?, ?, ?, ?)
        """, (admin_email, admin_password_hash, "Admin User", 1, 1))
        conn.commit()
        print(f"✅ Default admin created for {admin_email}")
    
    conn.close()
    print("✅ Database initialized")

# User functions
def create_user(email: str, password: str, full_name: str = "") -> dict:
    """Create a new user"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        email = normalize_email(email)
        full_name = (full_name or "").strip()

        if not email:
            conn.close()
            return {"success": False, "message": "Email is required"}

        if not password_length_is_valid(password):
            conn.close()
            return {
                "success": False,
                "message": f"Password must be {MIN_PASSWORD_LENGTH} to {MAX_PASSWORD_LENGTH} characters.",
            }

        cursor.execute("SELECT id FROM users WHERE lower(trim(email)) = ?", (email,))
        if cursor.fetchone():
            conn.close()
            return {"success": False, "message": "Email already registered"}
        
        password_hash = hash_password(password)
        cursor.execute("""
            INSERT INTO users (email, password, full_name)
            VALUES (?, ?, ?)
            RETURNING id
        """, (email, password_hash, full_name))
        
        row = cursor.fetchone()
        user_id = row['id'] if row else None
        conn.commit()
        conn.close()
        
        return {"success": True, "user_id": user_id, "message": "User created successfully"}
    except sqlite3.IntegrityError:
        return {"success": False, "message": "Email already registered"}
    except Exception as e:
        message = str(e)
        if "72 bytes" in message:
            return {
                "success": False,
                "message": f"Password must be {MIN_PASSWORD_LENGTH} to {MAX_PASSWORD_LENGTH} characters.",
            }
        return {"success": False, "message": "Registration failed. Please try again."}

def get_user_by_email(email: str) -> dict:
    """Get user by email"""
    canonical_email = normalize_email(email)
    if not canonical_email:
        return None

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE lower(trim(email)) = ?", (canonical_email,))
    user = cursor.fetchone()
    conn.close()
    
    if user:
        return dict(user)
    return None

def verify_password(email: str, password: str) -> bool:
    """Verify user password"""
    user = get_user_by_email(email)
    if not user:
        return False

    stored = user.get("password", "")

    # Preferred path: bcrypt hash (starts with $2a$ or $2b$)
    if stored.startswith("$2"):
        if password_exceeds_bcrypt_limit(password):
            return False
        try:
            return bcrypt.checkpw(password.encode("utf-8"), stored.encode("utf-8"))
        except Exception:
            return False

    # Check for legacy passlib pbkdf2_sha256 hash
    if stored.startswith("$pbkdf2-sha256$"):
        if verify_pbkdf2_sha256(password, stored):
            # Auto-upgrade to bcrypt
            try:
                conn = get_db_connection()
                cursor = conn.cursor()
                cursor.execute("UPDATE users SET password = ? WHERE id = ?", (hash_password(password), user["id"]))
                conn.commit()
                conn.close()
            except Exception:
                pass
            return True
        return False

    # Backward compatibility: legacy SHA256, then auto-upgrade to current hash
    legacy_match = stored == _legacy_sha256_hash(password)
    if legacy_match:
        try:
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute("UPDATE users SET password = ? WHERE id = ?", (hash_password(password), user["id"]))
            conn.commit()
            conn.close()
        except Exception:
            pass

    return legacy_match

def update_last_login(user_id: int):
    """Update last login timestamp"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?", (user_id,))
    conn.commit()
    conn.close()

# Search history functions
def save_search(user_id: int, locality_name: str, lat: float, lon: float, 
                radius: float, business_type: str, weights: dict, result_count: int):
    """Save search to history"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    import json
    weights_json = json.dumps(weights)
    
    cursor.execute("""
        INSERT INTO searches 
        (user_id, locality_name, latitude, longitude, search_radius, business_type, weights, result_count)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (user_id, locality_name, lat, lon, radius, business_type, weights_json, result_count))
    
    conn.commit()
    conn.close()

def get_user_searches(user_id: int, limit: int = 50) -> list:
    """Get user search history"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM searches WHERE user_id = ? 
        ORDER BY created_at DESC 
        LIMIT ?
    """, (user_id, limit))
    
    searches = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    import json
    for search in searches:
        search['weights'] = json.loads(search['weights'])
    
    return searches

# Saved preferences functions
def save_preference(user_id: int, preference_name: str, weights: dict, 
                   business_type: str = None, search_radius: float = 5.0, description: str = ""):
    """Save a search preference"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    import json
    weights_json = json.dumps(weights)
    
    cursor.execute("""
        INSERT INTO saved_preferences 
        (user_id, preference_name, weights, business_type, search_radius, description)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (user_id, preference_name, weights_json, business_type, search_radius, description))
    
    conn.commit()
    conn.close()

def get_user_preferences(user_id: int) -> list:
    """Get user saved preferences"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM saved_preferences WHERE user_id = ?
        ORDER BY created_at DESC
    """, (user_id,))
    
    prefs = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    import json
    for pref in prefs:
        pref['weights'] = json.loads(pref['weights'])
    
    return prefs

# Favorites functions
def add_favorite(user_id: int, location_id: str, location_name: str, 
                lat: float, lon: float, notes: str = ""):
    """Add location to favorites"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        INSERT INTO favorites (user_id, location_id, location_name, latitude, longitude, notes)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (user_id, location_id, location_name, lat, lon, notes))
    
    conn.commit()
    conn.close()

def get_user_favorites(user_id: int) -> list:
    """Get user favorite locations"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM favorites WHERE user_id = ?
        ORDER BY created_at DESC
    """, (user_id,))
    
    favorites = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return favorites

def remove_favorite(favorite_id: int, user_id: int = None):
    """Remove favorite location, optionally verifying ownership."""
    conn = get_db_connection()
    cursor = conn.cursor()
    if user_id is not None:
        cursor.execute("DELETE FROM favorites WHERE id = ? AND user_id = ?", (favorite_id, user_id))
    else:
        cursor.execute("DELETE FROM favorites WHERE id = ?", (favorite_id,))
    conn.commit()
    conn.close()

# Admin functions
def get_all_users() -> list:
    """Get all users (admin only)"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, email, full_name, is_admin, is_active, created_at, last_login 
        FROM users 
        ORDER BY created_at DESC
    """)
    
    users = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return users

def get_user_stats() -> dict:
    """Get system statistics"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Total users
    cursor.execute("SELECT COUNT(*) as count FROM users WHERE is_active = 1")
    total_users = dict(cursor.fetchone())['count']
    
    # Total searches
    cursor.execute("SELECT COUNT(*) as count FROM searches")
    total_searches = dict(cursor.fetchone())['count']
    
    # Total favorites
    cursor.execute("SELECT COUNT(*) as count FROM favorites")
    total_favorites = dict(cursor.fetchone())['count']
    
    # Active today
    cursor.execute("""
        SELECT COUNT(DISTINCT user_id) as count FROM searches 
        WHERE DATE(created_at) = CURRENT_DATE
    """)
    active_today = dict(cursor.fetchone())['count']
    
    conn.close()
    
    return {
        "total_users": total_users,
        "total_searches": total_searches,
        "total_favorites": total_favorites,
        "active_today": active_today
    }

def deactivate_user(user_id: int):
    """Deactivate user account"""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET is_active = 0 WHERE id = ?", (user_id,))
    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_database()
