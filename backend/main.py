from fastapi import FastAPI, HTTPException, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from supabase import create_client, Client
from openai import OpenAI
import os
import sys
import base64

# Add scrapers directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'scrapers', '130point'))
from scraper_130point import fetch_html, parse_comps

# Load environment variables from root directory
root_dir = os.path.dirname(os.path.dirname(__file__))
load_dotenv(os.path.join(root_dir, '.env'))

# Ensure we can find requirements.txt in root
# Install with: pip3 install -r requirements.txt (from root directory)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# make supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# make openai client
openai_client = OpenAI(api_key=OPENAI_API_KEY)

app = FastAPI()

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "all good"}

# ============================================
# PROFILE ENDPOINTS
# ============================================

# create a new user/profile
@app.post("/users")
def create_user(email: str, role: str = "staff"):
    # check inputs
    if not email.strip():
        raise HTTPException(400, "Email cannot be empty")
    
    if role not in ["admin", "staff"]:
        raise HTTPException(400, "Role must be 'admin' or 'staff'")

    # check email unique
    existing = supabase.table("profiles").select("profile_id").eq("email", email).execute()
    if existing.data:
        raise HTTPException(400, "Email already exists")

    # insert profile
    result = supabase.table("profiles").insert({
        "email": email.strip(),
        "role": role
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

# UPDATE profile email
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

# ============================================
# AUCTION ENDPOINTS
# ============================================

# create auction
@app.post("/auctions")
def create_auction(profile_id: str, auction_name: str):
    # check inputs
    if not auction_name.strip():
        raise HTTPException(400, "Auction name cannot be empty")

    # check profile exists and is active
    prof = supabase.table("profiles").select("profile_id, is_active").eq("profile_id", profile_id).execute()
    if not prof.data:
        raise HTTPException(404, "User/profile not found")
    if not prof.data[0]["is_active"]:
        raise HTTPException(403, "User is not active")

    # create auction
    result = supabase.table("auctions").insert({
        "profile_id": profile_id,
        "auction_name": auction_name.strip()
    }).execute()
    if not result.data:
        raise HTTPException(500, "Failed to create auction")

    return result.data[0]

# GET auction by id
@app.get("/auctions/{auction_id}")
def get_auction(auction_id: str):
    # find auction
    auction = supabase.table("auctions").select("*").eq("auction_id", auction_id).execute()
    if not auction.data:
        raise HTTPException(404, "Auction not found")
    return auction.data[0]

# GET all auctions for a user
@app.get("/auctions")
def list_auctions_by_user(profile_id: str):
    # find user
    user = supabase.table("profiles").select("profile_id").eq("profile_id", profile_id).execute()
    if not user.data:
        raise HTTPException(404, "User not found")

    # get all auctions for this user
    auctions = supabase.table("auctions").select("*").eq("profile_id", profile_id).order("created_at", desc=True).execute()
    if not auctions.data:
        return {"message": "No auctions found for this user", "auctions": []}

    return {"profile_id": profile_id, "auctions": auctions.data}

# UPDATE auction name
@app.put("/auctions/{auction_id}")
def update_auction(auction_id: str, auction_name: str):
    # check auction exists
    auction = supabase.table("auctions").select("auction_id").eq("auction_id", auction_id).execute()
    if not auction.data:
        raise HTTPException(404, "Auction not found")

    # update name
    res = supabase.table("auctions").update({"auction_name": auction_name.strip()}).eq("auction_id", auction_id).execute()
    if not res.data:
        raise HTTPException(500, "Failed to update auction")
    return res.data[0]

# DELETE auction
@app.delete("/auctions/{auction_id}")
def delete_auction(auction_id: str):
    # check auction exists
    auction = supabase.table("auctions").select("auction_id").eq("auction_id", auction_id).execute()
    if not auction.data:
        raise HTTPException(404, "Auction not found")

    # delete (cascades to items if DB configured)
    res = supabase.table("auctions").delete().eq("auction_id", auction_id).execute()
    return {"message": "Auction deleted successfully", "auction_id": auction_id}

# ============================================
# ITEM ENDPOINTS
# ============================================

# create item + 1..5 image urls (now uses auction_id)
@app.post("/items")
def create_item(
    auction_id: str,
    title: str,
    image_url_1: str,
    image_url_2: str = "",
    image_url_3: str = "",
    image_url_4: str = "",
    image_url_5: str = "",
    brand: str = "",
    model: str = "",
    year: int | None = None,
    ai_description: str = ""
):
    # check auction exists
    auction = supabase.table("auctions").select("auction_id, profile_id").eq("auction_id", auction_id).execute()
    if not auction.data:
        raise HTTPException(404, "Auction not found")
    
    # verify profile is active
    profile_id = auction.data[0]["profile_id"]
    prof = supabase.table("profiles").select("is_active").eq("profile_id", profile_id).execute()
    if not prof.data or not prof.data[0]["is_active"]:
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
        "auction_id": auction_id,
        "title": title.strip(),
        "brand": brand_val,
        "model": model_val,
        "year": year_val,
        "status": "draft",
        "ai_description": ai_description.strip() if ai_description else None
    }).execute()
    if not item_res.data:
        raise HTTPException(500, "Failed to create item")

    item = item_res.data[0]
    item_id = item["item_id"]

    # insert item images with positions
    rows = [{"item_id": item_id, "url": url, "position": i + 1} for i, url in enumerate(images)]
    imgs_res = supabase.table("item_images").insert(rows).execute()
    if not imgs_res.data:
        # delete item if images failed so we don't leave orphans
        supabase.table("items").delete().eq("item_id", item_id).execute()
        raise HTTPException(500, "Failed to add item images")

    # return both
    return {"item": item, "images": imgs_res.data}

