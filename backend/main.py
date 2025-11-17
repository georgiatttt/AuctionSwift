from fastapi import FastAPI, HTTPException, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from supabase import create_client, Client
from openai import OpenAI
from pydantic import BaseModel
import os
import sys
import base64
from typing import Optional, List
from agents import Agent, Runner, WebSearchTool
import asyncio
import httpx
import json
import tempfile
import time

# load env from root dir
root_dir = os.path.dirname(os.path.dirname(__file__))
load_dotenv(os.path.join(root_dir, '.env'))

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
OPENAI_DESCRIPTION_KEY = os.getenv("OPENAI_DESCRIPTION_KEY")
OPENAI_COMPS_KEY = os.getenv("OPENAI_COMPS_KEY")

# setup supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# setup openai client for descriptions
openai_description_client = OpenAI(api_key=OPENAI_DESCRIPTION_KEY) if OPENAI_DESCRIPTION_KEY else None

app = FastAPI()

# enable cors for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "all good"}

# PROFILE ENDPOINTS

# create a new user/profile
@app.post("/users")
def create_user(email: str, role: str = "staff"):
    # check inputs
    if not email.strip():
        raise HTTPException(400, "Email cannot be empty")
    
    if role not in ["admin", "staff"]:
        raise HTTPException(400, "Role must be 'admin' or 'staff'")

    # email must be unique
    existing = supabase.table("profiles").select("profile_id").eq("email", email).execute()
    if existing.data:
        raise HTTPException(400, "Email already exists")

    # save to db
    result = supabase.table("profiles").insert({
        "email": email.strip(),
        "role": role
    }).execute()
    if not result.data:
        raise HTTPException(500, "Failed to create user")

    return result.data[0]

# get one user by id
@app.get("/users/{profile_id}")
def get_user(profile_id: str):
    # lookup user
    user = supabase.table("profiles").select("*").eq("profile_id", profile_id).execute()
    if not user.data:
        raise HTTPException(404, "User not found")
    return user.data[0]

# update user email
@app.put("/users/{profile_id}/email")
def update_user_email(profile_id: str, email: str):
    # verify user exists
    user = supabase.table("profiles").select("profile_id").eq("profile_id", profile_id).execute()
    if not user.data:
        raise HTTPException(404, "User not found")

    # email must be available
    taken = supabase.table("profiles").select("profile_id").eq("email", email).execute()
    if taken.data and taken.data[0]["profile_id"] != profile_id:
        raise HTTPException(400, "Email already exists")

    # save new email
    res = supabase.table("profiles").update({"email": email.strip()}).eq("profile_id", profile_id).execute()
    if not res.data:
        raise HTTPException(500, "Failed to update email")
    return res.data[0]

# activate user account
@app.post("/payments")
def make_payment(profile_id: str):
    # lookup user
    user = supabase.table("profiles").select("*").eq("profile_id", profile_id).execute()
    if not user.data:
        raise HTTPException(404, "User not found")

    # mark as active
    result = supabase.table("profiles").update({"is_active": True}).eq("profile_id", profile_id).execute()
    if not result.data:
        raise HTTPException(500, "Failed to update payment status")

    return {"message": "Payment successful", "profile_id": profile_id, "is_active": True}

# auction endpoints

# make new auction
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

