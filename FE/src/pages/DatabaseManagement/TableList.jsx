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
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [copyingTable, setCopyingTable] = useState({ _id: '', name: '', description: '', targetDatabaseId: '' });
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name'); // 'name', 'createdAt', 'updatedAt'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' or 'desc'

  // Fetch database
  const { data: databaseResponse, isLoading: databaseLoading, error: databaseError } = useQuery({
    queryKey: ['database', databaseId],
    queryFn: async () => {
      const response = await axiosInstance.get(`/database/databases/${databaseId}`);
      return response.data;
    },
    enabled: !!databaseId,
  });

  // Fetch all databases for copy target selection
  const { data: allDatabasesResponse } = useQuery({
    queryKey: ['databases'],
    queryFn: async () => {
      const response = await axiosInstance.get('/database/databases');
      return response.data;
    },
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
  const allDatabases = allDatabasesResponse?.data || [];

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

  // Copy table mutation
  const copyTableMutation = useMutation({
    mutationFn: async (tableData) => {
      const response = await axiosInstance.post(`/database/tables/${tableData._id}/copy`, {
        name: tableData.name,
        description: tableData.description,
        targetDatabaseId: tableData.targetDatabaseId
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Table copied successfully');
      setShowCopyModal(false);
      setCopyingTable({ _id: '', name: '', description: '', targetDatabaseId: '' });
      queryClient.invalidateQueries(['tables', databaseId]);
      queryClient.invalidateQueries(['tables', copyingTable.targetDatabaseId]);
    },
    onError: (error) => {
      console.error('Error copying table:', error);
      toast.error(error.response?.data?.message || 'Failed to copy table');
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

  const handleCopyTable = async (e) => {
    e.preventDefault();
    if (!copyingTable.name.trim()) {
      toast.error('Table name is required');
      return;
    }
    if (!copyingTable.targetDatabaseId) {
      toast.error('Target database is required');
      return;
    }
    copyTableMutation.mutate(copyingTable);
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

  // Filter and sort tables
  const filteredAndSortedTables = React.useMemo(() => {
    let filtered = tables.filter(table => 
      table.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (table.description && table.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Sort tables
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
  }, [tables, searchTerm, sortBy, sortOrder]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{database.name}</h1>
            <p className="mt-1 text-gray-600">Quản lý các bảng trong database</p>
            {database.description && (
              <p className="mt-2 text-sm text-gray-500">{database.description}</p>
            )}
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            disabled={createTableMutation.isPending}
          >
            {createTableMutation.isPending ? 'Creating...' : '+ Tạo mới Table'}
          </button>
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
                placeholder="Tìm kiếm tables..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
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
                <option value="updatedAt-desc">Cập nhật gần đây</option>
                <option value="updatedAt-asc">Cập nhật xa nhất</option>
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
          <span>Tổng cộng: <span className="font-medium text-gray-900">{tables.length}</span> tables</span>
          {searchTerm && (
            <span>Kết quả tìm kiếm: <span className="font-medium text-gray-900">{filteredAndSortedTables.length}</span> tables</span>
          )}
        </div>
      </div>

      {/* Tables Display */}
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
      ) : filteredAndSortedTables.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Không tìm thấy table nào</h3>
          <p className="mt-1 text-sm text-gray-500">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc.</p>
        </div>
      ) : (
        <>
          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedTables.map((table) => (
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
                  <div className="flex space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCopyingTable({
                          _id: table._id,
                          name: `${table.name} - Copy`,
                          description: table.description || '',
                          targetDatabaseId: databaseId
                        });
                        setShowCopyModal(true);
                      }}
                      className="text-green-600 hover:text-green-800 p-1"
                      title="Sao chép table"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTable(table._id, table.name);
                      }}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Xóa table"
                      disabled={deleteTableMutation.isPending}
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
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

          {/* List View */}
          {viewMode === 'list' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Table
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mô tả
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
                      <th 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                        onClick={() => handleSort('updatedAt')}
                      >
                        <div className="flex items-center">
                          Cập nhật
                          {sortBy === 'updatedAt' && (
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
                    {filteredAndSortedTables.map((table) => (
                      <tr 
                        key={table._id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => navigate(`/database/${databaseId}/table/${table._id}`)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                              <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{table.name}</div>
                              <div className="text-sm text-gray-500">Table</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {table.description || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(table.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(table.updatedAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setCopyingTable({
                                  _id: table._id,
                                  name: `${table.name} - Copy`,
                                  description: table.description || '',
                                  targetDatabaseId: databaseId
                                });
                                setShowCopyModal(true);
                              }}
                              className="text-green-600 hover:text-green-800 p-1"
                              title="Sao chép table"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTable(table._id, table.name);
                              }}
                              className="text-red-600 hover:text-red-800 p-1"
                              title="Xóa table"
                              disabled={deleteTableMutation.isPending}
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

      {/* Copy Table Modal */}
      {showCopyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Sao chép Table</h2>
            <form onSubmit={handleCopyTable}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên Table mới *
                </label>
                <input
                  type="text"
                  value={copyingTable.name}
                  onChange={(e) => setCopyingTable({ ...copyingTable, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Ví dụ: Products - Copy"
                  required
                  disabled={copyTableMutation.isPending}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Database đích *
                </label>
                <select
                  value={copyingTable.targetDatabaseId}
                  onChange={(e) => setCopyingTable({ ...copyingTable, targetDatabaseId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                  disabled={copyTableMutation.isPending}
                >
                  <option value="">Chọn database đích</option>
                  {allDatabases.map((db) => (
                    <option key={db._id} value={db._id}>
                      {db.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mô tả (tùy chọn)
                </label>
                <textarea
                  value={copyingTable.description}
                  onChange={(e) => setCopyingTable({ ...copyingTable, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Mô tả về table này..."
                  rows="3"
                  disabled={copyTableMutation.isPending}
                />
              </div>
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  <strong>Lưu ý:</strong> Việc sao chép sẽ tạo ra một table mới với tất cả columns và dữ liệu từ table gốc.
                </p>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCopyModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  disabled={copyTableMutation.isPending}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                  disabled={copyTableMutation.isPending}
                >
                  {copyTableMutation.isPending ? 'Copying...' : 'Sao chép'}
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