# GET all items for an auction
@app.get("/items")
def list_items(auction_id: str = None, profile_id: str = None):
    """
    Get items by auction_id OR get all items across all auctions for a profile_id
    """
    if auction_id:
        # get items for specific auction
        auction = supabase.table("auctions").select("auction_id").eq("auction_id", auction_id).execute()
        if not auction.data:
            raise HTTPException(404, "Auction not found")

        items = supabase.table("items").select("*").eq("auction_id", auction_id).order("created_at", desc=True).execute()
        if not items.data:
            return {"message": "No items found for this auction", "items": []}

        # get images
        item_ids = [i["item_id"] for i in items.data]
        imgs = supabase.table("item_images").select("*").in_("item_id", item_ids).execute()
        images = imgs.data if imgs.data else []

        # group images
        grouped = {}
        for img in images:
            iid = img["item_id"]
            if iid not in grouped:
                grouped[iid] = []
            grouped[iid].append(img)

        # attach images to items
        for it in items.data:
            it["images"] = grouped.get(it["item_id"], [])

        return {"auction_id": auction_id, "items": items.data}

    elif profile_id:
        # get all items across all auctions for this profile
        user = supabase.table("profiles").select("profile_id").eq("profile_id", profile_id).execute()
        if not user.data:
            raise HTTPException(404, "User not found")

        # get all auctions for this user
        auctions = supabase.table("auctions").select("auction_id").eq("profile_id", profile_id).execute()
        if not auctions.data:
            return {"message": "No auctions found for this user", "items": []}

        auction_ids = [a["auction_id"] for a in auctions.data]

        # get all items in these auctions
        items = supabase.table("items").select("*").in_("auction_id", auction_ids).order("created_at", desc=True).execute()
        if not items.data:
            return {"message": "No items found for this user", "items": []}

        # get images
        item_ids = [i["item_id"] for i in items.data]
        imgs = supabase.table("item_images").select("*").in_("item_id", item_ids).execute()
        images = imgs.data if imgs.data else []

        # group images
        grouped = {}
        for img in images:
            iid = img["item_id"]
            if iid not in grouped:
                grouped[iid] = []
            grouped[iid].append(img)

        # attach images to items
        for it in items.data:
            it["images"] = grouped.get(it["item_id"], [])

        return {"profile_id": profile_id, "items": items.data}
    
    else:
        raise HTTPException(400, "Must provide either auction_id or profile_id")

# GET single item by id
@app.get("/items/{item_id}")
def get_item(item_id: str):
    # find item
    item = supabase.table("items").select("*").eq("item_id", item_id).execute()
    if not item.data:
        raise HTTPException(404, "Item not found")

    # get images
    imgs = supabase.table("item_images").select("*").eq("item_id", item_id).execute()
    item_data = item.data[0]
    item_data["images"] = imgs.data if imgs.data else []

    return item_data

