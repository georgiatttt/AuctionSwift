# AuctionSwift

A full-stack auction management application for cataloging, pricing, and managing auction items using AI-powered descriptions and comparable sales analysis.

## Tech Stack

### Frontend
- **React** with Vite
- **TailwindCSS** + shadcn/ui components
- **React Router** for navigation
- **Supabase** for authentication and storage

### Backend
- **FastAPI** (Python)
- **Supabase** PostgreSQL database
- **OpenAI GPT-4o** for item descriptions
- **OpenAI Agents SDK** for comparable sales generation
- **Batch API** for cost-effective multi-item processing

### Database
- **PostgreSQL** via Supabase
- Row Level Security (RLS) enabled
- Multi-tenant architecture with organizations
![alt text](<Screenshot 2025-11-17 at 11.43.11 PM.png>)
---

## Features

- **Auction Management**: Create and manage multiple auctions
- **Item Cataloging**: Add items with images, brand, model, year
- **AI-Powered Descriptions**: Automatically generate item descriptions using GPT-4o
- **Comparable Sales (Comps)**: AI agent finds similar sold items from eBay, Reverb, etc.
- **Batch Processing**: Process 2+ items with 50% cost savings via OpenAI Batch API
- **Image Management**: Upload up to 5 images per item to Supabase Storage
- **Multi-tenant**: Organization-based access control with RLS

---

## Project Structure

```
AuctionSwift/
├── .env                     # Environment variables (root level)
├── .env.example             # Template for environment variables
├── requirements.txt         # Python dependencies (root level)
├── venv/                    # Python virtual environment (git-ignored)
├── backend/
│   └── main.py              # FastAPI server with all endpoints
└── front-end/
    ├── src/
    │   ├── components/      # React components
    │   │   ├── ui/          # shadcn/ui components
    │   │   ├── Layout.jsx   # Main layout with sidebar
    │   │   ├── Sidebar.jsx  # Navigation sidebar
    │   │   ├── ItemCard.jsx # Item display card
    │   │   ├── ItemMultiForm.jsx  # Multi-item creation form
    │   │   └── ImageUploadZone.jsx # Image upload handler
    │   ├── context/         # Global state management
    │   │   ├── AuctionContext.jsx  # Auction state
    │   │   └── AuthContext.jsx     # Auth state
    │   ├── pages/           # Route pages
    │   │   ├── HomePage.jsx         # Landing page
    │   │   ├── LoginPage.jsx        # Login
    │   │   ├── SignUpPage.jsx       # Sign up
    │   │   ├── DashboardPage.jsx    # User dashboard
    │   │   ├── NewAuctionPage.jsx   # Create auction
    │   │   └── AuctionDetailPage.jsx # Auction details
    │   ├── lib/             # API client & utilities
    │   │   └── supabaseClient.js # Supabase config
    │   └── App.jsx          # Main app component with routing
    └── package.json         # Frontend dependencies
```

---

## Setup Instructions

### Prerequisites
- **Node.js** 18+ and npm
- **Python** 3.10+
- **Supabase** project (free tier works)
- **OpenAI** API key

### 1. Clone Repository
```bash
git clone https://github.com/georgiatttt/AuctionSwift.git
cd AuctionSwift
```

### 2. Database Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Set up your database schema through the Supabase Dashboard
3. Configure Row Level Security (RLS) policies for multi-tenant access
4. Create the required tables: `profiles`, `organizations`, `auctions`, `items`, `item_images`, `comps`

### 3. Backend Setup

```bash
# From root directory
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt
pip install openai-agents
```

**Environment Variables (.env in root)**:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_service_role_key
OPENAI_DESCRIPTION_KEY=your_openai_api_key_for_descriptions
OPENAI_COMPS_KEY=your_openai_api_key_for_comps
```

### 4. Frontend Setup

```bash
cd front-end

# Install dependencies
npm install

# Frontend uses Supabase client directly
# Update src/lib/supabaseClient.js if needed
```

The frontend connects to Supabase using the anon key configured in `src/lib/supabaseClient.js`.

### 5. Run the Application

**Start Backend** (port 8081):
```bash
cd backend
python main.py
```

**Start Frontend** (port 5173):
```bash
cd front-end
npm run dev
```

Access the app at `http://localhost:5173`

---

## API Documentation

Base URL: `http://localhost:8081`

### Profile Endpoints

#### Get All Profiles
```http
GET /api/profiles
```
Returns all user profiles with organization info.

#### Create Profile
```http
POST /api/profiles
Content-Type: application/json

{
  "email": "user@example.com",
  "org_id": "uuid",
  "role": "admin"
}
```

### Auction Endpoints

#### Get User's Auctions
```http
GET /api/auctions/{profile_id}
```

#### Create Auction
```http
POST /api/auctions
Content-Type: application/json

{
  "profile_id": "uuid",
  "auction_name": "Estate Sale 2024",
  "auction_date": "2024-12-15",
  "location": "Portland, OR"
}
```

#### Delete Auction
```http
DELETE /api/auctions/{auction_id}
```
Cascades: deletes all items, images, and comps associated with auction.

### Item Endpoints

