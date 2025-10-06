# AuctionSwift DataBase

## Overview
This repo is a lightweight template for verifying end-to-end connectivity between a local Python environment and a Supabase (PostgreSQL) database with Row Level Security (RLS). It includes small scripts to confirm env vars are loaded, connect using the anon key, perform a safe read, and attempt a write that should be blocked by RLS. A simple `items` ↔ `organizations` join validates relational integrity and visibility under your policies. Use this as a quick sanity check before wiring the database into a larger app.



## Requirements
- Python 3.10+
- Supabase project URL + **anon** API key



## Repository Structure

```
├── test_connection.py # connect, read test, write attempt (RLS should block)
├── check_env.py # verifies .env is loaded correctly
├── sql/
│ ├── schema.sql # tables, constraints, RLS policies
│ └── seed.sql # sample data
├── docs/
│ └── er-diagram.png # ER diagram matching schema.sql
├── .gitignore # excludes .env, venv/, etc.
└── README.md # this file

```




## Setup

### 1) Clone the repository
```bash

git clone https://github.com/georgiatttt/AuctionSwift.git
cd AuctionSwift

```
**Create and activate a virtual environment**
```
python3 -m venv venv
# macOS/Linux
source venv/bin/activate
# Windows (PowerShell)
# .\venv\Scripts\Activate.ps1
```
**Install Dependencies**
```
pip install supabase python-dotenv
```
**Configure environment variables (local only; do NOT commit)**

Create a .env file in the project root:
```
SUPABASE_URL=your_project_url
SUPABASE_ANON_KEY=your_anon_key
```
**Apply schema and seed data in Supabase**

- Open ***Supabase*** -> ***SQL Editor***
- Run sql/schema.sql
- Run sql/seed.sql

**How to Run**
***Environment Check***
```
python check_env.py
```
***Connection & RLS verification***
```
python test_connection.py
```
## Join Query Test
Validate relational integrity and RLS-permitted visibility:
```
SELECT 
  items.title,
  items.brand,
  organizations.name AS organization_name
FROM items
JOIN organizations
  ON items.org_id = organizations.id;
```
