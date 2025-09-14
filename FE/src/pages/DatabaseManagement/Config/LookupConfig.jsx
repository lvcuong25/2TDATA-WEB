import React, { useState, useEffect } from 'react';
import { Select, Form, Alert, Spin } from 'antd';
import { DatabaseOutlined, LinkOutlined, CheckOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../../../axios/axiosInstance';

const { Option } = Select;

const LookupConfig = ({ config, onChange, currentTableId, currentDatabaseId, availableTables = [] }) => {
  const [selectedTableId, setSelectedTableId] = useState(config?.linkedTableId || null);
  const [selectedColumnId, setSelectedColumnId] = useState(config?.lookupColumnId || null);

  // Fetch tables if not provided
  const { data: tablesData, isLoading: isLoadingTables, error: tablesError } = useQuery({
    queryKey: ['tables', currentDatabaseId],
    queryFn: async () => {
      if (!currentDatabaseId) return { data: [] };
      const response = await axiosInstance.get(`/database/databases/${currentDatabaseId}/tables`);
      return response.data;
    },
    enabled: !currentDatabaseId || availableTables.length === 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Use availableTables prop if provided, otherwise use fetched data
  const allTables = availableTables.length > 0 ? availableTables : (tablesData?.data || []);
  
  // Filter tables - exclude current table only (API already filters by database)
  const filteredTables = allTables.filter(table => {
    // Exclude current table
    return table._id !== currentTableId;
  });

  // Fetch columns for selected table
  const { data: columnsData, isLoading: isLoadingColumns, error: columnsError } = useQuery({
    queryKey: ['tableColumns', selectedTableId],
    queryFn: async () => {
      if (!selectedTableId) {
        return { data: [] };
      }
      
      try {
        const response = await axiosInstance.get(`/database/tables/${selectedTableId}/columns`);
        return response.data;
      } catch (error) {
        console.error('Error fetching columns:', error);
        return { data: [] };
      }
    },
    enabled: !!selectedTableId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const availableColumns = columnsData?.data || [];

  // Handle table selection
  const handleTableChange = (tableId) => {
    setSelectedTableId(tableId);
    setSelectedColumnId(null); // Reset column selection
    
    // Find the selected table to get its name
    const selectedTable = filteredTables.find(table => table._id === tableId);
    const linkedTableName = selectedTable ? selectedTable.name : null;
    
    // Update config - reset lookup column
    const newConfig = {
      ...config,
      linkedTableId: tableId,
      linkedTableName: linkedTableName,
      lookupColumnId: null,
      lookupColumnName: null,
      defaultValue: config?.defaultValue || null
    };
    
    onChange(newConfig);
  };

  // Handle column selection
  const handleColumnChange = (columnId) => {
    setSelectedColumnId(columnId);
    
    // Find the selected column to get its name
    const selectedColumn = availableColumns.find(col => col._id === columnId);
    const lookupColumnName = selectedColumn ? selectedColumn.name : null;
    
    // Update config
    const newConfig = {
      ...config,
      lookupColumnId: columnId,
      lookupColumnName: lookupColumnName
    };
    
    onChange(newConfig);
  };

  // Get icon for column data type
  const getColumnIcon = (dataType) => {
    switch (dataType) {
      case 'string':
      case 'text':
        return 'T';
      case 'number':
        return '#';
      case 'date':
        return '📅';
      case 'email':
        return '@';
      case 'url':
        return '🔗';
      case 'linked_table':
        return '🔗';
      default:
        return 'T';
    }
  };

  return (
    <div style={{ marginTop: '16px' }}>
      {/* Link Field */}
      <Form.Item
        label="Link Field"
        required
        help="Select the table to link to"
      >
        <Select
          placeholder="Select a table..."
          value={selectedTableId}
          onChange={handleTableChange}
          loading={isLoadingTables}
          style={{ width: '100%' }}
          suffixIcon={<LinkOutlined />}
        >
          {filteredTables.map(table => (
            <Option key={table._id} value={table._id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <LinkOutlined style={{ color: '#722ed1' }} />
                <span>{table.name}</span>
              </div>
            </Option>
          ))}
        </Select>
      </Form.Item>

      {/* Lookup Field */}
      {selectedTableId && (
        <Form.Item
          label="Lookup Field"
          required
          help="Select the column to display in the lookup"
        >
          <Select
            placeholder="Select a column..."
            value={selectedColumnId}
            onChange={handleColumnChange}
            loading={isLoadingColumns}
            style={{ width: '100%' }}
            suffixIcon={<CheckOutlined />}
          >
            {availableColumns.map(column => (
              <Option key={column._id} value={column._id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ 
                    fontSize: '12px', 
                    fontWeight: 'bold',
                    color: '#666',
                    minWidth: '16px',
                    textAlign: 'center'
                  }}>
                    {getColumnIcon(column.dataType)}
                  </span>
                  <span>{column.name}</span>
                  {selectedColumnId === column._id && (
                    <CheckOutlined style={{ color: '#1890ff', marginLeft: 'auto' }} />
                  )}
                </div>
              </Option>
            ))}
          </Select>
        </Form.Item>
      )}

      {/* Error Messages */}
      {tablesError && (
        <Alert
          message="Error loading tables"
          description={tablesError.message || 'Failed to load tables'}
          type="error"
          style={{ marginTop: '8px' }}
        />
      )}

      {columnsError && (
        <Alert
          message="Error loading columns"
          description={columnsError.message || 'Failed to load columns'}
          type="error"
          style={{ marginTop: '8px' }}
        />
      )}

      {/* Configuration Summary */}
      {selectedTableId && selectedColumnId && (
        <Alert
          message="Lookup Configuration"
          description={`This column will display "${availableColumns.find(c => c._id === selectedColumnId)?.name}" from the "${filteredTables.find(t => t._id === selectedTableId)?.name}" table.`}
          type="info"
          style={{ marginTop: '16px' }}
        />
      )}
    </div>
  );
};

export default LookupConfig;