import React, { useState, useEffect } from 'react';
import { Select, Spin, Empty, Alert, Button, Modal, Input, List, Avatar, Typography, Pagination } from 'antd';
import { DatabaseOutlined, SearchOutlined, CheckOutlined, PlusOutlined, LinkOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../../../axios/axiosInstance';
import RecordLinkModal from './RecordLinkModal';
import LinkedTableTabs from './LinkedTableTabs';

const { Option } = Select;
const { Text } = Typography;

const LinkedTableDropdown = ({ 
  column, 
  value, 
  onChange, 
  onAddNewOption,
  isActive = false,
  style = {},
  record = null, // Add record prop to get recordId
  updateRecordMutation = null // Add updateRecordMutation prop
}) => {

    const { linkedTableConfig } = column;
  
  // Helper function to normalize value based on allowMultiple setting
  const normalizeValue = (val) => {
    if (!val) return linkedTableConfig?.allowMultiple ? [] : null;
    if (linkedTableConfig?.allowMultiple) {
      return Array.isArray(val) ? val : [val];
    } else {
      return Array.isArray(val) ? val[0] : val;
    }
  };

  const [searchValue, setSearchValue] = useState('');
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedValue, setSelectedValue] = useState(() => normalizeValue(value));
  const [currentPage, setCurrentPage] = useState(1);
  const [recordLinkModalVisible, setRecordLinkModalVisible] = useState(false);
  
  // Debug logging
  console.log('LinkedTableDropdown - column:', column);
  console.log('LinkedTableDropdown - linkedTableConfig:', linkedTableConfig);
  console.log('LinkedTableDropdown - record:', record);

  // Helper function to normalize value based on allowMultiple setting
  
  if (!linkedTableConfig) {
    return (
      <Alert
        message="Linked table configuration not found"
        type="error"
        size="small"
        description={`Column: ${column?.name}, DataType: ${column?.dataType}`}
      />
    );
  }

  // Check if linked table is selected
  if (!linkedTableConfig?.linkedTableId) {
    return (
      <div 
        style={{ 
          width: '100%', 
          height: '100%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          cursor: 'pointer',
          color: '#1890ff',
          fontSize: '12px',
          textDecoration: 'underline',
          padding: '4px 8px',
          border: '1px dashed #d9d9d9',
          borderRadius: '4px',
          backgroundColor: '#fafafa',
          minHeight: '32px',
          ...style 
        }}
        onClick={() => setModalVisible(true)}
        title="Click to select table"
      >
        <span style={{ textAlign: 'center' }}>
          Select table
        </span>
      </div>
    );
  }

  // Fetch linked table data
  const { data: linkedData, isLoading, error } = useQuery({
    queryKey: ['linkedTableData', column._id, searchValue, linkedTableConfig?.linkedTableId],
    queryFn: async () => {
      // If columns are not configured, fetch records directly from the linked table
      if (!linkedTableConfig?.linkedColumnId || !linkedTableConfig?.displayColumnId) {
        if (!linkedTableConfig?.linkedTableId) {
          return { options: [], totalCount: 0 };
        }
        
        // Fetch records directly from the linked table
        const params = new URLSearchParams();
        if (searchValue) params.append('search', searchValue);
        params.append('limit', '50');
        
        const response = await axiosInstance.get(
          `/database/tables/${linkedTableConfig.linkedTableId}/records?${params.toString()}`
        );
        
        // Transform records to options format
        const records = response.data.data || [];
        const options = records.map((record, index) => ({
          value: record._id, // Use record ID as value
          label: record.data?.name || record.data?.title || `Record ${index + 1}`, // Use name/title or fallback
          recordId: record._id
        }));
        
        return {
          options,
          totalCount: response.data.totalCount || records.length,
          linkedTable: { _id: linkedTableConfig.linkedTableId, name: 'Linked Table' }
        };
      }
      
      // If columns are configured, use the existing API
      const params = new URLSearchParams();
      if (searchValue) params.append('search', searchValue);
      params.append('limit', '50');
      
      const response = await axiosInstance.get(
        `/database/columns/${column._id}/linked-data?${params.toString()}`
      );
      return response.data.data;
    },
    enabled: !!column._id && !!linkedTableConfig?.linkedTableId,
    staleTime: 30000, // Cache for 30 seconds
  });

  // Update options when data changes
  useEffect(() => {
    if (linkedData?.options) {
      setOptions(linkedData.options);
    }
  }, [linkedData]);

  // Handle search
  const handleSearch = (search) => {
    setSearchValue(search);
  };

  // Handle selection change - FIXED VERSION
  const handleChange = (selectedValue) => {
    console.log('LinkedTableDropdown handleChange called with:', selectedValue);
    console.log('Record ID:', record?._id);
    console.log('updateRecordMutation available:', !!updateRecordMutation);
    
    // If we have access to the record and updateRecordMutation, use them directly
    if (record && updateRecordMutation && record._id) {
      const updatedData = { ...record.data };
      updatedData[column.name] = selectedValue;

      console.log('Calling updateRecordMutation with:', {
        recordId: record._id,
        data: updatedData
      });

      updateRecordMutation.mutate({
        recordId: record._id,
        data: updatedData
      });
    } else if (onChange) {
      // Fallback to onChange callback
      console.log('Using onChange callback');
      onChange(selectedValue);
    } else {
      console.warn('No way to update record - missing record, updateRecordMutation, or onChange');
    }
  };

  // Handle dropdown visible change
  const handleDropdownVisibleChange = (open) => {
    if (open && options.length === 0) {
      // Trigger initial load if no options
      setSearchValue('');
    }
  };

  // Get display value for current selection
  const getDisplayValue = () => {
    if (!value) return undefined;
    
    if (linkedTableConfig.allowMultiple && Array.isArray(value)) {
      return value;
    }
    
    return value;
  };

  // Render option
  const renderOption = (option) => (
    <Option key={option.value} value={option.value}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <DatabaseOutlined style={{ color: '#13c2c2', fontSize: '12px' }} />
        <span>{option.label}</span>
      </div>
    </Option>
  );

  if (error) {
    return (
      <Alert
        message="Error loading linked table data"
        description={error.message}
        type="error"
        size="small"
      />
    );
  }

  // Handle modal open
  const handleModalOpen = () => {
    setRecordLinkModalVisible(true);
    setSelectedValue(normalizeValue(value));
    setSearchValue('');
    setCurrentPage(1);
  };

  // Handle modal close
  const handleModalClose = () => {
    setRecordLinkModalVisible(false);
    setSearchValue('');
    setCurrentPage(1);
  };

  // Handle selection in modal
  const handleModalSelect = (option) => {
    if (linkedTableConfig.allowMultiple) {
      const currentValues = Array.isArray(selectedValue) ? selectedValue : [];
      const newValues = currentValues.includes(option.value)
        ? currentValues.filter(v => v !== option.value)
        : [...currentValues, option.value];
      setSelectedValue(newValues);
    } else {
      setSelectedValue(option.value);
    }
  };

  // Handle confirm selection
  const handleConfirm = () => {
    if (onChange) {
      onChange(selectedValue);
    }
    setRecordLinkModalVisible(false);
  };

    // Handle record link modal confirm - FIXED VERSION
  const handleRecordLinkConfirm = (selectedRecords) => {
    console.log('LinkedTableDropdown handleRecordLinkConfirm called with:', selectedRecords);
    console.log('Record ID:', record?._id);
    
    // Ensure selectedRecords is always an array
    const selectedArray = Array.isArray(selectedRecords) ? selectedRecords : 
                         selectedRecords ? [selectedRecords] : [];
    
    if (selectedArray.length === 0) {
      console.warn('No records selected');
      setRecordLinkModalVisible(false);
      return;
    }
    
    // Convert records to the format expected by the parent component
    const recordIds = selectedArray.map(record => record && record._id ? record._id : record);
    const finalValue = linkedTableConfig.allowMultiple ? recordIds : recordIds[0];
    
    console.log('Final value to save:', finalValue);
    
    // If we have access to the record and updateRecordMutation, use them directly
    if (record && updateRecordMutation && record._id) {
      const updatedData = { ...record.data };
      updatedData[column.name] = finalValue;

      console.log('Calling updateRecordMutation with:', {
        recordId: record._id,
        data: updatedData
      });

      updateRecordMutation.mutate({
        recordId: record._id,
        data: updatedData
      });
    } else if (onChange) {
      // Fallback to onChange callback
      console.log('Using onChange callback');
      onChange(finalValue);
    }
    
    setRecordLinkModalVisible(false);
  };

  // Get display text for current value
  const getDisplayText = () => {
    if (!linkedTableConfig?.linkedTableId) return 'Select table';
    if (!linkedTableConfig?.linkedColumnId || !linkedTableConfig?.displayColumnId) return 'Configure columns';
    if (!value) return 'No records linked';
    
    if (linkedTableConfig.allowMultiple && Array.isArray(value)) {
      if (value.length === 0) return 'No records linked';
      if (value.length === 1) {
        const option = linkedData?.options?.find(opt => opt.value === value[0]);
        return option ? option.label : value[0];
      }
      return `${value.length} records linked`;
    }
    
    const option = linkedData?.options?.find(opt => opt.value === value);
    return option ? option.label : value;
  };

  // Get linked records count
  const getLinkedRecordsCount = () => {
    if (!value) return 0;
    if (linkedTableConfig.allowMultiple && Array.isArray(value)) {
      return value.length;
    }
    return 1;
  };

  // Check if we should show the new tab interface
  const shouldShowTabInterface = linkedTableConfig?.linkedTableId;
  
  // Debug logging
  console.log('LinkedTableDropdown Debug:', {
    linkedTableConfig,
    shouldShowTabInterface,
    hasLinkedTableId: !!linkedTableConfig?.linkedTableId,
    hasLinkedColumnId: !!linkedTableConfig?.linkedColumnId,
    hasDisplayColumnId: !!linkedTableConfig?.displayColumnId,
    value
  });

  return (
    <>
      {shouldShowTabInterface ? (
        <LinkedTableTabs
          linkedTableConfig={linkedTableConfig}
          value={value}
          onChange={onChange}
          onModalOpen={handleModalOpen}
          style={style}
        />
      ) : (
        <div 
          style={{ 
            width: '100%', 
            height: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#1890ff',
            fontSize: '12px',
            textDecoration: 'underline',
            padding: '4px 8px',
            border: '1px dashed #d9d9d9',
            borderRadius: '4px',
            backgroundColor: '#fafafa',
            minHeight: '32px',
            ...style 
          }}
          onClick={handleModalOpen}
          title="Click to link records"
        >
          <span style={{ textAlign: 'center' }}>
            {getDisplayText()}
          </span>
        </div>
      )}

      <RecordLinkModal
        visible={recordLinkModalVisible}
        onCancel={handleModalClose}
        onConfirm={handleRecordLinkConfirm}
        column={column}
        value={selectedValue}
        linkedTableConfig={linkedTableConfig}
      />
    </>
  );
};

export default LinkedTableDropdown;
