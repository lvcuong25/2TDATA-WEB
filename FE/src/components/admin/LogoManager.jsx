import React, { useState } from 'react';
import { Upload, Image, X, Save, RotateCcw } from 'lucide-react';
import { useSite } from '../../context/SiteContext';
import DynamicLogo from '../common/DynamicLogo';

/**
 * Logo Manager Component
 * Allows administrators to upload and manage site logos
 */
const LogoManager = ({ siteId, onLogoUpdate }) => {
  const { currentSite, refreshSiteConfig } = useSite();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');

  const handleFileSelect = (event, logoType) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
      return;
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setUploadError('File size must be less than 5MB');
      return;
    }

    setUploadError('');
    
    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target.result);
    };
    reader.readAsDataURL(file);

    // Upload the file
    uploadLogo(file, logoType);
  };

  const uploadLogo = async (file, logoType) => {
    setUploading(true);
    setUploadError('');

    try {
      const formData = new FormData();
      formData.append('logo', file);
      
      // Add current site data to maintain other settings
      if (currentSite) {
        formData.append('name', currentSite.name);
        if (currentSite.domains) {
          formData.append('domains', JSON.stringify(currentSite.domains));
        }
        if (currentSite.theme_config) {
          formData.append('theme_config', JSON.stringify(currentSite.theme_config));
        }
        if (currentSite.settings) {
          formData.append('settings', JSON.stringify(currentSite.settings));
        }
      }

      const response = await fetch(`/api/sites/${siteId}`, {
        method: 'PUT',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        // Refresh site configuration to get updated logo
        await refreshSiteConfig();
        
        // Callback to parent component
        if (onLogoUpdate) {
          onLogoUpdate(result.data);
        }

        setPreviewUrl('');
        console.log('✅ Logo uploaded successfully');
      } else {
        throw new Error(result.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Logo upload error:', error);
      setUploadError(error.message || 'Failed to upload logo');
    } finally {
      setUploading(false);
    }
  };

  const clearPreview = () => {
    setPreviewUrl('');
    setUploadError('');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Image className="mr-2" size={20} />
          Logo Management
        </h3>

        {/* Current Logo Display */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current Logo
          </label>
          <div className="flex items-center space-x-4">
            <div className="w-32 h-20 border border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
              <DynamicLogo
                type="main"
                className="max-w-full max-h-full"
                style={{ maxWidth: '120px', maxHeight: '70px' }}
              />
            </div>
            <div className="text-sm text-gray-600">
              <p><strong>Site:</strong> {currentSite?.name || 'Unknown'}</p>
              <p><strong>Current URL:</strong> {currentSite?.logo_url || 'No logo set'}</p>
            </div>
          </div>
        </div>

        {/* Logo Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload New Logo
          </label>
          
          {/* Upload Area */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
            <input
              type="file"
              id="logo-upload"
              accept="image/*"
              onChange={(e) => handleFileSelect(e, 'main')}
              className="hidden"
              disabled={uploading}
            />
            <label
              htmlFor="logo-upload"
              className={`cursor-pointer ${uploading ? 'opacity-50' : ''}`}
            >
              <Upload className="mx-auto mb-2 text-gray-400" size={24} />
              <p className="text-sm text-gray-600">
                {uploading ? 'Uploading...' : 'Click to upload or drag and drop'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PNG, JPG, GIF, WebP up to 5MB
              </p>
            </label>
          </div>

          {/* Preview */}
          {previewUrl && (
            <div className="mt-4 p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Preview</span>
                <button
                  onClick={clearPreview}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="w-32 h-20 border border-gray-300 rounded flex items-center justify-center bg-gray-50">
                <img
                  src={previewUrl}
                  alt="Logo preview"
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            </div>
          )}

          {/* Error Display */}
          {uploadError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{uploadError}</p>
            </div>
          )}

          {/* Usage Instructions */}
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm font-medium text-blue-800 mb-2">Logo Usage</h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Logo will automatically appear in your site header</li>
              <li>• Used as favicon if no separate favicon is set</li>
              <li>• Recommended size: 200x80px or similar aspect ratio</li>
              <li>• Transparent PNG files work best for versatile backgrounds</li>
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={refreshSiteConfig}
            disabled={uploading}
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 disabled:opacity-50"
          >
            <RotateCcw size={16} className="mr-2" />
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoManager;
