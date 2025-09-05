import React from 'react';
import { Button, Space, Input, Dropdown, Menu, Badge, Tooltip } from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  SearchOutlined,
  FilterOutlined,
  SortAscendingOutlined,
  SettingOutlined,
  UnorderedListOutlined,
  ReloadOutlined,
  DownOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';

const { Search } = Input;

const TableToolbar = ({
  onBack,
  onAddColumn,
  onAddRow,
  onDeleteAll,
  onBulkDelete,
  selectedCount,
  searchTerm,
  onSearchChange,
  filterCount,
  onFilterClick,
  sortField,
  sortOrder,
  onSortClick,
  groupField,
  onGroupClick,
  visibleColumns,
  onFieldsClick,
  onRefresh,
  isLoading
}) => {
  const handleMenuClick = (e) => {
    if (e.key === 'deleteAll') {
      onDeleteAll();
    } else if (e.key === 'bulkDelete') {
      onBulkDelete();
    }
  };

  const menu = (
    <Menu onClick={handleMenuClick}>
      <Menu.Item key="bulkDelete" disabled={selectedCount === 0}>
        <Space>
          <DeleteOutlined />
          Xóa {selectedCount} dòng đã chọn
        </Space>
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="deleteAll" danger>
        <Space>
          <DeleteOutlined />
          Xóa tất cả dữ liệu
        </Space>
      </Menu.Item>
    </Menu>
  );

  return (
    <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
      <Space style={{ width: '100%', justifyContent: 'space-between' }} wrap>
        <Space>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={onBack}
          >
            Quay lại
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={onAddColumn}
          >
            Thêm cột
          </Button>
          <Button
            icon={<PlusOutlined />}
            onClick={onAddRow}
          >
            Thêm dòng
          </Button>
          <Dropdown overlay={menu}>
            <Button danger icon={<DeleteOutlined />}>
              Xóa <DownOutlined />
            </Button>
          </Dropdown>
        </Space>
        
        <Space>
          <Search
            placeholder="Tìm kiếm..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{ width: 200 }}
            prefix={<SearchOutlined />}
          />
          
          <Tooltip title="Lọc dữ liệu">
            <Badge count={filterCount} size="small">
              <Button
                icon={<FilterOutlined />}
                onClick={onFilterClick}
              >
                Lọc
              </Button>
            </Badge>
          </Tooltip>
          
          <Tooltip title={sortField ? `Sắp xếp theo: ${sortField} (${sortOrder})` : 'Sắp xếp'}>
            <Button
              icon={<SortAscendingOutlined />}
              onClick={onSortClick}
              type={sortField ? 'primary' : 'default'}
            >
              Sắp xếp
            </Button>
          </Tooltip>
          
          <Tooltip title={groupField ? `Nhóm theo: ${groupField}` : 'Nhóm'}>
            <Button
              icon={<UnorderedListOutlined />}
              onClick={onGroupClick}
              type={groupField ? 'primary' : 'default'}
            >
              Nhóm
            </Button>
          </Tooltip>
          
          <Tooltip title="Hiển thị/Ẩn cột">
            <Badge count={visibleColumns?.length} size="small">
              <Button
                icon={<SettingOutlined />}
                onClick={onFieldsClick}
              >
                Cột
              </Button>
            </Badge>
          </Tooltip>
          
          <Tooltip title="Làm mới">
            <Button
              icon={<ReloadOutlined />}
              onClick={onRefresh}
              loading={isLoading}
            />
          </Tooltip>
        </Space>
      </Space>
    </Space>
  );
};

export default TableToolbar;
