// Supabase Storage service for image uploads
import { supabase } from '../lib/supabaseClient';

const BUCKET_NAME = 'images2';

/**
 * Upload an image to Supabase Storage
 * @param {File} file - The image file to upload
 * @param {string} itemId - The item ID to use in the file path
 * @returns {Promise<{url: string, path: string}>} - The public URL and storage path
 */
export const uploadItemImage = async (file, itemId) => {
  try {
    // Generate unique filename: itemId/timestamp-originalname
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const fileName = `${itemId}/${timestamp}-${file.name.replace(/\s+/g, '_')}`;

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false // Don't overwrite existing files
      });

    if (error) {
      throw error;
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    return {
      url: urlData.publicUrl,
      path: fileName
    };
  } catch (error) {
    console.error('Error uploading image:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
};

/**
 * Delete an image from Supabase Storage
 * @param {string} path - The storage path of the file to delete
 * @returns {Promise<void>}
 */
export const deleteItemImage = async (path) => {
  try {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([path]);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error deleting image:', error);
    throw new Error(`Failed to delete image: ${error.message}`);
  }
};

/**
 * Upload multiple images for an item
 * @param {File[]} files - Array of image files
 * @param {string} itemId - The item ID
 * @returns {Promise<Array<{url: string, path: string}>>}
 */
export const uploadMultipleImages = async (files, itemId) => {
  const uploadPromises = files.map(file => uploadItemImage(file, itemId));
  return Promise.all(uploadPromises);
};
