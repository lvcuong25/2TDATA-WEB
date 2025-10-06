import React, { useState } from 'react';
import { Button, Input, Select, Checkbox, Tooltip, Tag, Dropdown, DatePicker } from 'antd';
import {
  PlusOutlined,
  MoreOutlined,
  CheckCircleOutlined,
  CheckSquareOutlined,
  BorderOutlined,
  DownOutlined,
  RightOutlined,
  StarOutlined,
  StarFilled,
  HeartOutlined,
  HeartFilled,
  LikeOutlined,
  LikeFilled,
  FireOutlined,
  FireFilled,
  TrophyOutlined,
  TrophyFilled,
  CloseOutlined,
  LinkOutlined,
  EditOutlined,
  AppstoreOutlined,
  ExpandOutlined,
  ZoomInOutlined,
  LockOutlined,
  MailOutlined
} from '@ant-design/icons';
import DraggableColumnHeader from './DraggableColumnHeader';
import { formatDateForDisplay, formatDateForInput } from '../../../utils/dateFormatter.js';
import dayjs from 'dayjs';
import {
  getColumnWidthString,
  isColumnCompact
} from '../Utils/columnUtils.jsx';
import {
  getDataTypeIcon
} from '../Utils/dataTypeUtils.jsx';
import {
  getRowHeight,
  getRowHeightStyle,
  getRowContentStyle,
  getCellContentStyle
} from '../Utils/rowHeightUtils.jsx';
import LinkedTableSelectModal from './LinkedTableSelectModal';
import LookupDropdown from './LookupDropdown';
import EditRecordModal from '../Modals/EditRecordModal';
import { canEditCell, canViewCell } from '../Utils/permissionUtils.jsx';

// Custom AddOptionInput component for dropdown
const AddOptionInput = ({ onAddOption, placeholder = "Enter new option" }) => {
  const [newOptionInput, setNewOptionInput] = useState('');
  const [isAddingOption, setIsAddingOption] = useState(false);

  const handleAddOption = () => {
    if (newOptionInput.trim()) {
      onAddOption(newOptionInput.trim());
      setNewOptionInput('');
      setIsAddingOption(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleAddOption();
    } else if (e.key === 'Escape') {
      setNewOptionInput('');
      setIsAddingOption(false);
    }
  };

  return (
    <div style={{ 
      padding: '4px 6px', 
      borderTop: '1px solid #e8e8e8',
      backgroundColor: '#f8f9fa'
    }}>
      {isAddingOption ? (
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <Input
            value={newOptionInput}
            onChange={(e) => setNewOptionInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            size="small"
            style={{ flex: 1 }}
            autoFocus
          />
          <Button
            type="primary"
            size="small"
            onClick={handleAddOption}
            disabled={!newOptionInput.trim()}
            style={{ minWidth: 'auto', padding: '0 8px' }}
          >
            Add
          </Button>
          <Button
            size="small"
            onClick={() => {
              setNewOptionInput('');
              setIsAddingOption(false);
            }}
            style={{ minWidth: 'auto', padding: '0 8px' }}
          >
            Cancel
          </Button>
        </div>
      ) : (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          padding: '6px',
          backgroundColor: '#ffffff',
          border: '1px solid #e1e5e9',
          borderRadius: '4px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
          width: '100%',
          height: '28px'
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = '#f0f7ff';
          e.target.style.borderColor = '#1890ff';
          e.target.style.boxShadow = '0 2px 4px rgba(24, 144, 255, 0.15)';
          e.target.style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = '#ffffff';
          e.target.style.borderColor = '#e1e5e9';
          e.target.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
          e.target.style.transform = 'translateY(0)';
        }}
        onClick={() => setIsAddingOption(true)}
        >
          <PlusOutlined style={{ 
            color: '#1890ff', 
            fontSize: '14px',
            fontWeight: 'bold'
          }} />
        </div>
      )}
    </div>
  );
};

// Custom SingleSelectPill component
const SingleSelectPill = ({ value, options, onChange, onAddNewOption, isActive = false }) => {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Select
        value={value || ''}
        onChange={onChange}
        style={{ width: '100%' }}
        placeholder="Select option"
        allowClear
        tagRender={(props) => {
          const { label, closable, onClose } = props;
          return (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 8px',
                backgroundColor: '#f0f0f0',
                borderRadius: '12px',
                fontSize: '12px',
                color: '#333',
                border: '1px solid #d9d9d9',
                margin: '2px'
              }}
            >
              <span>{label}</span>
              {closable && (
                <div
                  onClick={onClose}
                  style={{
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(0,0,0,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '10px',
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                >
                  ×
                </div>
              )}
            </div>
          );
        }}
        dropdownRender={(menu) => (
          <div>
            {menu}
            <AddOptionInput onAddOption={onAddNewOption} />
          </div>
        )}
      >
        {options.map((option, index) => (
          <Option key={index} value={option}>
            {String(option || '')}
          </Option>
        ))}
      </Select>
    </div>
  );
};
import {
  isCellEditing
} from '../Utils/cellUtils.jsx';
import ProgressBar from './ProgressBar';

const { Option } = Select;

