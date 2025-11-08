import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Download, FileSpreadsheet, FileText, Image } from 'lucide-react';
import { ItemMultiForm } from '../components/ItemMultiForm';
import { ItemCard } from '../components/ItemCard';
import { Separator } from '../components/ui/separator';
import { Button } from '../components/ui/button';
import { useAuction } from '../context/AuctionContext';

export function AuctionDetailPage() {
  const { auction_id } = useParams();
  const { state } = useAuction();
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef(null);

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
    console.log(`Exporting as ${format}`);
    setShowExportMenu(false);
    // Export logic will go here
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

        {/* Export Button */}
        <div className="relative" ref={exportMenuRef}>
          <Button
            variant="outline"
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export
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
