import React, { useState } from 'react';
import { Modal, Input, Button, List, Avatar, Typography, Space, Tag, Spin, Alert, Row, Col, Pagination } from 'antd';
import { SearchOutlined, LinkOutlined, CheckOutlined, PlusOutlined, ArrowLeftOutlined, ReloadOutlined, CloseOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../../../axios/axiosInstance';
import { safeLog } from '../../../utils/safeLog';
import LookupDropdown from './LookupDropdown';

const { Text, Title } = Typography;

const LinkedTableSelectModal = ({
  visible,
  onCancel,
  onSelect,
  column,
  record,
  updateRecordMutation
}) => {
  const [searchValue, setSearchValue] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [refreshKey, setRefreshKey] = useState(Date.now());

  // Fetch linked table data
  const { data: linkedData, isLoading, error, refetch } = useQuery({
    queryKey: ['linkedTableData', column?._id, column?.id, column?.linkedTableConfig?.linkedTableId, searchValue, currentPage, pageSize, refreshKey],
    queryFn: async () => {
      if (!column || !column.linkedTableConfig?.linkedTableId) {
        safeLog('❌ LinkedTableSelectModal: Missing column or linkedTableId', {
          column: column ? { _id: column._id, id: column.id, name: column.name } : null,
          linkedTableId: column?.linkedTableConfig?.linkedTableId
        });
        return { data: { options: [], totalCount: 0 } };
      }

      // Determine if this is database or template mode
      const columnId = column._id || column.id;
      const isTemplateMode = !column._id && column.id;
      
      if (!columnId) {
        safeLog('⚠️ LinkedTableSelectModal: No column ID available');
        return { data: { options: [], totalCount: 0 } };
      }

      safeLog('🔍 LinkedTableSelectModal: Fetching data', {
        mode: isTemplateMode ? 'template' : 'database',
        columnId,
        linkedTableId: column.linkedTableConfig.linkedTableId
      });

      const params = new URLSearchParams();
      if (searchValue) params.append('search', searchValue);
      params.append('limit', pageSize.toString());
      params.append('page', currentPage.toString());

      // Use different API endpoint based on mode
      const apiUrl = isTemplateMode 
        ? `/templates/columns/${columnId}/linked-data?${params.toString()}`
        : `/database/columns/${columnId}/linked-data?${params.toString()}`;

      const response = await axiosInstance.get(apiUrl);
      
      safeLog('✅ LinkedTableSelectModal: API Response:', {
        mode: isTemplateMode ? 'template' : 'database',
        linkedTableId: column.linkedTableConfig.linkedTableId,
        optionsCount: response.data?.data?.options?.length || 0
      });
      
      return response.data;
    },
    enabled: visible && !!column && !!column.linkedTableConfig?.linkedTableId && !!(column._id || column.id),
    staleTime: 0, // Always fetch fresh data when linkedTableId changes
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  const options = linkedData?.data?.options || [];
  const linkedTable = linkedData?.data?.linkedTable;
  const linkedTableColumns = linkedData?.data?.linkedTableColumns || [];
  const totalCount = linkedData?.data?.totalCount || 0;

  // Debug logging
  safeLog('🔍 LinkedTableSelectModal Data:', {
    optionsCount: options.length,
    linkedTable: linkedTable,
    linkedTableColumns: linkedTableColumns,
    totalCount: totalCount,
    firstOption: options[0] ? {
      value: options[0].value,
      data: options[0].data
    } : null
  });

  // Debug all columns
  safeLog('🔍 All Linked Table Columns:', linkedTableColumns.map((col, index) => ({
    index: index,
    _id: col._id,
    name: col.name,
    order: col.order,
    dataType: col.dataType
  })));

  // Debug all records data
  safeLog('🔍 All Records Data:', options.map((option, index) => ({
    index: index,
    value: option.value,
    label: option.label,
    data: option.data,
    dataKeys: Object.keys(option.data || {})
  })));

  // Initialize selected items from current record data
  React.useEffect(() => {
    if (visible && record && column) {
      safeLog('🔍 LinkedTableSelectModal: Modal opened with column:', {
        columnId: column._id,
        columnName: column.name,
        linkedTableId: column.linkedTableConfig?.linkedTableId,
        linkedTableConfig: column.linkedTableConfig
      });
      
      const currentValue = record.data?.[column.name];
      if (currentValue) {
        if (column.linkedTableConfig?.allowMultiple && Array.isArray(currentValue)) {
          setSelectedItems(currentValue);
        } else if (!Array.isArray(currentValue)) {
          setSelectedItems([currentValue]);
        }
      } else {
        setSelectedItems([]);
      }
    }
  }, [visible, record, column]);

  // Auto-refresh when modal opens
  React.useEffect(() => {
    if (visible && column?.linkedTableConfig?.linkedTableId) {
      safeLog('🔄 Auto-refreshing data when modal opens');
      setRefreshKey(Date.now());
      refetch();
    }
  }, [visible, column?.linkedTableConfig?.linkedTableId, refetch]);

  const handleItemClick = (item) => {
    if (!column || !record) return;
    
    // Check if item is already selected
    const isAlreadySelected = selectedItems.some(selected => selected.value === item.value);
    
    let newSelectedItems;
    if (isAlreadySelected) {
      // Remove item if already selected
      newSelectedItems = selectedItems.filter(selected => selected.value !== item.value);
    } else {
      // Add item if not selected
      if (column.linkedTableConfig?.allowMultiple) {
        // For multiple selection, add to existing items
        newSelectedItems = [...selectedItems, item];
      } else {
        // For single selection, replace with new item
        newSelectedItems = [item];
      }
    }
    
    setSelectedItems(newSelectedItems);
    
    // Update record data immediately
    const selectedValues = column.linkedTableConfig?.allowMultiple 
      ? newSelectedItems 
      : newSelectedItems[0] || null;

    const updatedData = {
      ...record.data,
      [column.name]: selectedValues
    };

    updateRecordMutation.mutate({
      recordId: record._id,
      data: updatedData
    }, {
      onSuccess: () => {
        safeLog('✅ Item selection updated successfully');
        // Don't close modal, just update the selection
      }
    });
  };

  const handleRemoveItem = (item) => {
    if (!column || !record) return;
    
    // Remove from selected items
    const newSelectedItems = selectedItems.filter(selected => selected.value !== item.value);
    setSelectedItems(newSelectedItems);
    
    // Update record data immediately
    const selectedValues = column.linkedTableConfig?.allowMultiple 
      ? newSelectedItems 
      : newSelectedItems[0] || null;

    const updatedData = {
      ...record.data,
      [column.name]: selectedValues
    };

    updateRecordMutation.mutate({
      recordId: record._id,
      data: updatedData
    }, {
      onSuccess: () => {
        safeLog('✅ Item removed successfully');
        // Don't close modal, just update the selection
      }
    });
  };

  const handleConfirm = () => {
    if (!column || !record || selectedItems.length === 0) {
      onCancel();
      return;
    }

    const selectedValues = column.linkedTableConfig?.allowMultiple 
      ? selectedItems 
      : selectedItems[0];

    // Update record data
    const updatedData = {
      ...record.data,
      [column.name]: selectedValues
    };

    updateRecordMutation.mutate({
      recordId: record._id,
      data: updatedData
    }, {
      onSuccess: () => {
        onSelect(selectedValues);
        onCancel();
      }
    });
  };

  const isItemSelected = (item) => {
    return selectedItems.some(selected => selected.value === item.value);
  };

  const getItemDisplayText = (item) => {
    return item.label || item.data?.name || item.data?.title || `Record ${item.value}`;
  };

  // Don't render if column is null
  if (!column) {
    return null;
  }

  return (
    <Modal
      title={null}
      open={visible}
      onCancel={onCancel}
      width={1200}
      footer={null}
      style={{ top: 20 }}
    >
      {/* Header with navigation and search */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: '20px',
        paddingBottom: '16px',
        borderBottom: '1px solid #f0f0f0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Button 
            type="text" 
            icon={<ArrowLeftOutlined />} 
            onClick={onCancel}
            style={{ padding: '4px 8px' }}
          />
          <Input
            placeholder="Search records to link..."
            prefix={<SearchOutlined style={{ color: '#999' }} />}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            allowClear
            style={{ width: '300px' }}
          />
          <Button 
            type="text" 
            icon={<ReloadOutlined />} 
            onClick={() => {
              safeLog('🔄 Manual refresh triggered');
              setRefreshKey(Date.now());
              refetch();
            }}
            style={{ padding: '4px 8px' }}
            title="Refresh data"
          />
        </div>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          backgroundColor: '#fa8c16',
          color: '#fff',
          padding: '6px 12px',
          borderRadius: '16px',
          fontSize: '12px',
          fontWeight: '500'
        }}>
          <LinkOutlined />
          <span>{selectedItems.length} linked records</span>
        </div>
      </div>

      {/* Content Area */}
      <div style={{ minHeight: '400px', maxHeight: '500px', overflowY: 'auto' }}>
        {/* Loading */}
        {isLoading && (
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <Spin size="large" />
            <div style={{ marginTop: '16px' }}>
              <Text type="secondary">Đang tải dữ liệu...</Text>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <Alert
            message="Lỗi tải dữ liệu"
            description={error.message || 'Không thể tải dữ liệu từ bảng liên kết'}
            type="error"
            showIcon
            style={{ margin: '20px 0' }}
          />
        )}

        {/* Records List */}
        {!isLoading && !error && (
          <div>
            {options.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px' }}>
                <Text type="secondary">
                  {searchValue ? 'Không tìm thấy kết quả nào' : 'Không có dữ liệu'}
                </Text>
              </div>
            ) : (
              <div style={{ 
                border: '1px solid #f0f0f0', 
                borderRadius: '8px',
                backgroundColor: '#fff'
              }}>
                {/* Column Headers */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 20px',
                  backgroundColor: '#fafafa',
                  borderBottom: '1px solid #f0f0f0',
                  fontWeight: '600',
                  fontSize: '12px',
                  color: '#666'
                }}>
                  <div style={{ flex: 1, display: 'flex', gap: '20px', overflowX: 'auto' }}>
                    {/* Lookup Column Header */}
                    {column.lookupConfig?.lookupColumnId && (
                      <div style={{ minWidth: '150px', flex: '0 0 auto' }}>
                        Lookup ({column.lookupConfig?.lookupColumnName || 'Value'})
                      </div>
                    )}
                    
                    {linkedTableColumns.map((col, colIndex) => (
                      <div key={col._id} style={{ minWidth: '150px', flex: '0 0 auto' }}>
                        {col.name}
                      </div>
                    ))}
                  </div>
                  <div style={{ marginLeft: '16px', minWidth: '32px' }}>
                    Action
                  </div>
                </div>
                
                {/* Records */}
                {options.map((item, index) => (
                  <div
                    key={item.value}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '16px 20px',
                      borderBottom: index < options.length - 1 ? '1px solid #f0f0f0' : 'none',
                      backgroundColor: isItemSelected(item) ? '#f6ffed' : 'transparent',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (!isItemSelected(item)) {
                        e.currentTarget.style.backgroundColor = '#fafafa';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isItemSelected(item)) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                    onClick={() => handleItemClick(item)}
                  >
                    {/* Record Data - All columns from linked table */}
                    <div style={{ 
                      flex: 1,
                      display: 'flex',
                      gap: '20px',
                      overflowX: 'auto'
                    }}>
                      {/* Lookup Column - Show lookup value if available */}
                      {column.lookupConfig?.lookupColumnId && (
                        <div style={{ minWidth: '150px', flex: '0 0 auto' }}>
                          <LookupDropdown
                            column={column}
                            value={item}
                            onChange={() => {}} // Read-only in this context
                            placeholder="Lookup value"
                            disabled={true}
                          />
                        </div>
                      )}
                      
                      {linkedTableColumns.map((col, colIndex) => {
                        // Try multiple ways to get the value
                        let value = item.data?.[col.name];
                        
                        // If not found by column name, try to find by column ID or other patterns
                        if (!value && item.data) {
                          // Try to find any value that might match this column
                          const dataKeys = Object.keys(item.data);
                          const possibleKeys = dataKeys.filter(key => 
                            key.toLowerCase().includes(col.name.toLowerCase()) ||
                            col.name.toLowerCase().includes(key.toLowerCase())
                          );
                          
                          if (possibleKeys.length > 0) {
                            value = item.data[possibleKeys[0]];
                          } else {
                            // If still not found, try to get any available data
                            const availableKeys = dataKeys.filter(key => 
                              item.data[key] && String(item.data[key]).trim()
                            );
                            if (availableKeys.length > colIndex) {
                              value = item.data[availableKeys[colIndex]];
                            }
                          }
                        }
                        
                        const displayValue = value && String(value).trim() 
                          ? String(value).substring(0, 30) + (String(value).length > 30 ? '...' : '')
                          : '-';
                        
                        // Debug logging for first record
                        if (index === 0) {
                          safeLog('🔍 Record data debug:', {
                            recordId: item.value,
                            columnName: col.name,
                            columnId: col._id,
                            value: value,
                            displayValue: displayValue,
                            allData: item.data,
                            allDataKeys: Object.keys(item.data || {}),
                            dataEntries: Object.entries(item.data || {}).map(([key, val]) => ({ key, value: val }))
                          });
                        }
                        
                        return (
                          <div key={col._id} style={{ minWidth: '150px', flex: '0 0 auto' }}>
                            <Text style={{ 
                              fontSize: '13px',
                              color: value ? '#333' : '#999',
                              display: 'block',
                              lineHeight: '1.4',
                              fontStyle: value ? 'normal' : 'italic'
                            }}>
                              {displayValue}
                            </Text>
                          </div>
                        );
                      })}
                    </div>

                    {/* Action Buttons */}
                    <div style={{ marginLeft: '16px', display: 'flex', gap: '8px' }}>
                      {isItemSelected(item) ? (
                        // If selected, show X button to remove
                        <Button
                          type="default"
                          shape="circle"
                          size="small"
                          icon={<CloseOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveItem(item); // This will remove the item immediately
                          }}
                          style={{
                            backgroundColor: '#ff4d4f',
                            borderColor: '#ff4d4f',
                            color: '#fff',
                            width: '32px',
                            height: '32px'
                          }}
                          title="Remove selection"
                        />
                      ) : (
                        // If not selected, show + button to add
                        <Button
                          type="default"
                          shape="circle"
                          size="small"
                          icon={<PlusOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleItemClick(item);
                          }}
                          style={{
                            backgroundColor: '#fff',
                            borderColor: '#d9d9d9',
                            color: '#666',
                            width: '32px',
                            height: '32px'
                          }}
                          title="Add selection"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer with New Record button, Pagination and Confirm button */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginTop: '20px',
        paddingTop: '16px',
        borderTop: '1px solid #f0f0f0'
      }}>
        <Button 
          type="dashed" 
          icon={<PlusOutlined />}
          onClick={() => {
            // TODO: Implement new record creation
            safeLog('Create new record');
          }}
        >
          + New record
        </Button>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={totalCount}
            showSizeChanger={false}
            showQuickJumper={false}
            showTotal={(total, range) => `${range[0]}-${range[1]} / ${total}`}
            onChange={(page) => setCurrentPage(page)}
            size="small"
          />
          <Button onClick={onCancel}>
            Hủy
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default LinkedTableSelectModal;