# UPDATE item
@app.put("/items/{item_id}")
def update_item(
    item_id: str,
    title: str = None,
    brand: str = None,
    model: str = None,
    year: int = None,
    status: str = None
):
    # check item exists
    item = supabase.table("items").select("item_id").eq("item_id", item_id).execute()
    if not item.data:
        raise HTTPException(404, "Item not found")

    # build update dict
    updates = {}
    if title is not None:
        updates["title"] = title.strip()
    if brand is not None:
        updates["brand"] = brand.strip()
    if model is not None:
        updates["model"] = model.strip()
    if year is not None:
        updates["year"] = year
    if status is not None:
        if status not in ["draft", "published", "sold"]:
            raise HTTPException(400, "Invalid status")
        updates["status"] = status

    if not updates:
        raise HTTPException(400, "No fields to update")

    # update
    res = supabase.table("items").update(updates).eq("item_id", item_id).execute()
    if not res.data:
        raise HTTPException(500, "Failed to update item")
    return res.data[0]

# DELETE item
@app.delete("/items/{item_id}")
def delete_item(item_id: str):
    # check item exists
    item = supabase.table("items").select("item_id").eq("item_id", item_id).execute()
    if not item.data:
        raise HTTPException(404, "Item not found")

    # delete (cascades to images/comps/etc if DB configured)
    res = supabase.table("items").delete().eq("item_id", item_id).execute()
    return {"message": "Item deleted successfully", "item_id": item_id}

# UPDATE item image URL
@app.put("/items/{item_id}/images/{image_id}")
def update_item_image(item_id: str, image_id: int, url: str):
    """
    Update the URL of a specific image for an item.
    Used after uploading image to Supabase Storage.
    """
    # Verify item exists
    item = supabase.table("items").select("item_id").eq("item_id", item_id).execute()
    if not item.data:
        raise HTTPException(404, "Item not found")
    
    # Update the image URL
    res = supabase.table("item_images").update({"url": url}).eq("image_id", image_id).execute()
    if not res.data:
        raise HTTPException(500, "Failed to update image URL")
    
    return {"message": "Image URL updated successfully", "image": res.data[0]}

# ============================================
# COMPS ENDPOINTS (130Point Integration)
# ============================================

# GET comps for an item using 130Point scraper
@app.get("/items/{item_id}/comps")
def get_item_comps(item_id: str, limit: int = 10):
    """
    Fetch comparable sales data from 130Point for a given item.
    Uses item's brand, model, and year to search for comps.
    """
    # get item details
    item = supabase.table("items").select("*").eq("item_id", item_id).execute()
    if not item.data:
        raise HTTPException(404, "Item not found")
    
    item_data = item.data[0]
    
    # build search query from item details
    brand = item_data.get("brand", "")
    model = item_data.get("model", "")
    year = item_data.get("year")
    
    # construct search query
    query_parts = []
    if brand and brand != "Unknown":
        query_parts.append(brand)
    if model and model != "Unknown":
        query_parts.append(model)
    if year:
        query_parts.append(str(year))
    
    if not query_parts:
        raise HTTPException(400, "Item must have brand, model, or year to search for comps")
    
    search_query = " ".join(query_parts)
    
    # fetch comps from 130Point
    try:
        html = fetch_html(query=search_query)
        comps = parse_comps(html)
        
        # save the top 3 comps to database if we found any
        comps_saved = 0
        if comps:
            top_3_comps = comps[:3]  # Get top 3 comps
            
            for comp in top_3_comps:
                # determine the sold price (prefer sale_price, fallback to best_offer_price, then current_price)
                sold_price = comp.sale_price or comp.best_offer_price or comp.current_price
                
                if sold_price and sold_price > 0:
                    # insert into comps table
                    comp_record = {
                        "item_id": item_id,
                        "source": comp.source or "130Point",
                        "source_url": comp.link,  # The eBay listing URL
                        "sold_price": float(sold_price),
                        "currency": comp.currency or "USD",
                        "sold_at": None,  # 130Point doesn't provide clean date format for DB
                        "notes": comp.title
                    }
                    
                    try:
                        supabase.table("comps").insert(comp_record).execute()
                        comps_saved += 1
                    except Exception as db_error:
                        # log error but don't fail the request
                        print(f"Warning: Failed to save comp to database: {db_error}")
        
        # limit results for API response
        limited_comps = comps[:limit] if limit else comps
        
        # convert to dict
        comps_data = [
            {
                "title": comp.title,
                "link": comp.link,
                "sale_price": comp.sale_price,
                "currency": comp.currency,
                "best_offer_price": comp.best_offer_price,
                "list_price": comp.list_price,
                "current_price": comp.current_price,
                "bids": comp.bids,
                "sale_type": comp.sale_type,
                "date_text": comp.date_text,
                "shipping": comp.shipping,
                "image_thumb": comp.image_thumb,
                "image_large": comp.image_large,
                "source": comp.source
            }
            for comp in limited_comps
        ]
        
        return {
            "item_id": item_id,
            "search_query": search_query,
            "total_comps_found": len(comps),
            "comps_returned": len(comps_data),
            "comps_saved_to_db": comps_saved,
            "comps": comps_data
        }
        
    except Exception as e:
        raise HTTPException(500, f"Failed to fetch comps: {str(e)}")

