// API service for backend communication
const API_BASE_URL = import.meta.env.VITE_API_URL;

// Helper function to handle API responses
const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
    throw new Error(error.detail || `HTTP error ${response.status}`);
  }
  return response.json();
};

// ============================================
// AUCTION API
// ============================================

export const createAuction = async (profileId, auctionName) => {
  const response = await fetch(`${API_BASE_URL}/auctions?profile_id=${profileId}&auction_name=${encodeURIComponent(auctionName)}`, {
    method: 'POST',
  });
  return handleResponse(response);
};

export const getAuction = async (auctionId) => {
  const response = await fetch(`${API_BASE_URL}/auctions/${auctionId}`);
  return handleResponse(response);
};

export const listAuctionsByUser = async (profileId) => {
  const response = await fetch(`${API_BASE_URL}/auctions?profile_id=${profileId}`);
  return handleResponse(response);
};

export const updateAuction = async (auctionId, auctionName) => {
  const response = await fetch(`${API_BASE_URL}/auctions/${auctionId}?auction_name=${encodeURIComponent(auctionName)}`, {
    method: 'PUT',
  });
  return handleResponse(response);
};

export const deleteAuction = async (auctionId) => {
  const response = await fetch(`${API_BASE_URL}/auctions/${auctionId}`, {
    method: 'DELETE',
  });
  return handleResponse(response);
};

// ============================================
// ITEM API
// ============================================

export const createItem = async ({
  auctionId,
  title,
  imageUrl1,
  imageUrl2 = '',
  imageUrl3 = '',
  imageUrl4 = '',
  imageUrl5 = '',
  brand = '',
  model = '',
  year = null,
  aiDescription = ''
}) => {
  const params = new URLSearchParams({
    auction_id: auctionId,
    title,
    image_url_1: imageUrl1,
  });

  if (imageUrl2) params.append('image_url_2', imageUrl2);
  if (imageUrl3) params.append('image_url_3', imageUrl3);
  if (imageUrl4) params.append('image_url_4', imageUrl4);
  if (imageUrl5) params.append('image_url_5', imageUrl5);
  if (brand) params.append('brand', brand);
  if (model) params.append('model', model);
  if (year) params.append('year', year);
  if (aiDescription) params.append('ai_description', aiDescription);

  const response = await fetch(`${API_BASE_URL}/items?${params.toString()}`, {
    method: 'POST',
  });
  return handleResponse(response);
};

export const listItems = async (auctionId = null, profileId = null) => {
  const params = new URLSearchParams();
  if (auctionId) params.append('auction_id', auctionId);
  if (profileId) params.append('profile_id', profileId);

  const response = await fetch(`${API_BASE_URL}/items?${params.toString()}`);
  return handleResponse(response);
};

export const getItem = async (itemId) => {
  const response = await fetch(`${API_BASE_URL}/items/${itemId}`);
  return handleResponse(response);
};

export const updateItem = async (itemId, updates) => {
  const params = new URLSearchParams();
  if (updates.title !== undefined) params.append('title', updates.title);
  if (updates.brand !== undefined) params.append('brand', updates.brand);
  if (updates.model !== undefined) params.append('model', updates.model);
  if (updates.year !== undefined) params.append('year', updates.year);
  if (updates.status !== undefined) params.append('status', updates.status);

  const response = await fetch(`${API_BASE_URL}/items/${itemId}?${params.toString()}`, {
    method: 'PUT',
  });
  return handleResponse(response);
};

export const deleteItem = async (itemId) => {
  const response = await fetch(`${API_BASE_URL}/items/${itemId}`, {
    method: 'DELETE',
  });
  return handleResponse(response);
};

export const updateItemImage = async (itemId, imageId, url) => {
  const response = await fetch(`${API_BASE_URL}/items/${itemId}/images/${imageId}?url=${encodeURIComponent(url)}`, {
    method: 'PUT',
  });
  return handleResponse(response);
};

// ============================================
// COMPS API
// ============================================

// Generate comps using AI agent
export const generateComps = async (itemId, brand = null, model = null, year = null, notes = null) => {
  const response = await fetch(`${API_BASE_URL}/comps`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      item_id: itemId,
      brand,
      model,
      year,
      notes
    }),
  });
  return handleResponse(response);
};

// Get saved comps for an item
export const getSavedComps = async (itemId) => {
  const response = await fetch(`${API_BASE_URL}/comps/${itemId}`);
  return handleResponse(response);
};

// Legacy 130point scraper endpoint (deprecated, use generateComps instead)
export const getItemComps = async (itemId, limit = 10) => {
  const response = await fetch(`${API_BASE_URL}/items/${itemId}/comps?limit=${limit}`);
  return handleResponse(response);
};

