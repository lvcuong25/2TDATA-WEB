import React from 'react';
import {
  Modal,
  Table,
  Typography,
  Space,
  Tag,
  Tooltip
} from 'antd';
import { EyeOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const PreviewTable = ({ visible, onClose, data, columns = [] }) => {
  if (!data || !data.records) {
    return (
      <Modal
        title={
          <Space>
            <EyeOutlined />
            <span>Formatting Preview</span>
          </Space>
        }
        open={visible}
        onCancel={onClose}
        width={800}
        footer={null}
      >
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Text type="secondary">No preview data available</Text>
        </div>
      </Modal>
    );
  }

  const { records, rules } = data;

  // Prepare table columns
  const tableColumns = columns.map(column => ({
    title: column.name,
    dataIndex: ['data', column.name],
    key: column.name,
    width: 150,
    render: (value, record) => {
      const formatting = record.formatting?.[column.name];
      
      if (!formatting) {
        return <span>{value || ''}</span>;
      }

      const cellStyle = {
        backgroundColor: formatting.backgroundColor,
        color: formatting.textColor,
        fontWeight: formatting.fontWeight,
        fontStyle: formatting.fontStyle,
        textDecoration: formatting.textDecoration,
        borderColor: formatting.borderColor,
        borderStyle: formatting.borderStyle,
        borderWidth: formatting.borderWidth,
        padding: '4px 8px',
        borderRadius: '2px'
      };

      return (
        <div style={cellStyle}>
          {value || ''}
        </div>
      );
    }
  }));

  // Add formatting info column
  tableColumns.push({
    title: 'Applied Formatting',
    key: 'formatting',
    width: 200,
    render: (_, record) => {
      const appliedFormatting = record.formatting || {};
      const formattedColumns = Object.keys(appliedFormatting);

      if (formattedColumns.length === 0) {
        return <Text type="secondary">No formatting</Text>;
      }

      return (
        <Space direction="vertical" size="small">
          {formattedColumns.map(columnName => {
            const formatting = appliedFormatting[columnName];
            return (
              <div key={columnName}>
                <Text strong style={{ fontSize: '12px' }}>{columnName}:</Text>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                  {formatting.backgroundColor && (
                    <Tooltip title={`Background: ${formatting.backgroundColor}`}>
                      <div
                        style={{
                          width: 12,
                          height: 12,
                          backgroundColor: formatting.backgroundColor,
                          border: '1px solid #d9d9d9',
                          borderRadius: 1
                        }}
                      />
                    </Tooltip>
                  )}
                  {formatting.textColor && (
                    <Tooltip title={`Text: ${formatting.textColor}`}>
                      <div
                        style={{
                          width: 12,
                          height: 12,
                          backgroundColor: formatting.textColor,
                          border: '1px solid #d9d9d9',
                          borderRadius: 1
                        }}
                      />
                    </Tooltip>
                  )}
                  {formatting.fontWeight === 'bold' && (
                    <Tag size="small" color="blue">Bold</Tag>
                  )}
                  {formatting.fontStyle === 'italic' && (
                    <Tag size="small" color="green">Italic</Tag>
                  )}
                </div>
              </div>
            );
          })}
        </Space>
      );
    }
  });

  // Prepare table data
  const tableData = records.map((record, index) => ({
    key: record._id || index,
    ...record,
    data: record.data || {}
  }));

  return (
    <Modal
      title={
        <Space>
          <EyeOutlined />
          <span>Formatting Preview</span>
          <Text type="secondary">({records.length} records)</Text>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={1000}
      footer={null}
    >
      <div style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text strong>Active Rules: </Text>
            <Text>{rules?.length || 0}</Text>
          </div>
          <div>
            <Text strong>Preview Records: </Text>
            <Text>{records.length}</Text>
          </div>
        </Space>
      </div>

      <Table
        columns={tableColumns}
        dataSource={tableData}
        pagination={false}
        scroll={{ x: 'max-content' }}
        size="small"
        bordered
      />

      {rules && rules.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <Title level={5}>Applied Rules:</Title>
          <Space direction="vertical" style={{ width: '100%' }}>
            {rules.map((rule, index) => (
              <div key={rule.id || index} style={{ 
                padding: 8, 
                border: '1px solid #f0f0f0', 
                borderRadius: 4,
                backgroundColor: '#fafafa'
              }}>
                <Space>
                  <Text strong>{rule.ruleName}</Text>
                  <Tag color="blue">{rule.ruleType}</Tag>
                  <Tag color="green">Priority: {rule.priority}</Tag>
                </Space>
              </div>
            ))}
          </Space>
        </div>
      )}
    </Modal>
  );
};

export default PreviewTable;