# GET saved comps from database for an item
@app.get("/items/{item_id}/comps/saved")
def get_saved_comps(item_id: str):
    """
    Retrieve previously saved comps from the database for an item.
    This is useful when the scraper is rate-limited or unavailable.
    """
    try:
        # Verify item exists
        item = supabase.table("items").select("item_id").eq("item_id", item_id).execute()
        if not item.data:
            raise HTTPException(404, "Item not found")
        
        # Get saved comps from database
        comps = supabase.table("comps").select("*").eq("item_id", item_id).order("created_at", desc=True).execute()
        
        if not comps.data:
            return {
                "item_id": item_id,
                "comps_count": 0,
                "comps": []
            }
        
        # Format comps for frontend
        formatted_comps = []
        for comp in comps.data:
            formatted_comps.append({
                "comp_id": comp.get("comp_id"),
                "source": comp.get("source", "eBay"),
                "link": comp.get("source_url"),  # Use source_url for the eBay listing URL
                "sale_price": comp.get("sold_price"),
                "currency": comp.get("currency", "USD"),
                "date_text": comp.get("sold_at"),
                "title": comp.get("notes")
            })
        
        return {
            "item_id": item_id,
            "comps_count": len(formatted_comps),
            "comps": formatted_comps
        }
        
    except Exception as e:
        raise HTTPException(500, f"Failed to retrieve saved comps: {str(e)}")

# ============================================
# VISION / AI DESCRIPTION ENDPOINT
# ============================================

@app.post("/items/generate-description")
async def generate_item_description(
    image: UploadFile = File(...),
    title: str = Form(...),
    model: str = Form(None),
    year: str = Form(None),
    notes: str = Form(None)
):
    """
    Generate a concise 3-sentence description for an auction item
    using OpenAI's vision API to analyze the uploaded image and condition notes.
    """
    try:
        # Read and encode the image
        image_data = await image.read()
        base64_image = base64.b64encode(image_data).decode('utf-8')
        
        # Construct the item details string
        item_details = f"Title: {title}"
        if model:
            item_details += f"\nModel: {model}"
        if year:
            item_details += f"\nYear: {year}"
        if notes:
            item_details += f"\nCondition Notes: {notes}"
        
        # Create the prompt for vision API
        prompt = f"""You are an expert auction copywriter creating compelling product descriptions for online sales. Analyze this image and write a confident, definitive 3-sentence marketing description.

Item Details:
{item_details}

Requirements:
- Write exactly 3 sentences in a confident, definitive tone
- Sentence 1: State what the item is (brand, model, year if provided) - be direct and factual
- Sentence 2: Describe the visual appearance - color, finish, aesthetic details you observe in the image - use confident language (avoid "appears", "seems", "looks like")
- Sentence 3: If condition notes are provided, incorporate them naturally; otherwise describe the overall presentation and appeal
- Use persuasive sales language but remain honest and factual
- Be specific about what you see in the image
- No hedging words like "appears to be", "seems to", "possibly" - be direct and confident

Generate the 3-sentence description now:"""

        # Call OpenAI vision API
        response = openai_client.chat.completions.create(
            model="gpt-4o",  # GPT-4 with vision
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64_image}",
                                "detail": "high"
                            }
                        }
                    ]
                }
            ],
            max_tokens=300,
            temperature=0.7
        )
        
        # Extract the generated description
        description = response.choices[0].message.content.strip()
        
        return {
            "success": True,
            "description": description,
            "item_details": {
                "title": title,
                "model": model,
                "year": year
            }
        }
        
    except Exception as e:
        raise HTTPException(500, f"Failed to generate description: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8080)