import React, { useState } from 'react';
import { Select, Space, Typography, Switch, Card, Alert, Spin } from 'antd';
import { DatabaseOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import axiosInstance from '../../../axios/axiosInstance';

const { Text, Title } = Typography;
const { Option } = Select;

const LinkedTableConfigSimple = ({ 
  config, 
  onChange, 
  style = {},
  currentTableId = null
}) => {
  const [selectedTableId, setSelectedTableId] = useState(config?.linkedTableId || null);

  // Fetch available tables from current database only
  const { data: tablesData, isLoading: isLoadingTables, error } = useQuery({
    queryKey: ['availableTables', currentTableId],
    queryFn: async () => {
      if (!currentTableId) {
        console.log('❌ No currentTableId provided');
        return { data: [] };
      }
      
      console.log('🔍 Fetching tables from current database for table:', currentTableId);
      try {
        // For now, we'll need to get databaseId from tableId
        // This is a simplified version - in real implementation, you'd need to pass databaseId
        const response = await axiosInstance.get(`/database/tables/${currentTableId}`);
        const tableData = response.data.data;
        const databaseId = tableData.databaseId;
        
        // Now fetch tables from that database
        const tablesResponse = await axiosInstance.get(`/database/databases/${databaseId}/tables`);
        console.log('✅ Tables API response:', tablesResponse.data);
        return tablesResponse.data;
      } catch (error) {
        console.error('❌ Error fetching tables:', error);
        throw error;
      }
    },
    enabled: !!currentTableId,
  });

  // Use fetched data
  const allTables = tablesData?.data || [];
  
  // Filter out current table from available tables
  const filteredTables = allTables.filter(table => table._id !== currentTableId);

  // Debug logging
  console.log('LinkedTableConfigSimple Debug:', {
    tablesData,
    allTables,
    filteredTables,
    currentTableId,
    isLoadingTables,
    error
  });

  // Handle table selection
  const handleTableChange = (tableId) => {
    console.log('LinkedTableConfigSimple handleTableChange:', { tableId, config });
    setSelectedTableId(tableId);
    
    // Update config - only require tableId
    const newConfig = {
      ...config,
      linkedTableId: tableId,
      allowMultiple: config?.allowMultiple || false,
      defaultValue: config?.defaultValue || null,
      filterRules: config?.filterRules || []
    };
    
    console.log('LinkedTableConfigSimple newConfig:', newConfig);
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

  if (error) {
    return (
      <Alert
        message="Error loading tables"
        description={error.message}
        type="error"
        showIcon
      />
    );
  }

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
          ) : (
            <div>
              <div style={{ fontSize: '10px', color: '#666', marginBottom: '4px' }}>
                Debug: {filteredTables.length} tables available
              </div>
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

        {/* Configuration Summary */}
        {selectedTable && (
          <Card size="small" style={{ backgroundColor: '#f6ffed', border: '1px solid #b7eb8f' }}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Text strong style={{ color: '#389e0d' }}>Configuration Summary</Text>
              <div style={{ fontSize: '12px' }}>
                <div><Text strong>Source Table:</Text> {selectedTable.name}</div>
                <div><Text strong>Multiple Selection:</Text> {config?.allowMultiple ? 'Yes' : 'No'}</div>
                <div style={{ color: '#52c41a', marginTop: '8px' }}>
                  <Text type="success">✅ Ready to use! Column configuration will be handled automatically.</Text>
                </div>
              </div>
            </Space>
          </Card>
        )}

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

export default LinkedTableConfigSimple;