# DELETE auction (with cascade deletion of related data)
@app.delete("/auctions/{auction_id}")
def delete_auction(auction_id: str):
    # Check auction exists
    auction = supabase.table("auctions").select("auction_id").eq("auction_id", auction_id).execute()
    if not auction.data:
        raise HTTPException(404, "Auction not found")

    # Get all items in this auction
    items_response = supabase.table("items").select("item_id").eq("auction_id", auction_id).execute()
    item_ids = [item["item_id"] for item in items_response.data] if items_response.data else []

    if item_ids:
        # delete all comps for these items
        try:
            for item_id in item_ids:
                supabase.table("comps").delete().eq("item_id", item_id).execute()
        except Exception:
            pass

        # delete all item_images for these items
        try:
            for item_id in item_ids:
                supabase.table("item_images").delete().eq("item_id", item_id).execute()
        except Exception:
            pass

        # delete all items in this auction
        try:
            supabase.table("items").delete().eq("auction_id", auction_id).execute()
        except Exception as e:
            raise HTTPException(500, f"Failed to delete items: {str(e)}")

    # Step 4: Finally delete the auction itself
    try:
        supabase.table("auctions").delete().eq("auction_id", auction_id).execute()
    except Exception as e:
        raise HTTPException(500, f"Failed to delete auction: {str(e)}")

    return {
        "message": "Auction and all related data deleted successfully",
        "auction_id": auction_id,
        "deleted_items": len(item_ids)
    }

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
        try:
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
        
        except httpx.ReadError as e:
            raise HTTPException(503, "Database connection timeout. Please try again.")
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(500, f"Failed to fetch items: {str(e)}")
    
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

# delete item and related data
@app.delete("/items/{item_id}")
def delete_item(item_id: str):
    try:
        # try rpc function first
        result = supabase.rpc('delete_item_cascade', {'p_item_id': item_id}).execute()
        
        if result.data is None or (isinstance(result.data, list) and len(result.data) == 0):
            raise HTTPException(404, "Item not found")
        
        return {"message": "Item deleted successfully", "item_id": item_id}
    
    except HTTPException:
        raise
    except Exception as e:
        # fallback to manual deletion
        try:
            supabase.table("comps").delete().eq("item_id", item_id).execute()
            supabase.table("item_images").delete().eq("item_id", item_id).execute()
            item_result = supabase.table("items").delete().eq("item_id", item_id).execute()
            
            if not item_result.data:
                raise HTTPException(404, "Item not found")
            
            return {"message": "Item deleted successfully", "item_id": item_id}
        except Exception as fallback_error:
            raise HTTPException(500, f"Failed to delete item: {str(fallback_error)}")

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

# comps endpoints

