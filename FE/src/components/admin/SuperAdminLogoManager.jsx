import React, { useState, useEffect } from 'react';
import { Upload, Image, Edit, Save, X, RefreshCw, Search } from 'lucide-react';
import axiosInstance from '../../axios/axiosInstance';

/**
 * Super Admin Logo Manager
 * Allows super-admins to view and update logos for all affiliate sites
 */
const SuperAdminLogoManager = () => {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingSite, setEditingSite] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    loadAllSites();
  }, []);

  const loadAllSites = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/sites', {
        params: {
          page: 1,
          limit: 100, // Get all sites
          search: searchTerm
        }
      });

      if (response.data.success) {
        setSites(response.data.data);
      }
    } catch (error) {
      console.error('Error loading sites:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSites = sites.filter(site => 
    site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    site.domains.some(domain => domain.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleFileSelect = (event, siteId) => {
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
    uploadLogoForSite(file, siteId);
  };

  const uploadLogoForSite = async (file, siteId) => {
    setUploading(true);
    setUploadError('');

    try {
      const site = sites.find(s => s._id === siteId);
      if (!site) throw new Error('Site not found');

      const formData = new FormData();
      formData.append('logo', file);
      
      // Add current site data to maintain other settings
      formData.append('name', site.name);
      if (site.domains) {
        formData.append('domains', JSON.stringify(site.domains));
      }
      if (site.theme_config) {
        formData.append('theme_config', JSON.stringify(site.theme_config));
      }
      if (site.settings) {
        formData.append('settings', JSON.stringify(site.settings));
      }

      const response = await axiosInstance.put(`/sites/${siteId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        // Update the site in local state
        setSites(prevSites => 
          prevSites.map(s => 
            s._id === siteId ? response.data.data : s
          )
        );

        setPreviewUrl('');
        setEditingSite(null);
        console.log('✅ Logo uploaded successfully for site:', site.name);
      } else {
        throw new Error(response.data.message || 'Upload failed');
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
    setEditingSite(null);
  };

  const getLogoUrl = (site) => {
    return site.theme_config?.logoUrl || site.logo_url || '/src/image/image.jpg';
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Image className="mr-3" size={24} />
            Logo Management - All Sites
          </h2>
          <button
            onClick={loadAllSites}
            disabled={loading}
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 disabled:opacity-50"
          >
            <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search sites by name or domain..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Sites Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-gray-50 rounded-lg p-4 animate-pulse">
                <div className="h-20 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSites.map((site) => (
              <div key={site._id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                {/* Site Header */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 truncate">{site.name}</h3>
                    <p className="text-sm text-gray-500">{site.domains[0]}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    site.status === 'active' ? 'bg-green-100 text-green-800' :
                    site.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {site.status}
                  </span>
                </div>

                {/* Current Logo */}
                <div className="mb-4">
                  <div className="w-full h-20 border border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden">
                    <img
                      src={getLogoUrl(site)}
                      alt={`${site.name} Logo`}
                      className="max-w-full max-h-full object-contain"
                      onError={(e) => {
                        e.target.src = '/src/image/image.jpg';
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    {site.logo_url || 'No custom logo'}
                  </p>
                </div>

                {/* Upload Section */}
                {editingSite === site._id ? (
                  <div className="space-y-3">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
                      <input
                        type="file"
                        id={`logo-upload-${site._id}`}
                        accept="image/*"
                        onChange={(e) => handleFileSelect(e, site._id)}
                        className="hidden"
                        disabled={uploading}
                      />
                      <label
                        htmlFor={`logo-upload-${site._id}`}
                        className={`cursor-pointer ${uploading ? 'opacity-50' : ''}`}
                      >
                        <Upload className="mx-auto mb-1 text-gray-400" size={20} />
                        <p className="text-xs text-gray-600">
                          {uploading ? 'Uploading...' : 'Click to upload'}
                        </p>
                      </label>
                    </div>

                    {/* Preview */}
                    {previewUrl && (
                      <div className="p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-gray-700">Preview</span>
                          <button
                            onClick={clearPreview}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <X size={14} />
                          </button>
                        </div>
                        <div className="w-full h-16 border border-gray-300 rounded flex items-center justify-center bg-gray-50">
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
                      <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                        {uploadError}
                      </div>
                    )}

                    <button
                      onClick={clearPreview}
                      className="w-full px-3 py-2 text-sm text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditingSite(site._id)}
                    className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100"
                  >
                    <Edit size={16} className="mr-2" />
                    Update Logo
                  </button>
                )}

                {/* Site Stats */}
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Users: {site.stats?.totalUsers || 0}</span>
                    <span>Domains: {site.domains?.length || 0}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No sites found */}
        {!loading && filteredSites.length === 0 && (
          <div className="text-center py-12">
            <Image className="mx-auto mb-4 text-gray-400" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No sites found</h3>
            <p className="text-gray-500">
              {searchTerm ? 'Try adjusting your search terms.' : 'No affiliate sites have been created yet.'}
            </p>
          </div>
        )}
      </div>

      {/* Usage Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-800 mb-2">Super Admin Logo Management</h4>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Click "Update Logo" on any site to upload a new logo</li>
          <li>• Logos are automatically resized and optimized</li>
          <li>• Changes take effect immediately across the affiliate site</li>
          <li>• Old logo files are automatically cleaned up</li>
          <li>• Supported formats: PNG, JPG, GIF, WebP (max 5MB)</li>
        </ul>
      </div>
    </div>
  );
};

export default SuperAdminLogoManager;
