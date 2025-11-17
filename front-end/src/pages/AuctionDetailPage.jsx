import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Download, FileSpreadsheet, FileText, Image, Trash2 } from 'lucide-react';
import { ItemMultiForm } from '../components/ItemMultiForm';
import { ItemCard } from '../components/ItemCard';
import { Separator } from '../components/ui/separator';
import { Button } from '../components/ui/button';
import { useAuction } from '../context/AuctionContext';
import { deleteAuction } from '../services/api';
import { ActionTypes } from '../context/AuctionContext';

export function AuctionDetailPage() {
  const { auction_id } = useParams();
  const navigate = useNavigate();
  const { state, dispatch } = useAuction();
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const exportMenuRef = useRef(null);

  // Reset state when auction_id changes (navigating between auctions)
  useEffect(() => {
    setShowExportMenu(false);
    setIsDeleting(false);
  }, [auction_id]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setShowExportMenu(false);
      }
    };

    if (showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportMenu]);

  const auction = state.auctions.find(a => a.auction_id === auction_id);
  const auctionItems = state.items.filter(item => item.auction_id === auction_id);

  const handleExport = (format) => {
    // Export logic will go here
  };

  const handleDeleteAuction = async () => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${auction.auction_name}"?\n\n` +
      `This will permanently delete:\n` +
      `• ${auctionItems.length} item(s)\n` +
      `• All associated images\n` +
      `• All comparable sales data\n\n` +
      `This action cannot be undone.`
    );

    if (!confirmDelete) return;

    setIsDeleting(true);
    try {
      await deleteAuction(auction_id);
      
      // Remove from local state
      dispatch({
        type: ActionTypes.DELETE_AUCTION,
        payload: { auction_id }
      });

      // Navigate back to dashboard
      navigate('/');
      
    } catch (error) {
      console.error('Failed to delete auction:', error);
      alert('Failed to delete auction. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!auction) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Auction not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">{auction.auction_name}</h1>
          <p className="text-muted-foreground">
            Created {new Date(auction.created_at).toLocaleDateString()}
            {auctionItems.length > 0 && ` • ${auctionItems.length} ${auctionItems.length === 1 ? 'item' : 'items'}`}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <div className="relative" ref={exportMenuRef}>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowExportMenu(!showExportMenu)}
            >
              <Download className="h-4 w-4" />
            </Button>

            {/* Export Dropdown Menu */}
          {showExportMenu && (
            <div className="absolute right-0 top-full mt-2 bg-card border rounded-lg shadow-lg overflow-hidden w-56 z-10">
              <button
                className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-accent transition-colors text-sm text-left"
                onClick={() => handleExport('excel')}
              >
                <FileSpreadsheet className="h-4 w-4 text-green-600" />
                <div>
                  <div className="font-medium">Export to Excel</div>
                  <div className="text-xs text-muted-foreground">Download as .xlsx</div>
                </div>
              </button>
              <button
                className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-accent transition-colors text-sm text-left"
                onClick={() => handleExport('pdf-catalog')}
              >
                <Image className="h-4 w-4 text-blue-600" />
                <div>
                  <div className="font-medium">PDF Catalog</div>
                  <div className="text-xs text-muted-foreground">Formatted with images</div>
                </div>
              </button>
            </div>
          )}
          </div>

          {/* Delete Button */}
          <Button
            variant="destructive"
            size="icon"
            onClick={handleDeleteAuction}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Add New Items Section */}
      <div>
        <h2 className="text-2xl font-semibold mb-2">Add New Items</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Add multiple items, then click "Generate" to auto-create descriptions and fetch comps
        </p>
        <ItemMultiForm auctionId={auction_id} />
      </div>

      {/* Existing Items Section */}
      {auctionItems.length > 0 && (
        <>
          <Separator className="my-8" />
          <div>
            <h2 className="text-2xl font-semibold mb-4">
              Current Items
            </h2>
            <div className="space-y-4">
              {auctionItems.map(item => (
                <ItemCard key={item.item_id} item={item} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
