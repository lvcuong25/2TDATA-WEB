import React from 'react';
import { Select, Space, Typography, Radio } from 'antd';
import { LinkOutlined } from '@ant-design/icons';

const { Text } = Typography;
const { Option } = Select;

const UrlConfig = ({
  config = {},
  onChange
}) => {
  
  const defaultConfig = {
    protocol: 'https',
    ...config
  };

  const handleConfigChange = (key, value) => {
    const newConfig = { ...defaultConfig, [key]: value };
    console.log('UrlConfig: handleConfigChange:', {
      key,
      value,
      defaultConfig,
      newConfig
    });
    onChange(newConfig);
  };

  return (
    <div style={{ 
      backgroundColor: '#fafafa', 
      padding: '16px', 
      borderRadius: '8px',
      border: '1px solid #f0f0f0'
    }}>
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <div>
          <Text strong>Protocol mặc định</Text>
          <Select
            value={defaultConfig.protocol}
            onChange={(value) => handleConfigChange('protocol', value)}
            style={{ width: '100%', marginTop: '8px' }}
          >
            <Option value="https">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <LinkOutlined style={{ color: '#52c41a' }} />
                <span>HTTPS (Bảo mật)</span>
              </div>
            </Option>
            <Option value="http">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <LinkOutlined style={{ color: '#1890ff' }} />
                <span>HTTP</span>
              </div>
            </Option>
            <Option value="none">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <LinkOutlined style={{ color: '#666' }} />
                <span>Không tự động thêm</span>
              </div>
            </Option>
          </Select>
        </div>


      </Space>
    </div>
  );
};

export default UrlConfig;
