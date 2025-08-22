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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Cơ sở dữ liệu</h1>
              <p className="mt-2 text-gray-600">Quản lý các cơ sở dữ liệu của bạn</p>
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
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteDatabase(database._id, database.name);
                      }}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Xóa database"
                      disabled={deleteDatabaseMutation.isPending}
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
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
      </div>
    </div>
  );
};

export default DatabaseList; 