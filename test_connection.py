import os
from datetime import datetime
from supabase import create_client, Client
from dotenv import load_dotenv, find_dotenv

# Force load the .env file
env_path = find_dotenv()
print("Loading from:", env_path)
load_dotenv(env_path)

# Debug check
print("URL from env:", os.getenv("SUPABASE_URL"))
print("KEY from env:", os.getenv("SUPABASE_ANON_KEY")[:8])

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

print("Testing Supabase connection...")
print("--------------------------------")

# Test 1: Read data
try:
    response = supabase.table("items").select("*").execute()
    print("Connected successfully.")
    print("Found", len(response.data), "records in items table")
except Exception as e:
    print("Error reading data:", e)

# Test 2: Insert data
try:
    test_row = {
        "org_id": "00000000-0000-0000-0000-000000000000",  # safe placeholder UUID
        "title": "VS Code Test Item",
        "ai_description": "Inserted by test_connection.py",
        "brand": "TestBrand",
        "year": 2025
    }
    response = supabase.table("items").insert(test_row).execute()
    print("Inserted data successfully.")
    print("Inserted ID:", response.data[0]['id'])
except Exception as e:
    print("Error inserting data:", e)
    print("This might be caused by RLS rules.")

# Test 3: Check RLS
print("Testing Row Level Security...")
try:
    public = supabase.table("items").select("*").execute()
    print("Records visible without auth:", len(public.data))
except Exception:
    print("Cannot read without auth. RLS is working.")

