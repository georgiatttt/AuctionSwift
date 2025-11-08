import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Input } from '../components/ui/input';
import { ItemCard } from '../components/ItemCard';
import { useAuction } from '../context/AuctionContext';

export function SearchAuctionsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { state } = useAuction();

  // Filter items based on search query (brand and title)
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) {
      return state.items;
    }

    const query = searchQuery.toLowerCase();
    return state.items.filter(item => 
      item.title?.toLowerCase().includes(query) ||
      item.brand?.toLowerCase().includes(query)
    );
  }, [searchQuery, state.items]);

  // Get auction names for context
  const getAuctionName = (auctionId) => {
    const auction = state.auctions.find(a => a.auction_id === auctionId);
    return auction?.auction_name || 'Unknown Auction';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Search Auctions</h1>
        <p className="text-muted-foreground">
          Search across all items by brand or title
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by brand or title..."
          className="pl-10"
          autoFocus
        />
      </div>

      {/* Results */}
      <div>
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {searchQuery ? 'No items found matching your search' : 'No items yet'}
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'} found
              </p>
            </div>
            <div className="space-y-4">
              {filteredItems.map(item => (
                <div key={item.item_id}>
                  <div className="text-xs text-muted-foreground mb-2">
                    From: {getAuctionName(item.auction_id)}
                  </div>
                  <ItemCard item={item} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
