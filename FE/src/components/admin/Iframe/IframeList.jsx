import React, { useState, useContext } from 'react';
import { Link } from "react-router-dom";
import instance from '../../../utils/axiosInstance-cookie-only';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Button, Modal, Form, Input, Space, Popconfirm, Pagination, Select, Alert } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CopyOutlined, LockOutlined } from '@ant-design/icons';
import { toast } from 'react-toastify';
import { AuthContext } from '../../core/Auth';

const IframeList = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingIframe, setEditingIframe] = useState(null);
  const [form] = Form.useForm();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const queryClient = useQueryClient();
  
  // Get current user context
  const authContext = useContext(AuthContext) || {};
  const currentUser = authContext?.currentUser || null;
  const isSuperAdmin = authContext?.isSuperAdmin || false;
  const isSiteAdmin = currentUser?.role === 'site_admin';

  // Kiểm tra quyền truy cập
  const hasAccess = isSuperAdmin || isSiteAdmin;

  // Fetch iframe data with pagination
  const { data, isLoading, error } = useQuery({
    queryKey: ["IFRAME", currentPage, pageSize],
    queryFn: async () => {
      const { data } = await instance.get(`/iframe?page=${currentPage}&limit=${pageSize}`);
      return data;
    },
    enabled: !!currentUser && hasAccess, // Only fetch if user is authenticated and has access
  });

  // Fetch user data for viewers select
  const { data: userData, isLoading: loadingUsers } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data } = await instance.get(`/user?limit=1000`);
      return data.docs || data.data?.docs || [];
    },
    enabled: !!currentUser && hasAccess, // Only fetch if user is authenticated and has access
  });

  // Fetch sites for super admin
  const { data: sitesData } = useQuery({
    queryKey: ["sites"],
    queryFn: async () => {
      const { data } = await instance.get("/sites");
      return data.docs || data.data || data;
    },
    enabled: isSuperAdmin,
  });

  // Create iframe mutation
  const createMutation = useMutation({
    mutationFn: (values) => instance.post('/iframe', values),
    onSuccess: () => {
      queryClient.invalidateQueries(["IFRAME"]);
      toast.success('Thêm iframe thành công!');
      setIsModalVisible(false);
      form.resetFields();
    },
    onError: (error) => {
      // Kiểm tra lỗi access denied
      if (error?.response?.status === 403) {
        toast.error('Bạn không có quyền tạo iframe. Chỉ site admin và super admin mới có quyền này.');
      } else if (
        error?.response?.data?.message?.includes('duplicate key') ||
        error?.response?.data?.message?.includes('E11000') ||
        error?.response?.data?.message?.includes('domain')
      ) {
        toast.error('Tên miền đã tồn tại, vui lòng chọn tên khác!');
      } else {
        toast.error('Có lỗi xảy ra: ' + (error.response?.data?.message || error.message));
      }
    },
  });

  // Update iframe mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, values }) => instance.put(`/iframe/${id}`, values),
    onSuccess: () => {
      queryClient.invalidateQueries(["IFRAME"]);
      toast.success('Cập nhật iframe thành công!');
      setIsModalVisible(false);
      form.resetFields();
      setEditingIframe(null);
    },
    onError: (error) => {
      // Kiểm tra lỗi access denied
      if (error?.response?.status === 403) {
        toast.error('Bạn không có quyền sửa iframe. Chỉ site admin và super admin mới có quyền này.');
      } else if (
        error?.response?.data?.message?.includes('duplicate key') ||
        error?.response?.data?.message?.includes('E11000') ||
        error?.response?.data?.message?.includes('domain')
      ) {
        toast.error('Tên miền đã tồn tại, vui lòng chọn tên khác!');
      } else {
        toast.error('Có lỗi xảy ra: ' + (error.response?.data?.message || error.message));
      }
    },
  });

  // Delete iframe mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => instance.delete(`/iframe/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(["IFRAME"]);
      toast.success('Xóa iframe thành công!');
    },
    onError: (error) => {
      if (error?.response?.status === 403) {
        toast.error('Bạn không có quyền xóa iframe. Chỉ site admin và super admin mới có quyền này.');
      } else {
        toast.error('Có lỗi xảy ra khi xóa: ' + (error.response?.data?.message || error.message));
      }
    },
  });

  const handleAdd = () => {
    setEditingIframe(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingIframe(record);
    form.setFieldsValue({
      ...record,
      viewers: record.viewers?.map(u => typeof u === 'string' ? u : u._id),
      site_id: record.site_id?._id || record.site_id
    });
    setIsModalVisible(true);
  };

  const handleDelete = (id) => {
    deleteMutation.mutate(id);
  };

  const handleSubmit = (values) => {
    if (editingIframe) {
      updateMutation.mutate({ id: editingIframe._id, values });
    } else {
      createMutation.mutate(values);
    }
  };

  // Hiển thị thông báo không có quyền truy cập
  if (!hasAccess) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="Không có quyền truy cập"
          description="Chỉ site admin và super admin mới có quyền truy cập quản lý iframe. Vui lòng liên hệ quản trị viên nếu bạn cần quyền truy cập."
          type="warning"
          showIcon
          icon={<LockOutlined />}
          style={{ marginBottom: '16px' }}
        />
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <LockOutlined style={{ fontSize: '48px', color: '#faad14', marginBottom: '16px' }} />
          <h3>Quyền truy cập bị từ chối</h3>
          <p>Bạn không có quyền truy cập vào trang quản lý iframe.</p>
          <Button type="primary" onClick={() => window.history.back()}>
            Quay lại
          </Button>
        </div>
      </div>
    );
  }

  // Hiển thị lỗi access denied từ API
  if (error?.response?.status === 403) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="Không có quyền truy cập"
          description={error.response?.data?.message || "Chỉ site admin và super admin mới có quyền truy cập quản lý iframe."}
          type="warning"
          showIcon
          icon={<LockOutlined />}
          style={{ marginBottom: '16px' }}
        />
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <LockOutlined style={{ fontSize: '48px', color: '#faad14', marginBottom: '16px' }} />
          <h3>Quyền truy cập bị từ chối</h3>
          <p>Bạn không có quyền truy cập vào trang quản lý iframe.</p>
          <Button type="primary" onClick={() => window.history.back()}>
            Quay lại
          </Button>
        </div>
      </div>
    );
  }

  const columns = [
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
    },
    {
      title: 'Site',
      dataIndex: 'site_id',
      key: 'site_id',
      width: 120,
      render: (siteId) => {
        const site = sitesData?.find(s => s._id === siteId);
        return site ? site.name : "N/A";
      },
      hidden: !isSuperAdmin,
    },
    {
      title: 'Tên miền',
      dataIndex: 'domain',
      key: 'domain',
      ellipsis: true,
      render: (domain, record) => {
        // Get the site for this iframe
        const site = sitesData?.find(s => s._id === record.site_id);
        const siteDomain = site?.domains?.[0]; // Use first domain from site
        
        // Use site domain if available, otherwise fallback to current origin
        const baseUrl = siteDomain ? `https://${siteDomain}` : window.location.origin;
        const fullUrl = `${baseUrl}/${domain}`;
        
        return domain ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link
              to={`/${domain}`}
              style={{ 
                color: "#2563eb", 
                textDecoration: "underline", 
                cursor: "pointer",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "200px",
                display: "inline-block"
              }}
              title={fullUrl}
            >
              {fullUrl}
            </Link>
            <Button
              size="small"
              icon={<CopyOutlined />}
              onClick={() => {
                navigator.clipboard.writeText(fullUrl);
                toast.success('Đã copy domain!');
              }}
              title="Copy domain"
            />
          </div>
        ) : 'Chưa đặt';
      },
    },
    {
      title: 'URL',
      dataIndex: 'url',
      key: 'url',
      ellipsis: true,
      render: (url) => url || 'Chưa đặt',
    },
    {
      title: 'Người xem',
      dataIndex: 'viewers',
      key: 'viewers',
      render: (viewers) => {
        if (!viewers || viewers.length === 0) {
          return 'Không có';
        }
        return viewers.map(viewer => 
          typeof viewer === 'string' ? viewer : viewer.name || viewer.email
        ).join(', ');
      },
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          >
            Sửa
          </Button>
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa iframe này?"
            onConfirm={() => handleDelete(record._id)}
            okText="Có"
            cancelText="Không"
          >
            <Button
              type="primary"
              danger
              icon={<DeleteOutlined />}
              size="small"
            >
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Quản lý Iframe</h2>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
        >
          Thêm Iframe
        </Button>
      </div>

      <Table
        columns={columns.filter(col => !col.hidden)}
        dataSource={data?.docs || []}
        loading={isLoading}
        rowKey="_id"
        pagination={false}
      />

      {data && (
        <div style={{ marginTop: 16, textAlign: 'right' }}>
          <Pagination
            current={currentPage}
            total={data.totalDocs}
            pageSize={pageSize}
            showSizeChanger
            showQuickJumper
            showTotal={(total, range) =>
              `${range[0]}-${range[1]} của ${total} iframe`
            }
            onChange={(page, size) => {
              setCurrentPage(page);
              setPageSize(size);
            }}
          />
        </div>
      )}

      <Modal
        title={editingIframe ? "Sửa Iframe" : "Thêm Iframe"}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="title"
            label="Tiêu đề"
            rules={[{ required: true, message: 'Vui lòng nhập tiêu đề!' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="domain"
            label="Tên miền"
            rules={[{ required: true, message: 'Vui lòng nhập tên miền!' }]}
          >
            <Input placeholder="example" />
          </Form.Item>

          <Form.Item
            name="url"
            label="URL"
            rules={[{ required: true, message: 'Vui lòng nhập URL!' }]}
          >
            <Input placeholder="https://example.com" />
          </Form.Item>

          {isSuperAdmin && (
            <Form.Item
              name="site_id"
              label="Site"
            >
              <Select
                placeholder="Chọn site"
                allowClear
                loading={!sitesData}
              >
                {sitesData?.map(site => (
                  <Select.Option key={site._id} value={site._id}>
                    {site.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <Form.Item
            name="viewers"
            label="Người xem"
          >
            <Select
              mode="multiple"
              placeholder="Chọn người xem"
              allowClear
              loading={loadingUsers}
            >
              {userData?.map(user => (
                <Select.Option key={user._id} value={user._id}>
                  {user.name} ({user.email})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={createMutation.isPending || updateMutation.isPending}>
                {editingIframe ? 'Cập nhật' : 'Thêm'}
              </Button>
              <Button onClick={() => setIsModalVisible(false)}>
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default IframeList;
