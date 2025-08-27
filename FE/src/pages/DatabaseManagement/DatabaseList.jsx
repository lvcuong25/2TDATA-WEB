import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../../utils/axiosInstance-cookie-only';
import { toast } from 'react-toastify';

const DatabaseList = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDatabase, setNewDatabase] = useState({ name: '', description: '' });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDatabase, setEditingDatabase] = useState({ _id: '', name: '', description: '' });
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

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

  // Create database mutation
  const createDatabaseMutation = useMutation({
    mutationFn: async (databaseData) => {
      const response = await axiosInstance.post('/database/databases', databaseData);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Database created successfully');
      setShowCreateModal(false);
      setNewDatabase({ name: '', description: '' });
      queryClient.invalidateQueries(['databases']);
    },
    onError: (error) => {
      console.error('Error creating database:', error);
      toast.error(error.response?.data?.message || 'Failed to create database');
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

  const handleCreateDatabase = async (e) => {
    e.preventDefault();
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
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              disabled={createDatabaseMutation.isPending}
            >
              {createDatabaseMutation.isPending ? 'Creating...' : '+ Tạo mới Database'}
            </button>
          </div>
        </div>
      </div>

      {/* Database Grid */}
      {databases.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Chưa có database nào</h3>
          <p className="mt-1 text-sm text-gray-500">Bắt đầu bằng cách tạo database đầu tiên của bạn.</p>
          <div className="mt-6">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              + Tạo Database
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {databases.map((database) => (
                <div
                  key={database._id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/database/${database._id}/tables`)}
                >
                  <div className="p-6">
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
                    
                    {database.description && (
                      <p className="text-sm text-gray-600 mb-4">{database.description}</p>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Tạo: {formatDate(database.createdAt)}</span>
                      <span>Cập nhật: {formatDate(database.updatedAt)}</span>
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
                    {databases.map((database) => (
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
                  {createDatabaseMutation.isPending ? 'Creating...' : 'Tạo Database'}
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
    </div>
  );
};

export default DatabaseList; 