import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { toast } from 'react-toastify';
import axiosInstance from '../../../utils/axiosInstance-cookie-only';

/**
 * Custom hook for managing template table data fetching and mutations
 * @param {string} templateId - Template ID
 * @param {string} tableIndex - Table index in template
 * @param {Object} context - Table context with selectedRowKeys, setSelectedRowKeys, etc.
 * @param {Object} modalCallbacks - Callbacks for modal state management
 * @returns {Object} All queries and mutations
 */
export const useTemplateTableData = (templateId, tableIndex, context, modalCallbacks) => {
  const queryClient = useQueryClient();

  // Force refetch when component mounts to ensure fresh data
  useEffect(() => {
    if (templateId) {
      queryClient.invalidateQueries(['template', templateId]);
      queryClient.refetchQueries(['template', templateId]);
    }
  }, [templateId, queryClient]);

  const { 
    selectedRowKeys, 
    setSelectedRowKeys, 
    selectAll, 
    setSelectAll, 
    setAllRecords 
  } = context;

  // Fetch template table details
  const { data: templateTableResponse, isLoading, error } = useQuery({
    queryKey: ['templateTable', templateId, tableIndex],
    queryFn: async () => {
      const response = await axiosInstance.get(`/templates/admin/${templateId}/tables/${tableIndex}`);
      return response.data;
    },
    enabled: !!templateId && tableIndex !== undefined,
    retry: 2,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch template records
  const { data: recordsResponse } = useQuery({
    queryKey: ['templateRecords', templateId, tableIndex],
    queryFn: async () => {
      const response = await axiosInstance.get(`/templates/admin/${templateId}/tables/${tableIndex}/records`);
      return response.data;
    },
    enabled: !!templateId && tableIndex !== undefined,
    retry: 2,
    staleTime: 5 * 60 * 1000,
  });

  const template = templateTableResponse?.data?.template;
  const table = templateTableResponse?.data?.table;
  const columns = table?.columns || [];
  

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

  // Add column mutation
  const addColumnMutation = useMutation({
    mutationFn: async (columnData) => {
      const response = await axiosInstance.post(`/templates/admin/${templateId}/tables/${tableIndex}/columns`, columnData);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Column added successfully');
      queryClient.invalidateQueries(['templateTable', templateId, tableIndex]);
      modalCallbacks?.onAddColumnSuccess?.();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to add column');
    },
  });

  // Update column mutation
  const updateColumnMutation = useMutation({
    mutationFn: async ({ columnId, columnData }) => {
      const response = await axiosInstance.put(`/templates/admin/${templateId}/tables/${tableIndex}/columns/${columnId}`, columnData);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Column updated successfully');
      queryClient.invalidateQueries(['templateTable', templateId, tableIndex]);
      modalCallbacks?.onEditColumnSuccess?.();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update column');
    },
  });

  // Delete column mutation
  const deleteColumnMutation = useMutation({
    mutationFn: async (columnId) => {
      const response = await axiosInstance.delete(`/templates/admin/${templateId}/tables/${tableIndex}/columns/${columnId}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Column deleted successfully');
      queryClient.invalidateQueries(['templateTable', templateId, tableIndex]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete column');
    },
  });

  // Reorder columns mutation
  const reorderColumnsMutation = useMutation({
    mutationFn: async (columnIds) => {
      const response = await axiosInstance.put(`/templates/admin/${templateId}/tables/${tableIndex}/columns/reorder`, {
        columnIds
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Columns reordered successfully');
      queryClient.invalidateQueries(['templateTable', templateId, tableIndex]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to reorder columns');
    },
  });

  // Mock mutations for compatibility
  const saveGroupPreferenceMutation = useMutation({
    mutationFn: async (data) => {
      // Mock implementation - templates don't need group preferences
      // Just return empty data to avoid errors
      return { data: { groupRules: [], expandedGroups: [] } };
    },
  });

  const saveFieldPreferenceMutation = useMutation({
    mutationFn: async (data) => {
      // Mock implementation - templates don't need field preferences
      return Promise.resolve();
    },
  });

  const addRecordMutation = useMutation({
    mutationFn: async (data) => {
      const response = await axiosInstance.post(`/templates/admin/${templateId}/tables/${tableIndex}/records`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['templateTable', templateId, tableIndex]);
      queryClient.invalidateQueries(['templateRecords', templateId, tableIndex]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to add record');
    },
  });

  const updateRecordMutation = useMutation({
    mutationFn: async ({ recordId, data }) => {
      const response = await axiosInstance.put(`/templates/admin/${templateId}/tables/${tableIndex}/records/${recordId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['templateRecords', templateId, tableIndex]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update record');
    },
  });

  const deleteRecordMutation = useMutation({
    mutationFn: async (recordId) => {
      const response = await axiosInstance.delete(`/templates/admin/${templateId}/tables/${tableIndex}/records/${recordId}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Record deleted successfully');
      queryClient.invalidateQueries(['templateRecords', templateId, tableIndex]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete record');
    },
  });

  const deleteMultipleRecordsMutation = useMutation({
    mutationFn: async (recordIds) => {
      const response = await axiosInstance.delete(`/templates/admin/${templateId}/tables/${tableIndex}/records/bulk`, {
        data: { recordIds }
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`${data.data.deletedCount} record(s) deleted successfully`);
      queryClient.invalidateQueries(['templateRecords', templateId, tableIndex]);
      // Clear selected rows after successful deletion
      setSelectedRowKeys([]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete records');
    },
  });

  const deleteAllRecordsMutation = useMutation({
    mutationFn: async (data) => {
      // Mock implementation - templates don't have records
      return Promise.resolve();
    },
  });

  // Permission checks (simplified for templates)
  const canViewTable = true; // Templates are viewable by all
  const canEditStructure = true; // Assume can edit for now
  const canEditData = true; // Allow editing for testing
  const canAddData = true; // Allow clicking for testing, but show message
  const canAddView = false; // Not applicable for templates
  const canEditView = false; // Not applicable for templates

  // Create mock response objects to match the expected format
  const groupPreferenceResponse = { data: { groupRules: [], expandedGroups: [] } };
  const fieldPreferenceResponse = { data: null };
  const tableStructureResponse = { 
    data: {
      table: table,
      columns: columns
    }
  };
  // Use real records data from API
  // const recordsResponse = { data: [] }; // Templates don't have records
  const columnPermissionsResponse = { data: [] };
  const recordPermissionsResponse = { data: [] };
  const cellPermissionsResponse = { data: [] }; // Empty permissions = allow all
  const databaseMembersResponse = { data: [] };

  return {
    // Response objects (matching DatabaseManagement format)
    groupPreferenceResponse,
    fieldPreferenceResponse,
    tableStructureResponse,
    recordsResponse,
    columnPermissionsResponse,
    recordPermissionsResponse,
    cellPermissionsResponse,
    databaseMembersResponse,
    
    // Data
    template,
    table,
    columns,
    allRecords: [], // Templates don't have records
    
    // Loading states
    isLoading,
    error,
    
    // Mutations
    updateTemplateMutation,
    addColumnMutation,
    updateColumnMutation,
    deleteColumnMutation,
    reorderColumnsMutation,
    saveGroupPreferenceMutation,
    saveFieldPreferenceMutation,
    addRecordMutation,
    updateRecordMutation,
    deleteRecordMutation,
    deleteMultipleRecordsMutation,
    deleteAllRecordsMutation,
    
    // Permission checks
    canViewTable,
    canEditStructure,
    canEditData,
    canAddData,
    canAddView,
    canEditView,
    tablePermissionsLoading: false,
  };
};
