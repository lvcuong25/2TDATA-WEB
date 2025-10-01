import React from 'react';
import { 
  Modal, 
  Button, 
  Typography, 
  Space,
  Tag,
  Divider
} from 'antd';
import { 
  EditOutlined, 
  DeleteOutlined,
  StarOutlined
} from '@ant-design/icons';
import { getDataTypeIcon } from '../Utils/dataTypeUtils';

const { Title, Text } = Typography;

const RecordDetailModal = ({ 
  open, 
  onCancel, 
  record, 
  tableColumns,
  onEdit,
  onDelete 
}) => {
  if (!record) return null;

  // Debug logging
  console.log('🔍 RecordDetailModal Debug:', {
    record: record,
    recordData: record.data,
    tableColumns: tableColumns,
    tableColumnsData: tableColumns?.data,
    recordDataKeys: Object.keys(record.data || {}),
    tableColumnNames: tableColumns?.data?.map(col => col.name) || []
  });

  // Get icon for data type (using centralized function)
  const getIconForDataType = (dataType) => {
    // Override for long_text to use text icon
    if (dataType === 'long_text') {
      return getDataTypeIcon('text');
    }
    // Override for datetime to use date icon
    if (dataType === 'datetime') {
      return getDataTypeIcon('date');
    }
    return getDataTypeIcon(dataType);
  };

  // Format field value based on data type
  const formatFieldValue = (value, dataType) => {
    if (value === null || value === undefined) {
      return <Text type="secondary">-</Text>;
    }

    // Handle different data types
    switch (dataType) {
      case 'lookup':
      case 'linked_table':
        // For lookup and linked_table, value is usually an object
        if (typeof value === 'object') {
          if (Array.isArray(value)) {
            // Multiple linked records
            return value.map(item => {
              if (typeof item === 'object' && item !== null) {
                return String(item?.label || item?.name || item?.title || item?._id || 'Linked Record');
              }
              return String(item);
            }).join(', ');
          } else {
            // Single linked record
            return String(value?.label || value?.name || value?.title || value?._id || 'Linked Record');
          }
        }
        return String(value || '');

      case 'single_select':
      case 'multi_select':
        if (Array.isArray(value)) {
          return (
            <Space wrap>
              {value.map((item, index) => (
                <Tag key={index} color="blue">{String(item || '')}</Tag>
              ))}
            </Space>
          );
        }
        return <Tag color="blue">{String(value || '')}</Tag>;

      case 'date':
      case 'datetime':
        if (value instanceof Date) {
          return value.toLocaleDateString('vi-VN');
        }
        if (typeof value === 'string' && value) {
          try {
            return new Date(value).toLocaleDateString('vi-VN');
          } catch {
            return value;
          }
        }
        return String(value || '');

      case 'time':
        if (typeof value === 'string' && value) {
          return value; // Already in HH:mm format
        }
        return String(value || '');

      case 'rating':
        const ratingValue = Number(value);
        if (isNaN(ratingValue)) return String(value);
        
        return (
          <Space>
            {Array.from({ length: ratingValue }, (_, i) => (
              <StarOutlined key={i} style={{ color: '#faad14' }} />
            ))}
            {Array.from({ length: 5 - ratingValue }, (_, i) => (
              <StarOutlined key={i + ratingValue} style={{ color: '#d9d9d9' }} />
            ))}
            <span>({ratingValue}/5)</span>
          </Space>
        );

      case 'number':
      case 'currency':
      case 'percent':
        if (typeof value === 'number') {
          return value.toLocaleString('vi-VN');
        }
        return String(value || '');

      case 'checkbox':
        return value ? (
          <Tag color="green">Có</Tag>
        ) : (
          <Tag color="red">Không</Tag>
        );

      case 'json':
        if (typeof value === 'object') {
          return (
            <pre style={{ 
              backgroundColor: '#f5f5f5', 
              padding: '8px', 
              borderRadius: '4px',
              fontSize: '12px',
              overflow: 'auto',
              maxHeight: '200px'
            }}>
              {JSON.stringify(value, null, 2)}
            </pre>
          );
        }
        return String(value || '');

      default:
        return String(value || '');
    }
  };

  return (
    <>
      <style jsx>{`
        .record-detail-modal .ant-modal-header {
          border-bottom: 1px solid #f0f0f0;
          padding: 16px 24px;
        }
        .record-detail-modal .ant-modal-title {
          font-size: 16px;
          font-weight: 500;
          color: #262626;
        }
        .record-detail-modal .ant-modal-body {
          padding: 24px;
        }
        .record-detail-modal .ant-modal-footer {
          border-top: 1px solid #f0f0f0;
          padding: 10px 16px;
          text-align: right;
        }
      `}</style>
      <Modal
        title="Record Details"
        open={open}
        onCancel={onCancel}
        footer={[
          <Button key="close" onClick={onCancel}>
            Close
          </Button>,
          <Button 
            key="edit" 
            type="primary" 
            icon={<EditOutlined />}
            onClick={() => {
              onEdit?.(record);
              onCancel();
            }}
          >
            Edit
          </Button>
        ]}
        width={600}
        className="record-detail-modal"
        destroyOnClose
      >
        <div style={{ padding: '16px' }}>
          <div style={{ marginBottom: '16px' }}>
            <Title level={4}>Record Data Debug</Title>
            <Text>Record ID: {record._id}</Text>
            <Text>Has data: {record.data ? 'Yes' : 'No'}</Text>
            <Text>Data keys: {Object.keys(record.data || {}).join(', ')}</Text>
            <Text>Table columns loaded: {tableColumns ? 'Yes' : 'No'}</Text>
            <Text>Table columns count: {tableColumns?.data?.length || 0}</Text>
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <Title level={5}>Raw Record Data:</Title>
            <pre style={{ backgroundColor: '#f5f5f5', padding: '8px', borderRadius: '4px' }}>
              {JSON.stringify(record.data, null, 2)}
            </pre>
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <Title level={5}>Table Columns:</Title>
            <pre style={{ backgroundColor: '#f5f5f5', padding: '8px', borderRadius: '4px' }}>
              {JSON.stringify(tableColumns?.data?.map(col => ({ name: col.name, dataType: col.dataType })), null, 2)}
            </pre>
          </div>
          
          <div>
            <Title level={5}>Formatted Fields:</Title>
            {Object.entries(record.data || {})
              .filter(([key, value]) => {
                const column = tableColumns?.data?.find(col => col.name === key);
                const dataType = column?.dataType || 'text';
                // Ẩn các field lookup và formula - TẠM THỜI COMMENT ĐỂ DEBUG
                // return !['lookup', 'linked_table', 'formula'].includes(dataType);
                return true; // Show all fields for debugging
              })
              .map(([key, value]) => {
                const column = tableColumns?.data?.find(col => col.name === key);
                const dataType = column?.dataType || 'text';
                
                // Debug logging for each field
                console.log('🔍 Field Debug:', {
                  key,
                  value,
                  column,
                  dataType,
                  foundColumn: !!column
                });
                return (
                  <div key={String(key)} style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    marginBottom: '12px',
                    padding: '8px',
                    border: '1px solid #e8e8e8',
                    borderRadius: '4px'
                  }}>
                    <div style={{ 
                      width: '24px', 
                      height: '24px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      marginRight: '12px',
                      flexShrink: 0
                    }}>
                      {getIconForDataType(dataType)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        fontSize: '14px', 
                        fontWeight: '500', 
                        color: '#666',
                        marginBottom: '4px'
                      }}>
                        {String(key)} ({dataType})
                      </div>
                      <div style={{ fontSize: '14px', color: '#333' }}>
                        {formatFieldValue(value, dataType)}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
          
          <Divider />
          
          <div className="flex justify-between items-center text-xs text-gray-500">
            <div>
              <Text type="secondary">Record ID: {record._id?.slice(-8)}</Text>
            </div>
            <div>
              <Text type="secondary">
                Created: {new Date(record.createdAt).toLocaleDateString('vi-VN')}
              </Text>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default RecordDetailModal;
