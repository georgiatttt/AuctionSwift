import os
from datetime import datetime
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

print("Testing Supabase Connection...")
print("=" * 50)

# --- READ TEST ---
try:
    response = supabase.table("items").select("id, title, status").execute()
    print(f"✅ Connected! Found {len(response.data)} rows in 'items'.")
except Exception as e:
    print(f"❌ Read error: {e}")

# --- WRITE TEST ---
try:
    new_item = {
        "org_id": "00000000-0000-0000-0000-000000000001",
        "title": "Demo Test Item",
        "status": "draft",
        "created_at": datetime.now().isoformat()
    }
    insert_res = supabase.table("items").insert(new_item).execute()
    print(f"✅ Inserted item ID: {insert_res.data[0]['id']}")
except Exception as e:
    print(f"❌ Insert error: {e}")

# --- OPTIONAL RLS TEST ---
try:
    restricted = supabase.table("items").select("*").eq("org_id", "1234").execute()
    print("RLS test result:", restricted.data)
except Exception as e:
    print("RLS seems active (access denied).")
