import React, { useRef, useEffect, useState } from 'react';
import { Table, Input, Select, Checkbox, Button, Space, Tag, DatePicker, Dropdown, Menu, Empty } from 'antd';
import { MoreOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { formatDateForDisplay, formatDateForInput } from '../../../../utils/dateFormatter';
import dayjs from 'dayjs';

const { Option } = Select;

const TableView = ({
  columns = [],
  records = [],
  loading,
  editingCell,
  onCellClick,
  onCellSave,
  onCellCancel,
  setEditingCell,
  onDeleteColumn,
  onEditColumn,
  onAddRowToGroup,
  onDeleteRecord,
  onContextMenu,
  selectedRowKeys,
  onRowSelectionChange,
  sortedRecords,
  groupField,
  groupRules = [],
  visibleColumns = []
}) => {
  const [resizing, setResizing] = useState({ isResizing: false, columnId: null, startX: 0, startWidth: 0 });
  const [columnWidths, setColumnWidths] = useState({});
  const tableRef = useRef(null);

  // Cell editing refs
  const inputRef = useRef(null);
  const selectRef = useRef(null);

  useEffect(() => {
    if (editingCell.recordId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell.recordId]);

  useEffect(() => {
    if (editingCell.recordId && selectRef.current) {
      selectRef.current.focus();
    }
  }, [editingCell.recordId]);

  // Column resize handlers
  const handleResizeStart = (e, columnId) => {
    e.preventDefault();
    const startX = e.clientX;
    const columnEl = document.querySelector(`[data-column-id="${columnId}"]`);
    const startWidth = columnEl ? columnEl.offsetWidth : 150;
    
    setResizing({ isResizing: true, columnId, startX, startWidth });

    const handleMouseMove = (moveEvent) => {
      if (!resizing.isResizing) return;
      const diff = moveEvent.clientX - startX;
      const newWidth = Math.max(100, startWidth + diff);
      setColumnWidths(prev => ({ ...prev, [columnId]: newWidth }));
    };

    const handleMouseUp = () => {
      setResizing({ isResizing: false, columnId: null, startX: 0, startWidth: 0 });
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Render cell based on column type
  const renderCell = (record, column) => {
    const value = record[column.name];
    const isEditing = editingCell.recordId === record._id && editingCell.column === column.name;

    if (isEditing) {
      return renderEditingCell(column, value);
    }

    return renderDisplayCell(column, value, record._id);
  };

  const renderEditingCell = (column, value) => {
    switch (column.dataType) {
      case 'text':
        return (
          <Input
            ref={inputRef}
            value={editingCell.value || ''}
            onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
            onPressEnter={onCellSave}
            onBlur={onCellCancel}
            onClick={(e) => e.stopPropagation()}
          />
        );

      case 'number':
        return (
          <Input
            ref={inputRef}
            type="number"
            value={editingCell.value || ''}
            onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
            onPressEnter={onCellSave}
            onBlur={onCellCancel}
            onClick={(e) => e.stopPropagation()}
          />
        );

      case 'currency':
        return (
          <Input
            ref={inputRef}
            type="number"
            value={editingCell.value || ''}
            onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
            onPressEnter={onCellSave}
            onBlur={onCellCancel}
            onClick={(e) => e.stopPropagation()}
            addonBefore={column.currencyConfig?.currency || 'VND'}
          />
        );

      case 'date':
        return (
          <DatePicker
            value={editingCell.value ? dayjs(editingCell.value) : null}
            format={column.dateConfig?.format || 'DD/MM/YYYY'}
            showTime={column.dateConfig?.includeTime}
            onChange={(date) => setEditingCell({ ...editingCell, value: date ? date.toISOString() : null })}
            onOk={onCellSave}
            onBlur={onCellCancel}
            onClick={(e) => e.stopPropagation()}
            style={{ width: '100%' }}
          />
        );

      case 'single_select':
        return (
          <Select
            ref={selectRef}
            value={editingCell.value || ''}
            onChange={(val) => {
              setEditingCell({ ...editingCell, value: val });
              setTimeout(onCellSave, 100);
            }}
            onBlur={onCellCancel}
            style={{ width: '100%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <Option value="">-- Chọn --</Option>
            {column.singleSelectConfig?.options?.map(option => (
              <Option key={option.value} value={option.value}>
                <Tag color={option.color}>{option.label}</Tag>
              </Option>
            ))}
          </Select>
        );

      case 'multi_select':
        return (
          <Select
            ref={selectRef}
            mode="multiple"
            value={editingCell.value || []}
            onChange={(val) => {
              setEditingCell({ ...editingCell, value: val });
            }}
            onBlur={onCellSave}
            style={{ width: '100%' }}
            onClick={(e) => e.stopPropagation()}
          >
            {column.multiSelectConfig?.options?.map(option => (
              <Option key={option.value} value={option.value}>
                <Tag color={option.color}>{option.label}</Tag>
              </Option>
            ))}
          </Select>
        );

      default:
        return null;
    }
  };

  const renderDisplayCell = (column, value, recordId) => {
    switch (column.dataType) {
      case 'checkbox':
        return (
          <Checkbox
            checked={!!value}
            onChange={(e) => {
              setEditingCell({ recordId, column: column.name, value: e.target.checked });
              setTimeout(onCellSave, 0);
            }}
          />
        );

      case 'date':
        return value ? formatDateForDisplay(value, column.dateConfig) : '-';

      case 'single_select':
        const selectedOption = column.singleSelectConfig?.options?.find(opt => opt.value === value);
        return selectedOption ? (
          <Tag color={selectedOption.color}>{selectedOption.label}</Tag>
        ) : '-';

      case 'multi_select':
        return Array.isArray(value) && value.length > 0 ? (
          <Space size={4} wrap>
            {value.map(val => {
              const option = column.multiSelectConfig?.options?.find(opt => opt.value === val);
              return option ? (
                <Tag key={val} color={option.color}>{option.label}</Tag>
              ) : null;
            })}
          </Space>
        ) : '-';

      case 'currency':
        if (value === null || value === undefined) return '-';
        const formatter = new Intl.NumberFormat(
          column.currencyConfig?.locale || 'vi-VN',
          {
            style: 'currency',
            currency: column.currencyConfig?.currency || 'VND',
            minimumFractionDigits: column.currencyConfig?.minimumFractionDigits ?? 0,
            maximumFractionDigits: column.currencyConfig?.maximumFractionDigits ?? 0
          }
        );
        return formatter.format(value);

      case 'formula':
        return value ?? '-';

      default:
        return value || '-';
    }
  };

  // Generate table columns
  const tableColumns = [
    {
      title: '',
      width: 50,
      fixed: 'left',
      render: (_, __, index) => index + 1
    },
    ...columns
      .filter(col => visibleColumns.includes(col.name))
      .map(column => ({
        title: (
          <div className="column-header" data-column-id={column._id}>
            <span>{column.name}</span>
            <Dropdown
              overlay={
                <Menu>
                  <Menu.Item key="edit" onClick={() => onEditColumn(column)}>
                    <EditOutlined /> Chỉnh sửa
                  </Menu.Item>
                  <Menu.Item 
                    key="delete" 
                    danger
                    onClick={() => onDeleteColumn(column._id, column.name)}
                  >
                    <DeleteOutlined /> Xóa cột
                  </Menu.Item>
                </Menu>
              }
              trigger={['click']}
            >
              <Button
                type="text"
                size="small"
                icon={<MoreOutlined />}
                onClick={e => e.stopPropagation()}
              />
            </Dropdown>
            <div
              className="resize-handle"
              onMouseDown={(e) => handleResizeStart(e, column._id)}
              style={{
                position: 'absolute',
                right: 0,
                top: 0,
                bottom: 0,
                width: 5,
                cursor: 'col-resize',
                backgroundColor: 'transparent'
              }}
            />
          </div>
        ),
        dataIndex: column.name,
        key: column._id,
        width: columnWidths[column._id] || 150,
        render: (_, record) => (
          <div
            onClick={() => column.dataType !== 'checkbox' && column.dataType !== 'formula' && 
              onCellClick(record._id, column.name, record[column.name])}
            style={{ cursor: column.dataType !== 'checkbox' && column.dataType !== 'formula' ? 'text' : 'default' }}
          >
            {renderCell(record, column)}
          </div>
        )
      })),
    {
      title: '',
      key: 'actions',
      width: 50,
      fixed: 'right',
      render: (_, record) => (
        <Dropdown
          overlay={
            <Menu>
              <Menu.Item 
                key="delete" 
                danger
                onClick={() => onDeleteRecord(record._id)}
              >
                <DeleteOutlined /> Xóa
              </Menu.Item>
            </Menu>
          }
          trigger={['click']}
        >
          <Button
            type="text"
            size="small"
            icon={<MoreOutlined />}
          />
        </Dropdown>
      )
    }
  ];

  // Render grouped data
  const renderGroupedData = () => {
    if (!groupField || !sortedRecords || sortedRecords.length === 0) {
      return <Empty description="Không có dữ liệu" />;
    }

    const grouped = {};
    sortedRecords.forEach(record => {
      const key = record[groupField] || 'Không có giá trị';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(record);
    });

    return Object.entries(grouped).map(([groupValue, groupRecords]) => (
      <div key={groupValue} style={{ marginBottom: 24 }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          marginBottom: 8,
          padding: '8px 16px',
          backgroundColor: '#f5f5f5',
          borderRadius: 4
        }}>
          <h4 style={{ margin: 0, flex: 1 }}>{groupField}: {groupValue}</h4>
          <Button
            type="link"
            icon={<PlusOutlined />}
            onClick={() => {
              const groupValues = [groupValue];
              onAddRowToGroup(groupValues, groupRules);
            }}
          >
            Thêm dòng
          </Button>
        </div>
        <Table
          columns={tableColumns}
          dataSource={groupRecords}
          rowKey="_id"
          pagination={false}
          size="small"
          scroll={{ x: 'max-content' }}
          rowSelection={{
            selectedRowKeys,
            onChange: onRowSelectionChange
          }}
          onRow={(record) => ({
            onContextMenu: (e) => onContextMenu(e, record._id)
          })}
        />
      </div>
    ));
  };

  return (
    <div ref={tableRef} className="table-container">
      {groupField ? (
        renderGroupedData()
      ) : (
        <Table
          columns={tableColumns}
          dataSource={sortedRecords}
          rowKey="_id"
          loading={loading}
          pagination={{
            pageSize: 50,
            showSizeChanger: true,
            showTotal: (total) => `Tổng cộng ${total} dòng`
          }}
          scroll={{ x: 'max-content' }}
          rowSelection={{
            selectedRowKeys,
            onChange: onRowSelectionChange
          }}
          onRow={(record) => ({
            onContextMenu: (e) => onContextMenu(e, record._id)
          })}
        />
      )}
    </div>
  );
};

export default TableView;
