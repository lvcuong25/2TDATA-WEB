import React, { useState, useRef } from 'react';
import { Button, Dropdown, Tooltip } from 'antd';
import {
  MoreOutlined,
  DragOutlined,
  EditOutlined,
  LockOutlined,
  PlusOutlined
} from '@ant-design/icons';
import {
  getColumnWidthString,
  isColumnCompact,
  getColumnHeaderStyle,
  getResizeHandleStyle,
  getCompactHeaderStyle,
  getNormalHeaderStyle
} from '../Utils/columnUtils.jsx';
import {
  getDataTypeIcon
} from '../Utils/dataTypeUtils.jsx';

const DraggableColumnHeader = ({
  column,
  columnWidths,
  sortRules = [],
  groupRules = [],
  fieldVisibility,
  isDragging,
  isDragOver,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
  onResizeStart,
  isResizing,
  resizingColumn,
  handleEditColumn,
  handleColumnPermission,
  handleDeleteColumn,
  handleAddColumnLeft,
  handleAddColumnRight,
  dragIndex,
  hoverIndex,
  isLastColumn = false
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const dragRef = useRef(null);

  const handleMouseDown = (e) => {
    if (e.target.closest('.column-resize-handle')) {
      return; // Let resize handle handle the event
    }
    // Don't call onDragStart here - let the actual drag event handle it
  };

  const handleDragStart = (e) => {
    if (onDragStart) {
      onDragStart(e, dragIndex);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (onDragOver) {
      onDragOver(e, hoverIndex);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (onDrop) {
      onDrop(e, hoverIndex);
    }
  };

  const handleDragEnd = (e) => {
    if (onDragEnd) {
      onDragEnd(e);
    }
  };

  const columnMenuItems = [
    {
      key: 'add-left',
      label: 'Thêm cột bên trái',
      icon: <PlusOutlined />,
      onClick: () => handleAddColumnLeft(column)
    },
    {
      key: 'add-right',
      label: 'Thêm cột bên phải',
      icon: <PlusOutlined />,
      onClick: () => handleAddColumnRight(column)
    },
    {
      type: 'divider'
    },
    {
      key: 'edit',
      label: 'Edit Column',
      icon: <EditOutlined />,
      onClick: () => handleEditColumn(column)
    },
    {
      key: 'permissions',
      label: 'Column Permissions',
      icon: <LockOutlined />,
      onClick: () => handleColumnPermission(column)
    },
    {
      type: 'divider'
    },
    {
      key: 'delete',
      label: 'Delete Column',
      danger: true,
      onClick: () => {
        const columnId = column.id || column._id;
        if (!columnId) {
          console.error('❌ Column ID is undefined!');
          return;
        }
        handleDeleteColumn(columnId, column.name);
      }
    }
  ];

  const headerStyle = getColumnHeaderStyle(columnWidths, column.id || column._id, column, sortRules, groupRules);
  const resizeHandleStyle = getResizeHandleStyle(isResizing, resizingColumn, column.id || column._id);
  const compactStyle = getCompactHeaderStyle(column);
  const normalStyle = getNormalHeaderStyle(column, fieldVisibility);

  return (
    <div
      ref={dragRef}
      draggable
      onMouseDown={handleMouseDown}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragEnd={handleDragEnd}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: getColumnWidthString(columnWidths, column.id || column._id),
        minWidth: '50px',
        maxWidth: getColumnWidthString(columnWidths, column.id || column._id),
        flexShrink: 0,
        flexGrow: 0,
        flexBasis: getColumnWidthString(columnWidths, column.id || column._id),
        padding: isColumnCompact(columnWidths, column.id || column._id) ? '4px' : '8px',
        borderLeft: isDragOver ? '2px dashed #1890ff' : 'none',
        borderRight: isDragOver ? '2px dashed #1890ff' : '1px solid #d9d9d9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: isColumnCompact(columnWidths, column.id || column._id) ? 'center' : 'space-between',
        backgroundColor: isDragOver ? '#e6f7ff' : (column.isSystem ? '#f6ffed' : '#f5f5f5'),
        position: 'relative',
        borderTop: isDragOver ? '2px dashed #1890ff' : (column.isSystem ? '2px solid #52c41a' : 'none'),
        borderBottom: isDragOver ? '2px dashed #1890ff' : 'none',
        cursor: isDragging ? 'grabbing' : 'grab',
        opacity: isDragging ? 0.5 : 1,
        transform: isDragging ? 'rotate(2deg)' : 'none',
        transition: isDragging ? 'none' : 'all 0.2s ease'
      }}
    >
      {/* Drag Handle */}
      <div
        style={{
          position: 'absolute',
          left: '4px',
          top: '50%',
          transform: 'translateY(-50%)',
          color: isHovered ? '#1890ff' : '#d9d9d9',
          fontSize: '12px',
          cursor: 'grab',
          zIndex: 15,
          padding: '4px',
          width: '20px',
          height: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <DragOutlined />
      </div>

      {/* Column Content */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '4px', 
        flex: 1, 
        minWidth: 0,
        maxWidth: 'calc(100% - 40px)', // Account for drag handle and dropdown
        marginLeft: '20px' // Space for drag handle
      }}>
        {isColumnCompact(columnWidths, column.id || column._id) ? (
          <div style={compactStyle}>
            {getDataTypeIcon(column.dataType || column.data_type)}
          </div>
        ) : (
          <>
            {getDataTypeIcon(column.dataType || column.data_type)}
            <span style={{
              ...normalStyle,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '100%'
            }}>
              {String(column.name || '')}
            </span>
            {column.isSystem && (
              <span style={{
                fontSize: '10px',
                color: '#52c41a',
                fontWeight: 'bold',
                marginLeft: '4px'
              }}>
                S
              </span>
            )}
          </>
        )}
      </div>

      {/* Column Actions */}
      {!isColumnCompact(columnWidths, column.id || column._id) && (
        <Dropdown
          menu={{ items: columnMenuItems }}
          trigger={['click']}
          placement="bottomRight"
        >
          <Button
            type="text"
            size="small"
            icon={<MoreOutlined />}
            style={{
              padding: '2px',
              fontSize: '12px',
              opacity: isHovered ? 1 : 0.6,
              transition: 'opacity 0.2s ease'
            }}
          />
        </Dropdown>
      )}

      {/* Resize Handle */}
      <div
        className="column-resize-handle"
        style={resizeHandleStyle}
        onMouseDown={(e) => onResizeStart(e, column.id || column._id)}
      />
    </div>
  );
};

export default DraggableColumnHeader;