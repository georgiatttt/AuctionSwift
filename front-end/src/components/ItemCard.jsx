import { Badge } from './ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import { Button } from './ui/button';
import * as XLSX from 'xlsx';
import { Trash2 } from 'lucide-react';
import { useAuction } from '../context/AuctionContext';
import { ActionTypes } from '../context/AuctionContext';
import { deleteItem } from '../services/api';

export function ItemCard({ item }) {
  const { state, dispatch } = useAuction();

  const handleDelete = async () => {
    try {
      await deleteItem(item.item_id);
      dispatch({
        type: ActionTypes.DELETE_ITEM,
        payload: { item_id: item.item_id }
      });
    } catch (error) {
      console.error('Failed to delete item:', error);
      alert('Failed to delete item. Please try again.');
    }
  };

  // Get the first image for this item
  const itemImage = state.itemImages.find(img => img.item_id === item.item_id);
  
  // Get comps for this item
  const itemComps = state.comps.filter(comp => comp.item_id === item.item_id);

  const handleExport = () => {
    try {
      // Build rows for the Excel sheet
      const rows = [];

      // Basic item info
      rows.push(
        { Section: 'Item', Field: 'Title', Value: item.title },
        { Section: 'Item', Field: 'AI Description', Value: item.ai_description || 'N/A' },
        { Section: 'Item', Field: 'Item ID', Value: item.item_id },
        { Section: 'Item', Field: 'Auction ID', Value: item.auction_id || '' }
      );

      // Add comps (if any)
      if (itemComps.length > 0) {
        itemComps.forEach((comp, index) => {
          rows.push({
            Section: 'Comp',
            Field: `Comp #${index + 1}`,
            Value: `${comp.source} — ${comp.currency} ${comp.sold_price.toFixed(2)} on ${comp.sold_at}`
          });
        });
      } else {
        rows.push({
          Section: 'Comp',
          Field: 'Comps',
          Value: 'No comparable sales found'
        });
      }

      // Create worksheet + workbook
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Item');

      // Safe filename from title
      const safeTitle = (item.title || 'item')
        .replace(/[\\/:*?"<>|]/g, '_')   // remove illegal filename chars
        .slice(0, 50);                   // keep it a reasonable length

      const filename = `${safeTitle || 'item'}-details.xlsx`;

      // Trigger download in the browser
      XLSX.writeFile(workbook, filename);
    } catch (error) {
      console.error('Failed to export item to Excel:', error);
      alert('Failed to export item to Excel. Please try again.');
    }
  };




  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col md:flex-row h-full">
        {/* Image Section */}
        <div className="w-full md:w-64 md:min-h-full bg-muted flex items-center justify-center shrink-0 p-4">
          {itemImage ? (
            <div className="w-full h-full flex items-center justify-center">
              <img
                src={itemImage.url}
                alt={item.title}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          ) : (
            <div className="text-muted-foreground text-sm">No image</div>
          )}
        </div>

        {/* Content Section */}
        <div className="flex-1">
          <CardHeader className="pb-3 pt-4">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-xl">
                {item.title}
              </CardTitle>

              {/* Button Row */}
              <div className="flex gap-2">

                {/* Delete Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDelete}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  title="Delete item"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>

                {/* Export Button */}
                <Button onClick={handleExport}>
                  Export to Excel
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            {item.ai_description && (
              <div className="mb-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-2">
                  <span className="text-blue-600 font-semibold text-xs uppercase tracking-wide">AI Description</span>
                </div>
                <p className="text-sm text-gray-800 mt-1 leading-relaxed">{item.ai_description}</p>
              </div>
            )}

            {itemComps.length > 0 && (
              <>
                <Separator className="my-3" />
                <div>
                  <h4 className="text-sm font-semibold mb-2">Recent Comps (Top 3)</h4>
                  <div className="space-y-1.5">
                    {itemComps.slice(0, 3).map((comp, index) => (
                      <div key={comp.id || index} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <a 
                            href={comp.source_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="hover:opacity-80 transition-opacity"
                          >
                            <Badge variant="secondary" className="text-xs cursor-pointer">
                              {comp.source}
                            </Badge>
                          </a>
                          <span className="text-muted-foreground text-xs">{comp.sold_at}</span>
                        </div>
                        <span className="font-semibold text-sm">
                          {comp.currency} ${comp.sold_price.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {itemComps.length === 0 && (
              <>
                <Separator className="my-3" />
                <div className="text-sm text-muted-foreground italic">
                  No comparable sales found yet
                </div>
              </>
            )}
          </CardContent>
        </div>
      </div>
    </Card>
  );
}
