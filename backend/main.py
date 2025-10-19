from fastapi import FastAPI, HTTPException
from dotenv import load_dotenv
from supabase import create_client, Client
import os

# load env 
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# make supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

app = FastAPI()

@app.get("/")
def root():
    return {"message": "all good"}

# create organization + admin user
@app.post("/organizations")
def create_organization(name: str, email: str):
    # check inputs
    if not name.strip():
        raise HTTPException(400, "Organization name cannot be empty")
    if not email.strip():
        raise HTTPException(400, "Email cannot be empty")

    # create org
    org_result = supabase.table("organizations").insert({
        "name": name.strip()
    }).execute()
    if not org_result.data:
        raise HTTPException(500, "Failed to create organization")

    org = org_result.data[0]
    org_id = org["org_id"]  # new key name

    # make sure email not in use
    existing = supabase.table("profiles").select("profile_id").eq("email", email).execute()
    if existing.data:
        raise HTTPException(400, "Email already exists")

    # create admin user in that org
    user_result = supabase.table("profiles").insert({
        "org_id": org_id,
        "email": email,
        "role": "admin"
    }).execute()
    if not user_result.data:
        raise HTTPException(500, "Failed to create admin user")

    user = user_result.data[0]

    # return both
    return {
        "message": "Organization and admin created successfully",
        "organization": org,
        "admin_user": user
    }

# get org by id
@app.get("/organizations/{org_id}")
def get_organization(org_id: str):
    # find org
    org = supabase.table("organizations").select("*").eq("org_id", org_id).execute()
    if not org.data:
        raise HTTPException(404, "Organization not found")
    return org.data[0]

# create normal user (staff by default via DB)
@app.post("/users")
def create_user(org_id: str, email: str):
    # check org exists
    org = supabase.table("organizations").select("org_id").eq("org_id", org_id).execute()
    if not org.data:
        raise HTTPException(404, "Organization not found")

    # check email unique
    existing = supabase.table("profiles").select("profile_id").eq("email", email).execute()
    if existing.data:
        raise HTTPException(400, "Email already exists")

    # insert profile (role defaults to 'staff')
    result = supabase.table("profiles").insert({
        "org_id": org_id,
        "email": email
    }).execute()
    if not result.data:
        raise HTTPException(500, "Failed to create user")

    return result.data[0]

# GET one profile by id
@app.get("/users/{profile_id}")
def get_user(profile_id: str):
    # find user
    user = supabase.table("profiles").select("*").eq("profile_id", profile_id).execute()
    if not user.data:
        raise HTTPException(404, "User not found")
    return user.data[0]

# UPDATE profile email (simple)
@app.put("/users/{profile_id}/email")
def update_user_email(profile_id: str, email: str):
    # make sure user exists
    user = supabase.table("profiles").select("profile_id").eq("profile_id", profile_id).execute()
    if not user.data:
        raise HTTPException(404, "User not found")

    # check email is not used by someone else
    taken = supabase.table("profiles").select("profile_id").eq("email", email).execute()
    if taken.data and taken.data[0]["profile_id"] != profile_id:
        raise HTTPException(400, "Email already exists")

    # update email
    res = supabase.table("profiles").update({"email": email.strip()}).eq("profile_id", profile_id).execute()
    if not res.data:
        raise HTTPException(500, "Failed to update email")
    return res.data[0]

# mark user active (like simple payment/activation)
@app.post("/payments")
def make_payment(profile_id: str):
    # find user
    user = supabase.table("profiles").select("*").eq("profile_id", profile_id).execute()
    if not user.data:
        raise HTTPException(404, "User not found")

    # set active
    result = supabase.table("profiles").update({"is_active": True}).eq("profile_id", profile_id).execute()
    if not result.data:
        raise HTTPException(500, "Failed to update payment status")

    return {"message": "Payment successful", "profile_id": profile_id, "is_active": True}