#### Get User's Items
```http
GET /api/items/{profile_id}
```
Returns items with images array included.

#### Create Item
```http
POST /api/items
Content-Type: application/json

{
  "auction_id": "uuid",
  "title": "Fender Stratocaster",
  "brand": "Fender",
  "model": "Stratocaster",
  "year": 1965,
  "ai_description": "Vintage guitar in excellent condition",
  "imageUrl1": "https://..."
}
```
Creates item with initial placeholder image.

#### Update Item
```http
PUT /api/items/{item_id}
Content-Type: application/json

{
  "title": "Updated Title",
  "brand": "Updated Brand",
  ...
}
```

#### Delete Item
```http
DELETE /api/items/{item_id}
```
Cascades: deletes all images and comps for this item.

### Image Endpoints

#### Upload Item Image
```http
POST /api/items/{item_id}/images
Content-Type: multipart/form-data

file: <image file>
position: 1
```
Uploads to Supabase Storage, returns public URL.

#### Update Image URL
```http
PUT /api/items/{item_id}/images/{image_id}
Content-Type: application/json

{
  "url": "https://supabase.co/storage/..."
}
```

#### Get Item Images
```http
GET /api/items/{item_id}/images
```

### AI Description Endpoint

#### Generate Item Description
```http
POST /api/items/generate-description
Content-Type: multipart/form-data

image: <image file>
title: "Fender Stratocaster"
model: "Stratocaster"
year: "1965"
notes: "Vintage, excellent condition"
```
Uses **GPT-4o vision** to analyze image and generate professional description.

### Comparable Sales (Comps) Endpoints

#### Get Item Comps
```http
GET /api/comps/item/{item_id}
```

#### Generate Comps (Single Item)
```http
POST /api/comps/generate
Content-Type: application/json

{
  "item_id": "uuid",
  "brand": "Fender",
  "model": "Stratocaster", 
  "year": "1965",
  "notes": ""
}
```
Uses **OpenAI Agents SDK** to search for 3 comparable sales. Returns immediately with results.

#### Generate Comps (Batch)
```http
POST /api/comps/batch
Content-Type: application/json

{
  "items": [
    {
      "item_id": "uuid",
      "brand": "Fender",
      "model": "Stratocaster",
      "year": "1965",
      "notes": ""
    },
    ...
  ]
}
```
**Batch API for 2+ items** - 50% cheaper than individual requests. Returns all results in one response (no polling needed).

Response includes:
- `batch_id`: OpenAI batch identifier
- `status`: "completed" or "failed"
- `results`: Array of comp results per item
- `successful`: Count of successful items
- `total_items`: Total items processed

#### Delete Comp
```http
DELETE /api/comps/{comp_id}
```

### User Data Endpoint

#### Get All User Data
```http
GET /api/user/{profile_id}/all
```
Returns complete dataset for a user:
- All auctions
- All items (with images)
- All comps

Used for initial app load to hydrate state.

---

## Database Schema

### Core Tables

**auctions** - Auction events
- `auction_id` (uuid, PK)
- `profile_id` (uuid, FK → profiles)
- `auction_name`, `auction_date`, `location`

**items** - Auction items
- `item_id` (uuid, PK)
- `auction_id` (uuid, FK → auctions)
- `title`, `brand`, `model`, `year`
- `ai_description`, `status`

**item_images** - Item photos (up to 5)
- `image_id` (bigserial, PK)
- `item_id` (uuid, FK → items)
- `url`, `position`

**comps** - Comparable sales
- `comp_id` (bigserial, PK)
- `item_id` (uuid, FK → items)
- `source`, `source_url`, `sold_price`, `sold_at`

**profiles** - User profiles
- `profile_id` (uuid, PK)
- `org_id` (uuid, FK → organizations)
- `email`, `role`

**organizations** - Multi-tenant organizations
- `org_id` (uuid, PK)
- `name`

See `docs/er-diagram.png` for visual schema.

---

## Environment Variables Reference

### Root .env File
```env
# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJxxxx...  # Service role key for backend

# OpenAI
OPENAI_DESCRIPTION_KEY=sk-proj-xxxxx  # For GPT-4o descriptions
OPENAI_COMPS_KEY=sk-proj-xxxxx        # For Agents SDK comps
```

### Frontend
Configured in `front-end/src/lib/supabaseClient.js`:
- Uses `SUPABASE_URL` and `SUPABASE_ANON_KEY`
- No separate .env needed (hardcoded in client)

---

## Development Notes

- **CORS**: Backend allows all origins (`*`) for development
- **RLS**: Database uses Row Level Security - users can only access their org's data
- **Image Storage**: All images stored in Supabase Storage bucket `item-images`
- **AI Costs**: Batch API saves 50% on multi-item comp generation
- **Port Conflicts**: Backend uses 8081 (not 8000) to avoid conflicts

---

## Assignment Context

This project was built as a full-stack application demonstrating:
- RESTful API design with FastAPI
- React frontend with modern hooks and context
- PostgreSQL database design with proper foreign keys
- AI integration (OpenAI GPT-4o + Agents SDK)
- Cloud storage and authentication (Supabase)
- Multi-tenant security with RLS

---

## License

MIT
