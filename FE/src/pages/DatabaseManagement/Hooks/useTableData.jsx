import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import axiosInstance from '../../../utils/axiosInstance-cookie-only';

/**
 * Custom hook for managing table data fetching and mutations
 * @param {string} tableId - Table ID
 * @param {string} databaseId - Database ID
 * @param {Array} sortRules - Sort rules
 * @param {Array} filterRules - Filter rules
 * @param {boolean} isFilterActive - Whether filter is active
 * @param {Object} context - Table context with selectedRowKeys, setSelectedRowKeys, etc.
 * @param {Object} modalCallbacks - Callbacks for modal state management
 * @returns {Object} All queries and mutations
 */
export const useTableData = (tableId, databaseId, sortRules, filterRules, isFilterActive, context, modalCallbacks) => {
  const queryClient = useQueryClient();
  const { 
    selectedRowKeys, 
    setSelectedRowKeys, 
    selectAll, 
    setSelectAll, 
    setAllRecords 
  } = context;

  // Fetch group preferences from backend
  const { data: groupPreferenceResponse } = useQuery({
    queryKey: ['groupPreference', tableId],
    queryFn: async () => {
      const response = await axiosInstance.get(`/database/tables/${tableId}/group-preference`);
      return response.data;
    },
    enabled: !!tableId,
  });

  // Save group preference mutation
  const saveGroupPreferenceMutation = useMutation({
    mutationFn: async ({ groupRules, expandedGroups }) => {
      const response = await axiosInstance.post(`/database/tables/${tableId}/group-preference`, {
        groupRules,
        expandedGroups: Array.from(expandedGroups)
      });
      return response.data;
    },
    onSuccess: () => {
      console.log('Group preference saved successfully');
    },
    onError: (error) => {
      console.error('Error saving group preference:', error);
    },
  });

  // Fetch field preferences from backend
  const { data: fieldPreferenceResponse } = useQuery({
    queryKey: ['fieldPreference', tableId],
    queryFn: async () => {
      const response = await axiosInstance.get(`/database/tables/${tableId}/field-preference`);
      return response.data;
    },
    enabled: !!tableId,
  });

  // Save field preference mutation
  const saveFieldPreferenceMutation = useMutation({
    mutationFn: async ({ fieldVisibility, showSystemFields }) => {
      const response = await axiosInstance.post(`/database/tables/${tableId}/field-preference`, {
        fieldVisibility,
        showSystemFields
      });
      return response.data;
    },
    onSuccess: () => {
      console.log('Field preference saved successfully');
    },
    onError: (error) => {
      console.error('Error saving field preference:', error);
    },
  });

  // Fetch table structure
  const { data: tableStructureResponse, isLoading, error } = useQuery({
    queryKey: ['tableStructure', tableId],
    queryFn: async () => {
      const response = await axiosInstance.get(`/database/tables/${tableId}/structure`);
      return response.data;
    },
    enabled: !!tableId,
  });

  // Fetch table records
  const { data: recordsResponse } = useQuery({
    queryKey: ['tableRecords', tableId, sortRules, filterRules, isFilterActive],
    queryFn: async () => {
      const sortRulesParam = sortRules.length > 0 ? JSON.stringify(sortRules) : undefined;
      const filterRulesParam = isFilterActive && filterRules.length > 0 ? JSON.stringify(filterRules) : undefined;
      const response = await axiosInstance.get(`/database/tables/${tableId}/records`, {
        params: {
          sortRules: sortRulesParam,
          filterRules: filterRulesParam,
          // Force ascending order when no sort rules are applied
          forceAscending: sortRules.length === 0 ? 'true' : undefined
        }
      });
      return response.data;
    },
    enabled: !!tableId,
  });

  // Add column mutation
  const addColumnMutation = useMutation({
    mutationFn: async (columnData) => {
      const response = await axiosInstance.post('/database/columns', {
        ...columnData,
        tableId,
        databaseId
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Thêm cột thành công');
      queryClient.invalidateQueries(['tableStructure', tableId]);
      
      // Close modal and reset form
      if (modalCallbacks?.onAddColumnSuccess) {
        modalCallbacks.onAddColumnSuccess();
      }
    },
    onError: (error) => {
      console.error('Error adding column:', error);
      toast.error(error.response?.data?.message || 'Không thể thêm cột');
    },
  });

  // Add record mutation
  const addRecordMutation = useMutation({
    mutationFn: async (recordData) => {
      const response = await axiosInstance.post('/database/records', {
        ...recordData,
        tableId,
        databaseId
      });
      return response.data;
    },
    onSuccess: () => {
      // toast.success('Record added successfully');
      queryClient.invalidateQueries(['tableRecords', tableId]);
    },
    onError: (error) => {
      console.error('Error adding record:', error);
      // toast.error(error.response?.data?.message || 'Failed to add record');
    },
  });

  // Update record mutation
  const updateRecordMutation = useMutation({
    mutationFn: async ({ recordId, data }) => {
      const response = await axiosInstance.put(`/database/records/${recordId}`, {
        data,
        tableId,
        databaseId
      });
      return response.data;
    },
    onSuccess: (data, variables) => {
      // toast.success('Record updated successfully');
      queryClient.invalidateQueries(['tableRecords', tableId]);
    },
    onError: (error) => {
      console.error('Error updating record:', error);
      // toast.error(error.response?.data?.message || 'Failed to update record');
    },
  });

  // Delete record mutation
  const deleteRecordMutation = useMutation({
    mutationFn: async (recordId) => {
      const response = await axiosInstance.delete(`/database/records/${recordId}`);
      return response.data;
    },
    onSuccess: () => {
      // toast.success('Record deleted successfully');
      queryClient.invalidateQueries(['tableRecords', tableId]);
    },
    onError: (error) => {
      console.error('Error deleting record:', error);
      // toast.error(error.response?.data?.message || 'Failed to delete record');
    },
  });

  // Bulk delete records mutation
  const deleteMultipleRecordsMutation = useMutation({
    mutationFn: async (recordIds) => {
      const response = await axiosInstance.delete('/database/records/bulk', {
        data: { recordIds }
      });
      return response.data;
    },
    onSuccess: (data) => {
      // toast.success(`${data.deletedCount} records deleted successfully`);
      setSelectedRowKeys([]);
      setSelectAll(false);
      queryClient.invalidateQueries(['tableRecords', tableId]);
    },
    onError: (error) => {
      console.error('Error deleting records:', error);
      // toast.error(error.response?.data?.message || 'Failed to delete records');
    },
  });

  // Delete all records mutation
  const deleteAllRecordsMutation = useMutation({
    mutationFn: async () => {
      const response = await axiosInstance.delete(`/database/tables/${tableId}/records/all`);
      return response.data;
    },
    onSuccess: (data) => {
      // toast.success(`All ${data.deletedCount} records deleted successfully`);
      setSelectedRowKeys([]);
      setSelectAll(false);
      queryClient.invalidateQueries(['tableRecords', tableId]);
    },
    onError: (error) => {
      console.error('Error deleting all records:', error);
      // toast.error(error.response?.data?.message || 'Failed to delete all records');
    },
  });

  // Update column mutation
  const updateColumnMutation = useMutation({
    mutationFn: async ({ columnId, columnData }) => {
      const response = await axiosInstance.put(`/database/columns/${columnId}`, columnData);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Cập nhật cột thành công');
      queryClient.invalidateQueries(['tableStructure', tableId]);
      
      // Close modal and reset form
      if (modalCallbacks?.onEditColumnSuccess) {
        modalCallbacks.onEditColumnSuccess();
      }
    },
    onError: (error) => {
      console.error('Error updating column:', error);
      toast.error(error.response?.data?.message || 'Không thể cập nhật cột');
    },
  });

  // Delete column mutation
  const deleteColumnMutation = useMutation({
    mutationFn: async (columnId) => {
      const response = await axiosInstance.delete(`/database/columns/${columnId}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Xóa cột thành công');
      queryClient.invalidateQueries(['tableStructure', tableId]);
    },
    onError: (error) => {
      console.error('Error deleting column:', error);
      toast.error(error.response?.data?.message || 'Không thể xóa cột');
    },
  });

  return {
    // Queries
    groupPreferenceResponse,
    fieldPreferenceResponse,
    tableStructureResponse,
    recordsResponse,
    isLoading,
    error,
    
    // Mutations
    saveGroupPreferenceMutation,
    saveFieldPreferenceMutation,
    addColumnMutation,
    addRecordMutation,
    updateRecordMutation,
    deleteRecordMutation,
    deleteMultipleRecordsMutation,
    deleteAllRecordsMutation,
    updateColumnMutation,
    deleteColumnMutation,
    
    // Query client for manual invalidation
    queryClient
  };
};
