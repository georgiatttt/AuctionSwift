#!/bin/bash
# Interactive 130Point Scraper Tester

cd /Users/johnmartin/Desktop/AuctionSwift/backend/scrapers/130point

echo "🔍 130Point Scraper - Interactive Tester"
echo "========================================"
echo ""

# Function to run a search
search_comps() {
    local query="$1"
    echo "Searching for: '$query'"
    echo "---"
    echo ""
    
    # Show first 10 results
    python scraper_130point.py --query "$query" | head -25
    echo ""
    
    # Get count
    local count=$(python scraper_130point.py --query "$query" --stdout-json 2>/dev/null | python -c "import sys, json; print(len(json.load(sys.stdin)))" 2>/dev/null)
    echo "📊 Total results found: ${count:-0}"
    echo ""
}

# Test with different queries
echo "Test 1: Rolex Submariner"
echo "========================"
search_comps "rolex submariner"

echo ""
echo "Test 2: Omega Speedmaster"
echo "========================="
search_comps "omega speedmaster"

echo ""
echo "Test 3: Patek Philippe"
echo "======================"
search_comps "patek philippe"

echo ""
echo "✅ Testing complete!"
echo ""
echo "💡 To search manually, use:"
echo "   python scraper_130point.py --query \"your search term\""
echo ""
echo "   Save to JSON:"
echo "   python scraper_130point.py --query \"rolex\" --json output.json"
echo ""
echo "   Save to CSV:"
echo "   python scraper_130point.py --query \"rolex\" --csv output.csv"
