import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { ImageDropzone } from './ImageDropzone';
import { ActionTypes, useAuction } from '../context/AuctionContext';
import { v4 as uuidv4 } from 'uuid';

export function ItemMultiForm({ auctionId }) {
  const { dispatch } = useAuction();
  const [items, setItems] = useState([
    {
      tempId: uuidv4(),
      brand: '',
      title: '',
      year: '',
      notes: '',
      imageUrl: null
    }
  ]);

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        tempId: uuidv4(),
        brand: '',
        title: '',
        year: '',
        notes: '',
        imageUrl: null
      }
    ]);
  };

  const handleRemoveItem = (tempId) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.tempId !== tempId));
    }
  };

  const handleItemChange = (tempId, field, value) => {
    setItems(items.map(item => 
      item.tempId === tempId 
        ? { ...item, [field]: value }
        : item
    ));
  };

  const handleImageUpload = (tempId, imageUrl) => {
    handleItemChange(tempId, 'imageUrl', imageUrl);
  };

  const handleImageRemove = (tempId) => {
    handleItemChange(tempId, 'imageUrl', null);
  };

  const handleSaveItems = () => {
    // Save all items that have at least a title or brand
    items.forEach(item => {
      if (item.title || item.brand) {
        const itemId = uuidv4();
        
        // Add item to state
        dispatch({
          type: ActionTypes.ADD_ITEM,
          payload: {
            item_id: itemId,
            auction_id: auctionId,
            title: item.title,
            brand: item.brand,
            year: item.year ? parseInt(item.year) : null,
            description: item.notes
          }
        });

        // Add image if present
        if (item.imageUrl) {
          dispatch({
            type: ActionTypes.ADD_ITEM_IMAGE,
            payload: {
              item_id: itemId,
              url: item.imageUrl
            }
          });
        }
      }
    });

    // Reset form to single empty item
    setItems([
      {
        tempId: uuidv4(),
        brand: '',
        title: '',
        year: '',
        notes: '',
        imageUrl: null
      }
    ]);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-6">
        {items.map((item, index) => (
          <Card key={item.tempId} className="relative">
            <CardContent className="pt-6">
              {/* Item Number and Delete Button */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Item {index + 1}</h3>
                {items.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveItem(item.tempId)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="space-y-4">
                {/* Image Uploader */}
                <div>
                  <Label>Image</Label>
                  <div className="mt-2">
                    <ImageDropzone
                      existingImage={item.imageUrl}
                      onImageUpload={(url) => handleImageUpload(item.tempId, url)}
                      onRemove={() => handleImageRemove(item.tempId)}
                    />
                  </div>
                </div>

                {/* Brand and Title Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`brand-${item.tempId}`}>Brand</Label>
                    <Input
                      id={`brand-${item.tempId}`}
                      value={item.brand}
                      onChange={(e) => handleItemChange(item.tempId, 'brand', e.target.value)}
                      placeholder="e.g., Rolex, Nike"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`title-${item.tempId}`}>Title</Label>
                    <Input
                      id={`title-${item.tempId}`}
                      value={item.title}
                      onChange={(e) => handleItemChange(item.tempId, 'title', e.target.value)}
                      placeholder="Item name or model"
                    />
                  </div>
                </div>

                {/* Year */}
                <div>
                  <Label htmlFor={`year-${item.tempId}`}>Year (optional)</Label>
                  <Input
                    id={`year-${item.tempId}`}
                    type="number"
                    value={item.year}
                    onChange={(e) => handleItemChange(item.tempId, 'year', e.target.value)}
                    placeholder="e.g., 2020"
                  />
                </div>

                {/* Notes */}
                <div>
                  <Label htmlFor={`notes-${item.tempId}`}>Notes (optional)</Label>
                  <Textarea
                    id={`notes-${item.tempId}`}
                    value={item.notes}
                    onChange={(e) => handleItemChange(item.tempId, 'notes', e.target.value)}
                    placeholder="Additional details about the item..."
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button
          type="button"
          variant="outline"
          onClick={handleAddItem}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Another Item
        </Button>
        <Button
          type="button"
          onClick={handleSaveItems}
          className="w-full"
          size="lg"
        >
          Generate Descriptions & Find Comps
        </Button>
      </div>
    </div>
  );
}
