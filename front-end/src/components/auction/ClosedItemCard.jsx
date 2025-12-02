import { memo } from 'react';
import { ImageIcon } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';

// Closed Auction Item Card - memoized for performance
const ClosedItemCard = memo(function ClosedItemCard({ item, itemBids = [] }) {
  const highestBid = itemBids.length > 0 ? itemBids[0] : null;
  const finalPrice = highestBid ? highestBid.amount : 0;
  const hasWinner = highestBid !== null;

  const primaryImage = item.images && item.images.length > 0 
    ? item.images.find(img => img.is_primary)?.url || item.images[0].url 
    : null;

  return (
    <Card className={`overflow-hidden ${hasWinner ? 'ring-2 ring-green-500 bg-green-50' : 'opacity-60'}`}>
      {/* Image */}
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        {primaryImage ? (
          <img 
            src={primaryImage} 
            alt={item.title} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-12 h-12 text-muted-foreground/30" />
          </div>
        )}
        
        {/* Winner Badge */}
        {hasWinner && (
          <Badge className="absolute top-2 left-2 bg-green-500 text-white border-0 text-xs">
            SOLD
          </Badge>
        )}
        {!hasWinner && (
          <Badge className="absolute top-2 left-2 bg-gray-500 text-white border-0 text-xs">
            No Bids
          </Badge>
        )}
      </div>

      {/* Content */}
      <CardContent className="p-3">
        <h3 className="font-semibold text-foreground line-clamp-1 text-sm">{item.title}</h3>
        
        {hasWinner ? (
          <div className="mt-2 space-y-1">
            <div className="text-lg font-bold text-green-600">${finalPrice.toFixed(2)}</div>
            <div className="text-xs text-muted-foreground">
              Won by: <span className="font-medium text-foreground">{highestBid.bidder_name || 'Anonymous'}</span>
            </div>
          </div>
        ) : (
          <div className="mt-2">
            <div className="text-sm text-muted-foreground">No bids placed</div>
            <div className="text-xs text-muted-foreground">Starting: ${(item.starting_bid || 0).toFixed(2)}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

export default ClosedItemCard;
