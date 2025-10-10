import React, { useState } from 'react';
import { Select, Space, Typography, Switch, Card, Alert, Spin } from 'antd';
import { DatabaseOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../../../axios/axiosInstance';

const { Text, Title } = Typography;
const { Option } = Select;

const LinkedTableConfig = ({ 
  config, 
  onChange, 
  style = {},
  availableTables = [],
  currentTableId = null,
  currentDatabaseId = null
}) => {
  const [selectedTableId, setSelectedTableId] = useState(config?.linkedTableId || null);

  // Fetch available tables from current template
  const { data: tablesData, isLoading: isLoadingTables, error: tablesError } = useQuery({
    queryKey: ['availableTemplateTables', currentDatabaseId],
    queryFn: async () => {
      if (!currentDatabaseId) {
        return { data: [] };
      }
      
      try {
        // For template, currentDatabaseId is actually templateId
        const response = await axiosInstance.get(`/templates/${currentDatabaseId}`);
        
        // Return tables in the same format as database API
        return { data: response.data.data.tables || [] };
      } catch (error) {
        console.error('❌ Error fetching template tables:', error);
        console.error('❌ Error response:', error.response);
        throw error;
      }
    },
    enabled: availableTables.length === 0 && !!currentDatabaseId,
  });

  // Use availableTables prop if provided, otherwise use fetched data
  const allTables = availableTables.length > 0 ? availableTables : (tablesData?.data || []);
  
  // Filter tables - exclude current table only
  const filteredTables = allTables.filter(table => {
    // Template tables use 'id' field, database tables use '_id'
    const tableId = table.id || table._id;
    // Exclude current table
    return tableId !== currentTableId;
  });

  // Handle table selection
  const handleTableChange = (tableId) => {
    setSelectedTableId(tableId);
    
    // Find the selected table to get its name
    // Template tables use 'id' field, database tables use '_id'
    const selectedTable = filteredTables.find(table => (table.id || table._id) === tableId);
    const linkedTableName = selectedTable ? selectedTable.name : null;
    
    // Update config - include both tableId and tableName
    const newConfig = {
      ...config,
      linkedTableId: tableId,
      linkedTableName: linkedTableName,
      allowMultiple: config?.allowMultiple || false,
      defaultValue: config?.defaultValue || null,
      filterRules: config?.filterRules || []
    };
    
    onChange(newConfig);
  };


  // Handle allow multiple toggle
  const handleAllowMultipleChange = (checked) => {
    onChange({
      ...config,
      linkedTableId: selectedTableId,
      allowMultiple: checked,
      defaultValue: config?.defaultValue || null,
      filterRules: config?.filterRules || []
    });
  };

  // Get selected table info
  // Template tables use 'id' field, database tables use '_id'
  const selectedTable = filteredTables.find(table => (table.id || table._id) === selectedTableId);

  return (
    <div style={{ 
      backgroundColor: '#fafafa', 
      padding: '16px', 
      borderRadius: '8px',
      border: '1px solid #f0f0f0',
      ...style
    }}>
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <div>
          <Title level={5} style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DatabaseOutlined style={{ color: '#13c2c2' }} />
            Linked Table Configuration
          </Title>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Create a dropdown that links to data from another table
          </Text>
        </div>

        {/* Table Selection */}
        <div>
          <Text strong>Source Table</Text>
          {isLoadingTables ? (
            <div style={{ marginTop: '8px', textAlign: 'center' }}>
              <Spin size="small" />
              <Text type="secondary" style={{ marginLeft: '8px' }}>Loading tables...</Text>
            </div>
          ) : tablesError ? (
            <div style={{ marginTop: '8px' }}>
              <Alert
                message="Error loading tables"
                description={`${tablesError.message || 'Failed to fetch tables'}`}
                type="error"
                showIcon
              />
            </div>
          ) : (
            <div>
              <Select
                value={selectedTableId}
                onChange={handleTableChange}
                style={{ width: '100%', marginTop: '8px' }}
                placeholder="Select a table to link to"
                showSearch
                filterOption={(input, option) =>
                  option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
              >
                {filteredTables.map(table => {
                  const tableId = table.id || table._id;
                  return (
                    <Option key={tableId} value={tableId}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <DatabaseOutlined style={{ color: '#13c2c2' }} />
                        <span>{table.name}</span>
                        {table.databaseId && (
                          <Text type="secondary" style={{ fontSize: '10px' }}>
                            ({table.databaseId.name})
                          </Text>
                        )}
                      </div>
                    </Option>
                  );
                })}
              </Select>
            </div>
          )}
        </div>


        {/* Allow Multiple Selection */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <Text strong>Allow Multiple Selection</Text>
              <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>
                Allow users to select multiple values from the linked table
              </Text>
            </div>
            <Switch
              checked={config?.allowMultiple || false}
              onChange={handleAllowMultipleChange}
            />
          </div>
        </div>


        {/* Warning for same table */}
        {currentTableId && selectedTableId === currentTableId && (
          <Alert
            message="Cannot link to the same table"
            description="Please select a different table to avoid circular references."
            type="warning"
            showIcon
          />
        )}
      </Space>
    </div>
  );
};

export default LinkedTableConfig;
