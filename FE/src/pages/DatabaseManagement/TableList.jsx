import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../../utils/axiosInstance-cookie-only';
import { toast } from 'react-toastify';

const TableList = () => {
  const { databaseId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTable, setNewTable] = useState({ name: '', description: '' });

  // Fetch database
  const { data: databaseResponse, isLoading: databaseLoading, error: databaseError } = useQuery({
    queryKey: ['database', databaseId],
    queryFn: async () => {
      const response = await axiosInstance.get(`/database/databases/${databaseId}`);
      return response.data;
    },
    enabled: !!databaseId,
  });

  // Fetch tables
  const { data: tablesResponse, isLoading: tablesLoading, error: tablesError } = useQuery({
    queryKey: ['tables', databaseId],
    queryFn: async () => {
      const response = await axiosInstance.get(`/database/databases/${databaseId}/tables`);
      return response.data;
    },
    enabled: !!databaseId,
  });

  // Extract data from responses
  const database = databaseResponse?.data;
  const tables = tablesResponse?.data || [];

  // Create table mutation
  const createTableMutation = useMutation({
    mutationFn: async (tableData) => {
      const response = await axiosInstance.post('/database/tables', {
        ...tableData,
        databaseId
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Table created successfully');
      setShowCreateModal(false);
      setNewTable({ name: '', description: '' });
      queryClient.invalidateQueries(['tables', databaseId]);
    },
    onError: (error) => {
      console.error('Error creating table:', error);
      toast.error(error.response?.data?.message || 'Failed to create table');
    },
  });

  // Delete table mutation
  const deleteTableMutation = useMutation({
    mutationFn: async (tableId) => {
      const response = await axiosInstance.delete(`/database/tables/${tableId}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Table deleted successfully');
      queryClient.invalidateQueries(['tables', databaseId]);
    },
    onError: (error) => {
      console.error('Error deleting table:', error);
      toast.error('Failed to delete table');
    },
  });

  const handleCreateTable = async (e) => {
    e.preventDefault();
    createTableMutation.mutate(newTable);
  };

  const handleDeleteTable = async (tableId, tableName) => {
    if (!window.confirm(`Are you sure you want to delete "${tableName}"? This will delete all columns and data inside.`)) {
      return;
    }
    deleteTableMutation.mutate(tableId);
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

  const isLoading = databaseLoading || tablesLoading;
  const error = databaseError || tablesError;

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
          <h2 className="text-xl font-semibold text-gray-900">Error loading database information</h2>
          <p className="mt-2 text-gray-600">{error.message}</p>
          <button
            onClick={() => navigate('/database')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Databases
          </button>
        </div>
      </div>
    );
  }

  if (!database) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Database not found</h2>
          <button
            onClick={() => navigate('/database')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Databases
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{database.name}</h1>
            <p className="mt-1 text-gray-600">Quản lý các bảng trong database</p>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {database.description && <p>{database.description}</p>}
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            disabled={createTableMutation.isPending}
          >
            {createTableMutation.isPending ? 'Creating...' : '+ Tạo mới Table'}
          </button>
        </div>
      </div>

      {/* Tables Grid */}
      {tables.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Chưa có table nào</h3>
          <p className="mt-1 text-sm text-gray-500">Bắt đầu bằng cách tạo table đầu tiên của bạn.</p>
          <div className="mt-6">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              + Tạo Table
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tables.map((table) => (
            <div
              key={table._id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/database/${databaseId}/table/${table._id}`)}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-semibold text-gray-900">{table.name}</h3>
                      <p className="text-sm text-gray-500">Table</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTable(table._id, table.name);
                    }}
                    className="text-red-600 hover:text-red-800 p-1"
                    title="Xóa table"
                    disabled={deleteTableMutation.isPending}
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
                
                {table.description && (
                  <p className="text-sm text-gray-600 mb-4">{table.description}</p>
                )}
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Tạo: {formatDate(table.createdAt)}</span>
                  <span>Cập nhật: {formatDate(table.updatedAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Table Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Tạo Table mới</h2>
            <form onSubmit={handleCreateTable}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên Table *
                </label>
                <input
                  type="text"
                  value={newTable.name}
                  onChange={(e) => setNewTable({ ...newTable, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ví dụ: Products"
                  required
                  disabled={createTableMutation.isPending}
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mô tả (tùy chọn)
                </label>
                <textarea
                  value={newTable.description}
                  onChange={(e) => setNewTable({ ...newTable, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Mô tả về table này..."
                  rows="3"
                  disabled={createTableMutation.isPending}
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  disabled={createTableMutation.isPending}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                  disabled={createTableMutation.isPending}
                >
                  {createTableMutation.isPending ? 'Creating...' : 'Tạo Table'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableList;
