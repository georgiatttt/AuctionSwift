import { useState } from 'react';
import { Plus, Trash2, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { ImageDropzone } from './ImageDropzone';
import { ActionTypes, useAuction } from '../context/AuctionContext';
import { createItem, getItemComps, generateItemDescription, updateItemImage } from '../services/api';
import { uploadItemImage } from '../services/storage';

export function ItemMultiForm({ auctionId }) {
  const { dispatch } = useAuction();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [items, setItems] = useState([
    {
      tempId: crypto.randomUUID(),
      brand: '',
      model: '',
      year: '',
      notes: '', // Manual condition notes (scratches, dents, etc.)
      aiDescription: '', // AI-generated 3-sentence description
      imageFile: null
    }
  ]);

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        tempId: crypto.randomUUID(),
        brand: '',
        model: '',
        year: '',
        notes: '',
        aiDescription: '',
        imageFile: null
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

  const handleImageUpload = (tempId, imageFile) => {
    handleItemChange(tempId, 'imageFile', imageFile);
  };

  const handleImageRemove = (tempId) => {
    handleItemChange(tempId, 'imageFile', null);
  };

  const handleSaveItems = async () => {
    setLoading(true);
    setError('');

    try {
      // Filter items that have at least brand and model
      const validItems = items.filter(item => item.brand && item.model);
      
      if (validItems.length === 0) {
        setError('Please fill in at least one item with brand and model');
        setLoading(false);
        return;
      }

      const createdItems = [];

      // Create each item via API
      for (const item of validItems) {
        // Construct title as "Brand Model Year"
        const titleParts = [item.brand, item.model];
        if (item.year) {
          titleParts.push(item.year);
        }
        const title = titleParts.join(' ');

        // Generate AI description if image is provided
        let aiDescription = item.aiDescription || '';
        
        if (item.imageFile && !aiDescription) {
          try {
            console.log(`🤖 Generating AI description for: ${title}`);
            const response = await generateItemDescription(
              item.imageFile,
              title,
              item.model,
              item.year,
              item.notes
            );
            aiDescription = response.description;
            console.log(`✅ AI Description generated: ${aiDescription}`);
            
            // Update the item state with the generated description so it shows in UI
            handleItemChange(item.tempId, 'aiDescription', aiDescription);
          } catch (aiError) {
            console.error(`Failed to generate AI description:`, aiError);
            // Continue without AI description
          }
        }

        // First, create the item in the backend to get an item_id
        const createdItem = await createItem({
          auctionId,
          title: title,
          imageUrl1: 'https://via.placeholder.com/400x300?text=Uploading...', // Temporary placeholder
          brand: item.brand,
          model: item.model,
          year: item.year ? parseInt(item.year) : null,
          aiDescription: aiDescription // Pass the AI-generated description
        });

        const itemId = createdItem.item.item_id;
        
        // Now upload the image to Supabase Storage if there's a file
        let finalImageUrl = 'https://via.placeholder.com/400x300?text=No+Image';
        
        if (item.imageFile) {
          try {
            console.log(`Uploading image for item ${itemId}...`);
            const uploadResult = await uploadItemImage(item.imageFile, itemId);
            finalImageUrl = uploadResult.url;
            console.log(`✅ Image uploaded: ${finalImageUrl}`);
            
            // Update the item's image URL in the backend
            const imageId = createdItem.images[0].image_id; // Get the first image ID
            await updateItemImage(itemId, imageId, finalImageUrl);
            console.log(`✅ Image URL updated in database`);
            
          } catch (uploadError) {
            console.error(`Failed to upload image for item ${itemId}:`, uploadError);
            // Continue with placeholder if upload fails
          }
        }

        createdItems.push({ ...createdItem, finalImageUrl });

        // Update local state with the created item
        dispatch({
          type: ActionTypes.ADD_ITEM,
          payload: {
            item_id: itemId,
            auction_id: auctionId,
            title: createdItem.item.title,
            brand: createdItem.item.brand,
            model: createdItem.item.model,
            year: createdItem.item.year,
            status: createdItem.item.status,
            ai_description: aiDescription, // Include AI description
            created_at: createdItem.item.created_at
          }
        });

        // Add images to state (use the final uploaded URL)
        dispatch({
          type: ActionTypes.ADD_ITEM_IMAGE,
          payload: {
            item_id: itemId,
            url: finalImageUrl,
            position: 1
          }
        });
      }

      // Now fetch comps for all created items
      console.log(`Fetching comps for ${createdItems.length} items...`);
      
      let totalCompsAdded = 0;
      
      for (const createdItem of createdItems) {
        try {
          console.log(`Fetching comps for item ${createdItem.item.item_id}...`);
          const compsResponse = await getItemComps(createdItem.item.item_id, 3);
          
          console.log(`✅ Found ${compsResponse.total_comps_found} comps for item ${createdItem.item.item_id}`);
          console.log(`   Search query: "${compsResponse.search_query}"`);
          console.log(`   Comps saved to database: ${compsResponse.comps_saved_to_db}`);
          console.log(`   Comps in response:`, compsResponse.comps);
          
          // Add comps to state
          if (compsResponse.comps && compsResponse.comps.length > 0) {
            compsResponse.comps.forEach(comp => {
              const sold_price = comp.sale_price || comp.best_offer_price || comp.current_price;
              
              console.log(`   Adding comp: ${comp.source} - $${sold_price}`);
              
              dispatch({
                type: ActionTypes.ADD_COMP,
                payload: {
                  item_id: createdItem.item.item_id,
                  source: comp.source,
                  source_url: comp.link,
                  sold_price: sold_price,
                  currency: comp.currency,
                  sold_at: comp.date_text,
                  notes: comp.title
                }
              });
              
              totalCompsAdded++;
            });
          } else {
            console.warn(`No comps found in response for item ${createdItem.item.item_id}`);
          }
        } catch (compError) {
          console.error(`❌ Failed to fetch comps for item ${createdItem.item.item_id}:`, compError);
        }
      }
      
      console.log(`✅ Total comps added to state: ${totalCompsAdded}`);

      console.log(`✅ Total comps added to state: ${totalCompsAdded}`);

      // Reset form to single empty item
      setItems([
        {
          tempId: crypto.randomUUID(),
          brand: '',
          model: '',
          year: '',
          notes: '',
          aiDescription: '',
          imageFile: null
        }
      ]);

      setLoading(false);
      alert(`✅ Successfully created ${createdItems.length} item(s) and found ${totalCompsAdded} comps!`);
    } catch (err) {
      console.error('Error creating items:', err);
      setError(err.message || 'Failed to create items');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
          {error}
        </div>
      )}
      
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
                      existingImage={item.imageFile ? URL.createObjectURL(item.imageFile) : null}
                      onImageUpload={(file) => handleImageUpload(item.tempId, file)}
                      onRemove={() => handleImageRemove(item.tempId)}
                      itemId={item.tempId}
                    />
                  </div>
                </div>

                {/* Brand and Model Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`brand-${item.tempId}`}>Brand *</Label>
                    <Input
                      id={`brand-${item.tempId}`}
                      value={item.brand}
                      onChange={(e) => handleItemChange(item.tempId, 'brand', e.target.value)}
                      placeholder="e.g., Rolex, Omega"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor={`model-${item.tempId}`}>Model *</Label>
                    <Input
                      id={`model-${item.tempId}`}
                      value={item.model}
                      onChange={(e) => handleItemChange(item.tempId, 'model', e.target.value)}
                      placeholder="e.g., Submariner, Speedmaster"
                      required
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

                {/* Condition Notes - User enters specific condition details */}
                <div>
                  <Label htmlFor={`notes-${item.tempId}`}>Condition Notes</Label>
                  <Textarea
                    id={`notes-${item.tempId}`}
                    value={item.notes}
                    onChange={(e) => handleItemChange(item.tempId, 'notes', e.target.value)}
                    placeholder="Describe specific condition details: scratches, dents, wear, etc."
                    rows={3}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Optional: Enter specific condition details that the AI will include in the description.
                  </p>
                </div>

                {/* AI-Generated Description Preview */}
                {item.aiDescription && (
                  <div>
                    <Label>AI Description Preview</Label>
                    <div className="mt-2 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-gray-800 leading-relaxed">{item.aiDescription}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      This will be generated automatically when you save.
                    </p>
                  </div>
                )}
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
          disabled={loading}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Another Item
        </Button>
        <Button
          type="button"
          onClick={handleSaveItems}
          className="w-full"
          size="lg"
          disabled={loading}
        >
          {loading ? 'Saving & Fetching Comps...' : 'Save Items & Find Comps'}
        </Button>
      </div>
    </div>
  );
}
