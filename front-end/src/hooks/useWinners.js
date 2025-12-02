// Custom hook for fetching auction winners
// NOTE: This hook is available but not currently used.
// AuctionDetailPage and BidTrackingPage have inline implementations
// with slightly different logic for their specific use cases.
import { useState, useEffect, useCallback } from 'react';
import { getAuctionBids } from '../services/api';

/**
 * Hook to fetch and manage winners data for a closed auction
 * @param {string} auctionId - The auction ID
 * @param {boolean} isEnabled - Whether to fetch (e.g., only when auction is closed)
 * @returns {Object} { winners, loading, error, refetch }
 */
export function useWinners(auctionId, isEnabled = true) {
  const [winners, setWinners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchWinners = useCallback(async () => {
    if (!auctionId || !isEnabled) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await getAuctionBids(auctionId);
      const winnersList = data?.items_with_bids
        ?.filter(item => (item.bids && item.bids.length > 0) || item.highest_bid)
        ?.map(item => {
          const topBid = item.bids?.[0];
          return {
            itemName: item.name || item.title,
            itemId: item.item_id,
            winnerName: topBid?.bidder_name || 'Anonymous',
            winnerEmail: topBid?.bidder_email || 'N/A',
            winningBid: topBid?.amount || item.highest_bid || 0,
            isSold: item.is_sold
          };
        }) || [];
      setWinners(winnersList);
    } catch (err) {
      console.error('Failed to fetch winners:', err);
      setError(err.message || 'Failed to fetch winners');
    } finally {
      setLoading(false);
    }
  }, [auctionId, isEnabled]);

  useEffect(() => {
    fetchWinners();
  }, [fetchWinners]);

  return { winners, loading, error, refetch: fetchWinners };
}
