import React, { useState, useEffect } from 'react';
import { Modal, Input, Button, Typography, Pagination, Spin, Empty, Alert } from 'antd';
import { 
  SearchOutlined, 
  PlusOutlined, 
  LinkOutlined, 
  ArrowLeftOutlined,
  ExpandAltOutlined
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../../../axios/axiosInstance';

const { Text } = Typography;

const RecordLinkModal = ({
  visible,
  onCancel,
  onConfirm,
  column,
  value,
  linkedTableConfig,
  style = {}
}) => {
  const [searchValue, setSearchValue] = useState('');
  // Helper function to normalize value to array
  const normalizeValue = (val) => {
    if (!val) return [];
    return Array.isArray(val) ? val : [val];
  };

  const [selectedRecords, setSelectedRecords] = useState(() => normalizeValue(value));
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(6); // Show 6 records per page like in the image

  // Fetch linked table records
  const { data: recordsData, isLoading, error } = useQuery({
    queryKey: ['linkedTableRecords', linkedTableConfig?.linkedTableId, searchValue, currentPage],
    queryFn: async () => {
      if (!linkedTableConfig?.linkedTableId) {
        console.log('RecordLinkModal: No linkedTableId provided');
        return { records: [], totalCount: 0 };
      }

      console.log('RecordLinkModal: Fetching records for linkedTableId:', linkedTableConfig.linkedTableId);
      console.log('RecordLinkModal: Column exists:', !!column?._id);

      const params = new URLSearchParams();
      if (searchValue) params.append('search', searchValue);
      params.append('limit', pageSize);
      params.append('offset', (currentPage - 1) * pageSize);
      
      // If column exists, use the column API, otherwise fetch directly from table
      if (column?._id) {
        console.log('RecordLinkModal: Using column API for column:', column._id);
        const response = await axiosInstance.get(
          `/database/columns/${column._id}/linked-data?${params.toString()}`
        );
        
        console.log('RecordLinkModal: Column API response:', response.data);
        
        return {
          records: response.data.data?.options?.map(option => option.record) || [],
          totalCount: response.data.data?.totalCount || 0,
          totalPages: Math.ceil((response.data.data?.totalCount || 0) / pageSize)
        };
      } else {
        // Fetch directly from the linked table
        console.log('RecordLinkModal: Fetching directly from table:', linkedTableConfig.linkedTableId);
        const response = await axiosInstance.get(
          `/database/tables/${linkedTableConfig.linkedTableId}/records?${params.toString()}`
        );
        
        console.log('RecordLinkModal: Table API response:', response.data);
        
        return {
          records: response.data.data || [],
          totalCount: response.data.totalCount || 0,
          totalPages: Math.ceil((response.data.totalCount || 0) / pageSize)
        };
      }
    },
    enabled: !!linkedTableConfig?.linkedTableId && visible,
    staleTime: 30000,
  });

  // Initialize selected records when modal opens
  useEffect(() => {
    if (visible) {
      setSelectedRecords(normalizeValue(value));
      setSearchValue('');
      setCurrentPage(1);
    }
  }, [visible, value]);

  // Handle record selection
  const handleRecordSelect = (record) => {
    // Ensure selectedRecords is always an array
    const selectedArray = Array.isArray(selectedRecords) ? selectedRecords : [];
    const isSelected = selectedArray.some(selected => selected._id === record._id);
    
    if (isSelected) {
      setSelectedRecords(selectedArray.filter(selected => selected._id !== record._id));
    } else {
      setSelectedRecords([...selectedArray, record]);
    }
  };

  // Handle confirm selection
  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm(selectedRecords);
    }
    onCancel();
  };

  // Handle search
  const handleSearch = (e) => {
    setSearchValue(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Get display text for record
  const getRecordDisplayText = (record, index) => {
    const data = record.data || {};
    
    console.log('RecordLinkModal: Processing record:', record);
    console.log('RecordLinkModal: Record data:', data);
    
    // Get all available fields from the record
    const fields = Object.keys(data);
    console.log('RecordLinkModal: Available fields:', fields);
    
    // Use the first 3 available fields, or fallback to generic names
    const text1 = fields.length > 0 ? (data[fields[0]] || `Field 1`) : `Record ${index + 1}`;
    const text2 = fields.length > 1 ? (data[fields[1]] || `Field 2`) : (fields.length > 0 ? data[fields[0]] : `Record ${index + 1}`);
    const text3 = fields.length > 2 ? (data[fields[2]] || `Field 3`) : (fields.length > 1 ? data[fields[1]] : `Record ${index + 1}`);
    
    console.log('RecordLinkModal: Generated texts:', { text1, text2, text3 });
    
    return {
      text1: String(text1).length > 20 ? String(text1).substring(0, 20) + '...' : String(text1),
      text2: String(text2).length > 20 ? String(text2).substring(0, 20) + '...' : String(text2),
      text3: String(text3).length > 20 ? String(text3).substring(0, 20) + '...' : String(text3)
    };
  };

  // Get linked records count
  const getLinkedRecordsCount = () => {
    if (!selectedRecords) return 0;
    return Array.isArray(selectedRecords) ? selectedRecords.length : 1;
  };

  if (error) {
    return (
      <Modal
        title="Error"
        open={visible}
        onCancel={onCancel}
        footer={[
          <Button key="close" onClick={onCancel}>
            Close
          </Button>
        ]}
        width={800}
      >
        <Alert
          message="Error loading records"
          description={error.message}
          type="error"
        />
      </Modal>
    );
  }

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ArrowLeftOutlined style={{ color: '#666' }} />
          <SearchOutlined style={{ color: '#1890ff' }} />
          <span>Search records to link...</span>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      onOk={handleConfirm}
      width={900}
      okText="Link Records"
      cancelText="Cancel"
      okButtonProps={{ 
        disabled: selectedRecords.length === 0,
        style: { backgroundColor: '#52c41a', borderColor: '#52c41a' }
      }}
      style={style}
    >
      {/* Header with linked records count */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '16px',
        padding: '8px 0',
        borderBottom: '1px solid #f0f0f0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '20px',
            height: '20px',
            backgroundColor: '#ff4d4f',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <LinkOutlined style={{ color: 'white', fontSize: '12px' }} />
          </div>
          <Text strong>{getLinkedRecordsCount()} linked records</Text>
        </div>
      </div>

      {/* Search bar */}
      <div style={{ marginBottom: '16px' }}>
        <Input
          placeholder="Search records to link..."
          value={searchValue}
          onChange={handleSearch}
          prefix={<SearchOutlined />}
          allowClear
          size="large"
          style={{ borderRadius: '8px' }}
        />
      </div>

      {/* Records list */}
      <div style={{ 
        maxHeight: '500px', 
        overflowY: 'auto', 
        marginBottom: '16px',
        border: '1px solid #f0f0f0',
        borderRadius: '8px'
      }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" />
            <div style={{ marginTop: '16px' }}>Loading records...</div>
          </div>
        ) : !recordsData?.records || recordsData.records.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                searchValue ? 
                  `No results found for "${searchValue}"` : 
                  'No records available'
              }
            />
          </div>
        ) : (
          <div style={{ padding: '8px' }}>
            {recordsData.records.map((record, index) => {
              // Ensure selectedRecords is always an array
              const selectedArray = Array.isArray(selectedRecords) ? selectedRecords : [];
              const isSelected = selectedArray.some(selected => selected._id === record._id);
              const displayText = getRecordDisplayText(record, index);
              const recordNumber = (currentPage - 1) * pageSize + index + 1;
              
              return (
                <div
                  key={record._id}
                  style={{
                    padding: '12px 16px',
                    borderBottom: index < recordsData.records.length - 1 ? '1px solid #f0f0f0' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? '#e6f7ff' : 'transparent',
                    borderRadius: '4px',
                    margin: '2px 0',
                    transition: 'background-color 0.2s'
                  }}
                  onClick={() => handleRecordSelect(record)}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = '#f5f5f5';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                    {/* Three columns of text */}
                    <div style={{ display: 'flex', gap: '16px', flex: 1 }}>
                      <div style={{ flex: 1, minWidth: '120px' }}>
                        <Text style={{ fontSize: '12px', color: '#333' }}>
                          {displayText.text1}
                        </Text>
                      </div>
                      <div style={{ flex: 1, minWidth: '120px' }}>
                        <Text style={{ fontSize: '12px', color: '#333' }}>
                          {displayText.text2}
                        </Text>
                      </div>
                      <div style={{ flex: 1, minWidth: '120px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Text style={{ fontSize: '12px', color: '#333' }}>
                          {displayText.text3}
                        </Text>
                        {displayText.text3 === 'Social awareness' && (
                          <ExpandAltOutlined style={{ fontSize: '10px', color: '#666' }} />
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Action button */}
                  <Button
                    type={isSelected ? "default" : "primary"}
                    shape="circle"
                    icon={<PlusOutlined />}
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRecordSelect(record);
                    }}
                    style={{
                      backgroundColor: isSelected ? '#f0f0f0' : '#52c41a',
                      borderColor: isSelected ? '#d9d9d9' : '#52c41a',
                      color: isSelected ? '#666' : 'white',
                      minWidth: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer with pagination and new record button */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderTop: '1px solid #f0f0f0',
        paddingTop: '16px'
      }}>
        <Button 
          type="dashed" 
          icon={<PlusOutlined />}
          style={{ borderRadius: '6px' }}
        >
          New record
        </Button>
        
        {recordsData?.totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Button 
              type="text" 
              size="small"
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              ←
            </Button>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '4px',
              padding: '4px 8px',
              border: '1px solid #d9d9d9',
              borderRadius: '4px',
              backgroundColor: 'white'
            }}>
              <Text style={{ fontSize: '12px' }}>{currentPage}</Text>
            </div>
            <Text style={{ fontSize: '12px', color: '#666' }}>
              / {recordsData.totalPages}
            </Text>
            <Button 
              type="text" 
              size="small"
              disabled={currentPage === recordsData.totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              →
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default RecordLinkModal;
