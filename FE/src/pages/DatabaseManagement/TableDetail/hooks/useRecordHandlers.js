import { useState } from 'react';
import { toast } from 'react-toastify';
import axiosInstance from '../../../../utils/axiosInstance-cookie-only';

export const useRecordHandlers = ({ databaseId, tableId, queryClient, selectedRowKeys, setSelectedRowKeys }) => {
  const [editingCell, setEditingCell] = useState({ recordId: null, column: null, value: null });
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, recordId: null });

  const handleAddRow = async () => {
    try {
      const response = await axiosInstance.post(
        `/database/tables/${tableId}/records`,
        {}
      );
      
      if (response.data) {
        queryClient.invalidateQueries(['records', databaseId, tableId]);
        toast.success('Thêm dòng mới thành công');
      }
    } catch (error) {
      console.error('Error adding row:', error);
      toast.error(error.response?.data?.message || 'Lỗi khi thêm dòng');
    }
  };

  const handleAddRowToGroup = async (groupValues, groupRules) => {
    try {
      const newRowData = {};
      
      groupRules.forEach((rule, index) => {
        if (rule.field && groupValues[index] !== undefined) {
          newRowData[rule.field] = groupValues[index];
        }
      });

      const response = await axiosInstance.post(
        `/database/tables/${tableId}/records`,
        newRowData
      );
      
      if (response.data) {
        queryClient.invalidateQueries(['records', databaseId, tableId]);
        toast.success('Thêm dòng mới vào nhóm thành công');
      }
    } catch (error) {
      console.error('Error adding row to group:', error);
      toast.error(error.response?.data?.message || 'Lỗi khi thêm dòng vào nhóm');
    }
  };

  const handleDeleteRecord = async (recordId) => {
    try {
      await axiosInstance.delete(
        `/database/records/${recordId}`
      );
      queryClient.invalidateQueries(['records', databaseId, tableId]);
      toast.success('Xóa dòng thành công');
    } catch (error) {
      console.error('Error deleting record:', error);
      toast.error(error.response?.data?.message || 'Lỗi khi xóa dòng');
    }
  };

  const handleDeleteAllRecords = async () => {
    try {
      await axiosInstance.delete(`/database/tables/${tableId}/records`);
      queryClient.invalidateQueries(['records', databaseId, tableId]);
      setSelectedRowKeys([]);
      toast.success('Đã xóa tất cả dữ liệu');
    } catch (error) {
      console.error('Error deleting all records:', error);
      toast.error(error.response?.data?.message || 'Lỗi khi xóa dữ liệu');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRowKeys.length === 0) {
      toast.warning('Vui lòng chọn ít nhất một dòng để xóa');
      return;
    }

    try {
      await axiosInstance.post(
        `/database/records/bulk-delete`,
        { recordIds: selectedRowKeys }
      );
      
      queryClient.invalidateQueries(['records', databaseId, tableId]);
      setSelectedRowKeys([]);
      toast.success(`Đã xóa ${selectedRowKeys.length} dòng`);
    } catch (error) {
      console.error('Error bulk deleting records:', error);
      toast.error(error.response?.data?.message || 'Lỗi khi xóa nhiều dòng');
    }
  };

  const handleCellClick = (recordId, columnName, currentValue) => {
    setEditingCell({ recordId, column: columnName, value: currentValue });
  };

  const handleCellSave = async () => {
    try {
      await axiosInstance.put(
        `/database/records/${editingCell.recordId}`,
        { [editingCell.column]: editingCell.value }
      );
      queryClient.invalidateQueries(['records', databaseId, tableId]);
      toast.success('Cập nhật thành công');
      setEditingCell({ recordId: null, column: null, value: null });
    } catch (error) {
      console.error('Error updating cell:', error);
      toast.error(error.response?.data?.message || 'Lỗi khi cập nhật');
    }
  };

  const handleCellCancel = () => {
    setEditingCell({ recordId: null, column: null, value: null });
  };

  const handleContextMenu = (e, recordId) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.pageX,
      y: e.pageY,
      recordId
    });
  };

  const handleContextMenuClose = () => {
    setContextMenu({ visible: false, x: 0, y: 0, recordId: null });
  };

  const handleContextMenuDelete = () => {
    if (contextMenu.recordId) {
      handleDeleteRecord(contextMenu.recordId);
    }
    handleContextMenuClose();
  };

  return {
    editingCell,
    setEditingCell,
    contextMenu,
    setContextMenu,
    handleAddRow,
    handleAddRowToGroup,
    handleDeleteRecord,
    handleDeleteAllRecords,
    handleBulkDelete,
    handleCellClick,
    handleCellSave,
    handleCellCancel,
    handleContextMenu,
    handleContextMenuClose,
    handleContextMenuDelete
  };
};
