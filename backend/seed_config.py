import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    print("Missing Supabase credentials in .env")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# SQL to create the system_config table
create_table_sql = """
CREATE TABLE IF NOT EXISTS system_config (
    config_key VARCHAR(50) PRIMARY KEY,
    config_value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed initial data if not exists
INSERT INTO system_config (config_key, config_value) 
VALUES 
    ('academic_year', '2024'),
    ('reservation_percentage', '20'),
    ('application_deadline', '"2024-12-31T23:59:59Z"')
ON CONFLICT (config_key) DO NOTHING;
"""

print("Creating system_config table and seeding initial data...")
try:
    # We use a raw RPC or just assume the table is created via the UI/CLI
    # Since we can't run raw SQL easily via the SDK without an RPC, 
    # we'll use a trick or provide the SQL for the user.
    # For now, let's try to UPSERT directly to see if table exists.
    
    configs = [
        {"config_key": "academic_year", "config_value": "2024"},
        {"config_key": "reservation_percentage", "config_value": "20"},
        {"config_key": "application_deadline", "config_value": "2024-12-31T23:59:59Z"}
    ]
    
    for cfg in configs:
        supabase.table("system_config").upsert(cfg).execute()
    print("Initial configuration seeded successfully.")

except Exception as e:
    print(f"Error: {e}")
    print("\nIMPORTANT: Please run the following SQL in your Supabase SQL Editor:")
    print(create_table_sql)
