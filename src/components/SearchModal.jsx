import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { useAuction } from '../context/AuctionContext';
import { useNavigate } from 'react-router-dom';

export function SearchModal({ open, onOpenChange }) {
  const [searchQuery, setSearchQuery] = useState('');
  const { state } = useAuction();
  const navigate = useNavigate();

  // Filter items based on search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) {
      return [];
    }

    const query = searchQuery.toLowerCase();
    return state.items.filter(item => 
      item.title?.toLowerCase().includes(query) ||
      item.brand?.toLowerCase().includes(query)
    );
  }, [searchQuery, state.items]);

  // Get auction name for an item
  const getAuctionName = (auctionId) => {
    const auction = state.auctions.find(a => a.auction_id === auctionId);
    return auction?.auction_name || 'Unknown Auction';
  };

  // Get first image for an item
  const getItemImage = (itemId) => {
    return state.itemImages.find(img => img.item_id === itemId);
  };

  const handleItemClick = (item) => {
    navigate(`/auction/${item.auction_id}`);
    onOpenChange(false);
    setSearchQuery('');
  };

  const handleClose = () => {
    onOpenChange(false);
    setSearchQuery('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={handleClose}>
        <DialogHeader>
          <DialogTitle>Search Auctions</DialogTitle>
        </DialogHeader>

        {/* Search Input */}
        <div className="px-6">
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
        </div>

        {/* Results */}
        <ScrollArea className="px-6 pb-6 max-h-[50vh]">
          {!searchQuery.trim() ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              Start typing to search across all items...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No items found matching "{searchQuery}"
            </div>
          ) : (
            <div className="space-y-2 mt-4">
              {filteredItems.map(item => {
                const itemImage = getItemImage(item.item_id);
                return (
                  <button
                    key={item.item_id}
                    onClick={() => handleItemClick(item)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left"
                  >
                    {/* Item Image */}
                    <div className="w-12 h-12 rounded bg-muted flex-shrink-0 overflow-hidden">
                      {itemImage ? (
                        <img
                          src={itemImage.url}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                          No img
                        </div>
                      )}
                    </div>

                    {/* Item Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{item.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.brand} {item.year && `• ${item.year}`}
                      </div>
                      <div className="text-xs text-muted-foreground truncate mt-0.5">
                        in {getAuctionName(item.auction_id)}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
