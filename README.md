# Supabase Connection Test

## Overview
This repository contains a simple Python script (`test_connection.py`) to connect to our Supabase database, verify read/write operations, and confirm that Row Level Security (RLS) is active.

## Database Connection
- Verified connection to Supabase instance.
- Successfully read from `items` table.
- Write attempts blocked by RLS (expected behavior).
- Confirmed RLS active.

## Files
- `test_connection.py` — tests connection, read, and write operations.
- `check_env.py` — verifies environment variable loading.
- `.gitignore` — excludes `.env` and `venv/`.
- `.env` — (not tracked) contains your Supabase credentials.

## Setup

1. Clone this repo:
   ```bash
   git clone <repo_url>  # CHANGE LATER
   cd <repo_folder> 


python3 -m venv venv
source venv/bin/activate
pip install supabase python-dotenv


SUPABASE_URL=your_project_url
SUPABASE_ANON_KEY=your_anon_key

python3 test_connection.py
