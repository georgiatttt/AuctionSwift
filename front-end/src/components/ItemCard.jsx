import { Badge } from './ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import { useAuction } from '../context/AuctionContext';

export function ItemCard({ item }) {
  const { state } = useAuction();

  console.log('🎴 ItemCard rendering:', {
    title: item.title,
    hasAiDescription: !!item.ai_description,
    ai_description: item.ai_description
  });

  // Get the first image for this item
  const itemImage = state.itemImages.find(img => img.item_id === item.item_id);
  
  // Get comps for this item
  const itemComps = state.comps.filter(comp => comp.item_id === item.item_id);

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
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl">{item.title}</CardTitle>
                <CardDescription className="text-sm mt-1">
                  {item.brand} {item.year && `• ${item.year}`}
                </CardDescription>
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