// ============================================
// VISION / AI DESCRIPTION API
// ============================================

export const generateItemDescription = async (imageFile, title, model = '', year = '', notes = '') => {
  const formData = new FormData();
  formData.append('image', imageFile);
  formData.append('title', title);
  if (model) formData.append('model', model);
  if (year) formData.append('year', year);
  if (notes) formData.append('notes', notes);

  const response = await fetch(`${API_BASE_URL}/items/generate-description`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse(response);
};

// ============================================
// USER/PROFILE API
// ============================================

export const createUser = async (email, role = 'staff') => {
  const response = await fetch(`${API_BASE_URL}/users?email=${encodeURIComponent(email)}&role=${role}`, {
    method: 'POST',
  });
  return handleResponse(response);
};

export const getUser = async (profileId) => {
  const response = await fetch(`${API_BASE_URL}/users/${profileId}`);
  return handleResponse(response);
};

export const updateUserEmail = async (profileId, email) => {
  const response = await fetch(`${API_BASE_URL}/users/${profileId}/email?email=${encodeURIComponent(email)}`, {
    method: 'PUT',
  });
  return handleResponse(response);
};

// ============================================
// BATCH COMPS API
// ============================================

export const createCompsBatch = async (items) => {
  /**
   * Create a batch job for generating comps for multiple items
   * @param {Array} items - Array of {item_id, brand, model, year, notes}
   * @returns {Promise} - Batch job info with batch_id
   */
  const response = await fetch(`${API_BASE_URL}/comps/batch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ items }),
  });
  return handleResponse(response);
};

export const getBatchStatus = async (batchId) => {
  /**
   * Check the status of a batch comps generation job
   * @param {string} batchId - The batch job ID
   * @returns {Promise} - Batch status info
   */
  const response = await fetch(`${API_BASE_URL}/comps/batch/${batchId}`);
  return handleResponse(response);
};

export const getBatchResults = async (batchId, saveToDb = true) => {
  /**
   * Retrieve results from a completed batch job
   * @param {string} batchId - The batch job ID
   * @param {boolean} saveToDb - Whether to save comps to database
   * @returns {Promise} - Batch results with all comps
   */
  const response = await fetch(`${API_BASE_URL}/comps/batch/${batchId}/results?save_to_db=${saveToDb}`);
  return handleResponse(response);
};

export const cancelBatch = async (batchId) => {
  /**
   * Cancel an in-progress batch job
   * @param {string} batchId - The batch job ID
   * @returns {Promise} - Cancellation confirmation
   */
  const response = await fetch(`${API_BASE_URL}/comps/batch/${batchId}`, {
    method: 'DELETE',
  });
  return handleResponse(response);
};

export const makePayment = async (profileId) => {
  const response = await fetch(`${API_BASE_URL}/payments?profile_id=${profileId}`, {
    method: 'POST',
  });
  return handleResponse(response);
};

// ============================================
// FETCH ALL USER DATA (for startup)
// ============================================

export const fetchAllUserData = async (profileId) => {
  try {
    // Fetch auctions
    const auctionsData = await listAuctionsByUser(profileId);
    const auctions = auctionsData.auctions || [];
    
    // Fetch all items for this user
    const itemsData = await listItems(null, profileId);
    const items = itemsData.items || [];
    
    // Extract all item IDs to fetch comps
    const itemIds = items.map(item => item.item_id);
    
    // Fetch saved comps for each item in batches to avoid overwhelming the server
    const BATCH_SIZE = 5; // Process 5 items at a time
    const allComps = [];
    
    for (let i = 0; i < itemIds.length; i += BATCH_SIZE) {
      const batch = itemIds.slice(i, i + BATCH_SIZE);
      
      const batchPromises = batch.map(itemId => 
        getSavedComps(itemId).catch(err => {
          console.warn(`Failed to fetch saved comps for item ${itemId}:`, err);
          return { comps: [] };
        })
      );
      
      const batchResponses = await Promise.all(batchPromises);
      
      // Add comps from this batch
      batchResponses.forEach((response, batchIndex) => {
        if (response.comps) {
          response.comps.forEach(comp => {
            allComps.push({
              item_id: batch[batchIndex],
              source: comp.source,
              source_url: comp.url_comp,
              sold_price: comp.sold_price,
              currency: comp.currency,
              sold_at: comp.sold_at,
              notes: comp.notes
            });
          });
        }
      });
      
      // Small delay between batches to avoid rate limiting
      if (i + BATCH_SIZE < itemIds.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return {
      auctions,
      items,
      allComps
    };
  } catch (error) {
    console.error('Failed to fetch all user data:', error);
    throw error;
  }
};
