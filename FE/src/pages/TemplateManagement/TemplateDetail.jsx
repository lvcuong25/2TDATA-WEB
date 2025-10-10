import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../../utils/axiosInstance-cookie-only';
import { toast } from 'react-toastify';
import { useAuth } from '../../components/core/Auth';

const TemplateDetail = () => {
  const { templateId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === 'super_admin';
  
  // Check if templateId is undefined
  if (!templateId || templateId === 'undefined') {
    return (
      <div style={{ padding: '20px' }}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Template Not Found</h3>
          <p className="text-red-600 mt-1">Template ID is missing or invalid. Please check the URL and try again.</p>
          <button 
            onClick={() => navigate('/templates')}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Back to Templates
          </button>
        </div>
      </div>
    );
  }
  
  const [showCreateTableModal, setShowCreateTableModal] = useState(false);
  const [newTable, setNewTable] = useState({ name: '', description: '' });
  const [showEditTableModal, setShowEditTableModal] = useState(false);
  const [editingTable, setEditingTable] = useState({ index: -1, name: '', description: '' });

  // Fetch template details
  const { data: templateResponse, isLoading, error } = useQuery({
    queryKey: ['template', templateId],
    queryFn: async () => {
      const response = await axiosInstance.get(`/templates/${templateId}`);
      return response.data;
    },
    retry: 2,
    staleTime: 5 * 60 * 1000,
  });

  const template = templateResponse?.data;

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: async (templateData) => {
      const response = await axiosInstance.put(`/templates/admin/${templateId}`, templateData);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Template updated successfully');
      queryClient.invalidateQueries(['template', templateId]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update template');
    },
  });

  const handleCreateTable = async (e) => {
    e.preventDefault();
    if (!newTable.name.trim()) {
      toast.error('Table name is required');
      return;
    }

    const updatedTables = [...(template.tables || []), {
      name: newTable.name,
      description: newTable.description,
      columns: [],
      sampleData: []
    }];

    updateTemplateMutation.mutate({
      tables: updatedTables
    });

    setNewTable({ name: '', description: '' });
    setShowCreateTableModal(false);
  };

  const handleEditTable = async (e) => {
    e.preventDefault();
    if (!editingTable.name.trim()) {
      toast.error('Table name is required');
      return;
    }

    const updatedTables = [...(template.tables || [])];
    updatedTables[editingTable.index] = {
      ...updatedTables[editingTable.index],
      name: editingTable.name,
      description: editingTable.description
    };

    updateTemplateMutation.mutate({
      tables: updatedTables
    });

    setEditingTable({ index: -1, name: '', description: '' });
    setShowEditTableModal(false);
  };

  const handleDeleteTable = (tableIndex) => {
    if (!window.confirm(`Are you sure you want to delete "${template.tables[tableIndex].name}"?`)) {
      return;
    }

    const updatedTables = template.tables.filter((_, index) => index !== tableIndex);
    updateTemplateMutation.mutate({
      tables: updatedTables
    });
  };

  const handleEditTableClick = (tableIndex) => {
    const table = template.tables[tableIndex];
    setEditingTable({
      index: tableIndex,
      name: table.name,
      description: table.description || ''
    });
    setShowEditTableModal(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Template not found</h2>
          <p className="mt-2 text-gray-600">The template you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/templates')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Templates
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
            <button
              onClick={() => navigate('/templates')}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Templates
            </button>
            <h1 className="text-3xl font-bold text-gray-900">{template.name}</h1>
            <p className="mt-1 text-gray-600">{template.description}</p>
            <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
              <span>Tables: <span className="font-medium text-gray-900">{template.tables?.length || 0}</span></span>
              <span>Uses: <span className="font-medium text-gray-900">{template.usageCount || 0}</span></span>
            </div>
          </div>
          {isSuperAdmin && (
            <button
              onClick={() => setShowCreateTableModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              disabled={updateTemplateMutation.isPending}
            >
              {updateTemplateMutation.isPending ? 'Updating...' : '+ Add Table'}
            </button>
          )}
        </div>
      </div>

      {/* Tables List */}
      {!template.tables || template.tables.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No tables yet</h3>
          <p className="mt-1 text-sm text-gray-500">Start by adding your first table to this template.</p>
          {isSuperAdmin && (
            <div className="mt-6">
              <button
                onClick={() => setShowCreateTableModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                + Add Table
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {template.tables.map((table, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/templates/${templateId}/table/${index}`)}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-semibold text-gray-900">{table.name}</h3>
                      <p className="text-sm text-gray-500">Table</p>
                    </div>
                  </div>
                  {isSuperAdmin && (
                    <div className="flex space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditTableClick(index);
                        }}
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title="Edit table"
                        disabled={updateTemplateMutation.isPending}
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTable(index);
                        }}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Delete table"
                        disabled={updateTemplateMutation.isPending}
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
                
                {table.description && (
                  <p className="text-sm text-gray-600 mb-4">{table.description}</p>
                )}
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Columns: {table.columns?.length || 0}</span>
                  <span>Sample Data: {table.sampleData?.length || 0}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Table Modal */}
      {showCreateTableModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Add Table to Template</h2>
            <form onSubmit={handleCreateTable}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Table Name *
                </label>
                <input
                  type="text"
                  value={newTable.name}
                  onChange={(e) => setNewTable({ ...newTable, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Customers"
                  required
                  disabled={updateTemplateMutation.isPending}
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={newTable.description}
                  onChange={(e) => setNewTable({ ...newTable, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe this table..."
                  rows="3"
                  disabled={updateTemplateMutation.isPending}
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateTableModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  disabled={updateTemplateMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                  disabled={updateTemplateMutation.isPending}
                >
                  {updateTemplateMutation.isPending ? 'Adding...' : 'Add Table'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Table Modal */}
      {showEditTableModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Edit Table</h2>
            <form onSubmit={handleEditTable}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Table Name *
                </label>
                <input
                  type="text"
                  value={editingTable.name}
                  onChange={(e) => setEditingTable({ ...editingTable, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Customers"
                  required
                  disabled={updateTemplateMutation.isPending}
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={editingTable.description}
                  onChange={(e) => setEditingTable({ ...editingTable, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe this table..."
                  rows="3"
                  disabled={updateTemplateMutation.isPending}
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowEditTableModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  disabled={updateTemplateMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                  disabled={updateTemplateMutation.isPending}
                >
                  {updateTemplateMutation.isPending ? 'Updating...' : 'Update Table'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateDetail;
