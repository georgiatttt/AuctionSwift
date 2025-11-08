// Mock data for development - will be replaced with real API calls later
// 
// HOW TO USE THIS FILE:
// Import the data you need in your components:
// 
// Example:
//   import { mockAuctions, mockItems } from '../data/mockData';
//   
//   function MyComponent() {
//     const [auctions, setAuctions] = useState(mockAuctions);
//     const [items, setItems] = useState(mockItems);
//     // ... rest of component
//   }

// Sample auctions
export const mockAuctions = [
  {
    auction_id: '550e8400-e29b-41d4-a716-446655440000',
    created_at: new Date().toISOString(),
    profile_id: 'user-123',
    auction_name: 'John Auction'
  },
  {
    auction_id: '550e8400-e29b-41d4-a716-446655440001',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    profile_id: 'user-123',
    auction_name: 'Estate Sale Collection'
  },
  {
    auction_id: '550e8400-e29b-41d4-a716-446655440002',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    profile_id: 'user-123',
    auction_name: 'Anique Furniture Collection'
  },
  {
    auction_id: '550e8400-e29b-41d4-a716-446655440003',
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    profile_id: 'user-123',
    auction_name: 'Modern Art Pieces'
  }
];

// Sample items belonging to the auctions above
export const mockItems = [
  {
    item_id: 'item-001',
    auction_id: '550e8400-e29b-41d4-a716-446655440000',
    title: 'Vintage Watch',
    brand: 'Rolex',
    year: 1985,
    description: 'Beautiful vintage Rolex in excellent condition',
    created_at: new Date().toISOString()
  },
  {
    item_id: 'item-002',
    auction_id: '550e8400-e29b-41d4-a716-446655440001',
    title: 'Vintage Camera',
    brand: 'Leica',
    year: 1962,
    description: 'Classic film camera in great working order',
    created_at: new Date(Date.now() - 86400000).toISOString()
  },
  {
    item_id: 'item-003',
    auction_id: '550e8400-e29b-41d4-a716-446655440002',
    title: 'Victorian Desk',
    brand: 'Antique Furniture Co.',
    year: 1885,
    description: 'Elegant oak writing desk with brass handles',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString()
  },
  {
    item_id: 'item-004',
    auction_id: '550e8400-e29b-41d4-a716-446655440003',
    title: 'Abstract Painting #12',
    brand: 'M. Laurent',
    year: 2022,
    description: 'Modern abstract artwork on canvas',
    created_at: new Date(Date.now() - 3 * 86400000).toISOString()
  }
];

// Sample images for items
export const mockItemImages = [
  {
    image_id: 1,
    item_id: 'item-001',
    url: 'https://placehold.co/400x300/blue/white?text=Vintage+Watch',
    created_at: new Date().toISOString()
  }
];

// Sample comparable sales data
export const mockComps = [
  {
    id: 1,
    item_id: 'item-001',
    source: 'eBay',
    source_url: 'https://ebay.com/example',
    sold_price: 4500.0,
    currency: 'USD',
    sold_at: '2025-10-15',
    notes: 'Similar model, slightly different year',
    created_at: new Date().toISOString()
  }
];
