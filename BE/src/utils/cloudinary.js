import cloudinary from 'cloudinary';

// Configure Cloudinary
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dvvlskvo6',
  api_key: process.env.CLOUDINARY_API_KEY || '495944459298787',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'hkQmlePYOO809MriMi8E11WhDxY'
});

/**
 * Delete file from Cloudinary
 * @param {string} publicId - The public ID of the file to delete
 * @returns {Promise} - Promise that resolves when file is deleted
 */
export const deleteFromCloudinary = async (publicId) => {
  try {
    if (!publicId) {
      console.log('No public ID provided for deletion');
      return;
    }

    const result = await cloudinary.v2.uploader.destroy(publicId);
    console.log('File deleted from Cloudinary:', result);
    return result;
  } catch (error) {
    console.error('Error deleting file from Cloudinary:', error);
    throw error;
  }
};

/**
 * Extract public ID from Cloudinary URL
 * @param {string} url - Cloudinary URL
 * @returns {string|null} - Public ID or null if not found
 */
export const extractPublicIdFromUrl = (url) => {
  if (!url || !url.includes('cloudinary.com')) {
    return null;
  }

  try {
    // Extract public ID from URL like: https://res.cloudinary.com/dvvlskvo6/image/upload/v1234567890/reactjs/filename.jpg
    const urlParts = url.split('/');
    const uploadIndex = urlParts.findIndex(part => part === 'upload');
    
    if (uploadIndex === -1 || uploadIndex + 2 >= urlParts.length) {
      return null;
    }

    // Get the path after 'upload' and before the file extension
    const pathAfterUpload = urlParts.slice(uploadIndex + 2).join('/');
    const publicId = pathAfterUpload.split('.')[0]; // Remove file extension
    
    return publicId;
  } catch (error) {
    console.error('Error extracting public ID from URL:', error);
    return null;
  }
};

export default cloudinary; 