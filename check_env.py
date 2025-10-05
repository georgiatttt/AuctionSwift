import os
from dotenv import load_dotenv, find_dotenv

print("Running check_env.py...")

# Try to locate the .env file
env_path = find_dotenv()
print("find_dotenv() returned:", repr(env_path))

# Try to load it
loaded = load_dotenv(env_path)
print("load_dotenv() returned:", loaded)

# Try to read values
url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_ANON_KEY")

print("SUPABASE_URL:", repr(url))
print("SUPABASE_ANON_KEY:", repr(key))
