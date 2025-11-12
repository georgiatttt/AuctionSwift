#!/bin/bash
# Custom 130Point Search Tool

cd /Users/johnmartin/Desktop/AuctionSwift/backend/scrapers/130point

echo "🔍 130Point Comps Search"
echo "======================="
echo ""

# Check if query provided
if [ -z "$1" ]; then
    echo "Usage: ./search_comps.sh \"your search term\" [--json output.json] [--csv output.csv]"
    echo ""
    echo "Examples:"
    echo "  ./search_comps.sh \"rolex daytona\""
    echo "  ./search_comps.sh \"omega speedmaster\" --json results.json"
    echo "  ./search_comps.sh \"patek philippe nautilus\" --csv results.csv"
    echo ""
    exit 1
fi

QUERY="$1"
shift

echo "Searching for: '$QUERY'"
echo ""

# Run the scraper with all arguments
python scraper_130point.py --query "$QUERY" "$@"

echo ""
echo "✅ Search complete!"
