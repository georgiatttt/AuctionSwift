import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { ActionTypes, useAuction } from '../context/AuctionContext';
import { v4 as uuidv4 } from 'uuid';

export function NewAuctionPage() {
  const [auctionName, setAuctionName] = useState('');
  const { dispatch } = useAuction();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!auctionName.trim()) {
      return;
    }

    const newAuctionId = uuidv4();
    
    dispatch({
      type: ActionTypes.CREATE_AUCTION,
      payload: {
        auction_id: newAuctionId,
        auction_name: auctionName.trim()
      }
    });

    // Navigate to the new auction detail page
    navigate(`/auction/${newAuctionId}`);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Create New Auction</h1>
        <p className="text-muted-foreground">
          Start by giving your auction a name. You can add items in the next step.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Auction Details</CardTitle>
          <CardDescription>
            Choose a descriptive name that helps you identify this auction later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="auction-name">Auction Name</Label>
              <Input
                id="auction-name"
                value={auctionName}
                onChange={(e) => setAuctionName(e.target.value)}
                placeholder="e.g., John's Estate Sale, Spring Collection"
                className="mt-2"
                autoFocus
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/')}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!auctionName.trim()}
                className="flex-1"
              >
                Create Auction
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
