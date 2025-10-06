import React, { useState, useEffect } from 'react';
import { InputNumber, Select, Typography, Switch } from 'antd';
import { PercentageOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;
const { Option } = Select;

const PercentConfig = ({ 
  percentConfig, 
  onPercentConfigChange 
}) => {
  const [config, setConfig] = useState({
    displayFormat: 'percentage',
    displayAsProgress: false,
    defaultValue: 0,
    ...percentConfig
  });

  // Update parent component when config changes
  useEffect(() => {
    onPercentConfigChange(config);
  }, [config]);

  const handleConfigChange = (key, value) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div style={{ padding: '16px', backgroundColor: '#fafafa', borderRadius: '8px', border: '1px solid #d9d9d9' }}>
      <Title level={5} style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <PercentageOutlined style={{ color: '#fa541c' }} />
        Percent Configuration
      </Title>

      {/* % Percent Dropdown */}
      <div style={{ marginBottom: '16px' }}>
        <Text strong style={{ display: 'block', marginBottom: '8px' }}>% Percent</Text>
        <Select
          value={config.displayFormat}
          onChange={(value) => handleConfigChange('displayFormat', value)}
          style={{ width: '100%' }}
          suffixIcon={<PercentageOutlined />}
        >
          <Option value="percentage">Percent</Option>
          <Option value="decimal">Decimal</Option>
        </Select>
      </div>

      {/* Display as progress toggle */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Switch
            checked={config.displayAsProgress}
            onChange={(checked) => handleConfigChange('displayAsProgress', checked)}
          />
          <Text strong>Display as progress</Text>
        </div>
      </div>

      {/* Default value */}
      <div>
        <Text strong style={{ display: 'block', marginBottom: '8px' }}>Default value</Text>
        <InputNumber
          value={config.defaultValue}
          onChange={(value) => handleConfigChange('defaultValue', value)}
          style={{ width: '100%' }}
          placeholder="Enter default value"
        />
      </div>
    </div>
  );
};

export default PercentConfig;