# promote staff to admin (must be admin and same org)
@app.post("/users/promote")
def promote_user(requester_id: str, user_id: str):
    # find requester
    requester = supabase.table("profiles").select("*").eq("profile_id", requester_id).execute()
    if not requester.data:
        raise HTTPException(404, "Requester not found")
    rq = requester.data[0]

    # must be admin
    if rq["role"] != "admin":
        raise HTTPException(403, "Only admins can promote other users")

    # find target
    user = supabase.table("profiles").select("*").eq("profile_id", user_id).execute()
    if not user.data:
        raise HTTPException(404, "User to promote not found")
    u = user.data[0]

    # same org check
    if rq["org_id"] != u["org_id"]:
        raise HTTPException(403, "You can only promote users within your organization")

    # already admin?
    if u["role"] == "admin":
        raise HTTPException(400, "User is already an admin")

    # update role
    result = supabase.table("profiles").update({"role": "admin"}).eq("profile_id", user_id).execute()
    if not result.data:
        raise HTTPException(500, "Failed to promote user")

    return {
        "message": f"User {u['email']} has been promoted to admin",
        "profile_id": user_id,
        "new_role": "admin"
    }

# create item + 1..5 image urls (uses profile_id)
@app.post("/items")
def create_item(
    profile_id: str,
    title: str,
    image_url_1: str,
    image_url_2: str = "",
    image_url_3: str = "",
    image_url_4: str = "",
    image_url_5: str = "",
    brand: str = "",
    model: str = "",
    year: int | None = None
):
    # check profile exists and is active
    prof = supabase.table("profiles").select("profile_id, is_active").eq("profile_id", profile_id).execute()
    if not prof.data:
        raise HTTPException(404, "User/profile not found")
    p = prof.data[0]
    if not p["is_active"]:
        raise HTTPException(403, "User is not active")

    # gather images and basic check 1..5
    images = [u.strip() for u in [image_url_1, image_url_2, image_url_3, image_url_4, image_url_5] if u and u.strip()]
    if len(images) == 0:
        raise HTTPException(400, "At least one image URL is required")
    if len(images) > 5:
        raise HTTPException(400, "You can provide up to 5 image URLs")

    # defaults for brand/model/year
    brand_val = brand.strip() if brand.strip() else "Unknown"
    model_val = model.strip() if model.strip() else "Unknown"
    year_val = year if year is not None else None

    # insert item (status is draft)
    item_res = supabase.table("items").insert({
        "profile_id": profile_id,
        "title": title.strip(),
        "brand": brand_val,
        "model": model_val,
        "year": year_val,
        "status": "draft"
    }).execute()
    if not item_res.data:
        raise HTTPException(500, "Failed to create item")

    item = item_res.data[0]
    item_id = item["item_id"]  # new PK name

    # insert item images with positions
    rows = [{"item_id": item_id, "url": url, "position": i + 1} for i, url in enumerate(images)]
    imgs_res = supabase.table("item_images").insert(rows).execute()
    if not imgs_res.data:
        # delete item if images failed so we don't leave orphans
        supabase.table("items").delete().eq("item_id", item_id).execute()
        raise HTTPException(500, "Failed to add item images")

    # return both
    return {"item": item, "images": imgs_res.data}

# GET all items for a user (display all past queries)
@app.get("/items")
def list_items_by_user(profile_id: str):
    # find user
    user = supabase.table("profiles").select("profile_id").eq("profile_id", profile_id).execute()
    if not user.data:
        raise HTTPException(404, "User not found")

    # get all items made by this user
    items = supabase.table("items").select("*").eq("profile_id", profile_id).order("created_at", desc=True).execute()
    if not items.data:
        return {"message": "No items found for this user", "items": []}

    # collect all item_ids to fetch images in one go
    item_ids = [i["item_id"] for i in items.data]

    # get all images linked to these items
    imgs = supabase.table("item_images").select("*").in_("item_id", item_ids).execute()
    images = imgs.data if imgs.data else []

    # group images under their matching item_id
    grouped = {}
    for img in images:
        iid = img["item_id"]
        if iid not in grouped:
            grouped[iid] = []
        grouped[iid].append(img)

    # attach images to items
    for it in items.data:
        it["images"] = grouped.get(it["item_id"], [])

    # return everything
    return {"profile_id": profile_id, "items": items.data}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8080)