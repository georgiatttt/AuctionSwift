// Custom hook for fetching all bids for an auction
import { useState, useEffect, useCallback } from 'react';
import { getAuctionBids } from '../services/api';

/**
 * Hook to fetch and manage all bids for an auction with auto-refresh
 * @param {string} auctionId - The auction ID
 * @param {Object} options - Configuration options
 * @param {boolean} options.autoRefresh - Whether to auto-refresh (default: true)
 * @param {number} options.refreshInterval - Refresh interval in ms (default: 5000)
 * @param {boolean} options.enabled - Whether fetching is enabled (default: true)
 * @returns {Object} { allBids, loading, error, refetch }
 */
export function useAuctionBids(auctionId, options = {}) {
  const {
    autoRefresh = true,
    refreshInterval = 5000,
    enabled = true
  } = options;

  const [allBids, setAllBids] = useState({}); // { itemId: [bids] }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAllBids = useCallback(async () => {
    if (!auctionId || !enabled) return;
    
    try {
      const data = await getAuctionBids(auctionId);
      // Transform items_with_bids into a map of itemId -> bids
      const bidsMap = {};
      if (data?.items_with_bids) {
        data.items_with_bids.forEach(item => {
          bidsMap[item.item_id] = item.bids || [];
        });
      }
      setAllBids(bidsMap);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch bids:', err);
      setError(err.message || 'Failed to fetch bids');
    } finally {
      setLoading(false);
    }
  }, [auctionId, enabled]);

  // Initial fetch and auto-refresh
  useEffect(() => {
    fetchAllBids();
    
    if (autoRefresh && enabled) {
      const interval = setInterval(fetchAllBids, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchAllBids, autoRefresh, refreshInterval, enabled]);

  /**
   * Get bids for a specific item
   * @param {string} itemId - The item ID
   * @returns {Array} Array of bids for the item
   */
  const getBidsForItem = useCallback((itemId) => {
    return allBids[itemId] || [];
  }, [allBids]);

  return { allBids, loading, error, refetch: fetchAllBids, getBidsForItem };
}
