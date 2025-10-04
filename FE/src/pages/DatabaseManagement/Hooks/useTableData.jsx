import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { toast } from 'react-toastify';
import axiosInstance from '../../../utils/axiosInstance-cookie-only';
import { isSuperAdmin, getUserDatabaseRole } from '../Utils/permissionUtils.jsx';

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

  // Force refetch when component mounts to ensure fresh data
  useEffect(() => {
    if (tableId) {
      queryClient.invalidateQueries(['tableStructure', tableId]);
      queryClient.invalidateQueries({ queryKey: ['tableRecords', tableId], exact: false });
      queryClient.refetchQueries(['tableStructure', tableId]);
      queryClient.refetchQueries({ queryKey: ['tableRecords', tableId], exact: false });
    }
  }, [tableId, queryClient]);
  const { 
    selectedRowKeys, 
    setSelectedRowKeys, 
    selectAll, 
    setSelectAll, 
    setAllRecords 
  } = context;

  // Fetch table permissions - KEEP ENABLED (only disable column/record/cell permissions)
  const { data: tablePermissionsResponse, isLoading: tablePermissionsLoading } = useQuery({
    queryKey: ['table-permissions', tableId],
    queryFn: async () => {
      const response = await axiosInstance.get(`/permissions/tables/${tableId}/permissions`);
      return response.data;
    },
    enabled: !!tableId, // Keep enabled for table permissions
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Extract table permissions for current user
  const tablePermissions = tablePermissionsResponse?.data || [];
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  
  // Helper function to check table permission
  const checkTablePermission = (permission, userRole = null) => {
    if (!currentUser._id) return false;
    
    // Super admin có tất cả quyền
    if (isSuperAdmin(currentUser)) {
      return true;
    }
    
    // Check if user is owner (only owner has all permissions by default)
    if (userRole === 'owner') {
      console.log('✅ User is owner, bypassing permission check for:', permission);
      return true;
    }
    
    // Check specific user permissions first
    const specificUserPermission = tablePermissions.find(p => 
      p.targetType === 'specific_user' && 
      p.userId?._id === currentUser._id && 
      p.permissions?.[permission] === true
    );
    if (specificUserPermission) return true;
    
    // Check specific role permissions
    const specificRolePermission = tablePermissions.find(p => 
      p.targetType === 'specific_role' && 
      p.role === 'member' && // Assuming current user is member
      p.permissions?.[permission] === true
    );
    if (specificRolePermission) return true;
    
    // Check all members permissions
    const allMembersPermission = tablePermissions.find(p => 
      p.targetType === 'all_members' && 
      p.permissions?.[permission] === true
    );
    if (allMembersPermission) return true;
    
    return false;
  };


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
      // console.log('Group preference saved successfully');
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
      // console.log('Field preference saved successfully');
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
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    staleTime: 0
  });

  // Fetch table records
  const { data: recordsResponse } = useQuery({
    queryKey: ['tableRecords', tableId, sortRules, filterRules, isFilterActive],
    queryFn: async () => {
      const sortRulesParam = sortRules.length > 0 ? JSON.stringify(sortRules) : undefined;
      const filterRulesParam = isFilterActive && filterRules.length > 0 ? JSON.stringify(filterRules) : undefined;
      
      console.log('🔄 Frontend: Fetching records with sortRules:', sortRules);
      console.log('🔄 Frontend: sortRulesParam:', sortRulesParam);
      
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
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    staleTime: 0,
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

  // Fetch column permissions - TEMPORARILY DISABLED FOR TESTING
  const { data: columnPermissionsResponse, error: columnPermissionsError, isLoading: columnPermissionsLoading } = useQuery({
    queryKey: ['columnPermissions', tableId],
    queryFn: async () => {
      // Return empty permissions for testing
      return { data: [] };
    },
    enabled: false, // Disabled for testing
  });

  // Debug column permissions query
  useEffect(() => {
    if (tableId) {
      // console.log(`🔍 Column Permissions Query State:`, {
      //   tableId,
      //   isLoading: columnPermissionsLoading,
      //   error: columnPermissionsError,
      //   data: columnPermissionsResponse
      // });
    }
  }, [tableId, columnPermissionsLoading, columnPermissionsError, columnPermissionsResponse]);

  // Fetch record permissions - TEMPORARILY DISABLED FOR TESTING
  const { data: recordPermissionsResponse } = useQuery({
    queryKey: ['recordPermissions', tableId],
    queryFn: async () => {
      // Return empty permissions for testing
      return { data: [] };
    },
    enabled: false, // Disabled for testing
  });

  // Fetch cell permissions - TEMPORARILY DISABLED FOR TESTING
  const { data: cellPermissionsResponse } = useQuery({
    queryKey: ['cellPermissions', tableId],
    queryFn: async () => {
      // Return empty permissions for testing
      return { data: [] };
    },
    enabled: false, // Disabled for testing
  });

  // Fetch database members for user role
  const { data: databaseMembersResponse, error: databaseMembersError, isLoading: databaseMembersLoading } = useQuery({
    queryKey: ['databaseMembers', databaseId],
    queryFn: async () => {
      // console.log(`🔍 Fetching database members for databaseId: ${databaseId}`);
      try {
        const response = await axiosInstance.get(`/database/databases/${databaseId}/members`);
        // console.log(`🔍 Database members response:`, response.data);
        return response.data;
      } catch (error) {
        console.error(`🔍 Database members API error:`, error);
        // If still getting permission error, try test route as fallback
        if (error.response?.data?.error === 'no_manage_permission') {
          // console.log(`🔍 Trying test route as fallback...`);
          const testResponse = await axiosInstance.get(`/database/databases/${databaseId}/members-test`);
          // console.log(`🔍 Test route response:`, testResponse.data);
          return testResponse.data;
        }
        throw error;
      }
    },
    enabled: !!databaseId,
    retry: 1,
    retryDelay: 1000,
  });

  // Calculate user role after databaseMembersResponse is available
  const userRole = getUserDatabaseRole(databaseMembersResponse?.data || [], currentUser);
  
  // Permission checks - TABLE PERMISSIONS ENABLED (only disable column/record/cell permissions)
  const canViewTable = checkTablePermission('canView', userRole);
  const canEditStructure = checkTablePermission('canEditStructure', userRole);
  const canEditData = checkTablePermission('canEditData', userRole);
  const canAddData = checkTablePermission('canAddData', userRole);
  const canAddView = checkTablePermission('canAddView', userRole);
  const canEditView = checkTablePermission('canEditView', userRole);

  // Debug database members query
  useEffect(() => {
    if (databaseId) {
      // console.log(`🔍 Database Members Query State:`, {
      //   databaseId,
      //   isLoading: databaseMembersLoading,
      //   error: databaseMembersError,
      //   data: databaseMembersResponse
      // });
    }
  }, [databaseId, databaseMembersLoading, databaseMembersError, databaseMembersResponse]);

  // Debug when databaseId changes
  useEffect(() => {
    // console.log(`🔍 DatabaseId changed:`, databaseId);
    // console.log(`🔍 useQuery enabled:`, !!databaseId);
  }, [databaseId]);

  // Debug useQuery state
  useEffect(() => {
    // console.log(`🔍 Database Members useQuery State:`, {
    //   databaseId,
    //   enabled: !!databaseId,
    //   isLoading: databaseMembersLoading,
    //   error: databaseMembersError,
    //   data: databaseMembersResponse
    // });
  }, [databaseId, databaseMembersLoading, databaseMembersError, databaseMembersResponse]);

  return {
    // Queries
    groupPreferenceResponse,
    fieldPreferenceResponse,
    tableStructureResponse,
    recordsResponse,
    columnPermissionsResponse,
    recordPermissionsResponse,
    cellPermissionsResponse,
    databaseMembersResponse,
    tablePermissionsResponse,
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
    
    // Permission checks
    canViewTable,
    canEditStructure,
    canEditData,
    canAddData,
    canAddView,
    canEditView,
    tablePermissionsLoading,
    
    // Query client for manual invalidation
    queryClient
  };
};
