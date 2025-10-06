import React from 'react';
import { Radio, Space } from 'antd';

const TimeConfig = ({ timeConfig, setTimeConfig }) => {
  const handleFormatChange = (e) => {
    setTimeConfig({
      ...timeConfig,
      format: e.target.value
    });
  };

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
          Time Format
        </label>
        <Radio.Group 
          value={timeConfig?.format || '24'} 
          onChange={handleFormatChange}
        >
          <Space direction="vertical">
            <Radio value="12">12 Hrs</Radio>
            <Radio value="24">24 Hrs</Radio>
          </Space>
        </Radio.Group>
      </div>
    </div>
  );
};

export default TimeConfig;
