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

  // Fetch available tables from current database only
  const { data: tablesData, isLoading: isLoadingTables, error: tablesError } = useQuery({
    queryKey: ['availableTables', currentDatabaseId],
    queryFn: async () => {
      if (!currentDatabaseId) {
        console.log('❌ No currentDatabaseId provided');
        return { data: [] };
      }
      
      console.log('🔍 Fetching tables from current database:', currentDatabaseId);
      try {
        const response = await axiosInstance.get(`/database/databases/${currentDatabaseId}/tables`);
        console.log('✅ Tables API response:', response);
        console.log('✅ Tables data:', response.data);
        return response.data;
      } catch (error) {
        console.error('❌ Error fetching tables:', error);
        console.error('❌ Error response:', error.response);
        throw error;
      }
    },
    enabled: availableTables.length === 0 && !!currentDatabaseId,
  });

  // Use availableTables prop if provided, otherwise use fetched data
  const allTables = availableTables.length > 0 ? availableTables : (tablesData?.data || []);
  
  // Filter tables - exclude current table only (API already filters by database)
  const filteredTables = allTables.filter(table => {
    // Exclude current table
    return table._id !== currentTableId;
  });

  // Debug logging
  console.log('🔍 LinkedTableConfig Debug:', {
    availableTables,
    tablesData,
    allTables,
    filteredTables,
    currentTableId,
    currentDatabaseId,
    isLoadingTables,
    tablesError
  });

  // Detailed debug for each table
  console.log('🔍 All Tables Details (from current database):');
  allTables.forEach((table, index) => {
    console.log(`Table ${index + 1}:`, {
      id: table._id,
      name: table.name,
      databaseId: table.databaseId,
      currentTableId,
      isCurrentTable: table._id === currentTableId
    });
  });

  console.log('🔍 Filtered Tables Details:');
  filteredTables.forEach((table, index) => {
    console.log(`Filtered Table ${index + 1}:`, {
      id: table._id,
      name: table.name,
      databaseId: table.databaseId
    });
  });

  // Handle table selection
  const handleTableChange = (tableId) => {
    console.log('LinkedTableConfig handleTableChange:', { tableId, config });
    setSelectedTableId(tableId);
    
    // Find the selected table to get its name
    const selectedTable = filteredTables.find(table => table._id === tableId);
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
    
    console.log('LinkedTableConfig newConfig:', newConfig);
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
  const selectedTable = filteredTables.find(table => table._id === selectedTableId);

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
                  console.log('Rendering table option:', table);
                  return (
                    <Option key={table._id} value={table._id}>
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
