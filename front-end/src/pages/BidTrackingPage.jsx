// Bid Tracking Page - for auction creators to monitor all bids on their items
import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  Package,
  DollarSign,
  Users,
  Clock,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  RefreshCw,
  Trophy,
  CheckCircle,
  Loader2,
  Award,
  Mail,
  Copy,
  CheckCheck
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { getAuctionBids } from '../services/api';
import { formatCurrency, formatDate, copyToClipboard } from '../lib/utils';

function BidTrackingPage() {
  const { auctionId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedItems, setExpandedItems] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const result = await getAuctionBids(auctionId);
      setData(result);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load bid data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [auctionId]);

  useEffect(() => {
    fetchData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const toggleItem = (itemId) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const handleCopyEmail = async (email) => {
    const success = await copyToClipboard(email);
    if (success) {
      setCopiedEmail(email);
      setTimeout(() => setCopiedEmail(null), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Calculate summary stats
  const totalItems = data?.items_with_bids?.length || 0;
  const itemsWithBids = data?.items_with_bids?.filter(i => i.bid_count > 0).length || 0;
  const soldItems = data?.items_with_bids?.filter(i => i.is_sold).length || 0;
  const totalBids = data?.items_with_bids?.reduce((sum, i) => sum + i.bid_count, 0) || 0;
  const totalHighestBids = data?.items_with_bids?.reduce((sum, i) => sum + (i.highest_bid || 0), 0) || 0;
  
  // Check if auction is closed
  const isAuctionClosed = data?.auction?.status === 'closed';
  
  // Get winners - items with bids (check both bids array and highest_bid)
  // When closed, show ALL listed items so seller can see full results
  const winners = data?.items_with_bids
    ?.filter(item => {
      // If auction is closed, show all listed items
      if (isAuctionClosed) return item.is_listed !== false;
      // Otherwise only show items with bids
      return (item.bids && item.bids.length > 0) || item.highest_bid;
    })
    ?.map(item => {
      const topBid = item.bids?.[0];
      const hasBids = (item.bids && item.bids.length > 0) || item.highest_bid;
      return {
        itemName: item.name || item.title,
        itemId: item.item_id,
        winnerName: hasBids ? (topBid?.bidder_name || 'Anonymous') : 'No bids',
        winnerEmail: hasBids ? (topBid?.bidder_email || 'N/A') : '-',
        winningBid: topBid?.amount || item.highest_bid || 0,
        isSold: item.is_sold,
        isListed: item.is_listed,
        hasBids: hasBids
      };
    }) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <TrendingUp className="w-7 h-7" />
            Bid Tracking
            {isAuctionClosed && (
              <Badge className="ml-2 bg-red-100 text-red-700 border-red-300 text-sm">
                Closed
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground">
            {data?.auction?.auction_name}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 text-destructive bg-destructive/10 p-4 rounded-lg border border-destructive/20">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-muted-foreground text-sm flex items-center gap-2">
              <Package className="w-4 h-4" />
              Total Items
            </div>
            <div className="text-2xl font-bold mt-1">{totalItems}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-muted-foreground text-sm flex items-center gap-2">
              <Users className="w-4 h-4" />
              Items with Bids
            </div>
            <div className="text-2xl font-bold text-blue-600 mt-1">{itemsWithBids}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-muted-foreground text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Sold Items
            </div>
            <div className="text-2xl font-bold text-green-600 mt-1">{soldItems}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-muted-foreground text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Total Bids
            </div>
            <div className="text-2xl font-bold text-purple-600 mt-1">{totalBids}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-muted-foreground text-sm flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Highest Bids Total
            </div>
            <div className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(totalHighestBids)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Winners Summary - Always shows */}
      <Card className={isAuctionClosed ? "border-2 border-yellow-400 bg-yellow-50/50" : "border-2 border-blue-200"}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Award className={`w-5 h-5 ${isAuctionClosed ? 'text-yellow-600' : 'text-blue-600'}`} />
            {isAuctionClosed ? 'Auction Winners' : 'Current High Bidders'}
            {isAuctionClosed && (
              <Badge className="ml-2 bg-yellow-100 text-yellow-800 border-yellow-300">
                  Auction Closed
                </Badge>
              )}
            </CardTitle>
            {isAuctionClosed && (
              <p className="text-sm text-muted-foreground">
                Contact winners to arrange payment and delivery
              </p>
            )}
          </CardHeader>
          <CardContent>
            {winners.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No bids were placed on any items</p>
            ) : (
              <div className="space-y-1">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 text-xs font-medium text-muted-foreground uppercase px-3 py-2 bg-muted/50 rounded-lg">
                  <div className="col-span-4">Item</div>
                  <div className="col-span-3">Winner</div>
                  <div className="col-span-3">Email</div>
                  <div className="col-span-2 text-right">Amount</div>
                </div>
                
                {/* Winners List */}
                {winners.map((winner, index) => (
                  <div
                    key={winner.itemId}
                    className={`grid grid-cols-12 gap-4 px-3 py-3 rounded-lg items-center ${
                      !winner.hasBids ? 'bg-gray-50 opacity-60' : 
                      winner.isSold ? 'bg-green-50' : 
                      index % 2 === 0 ? 'bg-muted/20' : ''
                    }`}
                  >
                    <div className="col-span-4 flex items-center gap-2">
                      {winner.hasBids ? (
                        <Trophy className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                      ) : (
                        <Package className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      )}
                      <span className="font-medium truncate">{winner.itemName}</span>
                      {winner.isSold && (
                        <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-300">
                          Paid
                        </Badge>
                      )}
                      {!winner.hasBids && (
                        <Badge variant="outline" className="text-xs bg-gray-100 text-gray-500 border-gray-300">
                          No bids
                        </Badge>
                      )}
                    </div>
                    <div className="col-span-3">
                      <span className={`text-sm ${!winner.hasBids ? 'text-gray-400' : ''}`}>
                        {winner.winnerName}
                      </span>
                    </div>
                    <div className="col-span-3 flex items-center gap-1">
                      {winner.hasBids && winner.winnerEmail !== '-' ? (
                        <>
                          <a 
                            href={`mailto:${winner.winnerEmail}`}
                            className="text-sm text-blue-600 hover:text-blue-800 hover:underline truncate"
                          >
                            {winner.winnerEmail}
                          </a>
                          <button
                            onClick={() => handleCopyEmail(winner.winnerEmail)}
                            className="p-1 hover:bg-muted rounded"
                            title="Copy email"
                          >
                            {copiedEmail === winner.winnerEmail ? (
                              <CheckCheck className="w-3.5 h-3.5 text-green-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                            )}
                          </button>
                        </>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </div>
                    <div className="col-span-2 text-right">
                      {winner.hasBids ? (
                        <span className="font-bold text-green-600">{formatCurrency(winner.winningBid)}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>
                  </div>
                ))}
                
                {/* Total */}
                <div className="grid grid-cols-12 gap-4 px-3 py-3 mt-2 border-t-2 border-dashed">
                  <div className="col-span-10 text-right font-semibold">Total Revenue:</div>
                  <div className="col-span-2 text-right font-bold text-lg text-green-600">
                    {formatCurrency(winners.reduce((sum, w) => sum + (w.winningBid || 0), 0))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

      {/* Items List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Items</h2>
        
        {data?.items_with_bids?.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No items in this auction yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {data?.items_with_bids?.map((item) => (
              <Card key={item.item_id}>
                {/* Item Header - Clickable */}
                <button
                  onClick={() => toggleItem(item.item_id)}
                  className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors rounded-t-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{item.name}</span>
                        {item.is_sold && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800 border border-green-200 rounded-full">
                            SOLD
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-4 mt-1">
                        <span>Starting: {formatCurrency(item.starting_bid)}</span>
                        <span>Min Increment: {formatCurrency(item.min_increment)}</span>
                        {item.buy_now_price && <span>Buy Now: {formatCurrency(item.buy_now_price)}</span>}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">{item.bid_count} bid{item.bid_count !== 1 ? 's' : ''}</div>
                      {item.highest_bid && (
                        <div className="text-lg font-bold text-green-600">
                          {formatCurrency(item.highest_bid)}
                        </div>
                      )}
                    </div>
                    {expandedItems[item.item_id] ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {/* Expanded Bids */}
                <AnimatePresence>
                  {expandedItems[item.item_id] && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t"
                    >
                      <CardContent className="pt-4">
                        {item.bids.length === 0 ? (
                          <p className="text-muted-foreground text-sm text-center py-4">
                            No bids yet
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {/* Table Header */}
                            <div className="grid grid-cols-4 gap-4 text-xs font-medium text-muted-foreground uppercase px-3">
                              <div>Rank</div>
                              <div>Bidder</div>
                              <div className="text-right">Amount</div>
                              <div className="text-right">Time</div>
                            </div>
                            
                            {/* Bids */}
                            {item.bids.map((bid, index) => (
                              <div
                                key={bid.bid_id}
                                className={`grid grid-cols-4 gap-4 px-3 py-2 rounded-lg ${
                                  index === 0
                                    ? 'bg-green-50 border border-green-200'
                                    : 'bg-muted/30'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  {index === 0 && (
                                    <Trophy className="w-4 h-4 text-yellow-500" />
                                  )}
                                  <span className={index === 0 ? 'text-yellow-600 font-medium' : 'text-muted-foreground'}>
                                    #{index + 1}
                                  </span>
                                </div>
                                <div>
                                  <div className="text-sm">{bid.bidder_name || 'Anonymous'}</div>
                                  <div className="text-muted-foreground text-xs">{bid.bidder_email}</div>
                                </div>
                                <div className={`text-right font-semibold ${index === 0 ? 'text-green-600' : ''}`}>
                                  {formatCurrency(bid.amount)}
                                </div>
                                <div className="text-right text-muted-foreground text-sm flex items-center justify-end gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatDate(bid.created_at)}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export { BidTrackingPage };
export default BidTrackingPage;