const TableBody = ({
  // Data props
  visibleColumns,
  columns,
  records,
  groupedData,
  expandedGroups,
  selectedRowKeys,
  columnWidths,
  editingCell,
  selectedCell,
  cellValue,

  // Handlers
  handleSelectAll,
  handleSelectRow,
  handleCellClick,
  handleCellSave,
  setCellValue,
  handleResizeStart,
  handleEditColumn,
  handleColumnPermission,
  handleCellPermission,
  handleDeleteColumn,
  handleAddColumnLeft,
  handleAddColumnRight,
  handleAddRow,
  handleAddRowToGroup,
  handleToggleGroupExpansion,
  handleContextMenu,
  updateRecordMutation,
  updateColumnMutation,

  // State
  isResizing,
  resizingColumn,
  selectAll,
  setShowAddColumn,

  // Column reordering props
  isDragging,
  draggedColumn,
  dragOverColumn,
  handleColumnDragStart,
  handleColumnDragOver,
  handleColumnDrop,
  handleColumnDragEnd,

  // Utility functions
  formatCellValueForDisplay,
  formatCellWithConditionalFormatting,
  // Row height props
  tableId,
  databaseId,
  rowHeightSettings,
  
  // Permission props
  cellPermissions,
  currentUser,
  userRole,
  cellPermissionsResponse,
  addDebugLog,
  // Table permission checks
  canEditStructure,
  canAddData,
  canEditData
}) => {
  // Debug userRole
  console.log('🚨 TABLEBODY userRole:', userRole, 'type:', typeof userRole);
  // State for linked table modal
  const [linkedTableModal, setLinkedTableModal] = useState({
    visible: false,
    column: null,
    record: null
  });

  // State for edit record modal
  const [editRecordModal, setEditRecordModal] = useState({
    visible: false,
    record: null
  });

  // State for hovered row
  const [hoveredRow, setHoveredRow] = useState(null);


  // Format datetime to YYYY-MM-DD HH:MM format
  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    } catch {
      return dateString;
    }
  };

  // Helper function to check if cell can be edited
  const isCellEditableByPermission = (recordId, columnId) => {
    
    
    if (!cellPermissions || !currentUser || !userRole) {
      return true; // Default to editable if no permission data
    }
    
    const result = canEditCell(cellPermissions, recordId, columnId, currentUser, userRole);
    return result;
  };

  // Helper function to check if current editing cell can be edited
  const canEditCurrentCell = () => {
    
    
    if (!editingCell || !editingCell.column || !editingCell.column._id) {
      return false;
    }
    
    const result = isCellEditableByPermission(editingCell.recordId, editingCell.column._id);
    return result;
  };

  // Check if a cell is selected
  const isCellSelected = (recordId, columnName) => {
    return selectedCell?.recordId === recordId && selectedCell?.columnName === columnName;
  };

  // Get row height for current table
  const currentRowHeight = getRowHeight(rowHeightSettings, tableId);
  const rowHeightStyle = getRowHeightStyle(currentRowHeight);
  const rowContentStyle = getRowContentStyle(currentRowHeight);
  const cellContentStyle = getCellContentStyle(currentRowHeight);

  // Function to add new option to single select or multi select column
  const handleAddNewOption = (column, newOption) => {
    if (!newOption || !newOption.trim()) return;
    
    let updatedColumnData;
    
    if (column.dataType === 'single_select') {
      const currentOptions = column.singleSelectConfig?.options || [];
      const updatedOptions = [...currentOptions, newOption.trim()];
      
      updatedColumnData = {
        ...column,
        singleSelectConfig: {
          ...column.singleSelectConfig,
          options: updatedOptions
        }
      };
    } else if (column.dataType === 'multi_select') {
      const currentOptions = column.multiSelectConfig?.options || [];
      const updatedOptions = [...currentOptions, newOption.trim()];
      
      updatedColumnData = {
        ...column,
        multiSelectConfig: {
          ...column.multiSelectConfig,
          options: updatedOptions
        }
      };
    } else {
      return; // Unsupported column type
    }
    
    updateColumnMutation.mutate({
      columnId: column._id,
      columnData: updatedColumnData
    });
  };

  // Function to handle record click and open edit modal
  const handleRecordClick = (record) => {
    setEditRecordModal({
      visible: true,
      record: record
    });
  };

  return (
    <div
      data-table-container
      style={{
        background: 'transparent',
        overflow: 'auto',
        cursor: isResizing ? 'col-resize' : 'default',
        width: '100%',
        height: 'auto',
        maxHeight: 'calc(100vh - 120px)'
      }}
    >
      <div style={{
        display: 'block',
        border: '1px solid #d9d9d9',
        borderTop: '1px solid #d9d9d9',
        overflow: 'visible',
        backgroundColor: 'transparent',
        userSelect: isResizing ? 'none' : 'auto',
        width: 'fit-content',
        minWidth: 'max-content',
        maxWidth: '100%',
        borderTopLeftRadius: '0',
        borderTopRightRadius: '0'
      }}>
        {/* Table Header */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #d9d9d9',
          backgroundColor: '#fafafa',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          {/* Checkbox and Index Column */}
          <div style={{
            width: '80px',
            minWidth: '80px',
            padding: '8px',
            borderRight: '1px solid #d9d9d9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            backgroundColor: '#f5f5f5'
          }}>
            <Checkbox
              checked={selectAll}
              onClick={() => handleSelectAll(null, records)}
              indeterminate={selectedRowKeys.length > 0 && selectedRowKeys.length < records.length}
            />
            <span style={{ fontSize: '12px', color: '#666', fontWeight: 'bold' }}>#</span>
          </div>

          {/* Data Columns */}
          {visibleColumns.map((column, index) => (
            <DraggableColumnHeader
              key={column.id || column._id}
              column={column}
              columnWidths={columnWidths}
              sortRules={[]}
              groupRules={[]}
              fieldVisibility={{}}
              isDragging={isDragging && draggedColumn === index}
              isDragOver={dragOverColumn === index}
              onDragStart={(e) => handleColumnDragStart(e, index)}
              onDragOver={(e) => handleColumnDragOver(e, index)}
              onDragEnd={handleColumnDragEnd}
              onDrop={(e) => handleColumnDrop(e, index)}
              onResizeStart={handleResizeStart}
              isResizing={isResizing}
              resizingColumn={resizingColumn}
              dragIndex={index}
              hoverIndex={index}
              handleEditColumn={handleEditColumn}
              handleColumnPermission={handleColumnPermission}
              handleDeleteColumn={handleDeleteColumn}
              handleAddColumnLeft={handleAddColumnLeft}
              handleAddColumnRight={handleAddColumnRight}
              isLastColumn={index === visibleColumns.length - 1}
            />
          ))}

          {/* Add Column Button */}
          <div style={{
            width: '50px',
            minWidth: '50px',
            padding: '8px',
            borderRight: '1px solid #d9d9d9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f5f5f5',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
            onClick={() => setShowAddColumn(true)}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
          >
            <Tooltip title="Thêm cột">
              <PlusOutlined
                style={{
                  color: '#1890ff',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              />
            </Tooltip>
          </div>
        </div>

        {/* Table Body */}
        <div style={{ overflow: 'visible' }}>
          {/* Grouped Records */}
          {groupedData.groups.map((group, groupIndex) => {
            const isExpanded = expandedGroups.has(group.key);

            return (
              <div key={group.key} style={{
                borderBottom: '1px solid #f0f0f0',
                backgroundColor: '#fafafa'
              }}>
                {/* Group Header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  borderBottom: isExpanded ? '1px solid #d9d9d9' : 'none',
                  backgroundColor: '#f6ffed',
                  transition: 'background-color 0.2s'
                }}
                  onClick={() => handleToggleGroupExpansion(group.key)}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f9ff'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f6ffed'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                    {isExpanded ? <DownOutlined /> : <RightOutlined />}
                    <span style={{
                      fontSize: '12px',
                      fontWeight: 'bold',
                      color: '#52c41a',
                      textTransform: 'uppercase'
                    }}>
                      {group.rules[0].field}
                    </span>
                    <span style={{ fontSize: '12px', color: '#666' }}>
                      {String(group.values[0] || '(empty)')}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Tooltip title={canAddData ? `Add record to ${group.rules[0].field}: ${String(group.values[0] || '(empty)')}` : 'No permission to add records'}>
                      <Button
                        type="text"
                        size="small"
                        icon={<PlusOutlined />}
                        disabled={!canAddData}
                        style={{
                          color: canAddData ? '#52c41a' : '#d9d9d9',
                          fontSize: '12px',
                          padding: '2px 4px',
                          minWidth: 'auto'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (canAddData) {
                            handleAddRowToGroup(group.values, group.rules);
                          }
                        }}
                      />
                    </Tooltip>
                    <span style={{
                      fontSize: '11px',
                      color: '#666',
                      backgroundColor: '#e6f7ff',
                      padding: '2px 6px',
                      borderRadius: '10px'
                    }}>
                      Count {group.count}
                    </span>
                  </div>
                </div>

                {/* Group Records */}
                {isExpanded && group.records.map((record, index) => (
                  <div key={record._id} style={{
                    display: 'flex',
                    borderBottom: '1px solid #f0f0f0',
                    backgroundColor: 'white',
                    ...rowHeightStyle
                  }}
                    onContextMenu={(e) => handleContextMenu(e, record._id)}
                  >
                    {/* Checkbox and Index */}
                    <div 
                      style={{
                        width: '80px',
                        minWidth: '80px',
                        ...rowContentStyle,
                        borderRight: '1px solid #d9d9d9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '2px',
                        padding: '4px 8px',
                        backgroundColor: '#fafafa',
                        position: 'relative'
                      }}
                      onMouseEnter={() => {
                        setHoveredRow(record._id);
                      }}
                      onMouseLeave={() => {
                        setHoveredRow(null);
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <div style={{
                          opacity: selectedRowKeys.includes(record._id) || hoveredRow === record._id ? 1 : 0,
                          transition: 'opacity 0.2s ease',
                          position: 'absolute',
                          left: '4px'
                        }}
                          className="hover-checkbox"
                        >
                          <Checkbox
                            checked={selectedRowKeys.includes(record._id)}
                            onChange={(e) => handleSelectRow(record._id, e.target.checked)}
                          />
                        </div>
                        <span style={{
                          fontSize: '12px',
                          color: '#666',
                          fontWeight: 'bold',
                          opacity: selectedRowKeys.includes(record._id) ? 0.3 : 1,
                          transition: 'margin-left 0.2s ease',
                          marginLeft: selectedRowKeys.includes(record._id) || hoveredRow === record._id ? '20px' : '0px'
                        }}
                          className="index-number"
                        >
                          {index + 1}
                        </span>
                      </div>
                      <Tooltip title="Chỉnh sửa bản ghi">
                        <Button
                          type="text"
                          size="small"
                          icon={<ExpandOutlined />}
                          className="edit-button"
                          style={{
                            opacity: hoveredRow === record._id ? 1 : 0,
                            transition: 'opacity 0.2s ease',
                            color: '#1890ff',
                            fontSize: '12px',
                            padding: '2px',
                            minWidth: 'auto',
                            height: '20px',
                            width: '20px'
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRecordClick(record);
                          }}
                        />
                      </Tooltip>
                    </div>

                    {/* Data Cells */}
                    {visibleColumns.map(column => {
                      let value = '';
                      if (column.isSystem) {
                        // Handle system fields
                        switch (column.name) {
                          case 'Id':
                            value = record._id || '';
                            break;
                          case 'CreatedAt':
                            value = record.createdAt ? formatDateTime(record.createdAt) : '';
                            break;
                          case 'UpdatedAt':
                            value = record.updatedAt ? formatDateTime(record.updatedAt) : '';
                            break;
                          default:
                            value = '';
                        }
                      } else {
                        // For percent columns, use default value if no value provided
                        if (column.dataType === 'percent') {
                          const cellValue = record.data?.[column.name];
                          value = (cellValue !== null && cellValue !== undefined && cellValue !== '') 
                            ? cellValue 
                            : (column.percentConfig?.defaultValue || 0);
                        } else if (column.dataType === 'single_select') {
                          // For single select columns, use default value if cell is null/undefined (new records)
                          // But if cell is empty string (cleared by user), show empty
                          const cellValue = record.data?.[column.name];
                          if (cellValue === null || cellValue === undefined) {
                            // New record - use default value
                            value = column.singleSelectConfig?.defaultValue || '';
                          } else {
                            // Existing record - use actual value (including empty string if cleared)
                            value = cellValue;
                          }
                        } else if (column.dataType === 'multi_select') {
                          // For multi select columns, use default value if cell is null/undefined (new records)
                          // But if cell is empty array (cleared by user), show empty
                          const cellValue = record.data?.[column.name];
                          if (cellValue === null || cellValue === undefined) {
                            // New record - use default value
                            value = column.multiSelectConfig?.defaultValue || [];
                          } else {
                            // Existing record - use actual value (including empty array if cleared)
                            value = Array.isArray(cellValue) ? cellValue : [];
                          }
                        } else {
                          value = record.data?.[column.name] || '';
                        }
                      }
                      const isEditing = isCellEditing(editingCell, record._id, column.name);
                      const isSelected = isCellSelected(record._id, column.name);

                      return (
                        <div key={column._id} style={{
                          width: getColumnWidthString(columnWidths, column._id),
                          minWidth: '50px',
                          padding: '0',
                          borderRight: '1px solid #d9d9d9',
                          position: 'relative',
                          ...cellContentStyle,
                          boxShadow: isSelected ? 'inset 0 0 0 2px #1890ff' : 'none'
                        }}>
                          {isEditing ? (
                            (() => {
                              const dataType = column.dataType;

                              if (dataType === 'date') {
                                return (
                                  <Input
                                    type="date"
                                    value={formatDateForInput(cellValue)}
                                    onChange={(e) => {
                                      if (!canEditCurrentCell()) {
                                        console.log('🔍 Permission denied: Cannot edit date cell');
                                        return;
                                      }
                                      setCellValue(e.target.value);
                                    }}
                                    onPressEnter={handleCellSave}
                                    onBlur={handleCellSave}
                                    autoFocus
                                    size="small"
                                    disabled={!canEditCurrentCell()}
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      border: 'none',
                                      padding: '0',
                                      margin: '0',
                                      borderRadius: '0',
                                      backgroundColor: 'transparent',
                                      boxShadow: 'none',
                                      fontSize: 'inherit',
                                      position: 'absolute',
                                      top: '0',
                                      left: '0',
                                      right: '0',
                                      bottom: '0',
                                      boxSizing: 'border-box',
                                      outline: 'none',
                                      cursor: canEditCurrentCell() ? 'text' : 'not-allowed'
                                    }}
                                  />
                                );
                              } else if (dataType === 'percent') {
                                return (
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={cellValue}
                                    onChange={(e) => {
                                      if (!canEditCurrentCell()) {
                                        console.log('🔍 Permission denied: Cannot edit percent cell');
                                        return;
                                      }
                                      setCellValue(e.target.value);
                                    }}
                                    onPressEnter={handleCellSave}
                                    onBlur={handleCellSave}
                                    autoFocus
                                    size="small"
                                    disabled={!canEditCurrentCell()}
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      border: 'none',
                                      padding: '0',
                                      margin: '0',
                                      borderRadius: '0',
                                      backgroundColor: 'transparent',
                                      boxShadow: 'none',
                                      fontSize: 'inherit',
                                      position: 'absolute',
                                      top: '0',
                                      left: '0',
                                      right: '0',
                                      bottom: '0',
                                      boxSizing: 'border-box',
                                      outline: 'none',
                                      cursor: canEditCurrentCell() ? 'text' : 'not-allowed'
                                    }}
                                  />
                                );
                              } else if (dataType === 'number' || dataType === 'currency') {
                                return (
                                  <Input
                                    type="number"
                                    step={dataType === 'currency' ? "0.01" : undefined}
                                    value={cellValue}
                                    onChange={(e) => {
                                      if (!canEditCurrentCell()) {
                                        console.log('🔍 Permission denied: Cannot edit number/currency cell');
                                        return;
                                      }
                                      setCellValue(e.target.value);
                                    }}
                                    onPressEnter={handleCellSave}
                                    onBlur={handleCellSave}
                                    autoFocus
                                    size="small"
                                    disabled={!canEditCurrentCell()}
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      border: 'none',
                                      padding: '0',
                                      margin: '0',
                                      borderRadius: '0',
                                      backgroundColor: 'transparent',
                                      boxShadow: 'none',
                                      fontSize: 'inherit',
                                      position: 'absolute',
                                      top: '0',
                                      left: '0',
                                      right: '0',
                                      bottom: '0',
                                      boxSizing: 'border-box',
                                      outline: 'none',
                                      cursor: canEditCurrentCell() ? 'text' : 'not-allowed'
                                    }}
                                  />
                                );
                              } else if (dataType === 'year') {
                                return (
                                  <DatePicker
                                    picker="year"
                                    value={cellValue ? dayjs().year(cellValue) : null}
                                    onChange={(date) => {
                                      const year = date ? date.year() : '';
                                      setCellValue(year);
                                    }}
                                    onBlur={handleCellSave}
                                    autoFocus
                                    size="small"
                                    placeholder="Select year"
                                    style={{ 
                                      width: '100%',
                                      height: '100%',
                                      border: 'none',
                                      padding: '0',
                                      margin: '0',
                                      borderRadius: '0',
                                      backgroundColor: 'transparent',
                                      boxShadow: 'none',
                                      fontSize: 'inherit',
                                      position: 'absolute',
                                      top: '0',
                                      left: '0',
                                      right: '0',
                                      bottom: '0',
                                      boxSizing: 'border-box',
                                      outline: 'none'
                                    }}
                                    inputStyle={{
                                      border: 'none',
                                      padding: '0',
                                      margin: '0',
                                      borderRadius: '0',
                                      backgroundColor: 'transparent',
                                      boxShadow: 'none',
                                      fontSize: 'inherit',
                                      height: '100%'
                                    }}
                                  />
                                );
                              } else if (dataType === 'email') {
                                return (
                                  <Input
                                    type="email"
                                    value={cellValue}
                                    onChange={(e) => {
                                      if (!canEditCurrentCell()) {
                                        console.log('🔍 Permission denied: Cannot edit email cell');
                                        return;
                                      }
                                      setCellValue(e.target.value);
                                    }}
                                    onPressEnter={handleCellSave}
                                    onBlur={handleCellSave}
                                    autoFocus
                                    size="small"
                                    placeholder="Enter email address"
                                    disabled={!canEditCurrentCell()}
                                    style={{
                                      width: '100%',
                                      border: '1px solid #d9d9d9',
                                      borderRadius: '4px'
                                    }}
                                  />
                                );
                              } else if (dataType === 'phone') {
                                return (
                                  <Input
                                    type="tel"
                                    value={cellValue}
                                    onChange={(e) => {
                                      if (!canEditCurrentCell()) {
                                        console.log('🔍 Permission denied: Cannot edit phone cell');
                                        return;
                                      }
                                      setCellValue(e.target.value);
                                    }}
                                    onPressEnter={handleCellSave}
                                    onBlur={handleCellSave}
                                    autoFocus
                                    size="small"
                                    placeholder="Enter phone number"
                                    disabled={!canEditCurrentCell()}
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      border: 'none',
                                      padding: '0',
                                      margin: '0',
                                      borderRadius: '0',
                                      backgroundColor: 'transparent',
                                      boxShadow: 'none',
                                      fontSize: 'inherit',
                                      position: 'absolute',
                                      top: '0',
                                      left: '0',
                                      right: '0',
                                      bottom: '0',
                                      boxSizing: 'border-box',
                                      outline: 'none',
                                      cursor: canEditCurrentCell() ? 'text' : 'not-allowed'
                                    }}
                                  />
                                );
                              } else if (dataType === 'time') {
                                const format = column.timeConfig?.format || '24';
                                const placeholder = format === '24' ? 'Enter time (HH:MM)' : 'Enter time (H:MM AM/PM)';
                                
                                return (
                                  <Input
                                    type={format === '24' ? 'time' : 'text'}
                                    value={cellValue}
                                    onChange={(e) => {
                                      if (!canEditCurrentCell()) {
                                        console.log('🔍 Permission denied: Cannot edit time cell');
                                        return;
                                      }
                                      setCellValue(e.target.value);
                                    }}
                                    onPressEnter={handleCellSave}
                                    onBlur={handleCellSave}
                                    autoFocus
                                    size="small"
                                    placeholder={placeholder}
                                    disabled={!canEditCurrentCell()}
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      border: 'none',
                                      padding: '0',
                                      margin: '0',
                                      borderRadius: '0',
                                      backgroundColor: 'transparent',
                                      boxShadow: 'none',
                                      fontSize: 'inherit',
                                      position: 'absolute',
                                      top: '0',
                                      left: '0',
                                      right: '0',
                                      bottom: '0',
                                      boxSizing: 'border-box',
                                      outline: 'none',
                                      cursor: canEditCurrentCell() ? 'text' : 'not-allowed'
                                    }}
                                  />
                                );
                              } else if (dataType === 'rating') {
                                const maxStars = column.ratingConfig?.maxStars || 5;
                                const allowHalf = true; // Always allow half stars
                                const icon = column.ratingConfig?.icon || 'star';
                                const color = column.ratingConfig?.color || '#faad14';
                                
                                const iconMap = {
                                  star: { filled: <StarFilled />, outline: <StarOutlined /> },
                                  heart: { filled: <HeartFilled />, outline: <HeartOutlined /> },
                                  like: { filled: <LikeFilled />, outline: <LikeOutlined /> },
                                  fire: { filled: <FireFilled />, outline: <FireOutlined /> },
                                  trophy: { filled: <TrophyFilled />, outline: <TrophyOutlined /> }
                                };
                                
                                const icons = iconMap[icon] || iconMap.star;
                                
                                const handleStarClick = (starValue) => {
                                  setCellValue(starValue.toString());
                                };
                                
                                const handleHalfStarClick = (starValue) => {
                                  if (allowHalf) {
                                    setCellValue((starValue - 0.5).toString());
                                  }
                                };
                                
                                return (
                                  <div style={{
                                    position: 'absolute',
                                    top: '0',
                                    left: '0',
                                    right: '0',
                                    bottom: '0',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '2px',
                                    padding: '4px',
                                    backgroundColor: 'white',
                                    border: '1px solid #1890ff',
                                    borderRadius: '4px'
                                  }}>
                                    {Array.from({ length: maxStars }, (_, index) => {
                                      const starValue = index + 1;
                                      const currentValue = Number(cellValue) || 0;
                                      const isFullStar = currentValue >= starValue;
                                      const isHalfStar = allowHalf && currentValue > index && currentValue < starValue;
                                      
                                      return (
                                        <div key={index} style={{ position: 'relative', display: 'flex' }}>
                                          {/* Half star click area */}
                                          {allowHalf && (
                                            <div
                                              style={{
                                                position: 'absolute',
                                                left: 0,
                                                top: 0,
                                                width: '50%',
                                                height: '100%',
                                                cursor: 'pointer',
                                                zIndex: 2
                                              }}
                                              onClick={() => handleHalfStarClick(starValue)}
                                            />
                                          )}
                                          
                                          {/* Full star click area */}
                                          <div
                                            style={{
                                              position: 'absolute',
                                              right: 0,
                                              top: 0,
                                              width: '50%',
                                              height: '100%',
                                              cursor: 'pointer',
                                              zIndex: 2
                                            }}
                                            onClick={() => handleStarClick(starValue)}
                                          />
                                          
                                          {/* Star display */}
                                          <span
                                            style={{
                                              color: isFullStar ? color : '#d9d9d9',
                                              fontSize: '16px',
                                              position: 'relative'
                                            }}
                                          >
                                            {isFullStar ? icons.filled : icons.outline}
                                            {isHalfStar && (
                                              <span
                                                style={{
                                                  position: 'absolute',
                                                  top: 0,
                                                  left: 0,
                                                  width: '50%',
                                                  overflow: 'hidden',
                                                  color: color
                                                }}
                                              >
                                                {icons.filled}
                                              </span>
                                            )}
                                          </span>
                                        </div>
                                      );
                                    })}
                                    
                                    {/* Number input for precise value */}
                                    <Input
                                      type="number"
                                      value={cellValue}
                                      onChange={(e) => {
                                        if (!canEditCurrentCell()) {
                                          console.log('🔍 Permission denied: Cannot edit rating cell');
                                          return;
                                        }
                                        setCellValue(e.target.value);
                                      }}
                                      onPressEnter={handleCellSave}
                                      onBlur={handleCellSave}
                                      size="small"
                                      placeholder={allowHalf ? `0-${maxStars}` : `0-${maxStars}`}
                                      min={0}
                                      max={maxStars}
                                      step={allowHalf ? 0.5 : 1}
                                      disabled={!canEditCurrentCell()}
                                      style={{
                                        width: '60px',
                                        marginLeft: '8px',
                                        fontSize: '12px',
                                        cursor: canEditCurrentCell() ? 'text' : 'not-allowed'
                                      }}
                                    />
                                  </div>
                                );
                              } else if (dataType === 'checkbox') {
                                return (
                                  <Select
                                    value={cellValue}
                                    onChange={(value) => {
                                      setCellValue(value);
                                      handleCellSave();
                                    }}
                                    autoFocus
                                    size="small"
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      border: 'none',
                                      padding: '0',
                                      margin: '0',
                                      borderRadius: '0',
                                      backgroundColor: 'transparent',
                                      boxShadow: 'none',
                                      fontSize: 'inherit',
                                      position: 'absolute',
                                      top: '0',
                                      left: '0',
                                      right: '0',
                                      bottom: '0',
                                      boxSizing: 'border-box',
                                      outline: 'none'
                                    }}
                                  >
                                    <Option value="true">True</Option>
                                    <Option value="false">False</Option>
                                  </Select>
                                );
                              } else if (dataType === 'single_select') {
                                const options = column.singleSelectConfig?.options || [];
                                return (
                                  <Select
                                    value={cellValue}
                                    onChange={(value) => {
                                      setCellValue(typeof value === 'object' ? JSON.stringify(value) : (value || ''));
                                      handleCellSave();
                                    }}
                                    autoFocus
                                    size="small"
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      border: 'none',
                                      padding: '0',
                                      margin: '0',
                                      borderRadius: '0',
                                      backgroundColor: 'transparent',
                                      boxShadow: 'none',
                                      fontSize: 'inherit',
                                      position: 'absolute',
                                      top: '0',
                                      left: '0',
                                      right: '0',
                                      bottom: '0',
                                      boxSizing: 'border-box',
                                      outline: 'none'
                                    }}
                                    placeholder="Select option"
                                    allowClear
                                    dropdownRender={(menu) => (
                                      <div>
                                        {menu}
                                        <div style={{ 
                                          padding: '4px 6px', 
                                          borderTop: '1px solid #e8e8e8',
                                          backgroundColor: '#f8f9fa'
                                        }}>
                                          <div style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center',
                                            padding: '6px',
                                            backgroundColor: '#ffffff',
                                            border: '1px solid #e1e5e9',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                                            width: '100%',
                                            height: '28px'
                                          }}
                                          onMouseEnter={(e) => {
                                            e.target.style.backgroundColor = '#f0f7ff';
                                            e.target.style.borderColor = '#1890ff';
                                            e.target.style.boxShadow = '0 2px 4px rgba(24, 144, 255, 0.15)';
                                            e.target.style.transform = 'translateY(-1px)';
                                          }}
                                          onMouseLeave={(e) => {
                                            e.target.style.backgroundColor = '#ffffff';
                                            e.target.style.borderColor = '#e1e5e9';
                                            e.target.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
                                            e.target.style.transform = 'translateY(0)';
                                          }}
                                          onClick={() => {
                                            const newOption = prompt('Enter new option:');
                                            if (newOption && newOption.trim()) {
                                              handleAddNewOption(column, newOption);
                                            }
                                          }}
                                          >
                                            <PlusOutlined style={{ 
                                              color: '#1890ff', 
                                              fontSize: '14px',
                                              fontWeight: 'bold'
                                            }} />
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  >
                                    {options.map((option, index) => (
                                      <Option key={index} value={option}>
                                        {String(option || '')}
                                      </Option>
                                    ))}
                                  </Select>
                                );
                              } else {
                                return (
                                  <Input
                                    value={cellValue}
                                    onChange={(e) => {
                                      if (!canEditCurrentCell()) {
                                        console.log('🔍 Permission denied: Cannot edit text cell');
                                        return;
                                      }
                                      setCellValue(e.target.value);
                                    }}
                                    onPressEnter={handleCellSave}
                                    onBlur={handleCellSave}
                                    autoFocus
                                    size="small"
                                    disabled={!canEditCurrentCell()}
                                    style={{
                                      width: '100%',
                                      height: '100%',
                                      border: 'none',
                                      padding: '0',
                                      margin: '0',
                                      borderRadius: '0',
                                      backgroundColor: 'transparent',
                                      boxShadow: 'none',
                                      fontSize: 'inherit',
                                      position: 'absolute',
                                      top: '0',
                                      left: '0',
                                      right: '0',
                                      bottom: '0',
                                      boxSizing: 'border-box',
                                      outline: 'none',
                                      cursor: canEditCurrentCell() ? 'text' : 'not-allowed'
                                    }}
                                  />
                                );
                              }
                            })()
                          ) : (
                            <div
                              style={{
                                cursor: column.isSystem || column.dataType === 'checkbox' || column.dataType === 'single_select' || column.dataType === 'multi_select' ? 'default' : 'pointer',
                                ...cellContentStyle,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                fontSize: '12px',
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                boxSizing: 'border-box',
                                backgroundColor: column.isSystem ? '#fafafa' : (!isCellEditableByPermission(record._id, column._id) ? '#f5f5f5' : 'transparent'),
                                color: column.isSystem ? '#666' : (!isCellEditableByPermission(record._id, column._id) ? '#999' : '#333'),
                                fontStyle: column.isSystem ? 'italic' : 'normal',
                                cursor: !isCellEditableByPermission(record._id, column._id) ? 'not-allowed' : 'pointer'
                              }}
                              onContextMenu={(e) => {
                                e.preventDefault();
                                if (column.isSystem) return;
                                
                                // Create context menu using DOM elements
                                const { clientX, clientY } = e;
                                const contextMenu = document.createElement('div');
                                contextMenu.style.position = 'fixed';
                                contextMenu.style.left = `${clientX}px`;
                                contextMenu.style.top = `${clientY}px`;
                                contextMenu.style.zIndex = '9999';
                                contextMenu.style.backgroundColor = 'white';
                                contextMenu.style.border = '1px solid #d9d9d9';
                                contextMenu.style.borderRadius = '6px';
                                contextMenu.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                                contextMenu.style.padding = '4px 0';
                                contextMenu.style.minWidth = '120px';
                                
                                // Only show permission menu item for owners and managers
                                if (userRole === 'manager' || userRole === 'owner') {
                                  const menuItem = document.createElement('div');
                                  menuItem.style.padding = '8px 12px';
                                  menuItem.style.cursor = 'pointer';
                                  menuItem.style.display = 'flex';
                                  menuItem.style.alignItems = 'center';
                                  menuItem.style.gap = '8px';
                                  menuItem.style.fontSize = '14px';
                                  menuItem.style.color = '#333';
                                  menuItem.style.transition = 'background-color 0.2s';
                                  menuItem.innerHTML = `
                                    <svg style="color: #1890ff; width: 14px; height: 14px;" viewBox="0 0 1024 1024">
                                      <path fill="currentColor" d="M257.7 752c2 0 4-.2 6-.5L431.9 722c2-.4 3.9-1.3 5.3-2.8l423.9-423.9a9.96 9.96 0 0 0 0-14.1L694.9 114.9c-1.9-1.9-4.4-2.9-7.1-2.9s-5.2 1-7.1 2.9L256.8 538.8c-1.5 1.5-2.4 3.3-2.8 5.3l-29.5 168.2a33.5 33.5 0 0 0 9.4 29.8c6.6 6.4 14.9 9.9 23.8 9.9zm67.4-174.4L687.8 215l73.3 73.3-362.7 362.6-88.9 15.7 15.6-89zM880 836H144c-17.7 0-32 14.3-32 32v36c0 4.4 3.6 8 8 8h784c4.4 0 8-3.6 8-8v-36c0-17.7-14.3-32-32-32z"/>
                                    </svg>
                                    Phân quyền cell
                                  `;
                                  
                                  menuItem.addEventListener('mouseenter', () => {
                                    menuItem.style.backgroundColor = '#f5f5f5';
                                  });
                                  menuItem.addEventListener('mouseleave', () => {
                                    menuItem.style.backgroundColor = 'transparent';
                                  });
                                  menuItem.addEventListener('click', () => {
                                    handleCellPermission(record._id, column._id, column.name);
                                    document.body.removeChild(contextMenu);
                                  });
                                  
                                  contextMenu.appendChild(menuItem);
                                }
                                document.body.appendChild(contextMenu);
                                
                                // Remove context menu when clicking elsewhere
                                const removeMenu = () => {
                                  if (document.body.contains(contextMenu)) {
                                    document.body.removeChild(contextMenu);
                                  }
                                  document.removeEventListener('click', removeMenu);
                                };
                                setTimeout(() => document.addEventListener('click', removeMenu), 0);
                              }}
                              onClick={() => {
                                console.log('🔍 CELL ONCLICK TRIGGERED!', {
                                  recordId: record._id,
                                  columnName: column.name,
                                  value,
                                  isSystem: column.isSystem,
                                  dataType: column.dataType,
                                  isEditable: isCellEditableByPermission(record._id, column._id)
                                });
                                
                                if (column.isSystem || column.dataType === 'checkbox' || column.dataType === 'single_select' || column.dataType === 'multi_select' || column.dataType === 'linked_table' || column.dataType === 'lookup' || column.dataType === 'json' || !isCellEditableByPermission(record._id, column._id)) {
                                  console.log('🔍 Cell click blocked by conditions');
                                  return;
                                }
                                
                                console.log('🔍 Calling handleCellClick...');
                                handleCellClick(record._id, column.name, value);
                              }}
                              onMouseEnter={column.isSystem || column.dataType === 'checkbox' || column.dataType === 'single_select' || column.dataType === 'multi_select' ? undefined : (e) => e.target.style.backgroundColor = '#f5f5f5'}
                              onMouseLeave={column.isSystem || column.dataType === 'checkbox' || column.dataType === 'single_select' || column.dataType === 'multi_select' ? undefined : (e) => e.target.style.backgroundColor = 'transparent'}
                            >
                              {column.dataType === 'datetime' && value ? 
                                value // Already formatted by formatDateTime
                                : column.dataType === 'date' && value ? 
                                (() => {
                                  try {
                                    const date = new Date(value);
                                    return formatDateForDisplay(value, column.dateConfig?.format || 'DD/MM/YYYY');
                                  } catch {
                                    return value;
                                  }
                                })() 
                                : column.dataType === "year" ? 
                                (value || <span style={{color: "#bfbfbf", fontStyle: "italic"}}>Select year</span>)
                                : column.dataType === 'checkbox' ?
                                    (() => {
                                      const isChecked = value === 'true' || value === true;
                                      const config = column.checkboxConfig || { icon: 'check-circle', color: '#52c41a', defaultValue: false };

                                      return (
                                        <div style={{
                                          display: 'flex',
                                          justifyContent: 'center',
                                          alignItems: 'center',
                                          height: '100%',
                                          width: '100%'
                                        }}>
                                          <div
                                            onClick={() => {
                                              const newValue = !isChecked;
                                              const updatedData = { ...record.data };
                                              updatedData[column.name] = newValue;

                                              updateRecordMutation.mutate({
                                                recordId: record._id,
                                                data: updatedData
                                              });
                                            }}
                                            style={{
                                              cursor: 'pointer',
                                              fontSize: '16px',
                                              color: isChecked ? config.color : '#666',
                                              transition: 'all 0.2s ease'
                                            }}
                                          >
                                            {isChecked ? (
                                              config.icon === 'check-circle' ?
                                                <CheckCircleOutlined style={{ color: config.color, fontSize: '16px' }} /> :
                                                <CheckSquareOutlined style={{ color: config.color, fontSize: '16px' }} />
                                            ) : (
                                              config.icon === 'check-circle' ?
                                                <BorderOutlined style={{ color: '#666', fontSize: '16px' }} /> :
                                                <BorderOutlined style={{ color: '#666', fontSize: '16px' }} />
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })()
                                    : column.dataType === 'single_select' ?
                                      (() => {
                                        const options = column.singleSelectConfig?.options || [];
                                        const selectedValue = value;
                                        
                                        return (
                                          <SingleSelectPill
                                            value={selectedValue}
                                            options={options}
                                            onChange={(newValue) => {
                                              const updatedData = { ...record.data };
                                              updatedData[column.name] = newValue || '';

                                              updateRecordMutation.mutate({
                                                recordId: record._id,
                                                data: updatedData
                                              });
                                            }}
                                            onAddNewOption={(newOption) => handleAddNewOption(column, newOption)}
                                            isActive={isCellSelected(record._id, column.name)}
                                          />
                                        );
                                      })()
                                    : column.dataType === 'multi_select' ?
                                      (() => {
                                        const options = column.multiSelectConfig?.options || [];
                                        const selectedValues = Array.isArray(value) ? value : [];
                                        
                                        return (
                                          <Select
                                            mode="multiple"
                                            value={selectedValues}
                                            onChange={(newValues) => {
                                              const updatedData = { ...record.data };
                                              updatedData[column.name] = newValues || [];

                                              updateRecordMutation.mutate({
                                                recordId: record._id,
                                                data: updatedData
                                              });
                                            }}
                                            style={{ width: '100%' }}
                                            placeholder="Select options"
                                            allowClear
                                            tagRender={(props) => {
                                              const { label, closable, onClose } = props;
                                              return (
                                                <div
                                                  style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                    padding: '2px 8px',
                                                    backgroundColor: '#f0f0f0',
                                                    borderRadius: '12px',
                                                    fontSize: '12px',
                                                    color: '#333',
                                                    border: '1px solid #d9d9d9',
                                                    margin: '2px'
                                                  }}
                                                >
                                                  <span>{label}</span>
                                                  {closable && (
                                                    <div
                                                      onClick={onClose}
                                                      style={{
                                                        width: '14px',
                                                        height: '14px',
                                                        borderRadius: '50%',
                                                        backgroundColor: 'rgba(0,0,0,0.2)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        cursor: 'pointer',
                                                        fontSize: '10px',
                                                        color: 'white',
                                                        fontWeight: 'bold'
                                                      }}
                                                    >
                                                      ×
                                                    </div>
                                                  )}
                                                </div>
                                              );
                                            }}
                                            dropdownRender={(menu) => (
                                              <div>
                                                {menu}
                                                <AddOptionInput 
                                                  onAddOption={(newOption) => handleAddNewOption(column, newOption)} 
                                                />
                                              </div>
                                            )}
                                          >
                                            {options.map((option, index) => {
                                              // Handle both string and object options
                                              const optionValue = typeof option === 'object' ? (option.id || option.name) : option;
                                              const optionLabel = typeof option === 'object' ? option.name : option;
                                              return (
                                                <Option key={index} value={optionValue}>
                                                  {String(optionLabel || '')}
                                                </Option>
                                              );
                                            })}
                                          </Select>
                                        );
                                      })()
                                    : column.dataType === 'currency' && value !== null && value !== undefined ?
                                      (() => {
                                        const config = column.currencyConfig || {
                                          position: 'before',
                                          decimalPlaces: 2,
                                          thousandsSeparator: ',',
                                          decimalSeparator: '.'
                                        };

                                        const numValue = parseFloat(typeof value === 'object' && value.amount !== undefined ? value.amount : value);
                                        if (isNaN(numValue)) return value;

                                        const formatted = numValue.toLocaleString('en-US', {
                                          minimumFractionDigits: config.decimalPlaces,
                                          maximumFractionDigits: config.decimalPlaces
                                        }).replace(/,/g, config.thousandsSeparator).replace(/\./g, config.decimalSeparator);

                                        return config.position === 'before' ? `${config.symbol}${formatted}` : `${formatted}${config.symbol}`;
                                      })()
                                      : column.dataType === 'percent' && column.percentConfig?.displayAsProgress ? (
                                        <ProgressBar 
                                          value={Number(String(value)) || 0} 
                                          max={100}
                                          color="#1890ff"
                                          height="6px"
                                        />
                                      ) : column.dataType === 'percent' ? (
                                        (() => {
                                          const numValue = Number(String(value)) || 0;
                                          const displayFormat = column.percentConfig?.displayFormat || 'percentage';
                                          
                                          if (displayFormat === 'decimal') {
                                            // Display as decimal (e.g., 0.25 for 25%)
                                            return (numValue / 100).toFixed(2);
                                          } else {
                                            // Display as percentage (e.g., 25%)
                                            return `${numValue}%`;
                                          }
                                        })()
                                      ) : column.dataType === 'json' ? (
                                        (() => {
                                          try {
                                            if (!value || value === '') {
                                              return <span style={{ color: '#999', fontStyle: 'italic' }}>Empty JSON</span>;
                                            }
                                            
                                            // Try to parse and format JSON
                                            const jsonValue = typeof value === 'string' ? JSON.parse(value) : value;
                                            const formattedJson = JSON.stringify(jsonValue, null, 2);
                                            
                                            return (
                                              <div style={{ 
                                                fontFamily: 'monospace', 
                                                fontSize: '12px',
                                                backgroundColor: '#f5f5f5',
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                border: '1px solid #d9d9d9',
                                                maxWidth: '200px',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                              }}>
                                                {formattedJson.length > 50 ? `${formattedJson.substring(0, 50)}...` : formattedJson}
                                              </div>
                                            );
                                          } catch (error) {
                                            return (
                                              <div style={{ 
                                                color: '#ff4d4f',
                                                fontFamily: 'monospace',
                                                fontSize: '12px'
                                              }}>
                                                Invalid JSON
                                              </div>
                                            );
                                          }
                                        })()
                                      ) : column.dataType === 'linked_table' ?
                                        (() => {
                                          const linkedValue = value;
                                          const isMultiple = column.linkedTableConfig?.allowMultiple;
                                          
                                          if (!linkedValue) {
                                            return (
                                              <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                color: '#bfbfbf',
                                                fontStyle: 'italic',
                                                cursor: 'pointer'
                                              }}
                                              onClick={() => setLinkedTableModal({
                                                visible: true,
                                                column: column,
                                                record: record
                                              })}
                                              >
                                                <LinkOutlined />
                                                <span>Chọn dữ liệu</span>
                                              </div>
                                            );
                                          }

                                          if (isMultiple && Array.isArray(linkedValue)) {
                                            return (
                                              <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                flexWrap: 'wrap',
                                                cursor: 'pointer'
                                              }}
                                              onClick={() => setLinkedTableModal({
                                                visible: true,
                                                column: column,
                                                record: record
                                              })}
                                              >
                                                {linkedValue.map((item, index) => (
                                                  <Tag key={index} color="blue" size="small">
                                                    {String(item?.label || item?.data?.name || `Item ${index + 1}`)}
                                                  </Tag>
                                                ))}
                                                <Tag color="green" size="small">+</Tag>
                                              </div>
                                            );
                                          } else {
                                            const singleItem = isMultiple ? linkedValue[0] : linkedValue;
                                            return (
                                              <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                cursor: 'pointer'
                                              }}
                                              onClick={() => setLinkedTableModal({
                                                visible: true,
                                                column: column,
                                                record: record
                                              })}
                                              >
                                                <LinkOutlined style={{ color: '#722ed1' }} />
                                                <span>{String(singleItem?.label || singleItem?.data?.name || 'Linked Item')}</span>
                                              </div>
                                            );
                                          }
                                        })()
                                      : column.dataType === 'lookup' ? 
                                        (() => {
                                          if (isEditing && editingCell.columnName === column.name) {
                                            return (
                                              <LookupDropdown
                                                column={column}
                                                value={value}
                                                onChange={(selectedOption) => {
                                                  handleCellSave(record._id, column.name, selectedOption);
                                                }}
                                                placeholder={`Select from ${column.lookupConfig?.linkedTableName || 'table'}...`}
                                              />
                                            );
                                          }
                                          
                                          // Hiển thị giá trị đã được pull từ bảng liên kết
                                          if (!value) {
                                            return (
                                              <div style={{
                                                color: '#bfbfbf',
                                                fontStyle: 'italic',
                                                cursor: 'pointer'
                                              }}
                                              onClick={!isCellEditableByPermission(record._id, column._id) ? undefined : () => handleCellClick(record._id, column.name, value)}
                                              >
                                                Select value...
                                              </div>
                                            );
                                          }
                                          
                                          // Hiển thị label đã được pull từ bảng liên kết
                                          return (
                                            <div style={{ cursor: 'pointer' }}
                                            onClick={() => handleCellClick(record._id, column.name, value)}
                                            >
                                              {String(value?.label || 'Lookup Value')}
                                            </div>
                                          );
                                        })()
                                        : (() => {
                                            // Check if user can view this cell
                                            const canView = canViewCell(
                                              cellPermissions, 
                                              record._id, 
                                              column._id, 
                                              currentUser, 
                                              userRole
                                            );
                                            
                                            if (!canView) {
                                              return (
                                                <LockOutlined 
                                                  style={{ 
                                                    color: '#d9d9d9', 
                                                    fontSize: '14px',
                                                    padding: '2px'
                                                  }} 
                                                />
                                              );
                                            }
                                            
                                            if (formatCellWithConditionalFormatting) {
                                              const { value: formattedValue, style } = formatCellWithConditionalFormatting(value, column, record);
                                              return (
                                                <span style={style}>
                                                  {formattedValue}
                                                </span>
                                              );
                                            }
                                            return formatCellValueForDisplay ? formatCellValueForDisplay(value, column) : (typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value || ''));
                                          })()
                              }
                            </div>
                          )}

                          {/* Autofill handle for selected cell */}
                          {isSelected && !isEditing && (
                            <div
                              style={{
                                position: 'absolute',
                                bottom: '-2px',
                                right: '-2px',
                                width: '8px',
                                height: '8px',
                                backgroundColor: '#ff4d4f',
                                border: '1px solid #fff',
                                borderRadius: '1px',
                                cursor: 'crosshair',
                                zIndex: 10
                              }}
                            />
                          )}
                        </div>
                      );
                    })}

                    {/* Empty cell for alignment */}
                    <div style={{
                      width: '50px',
                      minWidth: '50px',
                      padding: '8px'
                    }} />
                  </div>
                ))}

                {/* Add New Record to Group */}
                {isExpanded && (
                  <div style={{
                    display: 'flex',
                    borderBottom: '1px solid #d9d9d9',
                    backgroundColor: canAddData ? '#fafafa' : '#f5f5f5',
                    cursor: canAddData ? 'pointer' : 'not-allowed',
                    transition: 'background-color 0.2s',
                    opacity: canAddData ? 1 : 0.6
                  }}
                    onClick={canAddData ? () => handleAddRowToGroup(String(group.values), group.rules) : undefined}
                    onMouseEnter={(e) => {
                      if (canAddData) {
                        e.currentTarget.style.backgroundColor = '#f0f0f0';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (canAddData) {
                        e.currentTarget.style.backgroundColor = '#fafafa';
                      }
                    }}
                  >
                    {/* Checkbox and Index Column */}
                    <div style={{
                      width: '80px',
                      minWidth: '80px',
                      padding: '8px',
                      borderRight: '1px solid #d9d9d9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <PlusOutlined
                        style={{
                          color: '#52c41a',
                          fontSize: '16px',
                          fontWeight: 'bold'
                        }}
                      />
                    </div>

                    {/* Data Columns */}
                    {visibleColumns.map((column, index) => {
                      const isLastColumn = index === visibleColumns.length - 1;
                      return (
                      <div key={column._id} style={{
                        width: getColumnWidthString(columnWidths, column._id),
                        minWidth: '50px',
                        padding: '8px',
                      
                      }} />
                      );
                    })}

                    {/* Empty cell for alignment */}
                    <div style={{
                      width: '50px',
                      minWidth: '50px',
                      padding: '8px'
                    }} />
                  </div>
                )}
              </div>
            );
          })}

          {/* Ungrouped Records */}
          {groupedData.ungroupedRecords.map((record, index) => (
            <div key={record._id} style={{
              display: 'flex',
              borderBottom: '1px solid #f0f0f0',
              ...rowHeightStyle
            }}
              onContextMenu={(e) => handleContextMenu(e, record._id)}
            >
              {/* Checkbox and Index */}
              <div 
                style={{
                  width: '80px',
                  minWidth: '80px',
                  ...rowContentStyle,
                  borderRight: '1px solid #d9d9d9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '2px',
                  padding: '4px 8px',
                  position: 'relative'
                }}
                onMouseEnter={() => {
                  setHoveredRow(record._id);
                }}
                onMouseLeave={() => {
                  setHoveredRow(null);
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{
                    opacity: selectedRowKeys.includes(record._id) || hoveredRow === record._id ? 1 : 0,
                    transition: 'opacity 0.2s ease',
                    position: 'absolute',
                    left: '4px'
                  }}
                    className="hover-checkbox"
                  >
                    <Checkbox
                      checked={selectedRowKeys.includes(record._id)}
                      onChange={(e) => handleSelectRow(record._id, e.target.checked)}
                    />
                  </div>
                  <span style={{
                    fontSize: '12px',
                    color: '#666',
                    fontWeight: 'bold',
                    opacity: selectedRowKeys.includes(record._id) ? 0.3 : 1,
                    transition: 'margin-left 0.2s ease',
                    marginLeft: selectedRowKeys.includes(record._id) || hoveredRow === record._id ? '20px' : '0px'
                  }}
                    className="index-number"
                  >
                    {index + 1}
                  </span>
                </div>
                <Tooltip title="Chỉnh sửa bản ghi">
                  <Button
                    type="text"
                    size="small"
                    icon={<ExpandOutlined />}
                    className="edit-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRecordClick(record);
                    }}
                    style={{
                      opacity: hoveredRow === record._id ? 1 : 0,
                      transition: 'opacity 0.2s ease',
                      color: '#1890ff',
                      fontSize: '12px',
                      padding: '2px',
                      minWidth: 'auto',
                      height: '20px',
                      width: '20px'
                    }}
                  />
                </Tooltip>
              </div>

              {/* Data Cells */}
              {visibleColumns.map((column, index) => {
                let value = '';
                if (column.isSystem) {
                  // Handle system fields
                  switch (column.name) {
                    case 'Id':
                      value = record._id || '';
                      break;
                    case 'CreatedAt':
                      value = record.createdAt ? formatDateTime(record.createdAt) : '';
                      break;
                    case 'UpdatedAt':
                      value = record.updatedAt ? formatDateTime(record.updatedAt) : '';
                      break;
                    default:
                      value = '';
                  }
                } else {
                  // For percent columns, use default value if no value provided
                  if (column.dataType === 'percent') {
                    const cellValue = record.data?.[column.name];
                    value = (cellValue !== null && cellValue !== undefined && cellValue !== '') 
                      ? cellValue 
                      : (column.percentConfig?.defaultValue || 0);
                  } else if (column.dataType === 'single_select') {
                    // For single select columns, use default value if cell is null/undefined (new records)
                    // But if cell is empty string (cleared by user), show empty
                    const cellValue = record.data?.[column.name];
                    if (cellValue === null || cellValue === undefined) {
                      // New record - use default value
                      value = column.singleSelectConfig?.defaultValue || '';
                    } else {
                      // Existing record - use actual value (including empty string if cleared)
                      value = cellValue;
                    }
                  } else if (column.dataType === 'multi_select') {
                    // For multi select columns, use default value if cell is null/undefined (new records)
                    // But if cell is empty array (cleared by user), show empty
                    const cellValue = record.data?.[column.name];
                    if (cellValue === null || cellValue === undefined) {
                      // New record - use default value
                      value = column.multiSelectConfig?.defaultValue || [];
                    } else {
                      // Existing record - use actual value (including empty array if cleared)
                      value = Array.isArray(cellValue) ? cellValue : [];
                    }
                  } else {
                    value = record.data?.[column.name] || '';
                  }
                }
                const isEditing = editingCell?.recordId === record._id && editingCell?.columnName === column.name;
                const isSelected = isCellSelected(record._id, column.name);

                const isLastColumn = index === visibleColumns.length - 1;
                return (
                  <div key={column._id} style={{
                    width: getColumnWidthString(columnWidths, column._id),
                    minWidth: '50px',
                    padding: '0',
                    borderRight: '1px solid #d9d9d9',
                    position: 'relative',
                    ...cellContentStyle,
                    boxShadow: isSelected ? 'inset 0 0 0 2px #1890ff' : 'none'
                  }}>
                    {isEditing ? (
                      (() => {
                        const dataType = column.dataType;

                        if (dataType === 'date') {
                          return (
                            <Input
                              type="date"
                              value={formatDateForInput(cellValue)}
                              onChange={(e) => {
                                if (!canEditCurrentCell()) {
                                  console.log('🔍 Permission denied: Cannot edit date cell (grouped)');
                                  return;
                                }
                                setCellValue(e.target.value);
                              }}
                              onPressEnter={handleCellSave}
                              onBlur={handleCellSave}
                              autoFocus
                              size="small"
                              disabled={!canEditCurrentCell()}
                              style={{
                                width: '100%',
                                height: '100%',
                                border: 'none',
                                padding: '0',
                                margin: '0',
                                borderRadius: '0',
                                backgroundColor: 'transparent',
                                boxShadow: 'none',
                                fontSize: 'inherit',
                                position: 'absolute',
                                top: '0',
                                left: '0',
                                right: '0',
                                bottom: '0',
                                boxSizing: 'border-box',
                                outline: 'none',
                                cursor: canEditCurrentCell() ? 'text' : 'not-allowed'
                              }}
                            />
                          );
                        } else if (dataType === 'number' || dataType === 'currency') {
                          return (
                            <Input
                              type="number"
                              step={dataType === 'currency' ? "0.01" : undefined}
                              value={cellValue}
                              onChange={(e) => {
                                if (!canEditCurrentCell()) {
                                  console.log('🔍 Permission denied: Cannot edit number/currency cell (grouped)');
                                  return;
                                }
                                setCellValue(e.target.value);
                              }}
                              onPressEnter={handleCellSave}
                              onBlur={handleCellSave}
                              autoFocus
                              size="small"
                              disabled={!canEditCurrentCell()}
                              style={{
                                width: '100%',
                                height: '100%',
                                border: 'none',
                                padding: '0',
                                margin: '0',
                                borderRadius: '0',
                                backgroundColor: 'transparent',
                                boxShadow: 'none',
                                fontSize: 'inherit',
                                position: 'absolute',
                                top: '0',
                                left: '0',
                                right: '0',
                                bottom: '0',
                                boxSizing: 'border-box',
                                outline: 'none',
                                cursor: canEditCurrentCell() ? 'text' : 'not-allowed'
                              }}
                            />
                          );
                        } else if (dataType === 'email') {
                          return (
                            <Input
                              type="email"
                              value={cellValue}
                              onChange={(e) => {
                                if (!canEditCurrentCell()) {
                                  console.log('🔍 Permission denied: Cannot edit email cell (grouped)');
                                  return;
                                }
                                setCellValue(e.target.value);
                              }}
                              onPressEnter={handleCellSave}
                              onBlur={handleCellSave}
                              autoFocus
                              size="small"
                              placeholder="Enter email address"
                              disabled={!canEditCurrentCell()}
                              style={{
                                width: '100%',
                                height: '100%',
                                border: 'none',
                                padding: '0',
                                margin: '0',
                                borderRadius: '0',
                                backgroundColor: 'transparent',
                                boxShadow: 'none',
                                fontSize: 'inherit',
                                position: 'absolute',
                                top: '0',
                                left: '0',
                                right: '0',
                                bottom: '0'
                              }}
                            />
                          );
                        } else if (dataType === 'phone') {
                          return (
                            <Input
                              type="tel"
                              value={cellValue}
                              onChange={(e) => {
                                if (!canEditCurrentCell()) {
                                  console.log('🔍 Permission denied: Cannot edit phone cell (grouped)');
                                  return;
                                }
                                setCellValue(e.target.value);
                              }}
                              onPressEnter={handleCellSave}
                              onBlur={handleCellSave}
                              autoFocus
                              size="small"
                              placeholder="Enter phone number"
                              disabled={!canEditCurrentCell()}
                              style={{
                                width: '100%',
                                height: '100%',
                                border: 'none',
                                padding: '0',
                                margin: '0',
                                borderRadius: '0',
                                backgroundColor: 'transparent',
                                boxShadow: 'none',
                                fontSize: 'inherit',
                                position: 'absolute',
                                top: '0',
                                left: '0',
                                right: '0',
                                bottom: '0',
                                boxSizing: 'border-box',
                                outline: 'none',
                                cursor: canEditCurrentCell() ? 'text' : 'not-allowed'
                              }}
                            />
                          );
                        } else if (dataType === 'time') {
                          const format = column.timeConfig?.format || '24';
                          const placeholder = format === '24' ? 'Enter time (HH:MM)' : 'Enter time (H:MM AM/PM)';
                          
                          return (
                            <Input
                              type={format === '24' ? 'time' : 'text'}
                              value={cellValue}
                              onChange={(e) => {
                                if (!canEditCurrentCell()) {
                                  console.log('🔍 Permission denied: Cannot edit time cell (grouped)');
                                  return;
                                }
                                setCellValue(e.target.value);
                              }}
                              onPressEnter={handleCellSave}
                              onBlur={handleCellSave}
                              autoFocus
                              size="small"
                              placeholder={placeholder}
                              disabled={!canEditCurrentCell()}
                              style={{
                                width: '100%',
                                height: '100%',
                                border: 'none',
                                padding: '0',
                                margin: '0',
                                borderRadius: '0',
                                backgroundColor: 'transparent',
                                boxShadow: 'none',
                                fontSize: 'inherit',
                                position: 'absolute',
                                top: '0',
                                left: '0',
                                right: '0',
                                bottom: '0',
                                boxSizing: 'border-box',
                                outline: 'none',
                                cursor: canEditCurrentCell() ? 'text' : 'not-allowed'
                              }}
                            />
                          );
                        } else if (dataType === 'year') {
                          return (
                            <DatePicker
                              picker="year"
                              value={cellValue ? dayjs().year(cellValue) : null}
                              onChange={(date) => {
                                const year = date ? date.year() : '';
                                setCellValue(year);
                              }}
                              onBlur={handleCellSave}
                              autoFocus
                              size="small"
                              placeholder="Select year"
                              style={{ 
                                width: '100%',
                                height: '100%',
                                border: 'none',
                                padding: '0',
                                margin: '0',
                                borderRadius: '0',
                                backgroundColor: 'transparent',
                                boxShadow: 'none',
                                fontSize: 'inherit',
                                position: 'absolute',
                                top: '0',
                                left: '0',
                                right: '0',
                                bottom: '0',
                                boxSizing: 'border-box',
                                outline: 'none'
                              }}
                              inputStyle={{
                                border: 'none',
                                padding: '0',
                                margin: '0',
                                borderRadius: '0',
                                backgroundColor: 'transparent',
                                boxShadow: 'none',
                                fontSize: 'inherit',
                                height: '100%'
                              }}
                            />
                          );
                        } else if (dataType === 'checkbox') {
                          return (
                            <Select
                              value={cellValue}
                              onChange={(value) => {
                                setCellValue(value);
                                handleCellSave();
                              }}
                              autoFocus
                              size="small"
                              style={{
                                width: '100%',
                                height: '100%',
                                border: 'none',
                                padding: '0',
                                margin: '0',
                                borderRadius: '0',
                                backgroundColor: 'transparent',
                                boxShadow: 'none',
                                fontSize: 'inherit',
                                position: 'absolute',
                                top: '0',
                                left: '0',
                                right: '0',
                                bottom: '0',
                                boxSizing: 'border-box',
                                outline: 'none'
                              }}
                            >
                              <Option value="true">True</Option>
                              <Option value="false">False</Option>
                            </Select>
                          );
                        } else if (dataType === 'single_select') {
                          const options = column.singleSelectConfig?.options || [];
                          return (
                            <Select
                              value={cellValue}
                              onChange={(value) => {
                                setCellValue(typeof value === 'object' ? JSON.stringify(value) : (value || ''));
                                handleCellSave();
                              }}
                              autoFocus
                              size="small"
                              style={{
                                width: '100%',
                                height: '100%',
                                border: 'none',
                                padding: '0',
                                margin: '0',
                                borderRadius: '0',
                                backgroundColor: 'transparent',
                                boxShadow: 'none',
                                fontSize: 'inherit',
                                position: 'absolute',
                                top: '0',
                                left: '0',
                                right: '0',
                                bottom: '0',
                                boxSizing: 'border-box',
                                outline: 'none'
                              }}
                              placeholder="Select option"
                              allowClear
                              dropdownRender={(menu) => (
                                <div>
                                  {menu}
                                  <div style={{ 
                                    padding: '4px 6px', 
                                    borderTop: '1px solid #e8e8e8',
                                    backgroundColor: '#f8f9fa'
                                  }}>
                                    <div style={{ 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      justifyContent: 'center',
                                      padding: '6px',
                                      backgroundColor: '#ffffff',
                                      border: '1px solid #e1e5e9',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s ease',
                                      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                                      width: '100%',
                                      height: '28px'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.target.style.backgroundColor = '#f0f7ff';
                                      e.target.style.borderColor = '#1890ff';
                                      e.target.style.boxShadow = '0 2px 4px rgba(24, 144, 255, 0.15)';
                                      e.target.style.transform = 'translateY(-1px)';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.target.style.backgroundColor = '#ffffff';
                                      e.target.style.borderColor = '#e1e5e9';
                                      e.target.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
                                      e.target.style.transform = 'translateY(0)';
                                    }}
                                    onClick={() => {
                                      const newOption = prompt('Enter new option:');
                                      if (newOption && newOption.trim()) {
                                        handleAddNewOption(column, newOption);
                                      }
                                    }}
                                    >
                                      <PlusOutlined style={{ 
                                        color: '#1890ff', 
                                        fontSize: '14px',
                                        fontWeight: 'bold'
                                      }} />
                                    </div>
                                  </div>
                                </div>
                              )}
                            >
                              {options.map((option, index) => (
                                <Option key={index} value={option}>
                                  {String(option || '')}
                                </Option>
                              ))}
                            </Select>
                          );
                        } else {
                          return (
                            <Input
                              value={cellValue}
                              onChange={(e) => {
                                if (!canEditCurrentCell()) {
                                  console.log('🔍 Permission denied: Cannot edit text cell (grouped)');
                                  return;
                                }
                                setCellValue(e.target.value);
                              }}
                              onPressEnter={handleCellSave}
                              onBlur={handleCellSave}
                              autoFocus
                              size="small"
                              disabled={!canEditCurrentCell()}
                              style={{
                                width: '100%',
                                height: '100%',
                                border: 'none',
                                padding: '0',
                                margin: '0',
                                borderRadius: '0',
                                backgroundColor: 'transparent',
                                boxShadow: 'none',
                                fontSize: 'inherit',
                                position: 'absolute',
                                top: '0',
                                left: '0',
                                right: '0',
                                bottom: '0',
                                boxSizing: 'border-box',
                                outline: 'none',
                                cursor: canEditCurrentCell() ? 'text' : 'not-allowed'
                              }}
                            />
                          );
                        }
                      })()
                    ) : (
                      <div
                        style={{
                          cursor: column.isSystem || column.dataType === 'checkbox' || column.dataType === 'single_select' || column.dataType === 'multi_select' ? 'default' : 'pointer',
                          ...cellContentStyle,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontSize: '12px',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          boxSizing: 'border-box',
                          backgroundColor: column.isSystem ? '#fafafa' : (!isCellEditableByPermission(record._id, column._id) ? '#f5f5f5' : 'transparent'),
                          color: column.isSystem ? '#666' : (!isCellEditableByPermission(record._id, column._id) ? '#999' : '#333'),
                          fontStyle: column.isSystem ? 'italic' : 'normal',
                          cursor: !isCellEditableByPermission(record._id, column._id) ? 'not-allowed' : 'pointer'
                        }}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          if (column.isSystem) return;
                          
                          // Create context menu using DOM elements
                          const { clientX, clientY } = e;
                          const contextMenu = document.createElement('div');
                          contextMenu.style.position = 'fixed';
                          contextMenu.style.left = `${clientX}px`;
                          contextMenu.style.top = `${clientY}px`;
                          contextMenu.style.zIndex = '9999';
                          contextMenu.style.backgroundColor = 'white';
                          contextMenu.style.border = '1px solid #d9d9d9';
                          contextMenu.style.borderRadius = '6px';
                          contextMenu.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                          contextMenu.style.padding = '4px 0';
                          contextMenu.style.minWidth = '120px';
                          
                          // Only show permission menu item for owners and managers
                          if (userRole === 'manager' || userRole === 'owner') {
                            const menuItem = document.createElement('div');
                            menuItem.style.padding = '8px 12px';
                            menuItem.style.cursor = 'pointer';
                            menuItem.style.display = 'flex';
                            menuItem.style.alignItems = 'center';
                            menuItem.style.gap = '8px';
                            menuItem.style.fontSize = '14px';
                            menuItem.style.color = '#333';
                            menuItem.style.transition = 'background-color 0.2s';
                            menuItem.innerHTML = `
                              <svg style="color: #1890ff; width: 14px; height: 14px;" viewBox="0 0 1024 1024">
                                <path fill="currentColor" d="M257.7 752c2 0 4-.2 6-.5L431.9 722c2-.4 3.9-1.3 5.3-2.8l423.9-423.9a9.96 9.96 0 0 0 0-14.1L694.9 114.9c-1.9-1.9-4.4-2.9-7.1-2.9s-5.2 1-7.1 2.9L256.8 538.8c-1.5 1.5-2.4 3.3-2.8 5.3l-29.5 168.2a33.5 33.5 0 0 0 9.4 29.8c6.6 6.4 14.9 9.9 23.8 9.9zm67.4-174.4L687.8 215l73.3 73.3-362.7 362.6-88.9 15.7 15.6-89zM880 836H144c-17.7 0-32 14.3-32 32v36c0 4.4 3.6 8 8 8h784c4.4 0 8-3.6 8-8v-36c0-17.7-14.3-32-32-32z"/>
                              </svg>
                              Phân quyền cell
                            `;
                            
                            menuItem.addEventListener('mouseenter', () => {
                              menuItem.style.backgroundColor = '#f5f5f5';
                            });
                            menuItem.addEventListener('mouseleave', () => {
                              menuItem.style.backgroundColor = 'transparent';
                            });
                            menuItem.addEventListener('click', () => {
                              handleCellPermission(record._id, column._id, column.name);
                              document.body.removeChild(contextMenu);
                            });
                            
                            contextMenu.appendChild(menuItem);
                          }
                          document.body.appendChild(contextMenu);
                          
                          // Remove context menu when clicking elsewhere
                          const removeMenu = () => {
                            if (document.body.contains(contextMenu)) {
                              document.body.removeChild(contextMenu);
                            }
                            document.removeEventListener('click', removeMenu);
                          };
                          setTimeout(() => document.addEventListener('click', removeMenu), 0);
                        }}
                        onClick={() => {
                          console.log('🔍 CELL ONCLICK TRIGGERED (GROUPED)!', {
                            recordId: record._id,
                            columnName: column.name,
                            value,
                            isSystem: column.isSystem,
                            dataType: column.dataType,
                            isEditable: isCellEditableByPermission(record._id, column._id)
                          });
                          
                          if (column.isSystem || column.dataType === 'checkbox' || column.dataType === 'single_select' || column.dataType === 'multi_select' || column.dataType === 'linked_table' || column.dataType === 'lookup' || column.dataType === 'json' || !isCellEditableByPermission(record._id, column._id)) {
                            console.log('🔍 Cell click blocked by conditions (grouped)');
                            return;
                          }
                          
                          console.log('🔍 Calling handleCellClick (grouped)...');
                          handleCellClick(record._id, column.name, value);
                        }}
                        onMouseEnter={column.isSystem || column.dataType === 'checkbox' || column.dataType === 'single_select' || column.dataType === 'multi_select' ? undefined : (e) => e.target.style.backgroundColor = '#f5f5f5'}
                        onMouseLeave={column.isSystem || column.dataType === 'checkbox' || column.dataType === 'single_select' || column.dataType === 'multi_select' ? undefined : (e) => e.target.style.backgroundColor = 'transparent'}
                      >
                        {column.dataType === 'datetime' && value ? 
                          value // Already formatted by formatDateTime
                          : column.dataType === 'date' && value ? 
                          (() => {
                            try {
                              const date = new Date(value);
                              return formatDateForDisplay(value, column.dateConfig?.format || 'DD/MM/YYYY');
                            } catch {
                              return value;
                            }
                          })() 
                          : column.dataType === "year" ? 
                          (value || <span style={{color: "#bfbfbf", fontStyle: "italic"}}>Select year</span>)
                          : column.dataType === 'url' && value ?
                              (() => {
                                let displayUrl = value;


                                // Debug log
                                console.log('TableBody URL Debug:', {
                                  columnName: column.name,
                                  value,
                                  urlConfig: column.urlConfig,
                                  hasUrlConfig: !!column.urlConfig,
                                  protocol: column.urlConfig?.protocol
                                });

                                // Auto-add protocol
                                if (!value.startsWith('http://') && !value.startsWith('https://')) {
                                  if (column.urlConfig && column.urlConfig.protocol && column.urlConfig.protocol !== 'none') {
                                    // Use the configured protocol
                                    const protocol = column.urlConfig.protocol;
                                    displayUrl = `${protocol}://${String(value)}`;
                                    console.log('Using configured protocol:', protocol, '→', displayUrl);
                                  } else if (column.urlConfig && column.urlConfig.protocol === 'none') {
                                    // Don't add protocol, keep original value
                                    displayUrl = String(value);
                                    console.log('Protocol is none, keeping original value:', displayUrl);
                                  } else if (!column.urlConfig) {
                                    // Fallback for old columns without urlConfig
                                    displayUrl = `https://${String(value)}`;
                                    console.log('Using fallback protocol: https →', displayUrl);
                                  }
                                }

                                return displayUrl;
                              })()
                              : column.dataType === 'email' && value ?
                                <a 
                                  href={`mailto:${value}`} 
                                  style={{ 
                                    color: '#1890ff', 
                                    textDecoration: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MailOutlined style={{ fontSize: '12px' }} />
                                  {value}
                                </a>
                                : column.dataType === 'phone' && value ?
                                  value
                                  : column.dataType === 'time' && value ?
                                    value
                                    : column.dataType === 'rating' ?
                                      (() => {
                                        const ratingValue = value !== undefined && value !== null && value !== '' ? Number(value) : 0;
                                        const maxStars = column.ratingConfig?.maxStars || 5;
                                        const icon = column.ratingConfig?.icon || 'star';
                                        const color = column.ratingConfig?.color || '#faad14';
                                        const allowHalf = true; // Always allow half stars
                                        
                                        console.log('TableBody: Displaying rating', {
                                          columnName: column.name,
                                          ratingValue,
                                          maxStars,
                                          icon,
                                          color,
                                          ratingConfig: column.ratingConfig
                                        });
                                        
                                        const iconMap = {
                                          star: { filled: <StarFilled />, outline: <StarOutlined /> },
                                          heart: { filled: <HeartFilled />, outline: <HeartOutlined /> },
                                          like: { filled: <LikeFilled />, outline: <LikeOutlined /> },
                                          fire: { filled: <FireFilled />, outline: <FireOutlined /> },
                                          trophy: { filled: <TrophyFilled />, outline: <TrophyOutlined /> }
                                        };
                                        
                                        const icons = iconMap[icon] || iconMap.star;
                                        
                                        const renderStar = (index) => {
                                          const starValue = index + 1;
                                          const isHalfStar = allowHalf && ratingValue > index && ratingValue < starValue;
                                          const isFullStar = ratingValue >= starValue;
                                          
                                          if (isHalfStar) {
                                            return (
                                              <span
                                                key={index}
                                                style={{
                                                  position: 'relative',
                                                  fontSize: '14px',
                                                  color: '#d9d9d9'
                                                }}
                                              >
                                                {icons.outline}
                                                <span
                                                  style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    width: '50%',
                                                    overflow: 'hidden',
                                                    color: color
                                                  }}
                                                >
                                                  {icons.filled}
                                                </span>
                                              </span>
                                            );
                                          }
                                          
                                          return (
                                            <span
                                              key={index}
                                              style={{
                                                color: isFullStar ? color : '#d9d9d9',
                                                fontSize: '14px'
                                              }}
                                            >
                                              {isFullStar ? icons.filled : icons.outline}
                                            </span>
                                          );
                                        };
                                        
                                        return (
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                                            {Array.from({ length: maxStars }, (_, index) => renderStar(index))}
                                            <span style={{ marginLeft: '8px', fontSize: '12px', color: '#666' }}>
                                              {ratingValue}/{maxStars}
                                            </span>
                                          </div>
                                        );
                                      })()
                                    : column.dataType === 'checkbox' ?
                                  (() => {
                                    const isChecked = value === 'true' || value === true;
                                    const config = column.checkboxConfig || { icon: 'check-circle', color: '#52c41a', defaultValue: false };

                                    return (
                                      <div style={{
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        height: '100%',
                                        width: '100%'
                                      }}>
                                        <div
                                          onClick={() => {
                                            const newValue = !isChecked;
                                            const updatedData = { ...record.data };
                                            updatedData[column.name] = newValue;

                                            updateRecordMutation.mutate({
                                              recordId: record._id,
                                              data: updatedData
                                            });
                                          }}
                                          style={{
                                            cursor: 'pointer',
                                            fontSize: '16px',
                                            color: isChecked ? config.color : '#666',
                                            transition: 'all 0.2s ease'
                                          }}
                                        >
                                          {isChecked ? (
                                            config.icon === 'check-circle' ?
                                              <CheckCircleOutlined style={{ color: config.color, fontSize: '16px' }} /> :
                                              <CheckSquareOutlined style={{ color: config.color, fontSize: '16px' }} />
                                          ) : (
                                            config.icon === 'check-circle' ?
                                              <BorderOutlined style={{ color: '#666', fontSize: '16px' }} /> :
                                              <BorderOutlined style={{ color: '#666', fontSize: '16px' }} />
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })()
                                  : column.dataType === 'single_select' ?
                                    (() => {
                                      const options = column.singleSelectConfig?.options || [];
                                      const selectedValue = value;
                                      
                                      return (
                                        <SingleSelectPill
                                          value={selectedValue}
                                          options={options}
                                          onChange={(newValue) => {
                                            const updatedData = { ...record.data };
                                            updatedData[column.name] = newValue || '';

                                            updateRecordMutation.mutate({
                                              recordId: record._id,
                                              data: updatedData
                                            });
                                          }}
                                          onAddNewOption={(newOption) => handleAddNewOption(column, newOption)}
                                          isActive={isCellSelected(record._id, column.name)}
                                        />
                                      );
                                    })()
                                  : column.dataType === 'multi_select' ?
                                    (() => {
                                      const options = column.multiSelectConfig?.options || [];
                                      const selectedValues = Array.isArray(value) ? value : [];
                                      
                                      return (
                                        <Select
                                          mode="multiple"
                                          value={selectedValues}
                                          onChange={(newValues) => {
                                            const updatedData = { ...record.data };
                                            updatedData[column.name] = newValues || [];

                                            updateRecordMutation.mutate({
                                              recordId: record._id,
                                              data: updatedData
                                            });
                                          }}
                                          style={{ width: '100%' }}
                                          placeholder="Select options"
                                          allowClear
                                          tagRender={(props) => {
                                            const { label, closable, onClose } = props;
                                            return (
                                              <div
                                                style={{
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  gap: '4px',
                                                  padding: '2px 8px',
                                                  backgroundColor: '#f0f0f0',
                                                  borderRadius: '12px',
                                                  fontSize: '12px',
                                                  color: '#333',
                                                  border: '1px solid #d9d9d9',
                                                  margin: '2px'
                                                }}
                                              >
                                                <span>{label}</span>
                                                {closable && (
                                                  <div
                                                    onClick={onClose}
                                                    style={{
                                                      width: '14px',
                                                      height: '14px',
                                                      borderRadius: '50%',
                                                      backgroundColor: 'rgba(0,0,0,0.2)',
                                                      display: 'flex',
                                                      alignItems: 'center',
                                                      justifyContent: 'center',
                                                      cursor: 'pointer',
                                                      fontSize: '10px',
                                                      color: 'white',
                                                      fontWeight: 'bold'
                                                    }}
                                                  >
                                                    ×
                                                  </div>
                                                )}
                                              </div>
                                            );
                                          }}
                                          dropdownRender={(menu) => (
                                            <div>
                                              {menu}
                                              <AddOptionInput 
                                                onAddOption={(newOption) => handleAddNewOption(column, newOption)} 
                                              />
                                            </div>
                                          )}
                                        >
                                          {options.map((option, index) => {
                                            // Handle both string and object options
                                            const optionValue = typeof option === 'object' ? (option.id || option.name) : option;
                                            const optionLabel = typeof option === 'object' ? option.name : option;
                                            return (
                                              <Option key={index} value={optionValue}>
                                                {String(optionLabel || '')}
                                              </Option>
                                            );
                                          })}
                                        </Select>
                                      );
                                    })()
                                  : column.dataType === 'currency' && value !== null && value !== undefined ?
                                    (() => {
                                      const config = column.currencyConfig || {
                                          
                                          currency: (typeof value === 'object' && value.currency) || column.currencyConfig?.currency || 'USD',
                                          symbol: (typeof value === 'object' && value.currency === 'VND') ? '₫' : column.currencyConfig?.symbol || '$',
                                        currency: 'USD',
                                        symbol: '$',
                                        position: 'before',
                                        decimalPlaces: 2,
                                        thousandsSeparator: ',',
                                        decimalSeparator: '.'
                                      };

                                      const numValue = parseFloat(typeof value === 'object' && value.amount !== undefined ? value.amount : value);
                                      if (isNaN(numValue)) return value;

                                      const formatted = numValue.toLocaleString('en-US', {
                                        minimumFractionDigits: config.decimalPlaces,
                                        maximumFractionDigits: config.decimalPlaces
                                      }).replace(/,/g, config.thousandsSeparator).replace(/\./g, config.decimalSeparator);

                                      return config.position === 'before' ? `${config.symbol}${formatted}` : `${formatted}${config.symbol}`;
                                    })()
                                    : column.dataType === 'percent' && column.percentConfig?.displayAsProgress ? (
                                      <ProgressBar 
                                        value={Number(String(value)) || 0} 
                                        max={100}
                                        color="#1890ff"
                                        height="6px"
                                      />
                                    ) : column.dataType === 'percent' ? (
                                      (() => {
                                        const numValue = Number(String(value)) || 0;
                                        const displayFormat = column.percentConfig?.displayFormat || 'percentage';
                                        
                                        if (displayFormat === 'decimal') {
                                          // Display as decimal (e.g., 0.25 for 25%)
                                          return (numValue / 100).toFixed(2);
                                        } else {
                                          // Display as percentage (e.g., 25%)
                                          return `${numValue}%`;
                                        }
                                      })()
                                    ) : column.dataType === 'json' ? (
                                      (() => {
                                        try {
                                          if (!value || value === '') {
                                            return <span style={{ color: '#999', fontStyle: 'italic' }}>Empty JSON</span>;
                                          }
                                          
                                          // Try to parse and format JSON
                                          const jsonValue = typeof value === 'string' ? JSON.parse(value) : value;
                                          const formattedJson = JSON.stringify(jsonValue, null, 2);
                                          
                                          return (
                                            <div style={{ 
                                              fontFamily: 'monospace', 
                                              fontSize: '12px',
                                              backgroundColor: '#f5f5f5',
                                              padding: '4px 8px',
                                              borderRadius: '4px',
                                              border: '1px solid #d9d9d9',
                                              maxWidth: '200px',
                                              overflow: 'hidden',
                                              textOverflow: 'ellipsis',
                                              whiteSpace: 'nowrap'
                                            }}>
                                              {formattedJson.length > 50 ? `${formattedJson.substring(0, 50)}...` : formattedJson}
                                            </div>
                                          );
                                        } catch (error) {
                                          return (
                                            <div style={{ 
                                              color: '#ff4d4f',
                                              fontFamily: 'monospace',
                                              fontSize: '12px'
                                            }}>
                                              Invalid JSON
                                            </div>
                                          );
                                        }
                                      })()
                                    ) : column.dataType === 'linked_table' ?
                                      (() => {
                                        const linkedValue = value;
                                        const isMultiple = column.linkedTableConfig?.allowMultiple;
                                        
                                        if (!linkedValue) {
                                          return (
                                            <div style={{
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: '8px',
                                              color: '#bfbfbf',
                                              fontStyle: 'italic',
                                              cursor: 'pointer'
                                            }}
                                            onClick={() => setLinkedTableModal({
                                              visible: true,
                                              column: column,
                                              record: record
                                            })}
                                            >
                                              <LinkOutlined />
                                              <span>Chọn dữ liệu</span>
                                            </div>
                                          );
                                        }

                                        if (isMultiple && Array.isArray(linkedValue)) {
                                          return (
                                            <div style={{
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: '4px',
                                              flexWrap: 'wrap',
                                              cursor: 'pointer'
                                            }}
                                            onClick={() => setLinkedTableModal({
                                              visible: true,
                                              column: column,
                                              record: record
                                            })}
                                            >
                                              {linkedValue.map((item, index) => (
                                                <Tag key={index} color="blue" size="small">
                                                  {String(item?.label || item?.data?.name || `Item ${index + 1}`)}
                                                </Tag>
                                              ))}
                                              <Tag color="green" size="small">+</Tag>
                                            </div>
                                          );
                                        } else {
                                          const singleItem = isMultiple ? linkedValue[0] : linkedValue;
                                          return (
                                            <div style={{
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: '8px',
                                              cursor: 'pointer'
                                            }}
                                            onClick={() => setLinkedTableModal({
                                              visible: true,
                                              column: column,
                                              record: record
                                            })}
                                            >
                                              <LinkOutlined style={{ color: '#722ed1' }} />
                                              <span>{String(singleItem?.label || singleItem?.data?.name || 'Linked Item')}</span>
                                            </div>
                                          );
                                        }
                                      })()
                                    : column.dataType === 'lookup' ? 
                                      (() => {
                                        if (isEditing && editingCell.columnName === column.name) {
                                          return (
                                            <LookupDropdown
                                              column={column}
                                              value={value}
                                              onChange={(selectedOption) => {
                                                handleCellSave(record._id, column.name, selectedOption);
                                              }}
                                              placeholder={`Select from ${column.lookupConfig?.linkedTableName || 'table'}...`}
                                            />
                                          );
                                        }
                                        
                                        // Hiển thị giá trị đã được pull từ bảng liên kết
                                        if (!value) {
                                          return (
                                            <div style={{
                                              color: '#bfbfbf',
                                              fontStyle: 'italic',
                                              cursor: 'pointer'
                                            }}
                                            onClick={() => handleCellClick(record._id, column.name, value)}
                                            >
                                              Select value...
                                            </div>
                                          );
                                        }
                                        
                                        // Hiển thị label đã được pull từ bảng liên kết
                                        return (
                                          <div style={{ cursor: 'pointer' }}
                                          onClick={() => handleCellClick(record._id, column.name, value)}
                                          >
                                            {String(value?.label || 'Lookup Value')}
                                          </div>
                                        );
                                      })()
                                      : (() => {
                                          // Check if user can view this cell
                                          const canView = canViewCell(
                                            cellPermissions, 
                                            record._id, 
                                            column._id, 
                                            currentUser, 
                                            userRole
                                          );
                                          
                                          if (!canView) {
                                            return (
                                              <LockOutlined 
                                                style={{ 
                                                  color: '#d9d9d9', 
                                                  fontSize: '14px',
                                                  padding: '2px'
                                                }} 
                                              />
                                            );
                                          }
                                          
                                          if (formatCellWithConditionalFormatting) {
                                            const { value: formattedValue, style } = formatCellWithConditionalFormatting(value, column, record);
                                            return (
                                              <span style={style}>
                                                {formattedValue}
                                              </span>
                                            );
                                          }
                                          return formatCellValueForDisplay ? formatCellValueForDisplay(value, column) : (typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value || ''));
                                        })()
                        }
                      </div>
                    )}

                    {/* Autofill handle for selected cell */}
                    {isSelected && !isEditing && (
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '-2px',
                          right: '-2px',
                          width: '8px',
                          height: '8px',
                          backgroundColor: '#ff4d4f',
                          border: '1px solid #fff',
                          borderRadius: '1px',
                          cursor: 'crosshair',
                          zIndex: 10
                        }}
                      />
                    )}
                  </div>
                );
              })}

              {/* Empty cell for alignment */}
              <div style={{
                width: '50px',
                minWidth: '50px',
                padding: '8px'
              }} />
            </div>
          ))}

          {/* Add Row Footer */}
          <div style={{
            display: 'flex',
            borderBottom: '1px solid #d9d9d9',
            backgroundColor: canAddData ? '#fafafa' : '#f5f5f5',
            cursor: canAddData ? 'pointer' : 'not-allowed',
            transition: 'background-color 0.2s',
            opacity: canAddData ? 1 : 0.6
          }}
            onClick={canAddData ? handleAddRow : undefined}
            onMouseEnter={(e) => {
              if (canAddData) {
                e.currentTarget.style.backgroundColor = '#f0f0f0';
              }
            }}
            onMouseLeave={(e) => {
              if (canAddData) {
                e.currentTarget.style.backgroundColor = '#fafafa';
              }
            }}
          >
            {/* Checkbox and Index Column */}
            <div style={{
              width: '80px',
              minWidth: '80px',
              padding: '8px',
              borderRight: '1px solid #d9d9d9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <PlusOutlined
                style={{
                  color: canAddData ? '#1890ff' : '#d9d9d9',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}
              />
            </div>

            {/* Data Columns */}
            {visibleColumns.map((column, index) => {
              const isLastColumn = index === visibleColumns.length - 1;
              return (
              <div key={column._id} style={{
                width: getColumnWidthString(columnWidths, column._id),
                minWidth: '50px',
                padding: '8px',
           
              }} />
              );
            })}

            {/* Empty cell for alignment */}
            <div style={{
              width: '50px',
              minWidth: '50px',
              padding: '8px'
            }} />
          </div>
        </div>
      </div>

      {/* Edit Record Modal */}
      <EditRecordModal
        open={editRecordModal.visible}
        onCancel={() => setEditRecordModal({ visible: false, record: null })}
        record={editRecordModal.record}
        tableId={tableId}
        tableColumns={visibleColumns}
        onSuccess={(data) => {
          // Data will be automatically updated through React Query
          // No need to refresh the page
        }}
      />

      {/* Linked Table Select Modal */}
      <LinkedTableSelectModal
        visible={linkedTableModal.visible}
        onCancel={() => setLinkedTableModal({ visible: false, column: null, record: null })}
        onSelect={(selectedData) => {
          console.log('Selected linked table data:', selectedData);
        }}
        column={linkedTableModal.column}
        record={linkedTableModal.record}
        updateRecordMutation={updateRecordMutation}
      />

    </div>
  );
};

export default TableBody;
