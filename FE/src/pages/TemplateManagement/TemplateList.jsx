import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../../utils/axiosInstance-cookie-only';
import { toast } from 'react-toastify';
import { useAuth } from '../../components/core/Auth';

const TemplateList = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === 'super_admin';
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: '', description: '' });
  const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', description: '', color: '#1890ff' });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState({ _id: '', name: '', description: '' });
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [copyingTemplate, setCopyingTemplate] = useState({ _id: '', name: '', description: '' });
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name'); // 'name', 'createdAt', 'usageCount'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' or 'desc'
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Fetch templates
  const { data: templatesResponse, isLoading, error } = useQuery({
    queryKey: ['templates', searchTerm, selectedCategory],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      
      const response = await axiosInstance.get(`/templates/public?${params}`);
      return response.data;
    },
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch categories
  const { data: categoriesResponse } = useQuery({
    queryKey: ['template-categories'],
    queryFn: async () => {
      const response = await axiosInstance.get('/templates/categories');
      return response.data;
    },
    retry: 2,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Extract templates array from response
  const templates = Array.isArray(templatesResponse?.data) ? templatesResponse.data : [];
  const categories = Array.isArray(categoriesResponse?.data) ? categoriesResponse.data : [];

  // Create template mutation (Super Admin only)
  const createTemplateMutation = useMutation({
    mutationFn: async (templateData) => {
      const response = await axiosInstance.post('/templates/admin', templateData);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Template created successfully');
      setShowCreateModal(false);
      setNewTemplate({ name: '', description: '' });
      queryClient.invalidateQueries(['templates']);
    },
    onError: (error) => {
      console.error('Error creating template:', error);
      toast.error(error.response?.data?.message || 'Failed to create template');
    },
  });

  // Create category mutation (Super Admin only)
  const createCategoryMutation = useMutation({
    mutationFn: async (categoryData) => {
      const response = await axiosInstance.post('/templates/admin/categories', categoryData);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Category created successfully');
      setShowCreateCategoryModal(false);
      setNewCategory({ name: '', description: '', color: '#1890ff' });
      queryClient.invalidateQueries(['template-categories']);
    },
    onError: (error) => {
      console.error('Error creating category:', error);
      toast.error(error.response?.data?.message || 'Failed to create category');
    },
  });

  // Update template mutation (Super Admin only)
  const updateTemplateMutation = useMutation({
    mutationFn: async (templateData) => {
      const response = await axiosInstance.put(`/templates/admin/${templateData._id}`, {
        name: templateData.name,
        description: templateData.description
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Template updated successfully');
      setShowEditModal(false);
      setEditingTemplate({ _id: '', name: '', description: '' });
      queryClient.invalidateQueries(['templates']);
    },
    onError: (error) => {
      console.error('Error updating template:', error);
      toast.error(error.response?.data?.message || 'Failed to update template');
    },
  });

  // Delete template mutation (Super Admin only)
  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId) => {
      const response = await axiosInstance.delete(`/templates/admin/${templateId}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Template deleted successfully');
      queryClient.invalidateQueries(['templates']);
    },
    onError: (error) => {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    },
  });

  // Copy template to create database mutation
  const copyTemplateMutation = useMutation({
    mutationFn: async (templateData) => {
      const response = await axiosInstance.post(`/templates/${templateData._id}/copy`, {
        databaseName: templateData.name,
        databaseDescription: templateData.description,
        includeSampleData: templateData.includeSampleData
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Database created successfully from template!');
      setShowCopyModal(false);
      setCopyingTemplate({ _id: '', name: '', description: '' });
      queryClient.invalidateQueries(['templates']);
      // Navigate to the new database
      navigate(`/database/${data.data.databaseId}`);
    },
    onError: (error) => {
      console.error('Error copying template:', error);
      toast.error(error.response?.data?.message || 'Failed to create database from template');
    },
  });

  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    createTemplateMutation.mutate(newTemplate);
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    createCategoryMutation.mutate(newCategory);
  };

  const handleEditTemplate = async (e) => {
    e.preventDefault();
    updateTemplateMutation.mutate(editingTemplate);
  };

  const handleDeleteTemplate = async (templateId, templateName) => {
    if (!templateId || templateId === 'undefined') {
      toast.error('Template ID is missing. Cannot delete template.');
      return;
    }
    
    if (!window.confirm(`Are you sure you want to delete "${templateName}"? This action cannot be undone.`)) {
      return;
    }
    deleteTemplateMutation.mutate(templateId);
  };

  const handleCopyTemplate = async (e) => {
    e.preventDefault();
    if (!copyingTemplate.name.trim()) {
      toast.error('Database name is required');
      return;
    }
    copyTemplateMutation.mutate(copyingTemplate);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter and sort templates
  const filteredAndSortedTemplates = React.useMemo(() => {
    let filtered = templates.filter(template => {
      const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (template.description && template.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'all' || 
        getCategoryName(template.category).toLowerCase() === selectedCategory.toLowerCase();
      
      return matchesSearch && matchesCategory;
    });

    // Sort templates
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case 'usageCount':
          aValue = a.usageCount || 0;
          bValue = b.usageCount || 0;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [templates, searchTerm, sortBy, sortOrder]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getCategoryIcon = (category) => {
    return '📄'; // Default icon for all categories
  };

  const getCategoryColor = (category) => {
    if (typeof category === 'string') {
      const cat = categories.find(c => c.name === category);
      return cat?.color || '#1890ff';
    }
    return category?.color || '#1890ff';
  };

  const getCategoryName = (category) => {
    if (typeof category === 'string') {
      return category;
    }
    return category?.name || 'Unknown';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Error loading templates</h2>
          <p className="mt-2 text-gray-600">{error.message}</p>
          <button
            onClick={() => navigate('/templates')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Template Gallery</h1>
            <p className="mt-1 text-gray-600">
              {isSuperAdmin ? 'Quản lý và tạo templates cho database' : 'Chọn template để tạo database mới'}
            </p>
            {!isSuperAdmin && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">Hướng dẫn:</span> Click "Use Template" để tạo database mới với các tables có sẵn.
                </p>
              </div>
            )}
            {isSuperAdmin && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-800">
                  <span className="font-medium">Super Admin:</span> Click vào template để quản lý tables bên trong.
                </p>
              </div>
            )}
          </div>
          {isSuperAdmin && (
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateCategoryModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                disabled={createCategoryMutation.isPending}
              >
                {createCategoryMutation.isPending ? 'Creating...' : '+ Tạo Category'}
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                disabled={createTemplateMutation.isPending}
              >
                {createTemplateMutation.isPending ? 'Creating...' : '+ Tạo Template'}
              </button>
            </div>
          )}
        </div>

        {/* Search and Controls */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Tìm kiếm templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category._id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Sắp xếp:</span>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field);
                  setSortOrder(order);
                }}
                className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="name-asc">Tên A-Z</option>
                <option value="name-desc">Tên Z-A</option>
                <option value="createdAt-desc">Mới nhất</option>
                <option value="createdAt-asc">Cũ nhất</option>
                <option value="usageCount-desc">Sử dụng nhiều</option>
                <option value="usageCount-asc">Sử dụng ít</option>
              </select>
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              List
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 flex items-center gap-6 text-sm text-gray-500">
          <span>Tổng cộng: <span className="font-medium text-gray-900">{templates.length}</span> templates</span>
          {searchTerm && (
            <span>Kết quả tìm kiếm: <span className="font-medium text-gray-900">{filteredAndSortedTemplates.length}</span> templates</span>
          )}
        </div>
      </div>

      {/* Templates Display */}
      {templates.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Chưa có template nào</h3>
          <p className="mt-1 text-sm text-gray-500">Bắt đầu bằng cách tạo template đầu tiên của bạn.</p>
          {isSuperAdmin && (
            <div className="mt-6 flex gap-3 justify-center">
              <button
                onClick={() => setShowCreateCategoryModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
              >
                + Tạo Category
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                + Tạo Template
              </button>
            </div>
          )}
        </div>
      ) : filteredAndSortedTemplates.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Không tìm thấy template nào</h3>
          <p className="mt-1 text-sm text-gray-500">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc.</p>
        </div>
      ) : (
        <>
          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedTemplates.map((template) => (
                <div
                  key={template.id || template._id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    console.log('🔍 Template data:', template);
                    console.log('🔍 Template ID:', template._id || template.id);
                    if (isSuperAdmin) {
                      // Super Admin: Click vào template để edit
                      const templateId = template._id || template.id;
                      if (!templateId) {
                        console.error('❌ Template ID is missing:', template);
                        return;
                      }
                      navigate(`/templates/${templateId}`);
                    } else {
                      // Regular user: Click để copy template
                      setCopyingTemplate({
                        _id: template.id || template._id,
                        name: template.name,
                        description: template.description,
                        includeSampleData: false
                      });
                      setShowCopyModal(true);
                    }
                  }}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <span className="text-2xl">{template.icon || getCategoryIcon(template.category)}</span>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                          <p className="text-sm text-gray-500">{getCategoryName(template.category)}</p>
                        </div>
                      </div>
                      {isSuperAdmin && (
                        <div className="flex space-x-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingTemplate({
                                _id: template.id || template._id,
                                name: template.name,
                                description: template.description || ''
                              });
                              setShowEditModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-800 p-1"
                            title="Sửa template"
                            disabled={updateTemplateMutation.isPending}
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTemplate(template.id || template._id, template.name);
                            }}
                            className="text-red-600 hover:text-red-800 p-1"
                            title="Xóa template"
                            disabled={deleteTemplateMutation.isPending}
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {template.description && (
                      <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Tables: {template.tables?.length || template.columns?.length || 0}</span>
                      <span>Uses: {template.usageCount || 0}</span>
                    </div>
                    
                    <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                      <span>Tạo: {formatDate(template.createdAt)}</span>
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        {template.complexity || 'beginner'}
                      </span>
                    </div>

                    {/* Use Template Button for regular users */}
                    {!isSuperAdmin && (
                      <div className="mt-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCopyingTemplate({
                              _id: template.id || template._id,
                              name: template.name,
                              description: template.description,
                              includeSampleData: false
                            });
                            setShowCopyModal(true);
                          }}
                          className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                        >
                          Use Template
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Template
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mô tả
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tables
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                        onClick={() => handleSort('usageCount')}
                      >
                        <div className="flex items-center">
                          Sử dụng
                          {sortBy === 'usageCount' && (
                            <svg className={`ml-1 h-4 w-4 ${sortOrder === 'asc' ? 'transform rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                        onClick={() => handleSort('createdAt')}
                      >
                        <div className="flex items-center">
                          Ngày tạo
                          {sortBy === 'createdAt' && (
                            <svg className={`ml-1 h-4 w-4 ${sortOrder === 'asc' ? 'transform rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          )}
                        </div>
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAndSortedTemplates.map((template) => (
                      <tr 
                        key={template.id || template._id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => {
                          console.log('🔍 Template data (second click):', template);
                          console.log('🔍 Template ID (second click):', template._id || template.id);
                          if (isSuperAdmin) {
                            // Super Admin: Click vào template để edit
                            const templateId = template._id || template.id;
                            if (!templateId) {
                              console.error('❌ Template ID is missing (second click):', template);
                              return;
                            }
                            navigate(`/templates/${templateId}`);
                          } else {
                            // Regular user: Click để copy template
                            setCopyingTemplate({
                              _id: template.id || template._id,
                              name: template.name,
                              description: template.description,
                              includeSampleData: false
                            });
                            setShowCopyModal(true);
                          }
                        }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                              <span className="text-lg">{template.icon || getCategoryIcon(template.category)}</span>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{template.name}</div>
                              <div className="text-sm text-gray-500">{getCategoryName(template.category)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {template.description || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {template.tables?.length || template.columns?.length || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {template.usageCount || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(template.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {isSuperAdmin && (
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                setEditingTemplate({
                                  _id: template.id || template._id,
                                  name: template.name,
                                  description: template.description || ''
                                });
                                  setShowEditModal(true);
                                }}
                                className="text-blue-600 hover:text-blue-800 p-1"
                                title="Sửa template"
                                disabled={updateTemplateMutation.isPending}
                              >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteTemplate(template.id || template._id, template.name);
                                }}
                                className="text-red-600 hover:text-red-800 p-1"
                                title="Xóa template"
                                disabled={deleteTemplateMutation.isPending}
                              >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Create Category Modal */}
      {showCreateCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Tạo Category mới</h2>
            <form onSubmit={handleCreateCategory}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên Category *
                </label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Ví dụ: Marketing"
                  required
                  disabled={createCategoryMutation.isPending}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mô tả (tùy chọn)
                </label>
                <textarea
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Mô tả về category này..."
                  rows="3"
                  disabled={createCategoryMutation.isPending}
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Màu sắc
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={newCategory.color}
                    onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                    className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                    disabled={createCategoryMutation.isPending}
                  />
                  <input
                    type="text"
                    value={newCategory.color}
                    onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="#1890ff"
                    disabled={createCategoryMutation.isPending}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateCategoryModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  disabled={createCategoryMutation.isPending}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                  disabled={createCategoryMutation.isPending}
                >
                  {createCategoryMutation.isPending ? 'Creating...' : 'Tạo Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Template Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Sửa Template</h2>
            <form onSubmit={handleEditTemplate}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên Template *
                </label>
                <input
                  type="text"
                  value={editingTemplate.name}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ví dụ: CRM System"
                  required
                  disabled={updateTemplateMutation.isPending}
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mô tả (tùy chọn)
                </label>
                <textarea
                  value={editingTemplate.description}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Mô tả về template này..."
                  rows="3"
                  disabled={updateTemplateMutation.isPending}
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  disabled={updateTemplateMutation.isPending}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                  disabled={updateTemplateMutation.isPending}
                >
                  {updateTemplateMutation.isPending ? 'Updating...' : 'Cập nhật Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Template Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Tạo Template mới</h2>
            <form onSubmit={handleCreateTemplate}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên Template *
                </label>
                <input
                  type="text"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ví dụ: CRM System"
                  required
                  disabled={createTemplateMutation.isPending}
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mô tả (tùy chọn)
                </label>
                <textarea
                  value={newTemplate.description}
                  onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Mô tả về template này..."
                  rows="3"
                  disabled={createTemplateMutation.isPending}
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  disabled={createTemplateMutation.isPending}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                  disabled={createTemplateMutation.isPending}
                >
                  {createTemplateMutation.isPending ? 'Creating...' : 'Tạo Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Copy Template Modal */}
      {showCopyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Tạo Database từ Template</h2>
            <form onSubmit={handleCopyTemplate}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên Database *
                </label>
                <input
                  type="text"
                  value={copyingTemplate.name}
                  onChange={(e) => setCopyingTemplate({ ...copyingTemplate, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Ví dụ: My CRM System"
                  required
                  disabled={copyTemplateMutation.isPending}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mô tả (tùy chọn)
                </label>
                <textarea
                  value={copyingTemplate.description}
                  onChange={(e) => setCopyingTemplate({ ...copyingTemplate, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Mô tả về database này..."
                  rows="3"
                  disabled={copyTemplateMutation.isPending}
                />
              </div>
              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={copyingTemplate.includeSampleData}
                    onChange={(e) => setCopyingTemplate({ ...copyingTemplate, includeSampleData: e.target.checked })}
                    className="mr-2"
                    disabled={copyTemplateMutation.isPending}
                  />
                  <span className="text-sm text-gray-700">Include sample data</span>
                </label>
              </div>
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>Lưu ý:</strong> Việc tạo database từ template sẽ tạo ra một database mới với tất cả tables và columns từ template.
                </p>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCopyModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  disabled={copyTemplateMutation.isPending}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                  disabled={copyTemplateMutation.isPending}
                >
                  {copyTemplateMutation.isPending ? 'Creating...' : 'Tạo Database'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default TemplateList;
