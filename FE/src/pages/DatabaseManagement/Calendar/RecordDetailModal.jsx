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
                return item.label || item.name || item.title || item._id || 'Linked Record';
              }
              return String(item);
            }).join(', ');
          } else {
            // Single linked record
            return value.label || value.name || value.title || value._id || 'Linked Record';
          }
        }
        return String(value);

      case 'single_select':
      case 'multi_select':
        if (Array.isArray(value)) {
          return (
            <Space wrap>
              {value.map((item, index) => (
                <Tag key={index} color="blue">{item}</Tag>
              ))}
            </Space>
          );
        }
        return <Tag color="blue">{String(value)}</Tag>;

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
        return String(value);

      case 'time':
        if (typeof value === 'string' && value) {
          return value; // Already in HH:mm format
        }
        return String(value);

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
        return String(value);

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
        return String(value);

      default:
        return String(value);
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
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {Object.entries(record.data || {})
              .filter(([key, value]) => {
                const column = tableColumns?.data?.find(col => col.name === key);
                const dataType = column?.dataType || 'text';
                // Ẩn các field lookup và formula
                return !['lookup', 'linked_table', 'formula'].includes(dataType);
              })
              .map(([key, value]) => {
                const column = tableColumns?.data?.find(col => col.name === key);
                const dataType = column?.dataType || 'text';
                return (
                  <div key={key} className="flex items-start">
                  <div className="w-6 h-6 flex items-center justify-center mr-3 mt-1 flex-shrink-0">
                    {getIconForDataType(dataType)}
                  </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-600 mb-1">
                        {key}
                      </div>
                      <div className="text-sm text-gray-800">
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
