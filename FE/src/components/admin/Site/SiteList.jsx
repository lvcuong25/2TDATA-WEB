import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, message, Space, Tag, Typography, Card, Tooltip } from 'antd';
import { Link } from 'react-router-dom';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, GlobalOutlined } from '@ant-design/icons';
import axiosInstance from '../../../axios/axiosInstance';

const { Title, Text } = Typography;
const { confirm } = Modal;

const SiteList = () => {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const fetchSites = async (page = 1, limit = 10) => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/sites?page=${page}&limit=${limit}`);
      setSites(response.data.data || []);
      setPagination({
        current: page,
        pageSize: limit,
        total: response.data.pagination?.totalDocs || 0,
      });
    } catch (error) {
      message.error('Không thể tải danh sách trang web');
      console.error('Error fetching sites:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSites();
  }, []);

  const handleDelete = (siteId, siteName) => {
    confirm({
      title: 'Xác nhận xóa trang web',
      content: `Bạn có chắc chắn muốn xóa trang web "${siteName}"? Hành động này không thể hoàn tác.`,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await axiosInstance.delete(`/sites/${siteId}`);
          message.success('Xóa trang web thành công');
          fetchSites(pagination.current, pagination.pageSize);
        } catch (error) {
          message.error('Không thể xóa trang web');
          console.error('Error deleting site:', error);
        }
      },
    });
  };

  const handleTableChange = (paginationInfo) => {
    fetchSites(paginationInfo.current, paginationInfo.pageSize);
  };

  const getStatusTag = (status) => {
    const statusConfig = {
      active: { color: 'green', text: 'Hoạt động' },
      inactive: { color: 'red', text: 'Không hoạt động' },
      maintenance: { color: 'orange', text: 'Bảo trì' },
    };
    const config = statusConfig[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const columns = [
    {
      title: 'Tên trang web',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div>
          <Text strong>{text}</Text>
          {record.domains && record.domains.length > 0 && (
            <div style={{ fontSize: '12px', color: '#666' }}>
              <GlobalOutlined /> {record.domains[0]}
              {record.domains.length > 1 && ` +${record.domains.length - 1} khác`}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: getStatusTag,
    },
    {
      title: 'Số tên miền',
      dataIndex: 'domains',
      key: 'domainCount',
      render: (domains) => (
        <Tag color="blue">{domains ? domains.length : 0} tên miền</Tag>
      ),
    },
    {
      title: 'Người dùng',
      dataIndex: 'stats',
      key: 'userCount',
      render: (stats) => (
        <Text>{stats?.totalUsers || 0} người dùng</Text>
      ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString('vi-VN'),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Link to={`/admin/sites/detail/${record._id}`}>
              <Button type="text" icon={<EyeOutlined />} size="small" />
            </Link>
          </Tooltip>
          <Tooltip title="Chỉnh sửa">
            <Link to={`/admin/sites/edit/${record._id}`}>
              <Button type="text" icon={<EditOutlined />} size="small" />
            </Link>
          </Tooltip>
          <Tooltip title="Xóa">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              size="small"
              onClick={() => handleDelete(record._id, record.name)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3} style={{ margin: 0 }}>Quản lý trang web</Title>
        <Link to="/admin/sites/add">
          <Button type="primary" icon={<PlusOutlined />}>
            Thêm trang web mới
          </Button>
        </Link>
      </div>

      <Table
        columns={columns}
        dataSource={sites}
        rowKey="_id"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} trang web`,
        }}
        onChange={handleTableChange}
      />
    </Card>
  );
};

export default SiteList;
