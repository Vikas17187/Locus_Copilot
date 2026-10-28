import os
import sys
import json
from pathlib import Path

# Ensure stdout handles emojis
sys.stdout.reconfigure(encoding='utf-8')

# Ensure api module can be imported
sys.path.insert(0, str(Path(__file__).parent.parent))

from api.database import get_db_connection, init_database

def migrate():
    # Force DB initialization to ensure localities table exists
    print("Initializing database schema...")
    init_database()

    conn = get_db_connection()
    
    # Check if this is SQLite or Postgres
    if not conn.is_postgres:
        print("WARNING: You are connected to SQLite!")
        print("Please set the DATABASE_URL environment variable to your Neon Postgres string before running.")
        print("Example: $env:DATABASE_URL=\"postgres://...\" ; python scripts/migrate_to_postgres.py")
        print("Or if using Unix/Mac: DATABASE_URL=\"postgres://...\" python scripts/migrate_to_postgres.py")
        sys.exit(1)

    print("Connected to PostgreSQL successfully!")
    
    cursor = conn.cursor()
    
    json_path = Path(__file__).parent.parent / "api" / "localities.json"
    if not json_path.exists():
        print(f"Error: {json_path} not found.")
        sys.exit(1)
        
    print(f"Loading data from {json_path}...")
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    localities = data.get("localities", {})
    if not localities:
        print("No localities found in JSON.")
        sys.exit(1)
        
    print(f"Found {len(localities)} localities. Starting migration...")
    
    # Clear existing data just in case
    cursor.execute("DELETE FROM localities")
    
    count = 0
    batch_size = 2000
    batch_data = []
    
    # Check if we have real psycopg2 conn for fast path
    raw_conn = getattr(conn, 'conn', None)
    cursor_to_use = getattr(cursor, 'cursor', cursor)
    
    import psycopg2.extras
    
    for loc_id, loc_data in localities.items():
        name = loc_data.get("name", "Unknown")
        lat = loc_data.get("lat")
        lon = loc_data.get("lon")
        
        # Skip invalid locations
        if lat is None or lon is None:
            continue
            
        loc_data_str = json.dumps(loc_data)
        batch_data.append((loc_id, name, lat, lon, loc_data_str))
        count += 1
        
        if len(batch_data) >= batch_size:
            psycopg2.extras.execute_values(
                cursor_to_use,
                "INSERT INTO localities (id, name, lat, lon, data) VALUES %s",
                batch_data
            )
            raw_conn.commit() if raw_conn else conn.commit()
            print(f"  Inserted {count} rows...")
            batch_data = []
            
    if batch_data:
        psycopg2.extras.execute_values(
            cursor_to_use,
            "INSERT INTO localities (id, name, lat, lon, data) VALUES %s",
            batch_data
        )
        raw_conn.commit() if raw_conn else conn.commit()
        print(f"  Inserted {count} rows...")
            
    conn.commit()
    conn.close()
    
    print(f"✅ Successfully migrated {count} localities to PostgreSQL!")

if __name__ == "__main__":
    migrate()
