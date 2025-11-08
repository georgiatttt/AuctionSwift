import { Badge } from './ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import { useAuction } from '../context/AuctionContext';

export function ItemCard({ item }) {
  const { state } = useAuction();

  // Get the first image for this item
  const itemImage = state.itemImages.find(img => img.item_id === item.item_id);
  
  // Get comps for this item
  const itemComps = state.comps.filter(comp => comp.item_id === item.item_id);

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col md:flex-row">
        {/* Image Section */}
        <div className="w-full md:w-40 h-40 bg-muted flex items-center justify-center shrink-0 overflow-hidden">
          {itemImage ? (
            <img
              src={itemImage.url}
              alt={item.title}
              className="w-full h-full object-cover object-center"
            />
          ) : (
            <div className="text-muted-foreground text-sm">No image</div>
          )}
        </div>

        {/* Content Section */}
        <div className="flex-1">
          <CardHeader className="pb-3 pt-3">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">{item.title}</CardTitle>
                <CardDescription className="text-xs">
                  {item.brand} {item.year && `• ${item.year}`}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            {item.description && (
              <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
            )}

            {itemComps.length > 0 && (
              <>
                <Separator className="my-3" />
                <div>
                  <h4 className="text-sm font-semibold mb-2">Recent Comps</h4>
                  <div className="space-y-1.5">
                    {itemComps.map(comp => (
                      <div key={comp.id} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">{comp.source}</Badge>
                          <span className="text-muted-foreground text-xs">{comp.sold_at}</span>
                        </div>
                        <span className="font-semibold text-sm">
                          {comp.currency} ${comp.sold_price.toLocaleString()}
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
