import React, { useState, useContext } from 'react';
import { Link } from "react-router-dom";
import instance from '../../../utils/axiosInstance';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Button, Modal, Form, Input, Space, Popconfirm, Pagination, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CopyOutlined } from '@ant-design/icons';
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
  const { currentUser } = useContext(AuthContext);
  const isSuperAdmin = currentUser?.role === "super_admin" || currentUser?.role === "superadmin";

  // Fetch iframe data with pagination
  const { data, isLoading, error } = useQuery({
    queryKey: ["IFRAME", currentPage, pageSize],
    queryFn: async () => {
      const { data } = await instance.get(`/iframe?page=${currentPage}&limit=${pageSize}`);
      return data;
    },
  });

  // Fetch user data for viewers select
  const { data: userData, isLoading: loadingUsers } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const { data } = await instance.get(`/user?limit=1000`);
      return data.docs || data.data?.docs || [];
    },
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
      // Kiểm tra lỗi trùng domain
      if (
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
      // Kiểm tra lỗi trùng domain
      if (
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
      toast.error('Có lỗi xảy ra khi xóa: ' + (error.response?.data?.message || error.message));
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
      render: (url) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ 
              color: "#2563eb", 
              textDecoration: "underline", 
              cursor: "pointer",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "250px",
              display: "inline-block"
            }}
            title={url}
          >
            {url}
          </a>
          <Button
            size="small"
            icon={<CopyOutlined />}
            onClick={() => {
              navigator.clipboard.writeText(url);
              toast.success('Đã copy URL!');
            }}
            title="Copy URL"
          />
        </div>
      ),
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 120,
      align: 'center',
      render: (_, record) => (
        <Space size="middle">
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          />
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa?"
            onConfirm={() => handleDelete(record._id)}
            okText="Có"
            cancelText="Không"
          >
            <Button
              icon={<DeleteOutlined />}
              danger
              size="small"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ].filter(col => !col.hidden);

  const handlePageChange = (page, pageSize) => {
    setCurrentPage(page);
    setPageSize(pageSize);
  };

  if (error) {
    toast.error('Có lỗi xảy ra khi tải dữ liệu');
  }

  return (
    <div style={{ padding: "16px" }}>
      <div style={{ marginBottom: "16px" }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
          size="large"
        >
          Thêm Iframe
        </Button>
      </div>

      <Table
        scroll={{ x: 1000 }}
        columns={columns}
        dataSource={data?.docs || []}
        loading={isLoading}
        rowKey="_id"
        pagination={false}
      />

      {data && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: "16px" }}>
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={data.totalDocs}
            onChange={handlePageChange}
            showSizeChanger
            showTotal={(total) => `Tổng ${total} iframe`}
          />
        </div>
      )}

      <Modal
        title={editingIframe ? 'Sửa Iframe' : 'Thêm Iframe'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingIframe(null);
          form.resetFields();
        }}
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
            <Input placeholder="Nhập tiêu đề iframe" />
          </Form.Item>

          <Form.Item
            name="domain"
            label="Tên miền"
            rules={[
              { pattern: /^[a-zA-Z0-9-]+$/, message: 'Tên miền chỉ chứa chữ cái, số và dấu gạch ngang!' }
            ]}
          >
            <Input placeholder="example-domain" />
          </Form.Item>

          <Form.Item
            name="url"
            label="URL"
            rules={[
              { required: true, message: 'Vui lòng nhập URL!' },
              { type: 'url', message: 'Vui lòng nhập URL hợp lệ!' }
            ]}
          >
            <Input placeholder="https://example.com" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Mô tả"
          >
            <Input.TextArea rows={4} placeholder="Nhập mô tả cho iframe" />
          </Form.Item>

          <Form.Item
            name="viewers"
            label="Người xem"
          >
            <Select
              mode="multiple"
              placeholder="Chọn người xem"
              loading={loadingUsers}
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
            >
              {userData?.map((user) => (
                <Select.Option key={user._id} value={user._id}>
                  {user.email}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          {isSuperAdmin && (
            <Form.Item
              name="site_id"
              label="Site"
              tooltip="Chỉ super admin mới có thể chọn site"
            >
              <Select
                placeholder="Chọn site (mặc định là site hiện tại)"
                allowClear
              >
                {sitesData?.map((site) => (
                  <Select.Option key={site._id} value={site._id}>
                    {site.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          )}

          <Form.Item>
            <Space style={{ width: "100%", justifyContent: "flex-end" }}>
              <Button onClick={() => {
                setIsModalVisible(false);
                setEditingIframe(null);
                form.resetFields();
              }}>
                Hủy
              </Button>
              <Button 
                type="primary" 
                htmlType="submit"
                loading={createMutation.isLoading || updateMutation.isLoading}
              >
                {editingIframe ? 'Cập nhật' : 'Thêm'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default IframeList;
