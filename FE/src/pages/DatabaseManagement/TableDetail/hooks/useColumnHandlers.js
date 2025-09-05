import { useState } from 'react';
import { toast } from 'react-toastify';
import axiosInstance from '../../../../utils/axiosInstance-cookie-only';

export const useColumnHandlers = ({ databaseId, tableId, queryClient }) => {
  const [newColumn, setNewColumn] = useState({ 
    name: '', 
    dataType: 'text',
    checkboxConfig: {
      icon: 'check-circle',
      color: '#52c41a',
      defaultValue: false
    },
    singleSelectConfig: {
      options: [],
      defaultValue: ''
    },
    multiSelectConfig: {
      options: [],
      defaultValue: []
    },
    dateConfig: {
      format: 'DD/MM/YYYY',
      includeTime: false,
      timeFormat: '24h'
    },
    formulaConfig: {
      expression: '',
      resultType: 'number',
      decimalPlaces: 2,
      references: []
    },
    currencyConfig: {
      currency: 'VND',
      locale: 'vi-VN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }
  });

  const [editingColumn, setEditingColumn] = useState(null);
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [showEditColumn, setShowEditColumn] = useState(false);

  const handleAddColumn = async (e) => {
    e.preventDefault();
    
    // Auto-generate name if empty
    let columnName = newColumn.name.trim();
    if (!columnName) {
      const dataTypeNames = {
        'text': 'Text',
        'number': 'Number',
        'date': 'Date',
        'checkbox': 'Checkbox',
        'single_select': 'Single Select',
        'multi_select': 'Multi Select',
        'formula': 'Formula',
        'currency': 'Currency'
      };
      columnName = dataTypeNames[newColumn.dataType] || newColumn.dataType;
    }
    
    const columnData = {
      ...newColumn,
      name: columnName
    };
    
    try {
      const response = await axiosInstance.post(
        `/database/columns`,
        { ...columnData, tableId }
      );
      
      if (response.data) {
        queryClient.invalidateQueries(['table', databaseId, tableId]);
        queryClient.invalidateQueries(['records', databaseId, tableId]);
        toast.success('Thêm cột thành công');
        setNewColumn({ 
          name: '', 
          dataType: 'text',
          checkboxConfig: {
            icon: 'check-circle',
            color: '#52c41a',
            defaultValue: false
          },
          singleSelectConfig: {
            options: [],
            defaultValue: ''
          },
          multiSelectConfig: {
            options: [],
            defaultValue: []
          },
          dateConfig: {
            format: 'DD/MM/YYYY',
            includeTime: false,
            timeFormat: '24h'
          },
          formulaConfig: {
            expression: '',
            resultType: 'number',
            decimalPlaces: 2,
            references: []
          },
          currencyConfig: {
            currency: 'VND',
            locale: 'vi-VN',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          }
        });
        setShowAddColumn(false);
      }
    } catch (error) {
      console.error('Error adding column:', error);
      toast.error(error.response?.data?.message || 'Lỗi khi thêm cột');
    }
  };

  const handleEditColumn = (column) => {
    setEditingColumn(column);
    setShowEditColumn(true);
  };

  const handleEditColumnSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await axiosInstance.put(
        `/database/columns/${editingColumn._id}`,
        editingColumn
      );
      
      if (response.data) {
        queryClient.invalidateQueries(['table', databaseId, tableId]);
        queryClient.invalidateQueries(['records', databaseId, tableId]);
        toast.success('Cập nhật cột thành công');
        setShowEditColumn(false);
        setEditingColumn(null);
      }
    } catch (error) {
      console.error('Error updating column:', error);
      toast.error(error.response?.data?.message || 'Lỗi khi cập nhật cột');
    }
  };

  const handleDeleteColumn = async (columnId, columnName) => {
    try {
      await axiosInstance.delete(
        `/database/columns/${columnId}`
      );
      queryClient.invalidateQueries(['table', databaseId, tableId]);
      queryClient.invalidateQueries(['records', databaseId, tableId]);
      toast.success(`Đã xóa cột "${columnName}"`);
    } catch (error) {
      console.error('Error deleting column:', error);
      toast.error(error.response?.data?.message || 'Lỗi khi xóa cột');
    }
  };

  return {
    newColumn,
    setNewColumn,
    editingColumn,
    setEditingColumn,
    showAddColumn,
    setShowAddColumn,
    showEditColumn,
    setShowEditColumn,
    handleAddColumn,
    handleEditColumn,
    handleEditColumnSubmit,
    handleDeleteColumn
  };
};
