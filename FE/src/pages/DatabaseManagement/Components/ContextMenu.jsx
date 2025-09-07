import React from 'react';
import { Menu } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';

const ContextMenu = ({
  visible,
  x,
  y,
  onClose,
  onDelete
}) => {
  if (!visible) return null;

  return (
    <>
      {/* Context Menu */}
      <div
        style={{
          position: 'fixed',
          top: y,
          left: x,
          zIndex: 1000,
          backgroundColor: '#fff',
          border: '1px solid #d9d9d9',
          borderRadius: '6px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          padding: '4px 0',
          minWidth: '120px'
        }}
        onClick={onClose}
      >
        <Menu
          mode="vertical"
          style={{ border: 'none', boxShadow: 'none' }}
          onClick={onClose}
        >
          <Menu.Item
            key="delete"
            icon={<DeleteOutlined />}
            danger
            onClick={onDelete}
            style={{ color: '#ff4d4f' }}
          >
            Xóa hàng
          </Menu.Item>
        </Menu>
      </div>

      {/* Click outside to close context menu */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 999
        }}
        onClick={onClose}
      />
    </>
  );
};

export default ContextMenu;
