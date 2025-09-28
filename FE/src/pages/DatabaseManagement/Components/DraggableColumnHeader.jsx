import React, { useState, useRef } from 'react';
import { Button, Dropdown, Tooltip } from 'antd';
import {
  MoreOutlined,
  DragOutlined,
  EditOutlined,
  LockOutlined
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
      onClick: () => handleDeleteColumn(column._id, column.name)
    }
  ];

  const headerStyle = getColumnHeaderStyle(columnWidths, column._id, column, sortRules, groupRules);
  const resizeHandleStyle = getResizeHandleStyle(isResizing, resizingColumn, column._id);
  const compactStyle = getCompactHeaderStyle(column);
  const normalStyle = getNormalHeaderStyle(column, fieldVisibility);

  return (
    <div
      ref={dragRef}
      draggable
      onMouseDown={handleMouseDown}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragEnd={handleDragEnd}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: getColumnWidthString(columnWidths, column._id),
        minWidth: '50px',
        padding: isColumnCompact(columnWidths, column._id) ? '4px' : '8px',
        borderLeft: isDragOver ? '2px dashed #1890ff' : 'none',
        borderRight: isDragOver ? '2px dashed #1890ff' : '1px solid #d9d9d9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: isColumnCompact(columnWidths, column._id) ? 'center' : 'space-between',
        backgroundColor: isDragOver ? '#e6f7ff' : (column.isSystem ? '#f6ffed' : '#f5f5f5'),
        position: 'relative',
        borderTop: isDragOver ? '2px dashed #1890ff' : (column.isSystem ? '2px solid #52c41a' : 'none'),
        borderBottom: isDragOver ? '2px dashed #1890ff' : 'none',
        borderLeft: isDragOver ? '2px dashed #1890ff' : 'none',
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
          zIndex: 1
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
        {isColumnCompact(columnWidths, column._id) ? (
          <div style={compactStyle}>
            {getDataTypeIcon(column.dataType)}
          </div>
        ) : (
          <>
            {getDataTypeIcon(column.dataType)}
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
      {!isColumnCompact(columnWidths, column._id) && (
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
        onMouseDown={(e) => onResizeStart(e, column._id)}
      />
    </div>
  );
};

export default DraggableColumnHeader;