# get saved comps for item
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
        
        # Detect image format from content type or filename
        content_type = image.content_type or ""
        filename = image.filename or ""
        
        # Determine image format
        if "avif" in content_type.lower() or filename.lower().endswith(".avif"):
            # AVIF not supported by OpenAI, need to convert or use URL
            raise HTTPException(400, "AVIF format not supported. Please use PNG, JPEG, GIF, or WEBP format.")
        elif "png" in content_type.lower() or filename.lower().endswith(".png"):
            mime_type = "image/png"
        elif "gif" in content_type.lower() or filename.lower().endswith(".gif"):
            mime_type = "image/gif"
        elif "webp" in content_type.lower() or filename.lower().endswith(".webp"):
            mime_type = "image/webp"
        else:
            # Default to jpeg
            mime_type = "image/jpeg"
        
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

        # Validate API key
        if not openai_description_client:
            raise HTTPException(500, "OpenAI Description API key not configured")
        
        # Call OpenAI vision API
        response = openai_description_client.chat.completions.create(
            model="gpt-4o",  # GPT-4 with vision
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:{mime_type};base64,{base64_image}",
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
        import traceback
        error_detail = traceback.format_exc()
        raise HTTPException(500, f"Failed to generate description: {str(e)}")


# ============================================
# COMPS AGENT INTEGRATION
# ============================================

# Pydantic models for the comps agent
class CompSchema(BaseModel):
    source: str
    url: str
    sale_date: str
    price: str
    notes: str

class CompsRequest(BaseModel):
    item_id: str
    brand: Optional[str] = None
    model: Optional[str] = None
    year: Optional[str] = None
    notes: Optional[str] = None

class CompsResponse(BaseModel):
    comp_1: dict
    comp_2: dict
    comp_3: dict

@app.post("/comps")
async def generate_comps_simple(request: CompsRequest):
    """
    Generate comparable sales data using OpenAI Agents SDK.
    Requires: brand, model, year, notes
    Returns: 3 comps from different sources
    """
    try:
        # verify item exists
        item = supabase.table("items").select("*").eq("item_id", request.item_id).execute()
        if not item.data:
            raise HTTPException(404, "Item not found")
        
        item_data = item.data[0]
        
        # use provided values or fall back to item data
        brand = request.brand or item_data.get("brand") or "Unknown"
        model = request.model or item_data.get("model") or "Unknown"
        year = request.year or (str(item_data.get("year")) if item_data.get("year") else "Unknown")
        notes = request.notes or ""
        
        # validate comps api key
        if not OPENAI_COMPS_KEY:
            raise HTTPException(500, "OpenAI Comps API key not configured")
        
        # set openai api key for agents
        os.environ["OPENAI_API_KEY"] = OPENAI_COMPS_KEY
        
        # Define the comps schema with proper field names
        class Comp1Schema(BaseModel):
            source_1: str
            url_1: str
            sale_date_1: str
            price_1: str
            notes_1: str
        
        class Comp2Schema(BaseModel):
            source_2: str
            url_2: str
            sale_date_2: str
            price_2: str
            notes_2: str
        
        class Comp3Schema(BaseModel):
            source_3: str
            url_3: str
            sale_date_3: str
            price_3: str
            notes_3: str
        
        class CompsOutput(BaseModel):
            comp_1: Comp1Schema
            comp_2: Comp2Schema
            comp_3: Comp3Schema
        
        # Create agent with WebSearchTool
        comps_agent = Agent(
            name="Comps Agent",
            instructions=f"""You are a Comps Agent. Your job is to find SOLD comparables ("comps") for any item.

Here are the inputs:
- Brand: {brand}
- Model: {model}
- Year: {year}
- Notes: {notes}

**CURRENT DATE: November 16, 2025**

Use the web search tool to find REAL, RECENT sold listings with VALID, WORKING URLs from 2025 ONLY.

### CRITICAL REQUIREMENTS
1. **2025 SALES ONLY**: Every comp MUST be from 2025. Sales from 2024 or earlier are NOT acceptable.
2. **URLs MUST BE VALID**: Every URL must be a real, working link to an actual sold listing page. Do not fabricate or guess URLs.
3. **THREE DIFFERENT SOURCES**: Each comp must be from a different website (e.g., eBay, 1stDibs, Sotheby's, Grailed, StockX, Heritage Auctions, Poshmark, The RealReal, etc.).
4. **SOLD LISTINGS ONLY**: Must be completed sales, not active listings or "Buy It Now" prices.

### SEARCH STRATEGY
- Search for: "{brand} {model} {year} sold 2025"
- Try multiple search queries if needed: "sold items", "auction results 2025", "recently sold"
- Check MULTIPLE pages of results to find 2025 sales
- Verify the sale date is from 2025 before including
- Keep searching until you find 3 valid comps from 2025

### OUTPUT FORMAT (STRICT)
You must output exactly THREE comps from 2025, filling every field:

- `source_X`: The website name (e.g., "eBay", "Heritage Auctions", "1stDibs")
- `url_X`: The COMPLETE, VALID URL to the sold listing page
- `sale_date_X`: Format "YYYY-MM-DD" - MUST be EXACT date with valid day (e.g., "2025-08-27", "2025-10-20"). NO wildcards like "2025-09-**". If exact day unknown, use "01" for the day (e.g., "2025-09-01").
- `price_X`: String with numbers only, e.g., "425.00" (no currency symbols)
- `notes_X`: Include item condition, differences from target item, and any relevant details

### VALIDATION RULES
1. All three comps must be from **three different websites**
2. All three comps must have sale dates in **2025 ONLY** (January 1 - November 16, 2025)
3. URLs must be **complete and valid** (start with https://)
4. If the first search doesn't return 2025 results, try different search terms and keep searching
5. Do NOT fabricate URLs or dates - only use real data from web search
6. If after extensive searching you cannot find 3 comps from 2025, only then set "source_X": "none"

**IMPORTANT**: Do not give up easily. Try multiple searches with different keywords until you find 3 valid 2025 sales.""",
            tools=[
                WebSearchTool(
                    search_context_size="medium",
                    user_location={
                        "type": "approximate",
                        "city": None,
                        "country": "US",
                        "region": None,
                        "timezone": None
                    }
                )
            ],
            output_type=CompsOutput,
        )
        
        # run agent with retry logic
        max_attempts = 3
        valid_comps = None
        
        for attempt in range(max_attempts):
            search_input = f"Find sold comparable items for {brand} {model} {year} from 2025"
            if attempt > 0:
                search_input += f" (Attempt {attempt + 1}: Focus on recent 2025 sales only)"
            
            result = await Runner.run(comps_agent, input=search_input)
            
            # transform to expected format
            raw_output = result.final_output.model_dump()
            comps_data = {
                "comp_1": {
                    "source": raw_output["comp_1"]["source_1"],
                    "url": raw_output["comp_1"]["url_1"],
                    "sale_date": raw_output["comp_1"]["sale_date_1"],
                    "price": raw_output["comp_1"]["price_1"],
                    "notes": raw_output["comp_1"]["notes_1"]
                },
                "comp_2": {
                    "source": raw_output["comp_2"]["source_2"],
                    "url": raw_output["comp_2"]["url_2"],
                    "sale_date": raw_output["comp_2"]["sale_date_2"],
                    "price": raw_output["comp_2"]["price_2"],
                    "notes": raw_output["comp_2"]["notes_2"]
                },
                "comp_3": {
                    "source": raw_output["comp_3"]["source_3"],
                    "url": raw_output["comp_3"]["url_3"],
                    "sale_date": raw_output["comp_3"]["sale_date_3"],
                    "price": raw_output["comp_3"]["price_3"],
                    "notes": raw_output["comp_3"]["notes_3"]
                }
            }
            
            # validate that all comps are from 2025
            valid_2025_comps = 0
            for comp_key in ["comp_1", "comp_2", "comp_3"]:
                comp_data = comps_data[comp_key]
                sale_date = comp_data.get("sale_date", "")
                
                if sale_date and sale_date.startswith("2025") and comp_data.get("source", "").lower() != "none":
                    valid_2025_comps += 1
            
            # if we have 3 valid 2025 comps, we're done
            if valid_2025_comps == 3:
                valid_comps = comps_data
                break
        
        # use last attempt if no valid comps found
        if valid_comps is None:
            valid_comps = comps_data
        
        # Save comps to database
        for comp_key in ["comp_1", "comp_2", "comp_3"]:
            if comp_key in valid_comps:
                comp_data = valid_comps[comp_key]
                if comp_data.get("source", "").lower() != "none":
                    try:
                        # Parse price (remove any currency symbols)
                        price_str = str(comp_data.get("price", "0")).replace("$", "").replace(",", "").strip()
                        price_numeric = float(price_str) if price_str else 0.0
                        
                        # parse date (handle various formats and validate)
                        sale_date = None
                        raw_date = comp_data.get("sale_date", "")
                        if raw_date and raw_date.lower() not in ["null", "unknown", "none"]:
                            import re
                            if re.match(r'^\d{4}-\d{2}-\d{2}$', raw_date):
                                sale_date = raw_date
                            else:
                                year_month_match = re.match(r'^(\d{4}-\d{2})', raw_date)
                                if year_month_match:
                                    sale_date = year_month_match.group(1) + "-01"
                        
                        # insert into comps table with retry logic
                        max_db_retries = 3
                        for retry in range(max_db_retries):
                            try:
                                supabase.table("comps").insert({
                                    "item_id": request.item_id,
                                    "source": comp_data.get("source", "Unknown"),
                                    "url_comp": comp_data.get("url", ""),
                                    "sold_price": price_numeric,
                                    "currency": "USD",
                                    "sold_at": sale_date,
                                    "notes": comp_data.get("notes", "")
                                }).execute()
                                break
                            except httpx.ReadError as db_error:
                                if retry < max_db_retries - 1:
                                    await asyncio.sleep(1)
                                else:
                                    raise db_error
                    except Exception as e:
                        pass
        
        return {
            "success": True,
            "item_id": request.item_id,
            "comps": valid_comps
        }
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_detail = traceback.format_exc()
        raise HTTPException(500, f"Failed to generate comps: {str(e)}")


@app.get("/comps/{item_id}")
def get_comps_for_item(item_id: str):
    """
    Get all saved comps for a specific item
    """
    max_retries = 3
    for attempt in range(max_retries):
        try:
            # Verify item exists
            item = supabase.table("items").select("item_id").eq("item_id", item_id).execute()
            if not item.data:
                raise HTTPException(404, "Item not found")
            
            # Get all comps for this item
            comps = supabase.table("comps").select("*").eq("item_id", item_id).order("created_at", desc=True).execute()
            
            return {
                "item_id": item_id,
                "comps": comps.data if comps.data else []
            }
        
        except httpx.ReadError as e:
            if attempt < max_retries - 1:
                import time
                time.sleep(0.5)
            else:
                raise HTTPException(503, "Database connection timeout. Please try again.")
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(500, f"Failed to retrieve comps: {str(e)}")


# ============================================
# BATCH COMPS GENERATION ENDPOINTS
# ============================================

class BatchCompsRequest(BaseModel):
    """Request model for batch comps generation"""
    items: List[dict]  # List of items with item_id, brand, model, year, notes

class BatchCompsResponse(BaseModel):
    """Response model for batch comps creation"""
    batch_id: str
    status: str
    total_items: int
    message: str

@app.post("/comps/batch")
async def create_comps_batch(request: BatchCompsRequest):
    """
    Process comps for multiple items in parallel using agents with WebSearchTool.
    Returns immediately with all results (not a background job).
    
    Request body:
    {
        "items": [
            {"item_id": "abc", "brand": "Rolex", "model": "Submariner", "year": "2020", "notes": ""},
            {"item_id": "def", "brand": "Omega", "model": "Speedmaster", "year": "2019", "notes": ""}
        ]
    }
    """
    try:
        if not request.items or len(request.items) == 0:
            raise HTTPException(400, "Items list cannot be empty")
        
        if len(request.items) > 100:
            raise HTTPException(400, "Batch size cannot exceed 100 items for parallel processing")
        
        # validate openai key
        if not OPENAI_COMPS_KEY:
            raise HTTPException(500, "OpenAI Comps API key not configured")
        
        # set openai api key for agents
        os.environ["OPENAI_API_KEY"] = OPENAI_COMPS_KEY
        
        # create function to process single item
        async def process_single_item(item_data):
            item_id = item_data.get("item_id")
            brand = item_data.get("brand", "Unknown")
            model = item_data.get("model", "Unknown")
            year = item_data.get("year", "Unknown")
            notes = item_data.get("notes", "")
            
            try:
                # use same agent logic as single comps endpoint
                comps_request = CompsRequest(
                    item_id=item_id,
                    brand=brand,
                    model=model,
                    year=year,
                    notes=notes
                )
                
                # call single comps generation function
                result = await generate_comps_simple(comps_request)
                
                return {
                    "item_id": item_id,
                    "success": True,
                    "comps": result["comps"]
                }
                
            except Exception as e:
                return {
                    "item_id": item_id,
                    "success": False,
                    "error": str(e)
                }
        
        # process all items in parallel
        tasks = [process_single_item(item) for item in request.items]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # count successes and failures
        successful = sum(1 for r in results if isinstance(r, dict) and r.get("success"))
        failed = len(results) - successful
        
        return {
            "batch_id": f"sync-{int(time.time())}",  # Generate a simple ID for tracking
            "status": "completed",
            "total_items": len(results),
            "successful": successful,
            "failed": failed,
            "results": results,
            "message": f"Batch processing complete. {successful}/{len(results)} items processed successfully."
        }
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_detail = traceback.format_exc()
        raise HTTPException(500, f"Failed to process batch: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8081)