import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../../utils/axiosInstance-cookie-only';
import { toast } from 'react-toastify';
import { SearchOutlined, SortAscendingOutlined, SortDescendingOutlined } from '@ant-design/icons';

import { useAuth } from '../../components/core/Auth';

import DatabaseExcelActions from './DatabaseExcelActions';


const DatabaseList = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentUser, currentOrganization } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDatabase, setNewDatabase] = useState({ name: '', description: '' });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDatabase, setEditingDatabase] = useState({ _id: '', name: '', description: '' });
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [copyingDatabase, setCopyingDatabase] = useState({ _id: '', name: '', description: '' });
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [showListImportModal, setShowListImportModal] = useState(false);
  const [selectedDatabaseForImport, setSelectedDatabaseForImport] = useState(null);
  const [listImportFile, setListImportFile] = useState(null);
  const [listImportTableName, setListImportTableName] = useState('');
  const [listImportOverwrite, setListImportOverwrite] = useState(false);
  const [isListImporting, setIsListImporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name'); // 'name', 'createdAt', 'updatedAt'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' or 'desc'

  // Fetch databases using React Query
  const { data: responseData, isLoading, error } = useQuery({
    queryKey: ['databases'],
    queryFn: async () => {
      const response = await axiosInstance.get('/database/databases');
      return response.data;
    },
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Extract databases array from response
  const databases = responseData?.data || [];

  // Check user role in organization
  const userMember = currentOrganization?.members?.find(member => 
    member.user === currentUser?._id
  );
  const userRole = userMember?.role;
  const canCreateDatabase = userRole === 'owner' || userRole === 'manager';

  // Filter and sort databases
  const filteredAndSortedDatabases = React.useMemo(() => {
    let filtered = databases.filter(db => 
      db.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (db.description && db.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Sort databases
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
        case 'updatedAt':
          aValue = new Date(a.updatedAt);
          bValue = new Date(b.updatedAt);
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
  }, [databases, searchTerm, sortBy, sortOrder]);

  // Create database mutation (now creates a base)
  const createDatabaseMutation = useMutation({
    mutationFn: async (databaseData) => {
      const response = await axiosInstance.post('/database/databases', databaseData);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Tạo database thành công!');
      setShowCreateModal(false);
      setNewDatabase({ name: '', description: '' });
      queryClient.invalidateQueries(['databases']);
    },
    onError: (error) => {
      console.error('Error creating database:', error);
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.error || 
                          'Không thể tạo database. Vui lòng thử lại!';
      toast.error(errorMessage);
    },
  });

  // Delete database mutation
  const deleteDatabaseMutation = useMutation({
    mutationFn: async (databaseId) => {
      const response = await axiosInstance.delete(`/database/databases/${databaseId}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Database deleted successfully');
      queryClient.invalidateQueries(['databases']);
    },
    onError: (error) => {
      console.error('Error deleting database:', error);
      toast.error('Failed to delete database');
    },
  });

  // Edit database mutation
  const editDatabaseMutation = useMutation({
    mutationFn: async (databaseData) => {
      const response = await axiosInstance.put(`/database/databases/${databaseData._id}`, databaseData);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Database updated successfully');
      setShowEditModal(false);
      setEditingDatabase({ _id: '', name: '', description: '' });
      queryClient.invalidateQueries(['databases']);
    },
    onError: (error) => {
      console.error('Error updating database:', error);
      toast.error(error.response?.data?.message || 'Failed to update database');
    },
  });

  // Copy database mutation
  const copyDatabaseMutation = useMutation({
    mutationFn: async (databaseData) => {
      const response = await axiosInstance.post(`/database/databases/${databaseData._id}/copy`, {
        name: databaseData.name,
        description: databaseData.description
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Database copied successfully');
      setShowCopyModal(false);
      setCopyingDatabase({ _id: '', name: '', description: '' });
      queryClient.invalidateQueries(['databases']);
    },
    onError: (error) => {
      console.error('Error copying database:', error);
      toast.error(error.response?.data?.message || 'Failed to copy database');
    },
  });

  const handleCreateDatabase = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!newDatabase.name || newDatabase.name.trim() === '') {
      toast.error('Vui lòng nhập tên database!');
      return;
    }
    
    if (newDatabase.name.length < 2) {
      toast.error('Tên database phải có ít nhất 2 ký tự!');
      return;
    }
    
    createDatabaseMutation.mutate(newDatabase);
  };

  const handleDeleteDatabase = async (databaseId, databaseName) => {
    if (!window.confirm(`Are you sure you want to delete "${databaseName}"? This will delete all tables and data inside.`)) {
      return;
    }
    deleteDatabaseMutation.mutate(databaseId);
  };

  const handleEditDatabase = async (e) => {
    e.preventDefault();
    if (!editingDatabase.name.trim()) {
      toast.error('Database name is required');
      return;
    }
    editDatabaseMutation.mutate(editingDatabase);
  };

  const handleCopyDatabase = async (e) => {
    e.preventDefault();
    if (!copyingDatabase.name.trim()) {
      toast.error('Database name is required');
      return;
    }
    copyDatabaseMutation.mutate(copyingDatabase);
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
          <h2 className="text-xl font-semibold text-gray-900">Error loading databases</h2>
          <p className="mt-2 text-gray-600">{error.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Cơ sở dữ liệu</h1>
            <p className="mt-2 text-gray-600">Quản lý các cơ sở dữ liệu của bạn</p>
          </div>
          <div className="flex items-center space-x-4">
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
            {canCreateDatabase && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                disabled={createDatabaseMutation.isPending}
              >
                {createDatabaseMutation.isPending ? 'Creating...' : '+ Tạo mới Database'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Search and Sort Bar */}
      <div className="mb-6 bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <SearchOutlined className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm databases..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          {/* Sort Options */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Sắp xếp:</span>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field);
                  setSortOrder(order);
                }}
                className="text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="name-asc">Tên A-Z</option>
                <option value="name-desc">Tên Z-A</option>
                <option value="createdAt-desc">Mới nhất</option>
                <option value="createdAt-asc">Cũ nhất</option>
                <option value="updatedAt-desc">Cập nhật gần đây</option>
                <option value="updatedAt-asc">Cập nhật xa nhất</option>
              </select>
            </div>
            
            {/* Stats */}
            <div className="text-sm text-gray-500">
              {searchTerm ? (
                <span>Kết quả: {filteredAndSortedDatabases.length}/{databases.length}</span>
              ) : (
                <span>Tổng cộng: {databases.length} databases</span>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Database Grid */}
      {filteredAndSortedDatabases.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {searchTerm ? 'Không tìm thấy database nào' : 'Chưa có database nào'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'Thử thay đổi từ khóa tìm kiếm' : 'Bắt đầu bằng cách tạo database đầu tiên của bạn.'}
          </p>
          {canCreateDatabase && (
            <div className="mt-6">
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                + Tạo Database
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedDatabases.map((database) => (
                <div
                  key={database._id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer h-64 flex flex-col"
                  onClick={() => navigate(`/database/${database._id}/tables`)}
                >
                  <div className="p-6 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-lg font-semibold text-gray-900">{database.name}</h3>
                          <p className="text-sm text-gray-500">Database</p>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingDatabase({
                              _id: database._id,
                              name: database.name,
                              description: database.description || ''
                            });
                            setShowEditModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="Sửa database"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCopyingDatabase({
                              _id: database._id,
                              name: `${database.name} - Copy`,
                              description: database.description || ''
                            });
                            setShowCopyModal(true);
                          }}
                          className="text-green-600 hover:text-green-800 p-1"
                          title="Sao chép database"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDatabase(database._id, database.name);
                          }}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Xóa database"
                          disabled={deleteDatabaseMutation.isPending}
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex flex-col flex-grow">
                      {database.description && (
                        <p className="text-sm text-gray-600 mb-4">{database.description}</p>
                      )}
                      
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                        <span>Tạo: {formatDate(database.createdAt)}</span>
                        <span>Cập nhật: {formatDate(database.updatedAt)}</span>
                      </div>
                      
                      {/* Excel Actions for this database */}
                      <div 
                        className="pt-3 border-t border-gray-100 mt-auto"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <DatabaseExcelActions
                          databaseId={database._id}
                          databaseName={database.name}
                          onImportSuccess={() => queryClient.invalidateQueries(['databases'])}
                          className="justify-end"
                        />
                      </div>
                    </div>
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
                        Database
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mô tả
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ngày tạo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cập nhật
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAndSortedDatabases.map((database) => (
                      <tr 
                        key={database._id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => navigate(`/database/${database._id}/tables`)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                              <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                              </svg>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{database.name}</div>
                              <div className="text-sm text-gray-500">Database</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {database.description || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(database.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(database.updatedAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingDatabase({
                                  _id: database._id,
                                  name: database.name,
                                  description: database.description || ''
                                });
                                setShowEditModal(true);
                              }}
                              className="text-blue-600 hover:text-blue-800 p-1"
                              title="Sửa database"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setCopyingDatabase({
                                  _id: database._id,
                                  name: `${database.name} - Copy`,
                                  description: database.description || ''
                                });
                                setShowCopyModal(true);
                              }}
                              className="text-green-600 hover:text-green-800 p-1"
                              title="Sao chép database"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteDatabase(database._id, database.name);
                              }}
                              className="text-red-600 hover:text-red-800 p-1"
                              title="Xóa database"
                              disabled={deleteDatabaseMutation.isPending}
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                            
                            {/* Excel Actions - Icon only */}
                            <div onClick={(e) => e.stopPropagation()} className="flex items-center space-x-1 ml-2 pl-2 border-l border-gray-200">
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (!database._id) {
                                    toast.error('Database ID is required for export');
                                    return;
                                  }
                                  try {
                                    const response = await axiosInstance.get(`/database/databases/${database._id}/export/excel`, {
                                      responseType: 'blob'
                                    });
                                    const url = window.URL.createObjectURL(new Blob([response.data]));
                                    const link = document.createElement('a');
                                    link.href = url;
                                    link.setAttribute('download', `${database.name}_export_${new Date().toISOString().split('T')[0]}.xlsx`);
                                    document.body.appendChild(link);
                                    link.click();
                                    link.remove();
                                    window.URL.revokeObjectURL(url);
                                    toast.success('Database exported to Excel successfully!');
                                  } catch (error) {
                                    console.error('Export error:', error);
                                    toast.error(error.response?.data?.message || 'Failed to export database');
                                  }
                                }}
                                className="text-blue-600 hover:text-blue-800 p-1"
                                title="Export Database"
                              >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedDatabaseForImport(database);
                                  setShowListImportModal(true);
                                }}
                                className="text-green-600 hover:text-green-800 p-1"
                                title="Import Excel"
                              >
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                                </svg>
                              </button>
                            </div>
                          </div>
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

      {/* Create Database Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Tạo Database mới</h2>
            <form onSubmit={handleCreateDatabase}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên Database *
                </label>
                <input
                  type="text"
                  value={newDatabase.name}
                  onChange={(e) => setNewDatabase({ ...newDatabase, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ví dụ: ShopDB"
                  required
                  disabled={createDatabaseMutation.isPending}
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mô tả (tùy chọn)
                </label>
                <textarea
                  value={newDatabase.description}
                  onChange={(e) => setNewDatabase({ ...newDatabase, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Mô tả về database này..."
                  rows="3"
                  disabled={createDatabaseMutation.isPending}
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  disabled={createDatabaseMutation.isPending}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                  disabled={createDatabaseMutation.isPending}
                >
                  {createDatabaseMutation.isPending ? 'Đang tạo...' : 'Tạo Database'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Database Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Sửa Database</h2>
            <form onSubmit={handleEditDatabase}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên Database *
                </label>
                <input
                  type="text"
                  value={editingDatabase.name}
                  onChange={(e) => setEditingDatabase({ ...editingDatabase, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ví dụ: ShopDB"
                  required
                  disabled={editDatabaseMutation.isPending}
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mô tả (tùy chọn)
                </label>
                <textarea
                  value={editingDatabase.description}
                  onChange={(e) => setEditingDatabase({ ...editingDatabase, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Mô tả về database này..."
                  rows="3"
                  disabled={editDatabaseMutation.isPending}
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  disabled={editDatabaseMutation.isPending}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                  disabled={editDatabaseMutation.isPending}
                >
                  {editDatabaseMutation.isPending ? 'Updating...' : 'Cập nhật'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Copy Database Modal */}
      {showCopyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Sao chép Database</h2>
            <form onSubmit={handleCopyDatabase}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên Database mới *
                </label>
                <input
                  type="text"
                  value={copyingDatabase.name}
                  onChange={(e) => setCopyingDatabase({ ...copyingDatabase, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Ví dụ: ShopDB - Copy"
                  required
                  disabled={copyDatabaseMutation.isPending}
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mô tả (tùy chọn)
                </label>
                <textarea
                  value={copyingDatabase.description}
                  onChange={(e) => setCopyingDatabase({ ...copyingDatabase, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Mô tả về database này..."
                  rows="3"
                  disabled={copyDatabaseMutation.isPending}
                />
              </div>
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  <strong>Lưu ý:</strong> Việc sao chép sẽ tạo ra một database mới với tất cả tables, columns và dữ liệu từ database gốc.
                </p>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCopyModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  disabled={copyDatabaseMutation.isPending}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                  disabled={copyDatabaseMutation.isPending}
                >
                  {copyDatabaseMutation.isPending ? 'Copying...' : 'Sao chép'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* List Import Modal */}
      {showListImportModal && selectedDatabaseForImport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Import Excel & Create Table</h2>
              <button
                onClick={() => {
                  setShowListImportModal(false);
                  setSelectedDatabaseForImport(null);
                  setListImportFile(null);
                  setListImportTableName('');
                  setListImportOverwrite(false);
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Excel File *
              </label>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    // Validate file type
                    const allowedTypes = [
                      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                      'application/vnd.ms-excel',
                      'text/csv'
                    ];
                    
                    if (!allowedTypes.includes(file.type)) {
                      toast.error('Please select a valid Excel file (.xlsx, .xls) or CSV file');
                      setListImportFile(null);
                      return;
                    }

                    // Validate file size (20MB limit)
                    if (file.size > 20 * 1024 * 1024) {
                      toast.error('File size must be less than 20MB');
                      setListImportFile(null);
                      return;
                    }

                    setListImportFile(file);
                    
                    // Auto-generate table name from filename
                    const fileName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
                    setListImportTableName(fileName);
                  } else {
                    setListImportFile(null);
                    setListImportTableName('');
                  }
                }}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {listImportFile && (
                <p className="mt-2 text-sm text-gray-600">
                  Selected: {listImportFile.name} ({(listImportFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Table Name *
              </label>
              <input
                type="text"
                value={listImportTableName}
                onChange={(e) => setListImportTableName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter table name"
                required
              />
            </div>

            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={listImportOverwrite}
                  onChange={(e) => setListImportOverwrite(e.target.checked)}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Overwrite if table exists
                </span>
              </label>
            </div>

            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>How it works:</strong>
              </p>
              <ul className="mt-1 text-xs text-blue-700 list-disc list-inside">
                <li>Creates a new table for each sheet in your Excel file</li>
                <li>Auto-detects column types from your data</li>
                <li>Imports all data from the Excel file</li>
                <li>Supports .xlsx, .xls, and .csv formats</li>
              </ul>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowListImportModal(false);
                  setSelectedDatabaseForImport(null);
                  setListImportFile(null);
                  setListImportTableName('');
                  setListImportOverwrite(false);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                disabled={isListImporting}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!selectedDatabaseForImport._id) {
                    toast.error('Database ID is required for import');
                    return;
                  }

                  if (!listImportFile) {
                    toast.error('Please select an Excel file to import');
                    return;
                  }

                  if (!listImportTableName.trim()) {
                    toast.error('Please enter a table name');
                    return;
                  }

                  try {
                    setIsListImporting(true);
                    const formData = new FormData();
                    formData.append('excelFile', listImportFile);
                    formData.append('tableName', listImportTableName.trim());
                    formData.append('overwrite', listImportOverwrite);

                    const response = await axiosInstance.post(`/database/databases/${selectedDatabaseForImport._id}/import/excel`, formData, {
                      headers: {
                        'Content-Type': 'multipart/form-data'
                      },
                      timeout: 120000 // 2 minutes timeout for large Excel files
                    });

                    const { data } = response.data;
                    
                    // Show import results
                    if (data.errors && data.errors.length > 0) {
                      toast.warn(`Import completed with ${data.errors.length} errors. ${data.totalImported} records imported successfully.`);
                      data.errors.forEach(error => toast.error(error));
                    } else {
                      toast.success(`Excel import completed: ${data.totalTables} tables created, ${data.totalImported} records imported.`);
                    }

                    setShowListImportModal(false);
                    setSelectedDatabaseForImport(null);
                    setListImportFile(null);
                    setListImportTableName('');
                    setListImportOverwrite(false);
                    
                    // Trigger refresh
                    queryClient.invalidateQueries(['databases']);
                  } catch (error) {
                    console.error('Import error:', error);
                    
                    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
                      toast.error('Import timeout. File may be too large or server is busy. Please try again with a smaller file.');
                    } else if (error.response?.status === 413) {
                      toast.error('File too large. Please use a file smaller than 20MB.');
                    } else if (error.response?.data?.message) {
                      toast.error(`Import failed: ${error.response.data.message}`);
                    } else {
                      toast.error('Failed to import Excel file. Please check your file and try again.');
                    }
                  } finally {
                    setIsListImporting(false);
                  }
                }}
                disabled={!listImportFile || !listImportTableName.trim() || isListImporting}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isListImporting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Creating Table...
                  </div>
                ) : (
                  'Create Table(s) & Import'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatabaseList; 