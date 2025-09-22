import React, { useState } from 'react';
import { Button, Dropdown, Input, Modal } from 'antd';
import { 
  ROW_HEIGHT_PRESETS, 
  getCurrentRowHeightPreset, 
  getRowHeightIcon 
} from '../Utils/rowHeightUtils.jsx';

const RowHeightDropdown = ({ 
  tableId, 
  currentSettings, 
  onRowHeightChange 
}) => {
  const [customHeightModalVisible, setCustomHeightModalVisible] = useState(false);
  const [customHeightInput, setCustomHeightInput] = useState('');

  const currentPreset = getCurrentRowHeightPreset(currentSettings, tableId);

  const handlePresetSelect = (presetKey) => {
    if (presetKey === 'custom') {
      setCustomHeightModalVisible(true);
      setCustomHeightInput(currentSettings[tableId]?.customHeight?.toString() || '');
    } else {
      onRowHeightChange(tableId, { preset: presetKey, customHeight: null });
    }
  };

  const handleCustomHeightSubmit = () => {
    const height = parseInt(customHeightInput);
    if (height >= 20 && height <= 200) {
      onRowHeightChange(tableId, { preset: 'custom', customHeight: height });
      setCustomHeightModalVisible(false);
    }
  };

  const menuItems = Object.values(ROW_HEIGHT_PRESETS).map(preset => ({
    key: preset.key,
    label: (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px',
        padding: '4px 0'
      }}>
        {getRowHeightIcon(preset.icon)}
        <span>{preset.label}</span>
        {currentPreset.key === preset.key && (
          <span style={{ 
            color: '#1890ff', 
            fontWeight: 'bold',
            marginLeft: 'auto'
          }}>
            ✓
          </span>
        )}
      </div>
    ),
    onClick: () => handlePresetSelect(preset.key)
  }));

  return (
    <>
      <Dropdown
        menu={{ items: menuItems }}
        trigger={['click']}
        placement="bottomLeft"
      >
        <Button
          type="text"
          size="small"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4px',
            height: '28px',
            width: '28px',
            border: '1px solid #d9d9d9',
            borderRadius: '4px',
            backgroundColor: '#fff'
          }}
          title="Chiều cao kỷ lục"
        >
          {getRowHeightIcon(currentPreset.icon)}
        </Button>
      </Dropdown>

      <Modal
        title="Tùy chỉnh chiều cao hàng"
        open={customHeightModalVisible}
        onOk={handleCustomHeightSubmit}
        onCancel={() => setCustomHeightModalVisible(false)}
        okText="Áp dụng"
        cancelText="Hủy"
        width={400}
      >
        <div style={{ padding: '16px 0' }}>
          <p style={{ marginBottom: '16px', color: '#666' }}>
            Nhập chiều cao hàng (20-200 pixels):
          </p>
          <Input
            type="number"
            value={customHeightInput}
            onChange={(e) => setCustomHeightInput(e.target.value)}
            placeholder="Ví dụ: 56"
            min={20}
            max={200}
            suffix="px"
            style={{ width: '100%' }}
            onPressEnter={handleCustomHeightSubmit}
          />
          <div style={{ 
            marginTop: '12px', 
            padding: '8px', 
            backgroundColor: '#f6ffed', 
            borderRadius: '4px',
            fontSize: '12px',
            color: '#52c41a'
          }}>
            💡 Gợi ý: Ngắn (32px), Trung bình (48px), Cao (64px)
          </div>
        </div>
      </Modal>
    </>
  );
};

export default RowHeightDropdown;
