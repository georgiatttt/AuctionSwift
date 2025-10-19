# AuctionSwift API

## What it does
This is a simple API for making organizations, users (profiles), and items.  
Items can have up to 5 image URLs and only active users can create them.

## Setup
1. 'pip install -r requirements.txt'
2. Add '.env' with Supabase credentials
3. 'uvicorn main:app --reload'
4. Test at http://localhost:8000/docs

## Endpoints 
- 'GET /organizations/{org_id}` - Get one organization by ID.
- 'POST /organizations' - Business logic: Create a new organization and automatically create the first admin user (needs 'name', 'email').
- 'GET /users/{profile_id}' - Get one user profile by ID.
- 'PUT /users/{profile_id}/email' - Update a user's email (checks if new email is unique).
- 'POST /users' - Create a new staff user (requires 'org_id', 'email').
- 'POST /users/promote' - Business logic: Promote a staff member to admin (only admins can promote, must be same organization).
- 'POST /payments' - Business logic: Activate a user (sets 'is_active=True', required before creating items).
- 'GET /items?profile_id=...' - List all items created by a user (includes linked images).
- 'POST /items' - Create a new item with 1–5 image URLs (requires 'profile_id', 'title', and at least one image).
  - Defaults 'brand' and 'model' to 'Unknown'.
  - Sets 'status' to 'draft'.

## Key Business Rule
1. 'POST /organizations' - Combines org + admin creation into one secure transaction.  
2. 'POST /users/promote' - Enforces admin-only promotion within the same organization.  
3. 'POST /payments' - Activates a user account (required before posting items).
4. 'POST /items' - Check if user is_active (payment) and then uploads images and item information in their respected tables.
5. 'GET /items?profile_id' - Will call this once user logs in so they can see their past requests. 