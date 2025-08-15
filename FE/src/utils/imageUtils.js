/**
 * Utility functions for handling image URLs
 */

const DEFAULT_IMAGE_URL = 'https://t4.ftcdn.net/jpg/04/73/25/49/360_F_473254957_bxG9yf4ly7OBO5I0O5KABlN930GwaMQz.jpg';

/**
 * Safely get image URL, fallback to default if empty or invalid
 * @param {string} imageUrl - The image URL to validate
 * @param {string} fallbackUrl - Optional fallback URL (defaults to DEFAULT_IMAGE_URL)
 * @returns {string} Valid image URL
 */
export const getSafeImageUrl = (imageUrl, fallbackUrl = DEFAULT_IMAGE_URL) => {
  // Check if imageUrl exists and is not empty
  if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim() !== '') {
    return imageUrl;
  }
  
  // Return fallback URL
  return fallbackUrl;
};

/**
 * Check if image URL is valid (not empty and is a string)
 * @param {string} imageUrl - The image URL to validate
 * @returns {boolean} True if valid, false otherwise
 */
export const isValidImageUrl = (imageUrl) => {
  return imageUrl && typeof imageUrl === 'string' && imageUrl.trim() !== '';
};

/**
 * Get default image URL
 * @returns {string} Default image URL
 */
export const getDefaultImageUrl = () => DEFAULT_IMAGE_URL;

export default {
  getSafeImageUrl,
  isValidImageUrl,
  getDefaultImageUrl
};
