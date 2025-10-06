import React, { useState } from 'react';
import { Button, Popover, Space } from 'antd';
import { BgColorsOutlined } from '@ant-design/icons';

const ColorPicker = ({ value = '#ffffff', onChange, presets = null }) => {
  const [visible, setVisible] = useState(false);

  // Default color presets
  const defaultPresets = [
    '#ffffff', '#f8f9fa', '#e9ecef', '#dee2e6', '#ced4da', '#adb5bd', '#6c757d', '#495057', '#343a40', '#212529',
    '#fef7f0', '#fff7e6', '#f6ffed', '#e6f7ff', '#f9f0ff', '#fff0f6', '#f0f9ff', '#f0fdf4', '#fffbeb', '#fefce8',
    '#ff4d4f', '#fa8c16', '#fadb14', '#52c41a', '#13c2c2', '#1890ff', '#722ed1', '#eb2f96', '#fa541c', '#faad14',
    '#a0d911', '#36cfc9', '#40a9ff', '#9254de', '#f759ab', '#ff7a45', '#ffc53d', '#73d13d', '#5cdbd3', '#69c0ff',
    '#b37feb', '#ff85c0', '#ff9c6e', '#ffd666', '#95de64', '#87e8de', '#91d5ff', '#d3adf7', '#ffadd6', '#ffb366'
  ];

  const colors = presets || defaultPresets;

  const handleColorSelect = (color) => {
    onChange(color);
    setVisible(false);
  };

  const colorPickerContent = (
    <div style={{ width: 200 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 4, marginBottom: 8 }}>
        {colors.map((color) => (
          <div
            key={color}
            style={{
              width: 18,
              height: 18,
              backgroundColor: color,
              border: '1px solid #d9d9d9',
              borderRadius: 2,
              cursor: 'pointer',
              border: value === color ? '2px solid #1890ff' : '1px solid #d9d9d9'
            }}
            onClick={() => handleColorSelect(color)}
            title={color}
          />
        ))}
      </div>
      
      {/* Custom color input */}
      <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #f0f0f0' }}>
        <input
          type="color"
          value={value}
          onChange={(e) => handleColorSelect(e.target.value)}
          style={{
            width: '100%',
            height: 32,
            border: '1px solid #d9d9d9',
            borderRadius: 4,
            cursor: 'pointer'
          }}
        />
      </div>
    </div>
  );

  return (
    <Popover
      content={colorPickerContent}
      title="Choose Color"
      trigger="click"
      open={visible}
      onOpenChange={setVisible}
      placement="bottomLeft"
    >
      <Button
        style={{
          backgroundColor: value,
          borderColor: '#d9d9d9',
          width: 40,
          height: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        icon={<BgColorsOutlined style={{ color: value === '#ffffff' ? '#000' : '#fff' }} />}
      />
    </Popover>
  );
};

export default ColorPicker;
