import React, { useState } from 'react';
import instance from '../../../utils/axiosInstance';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Button, Modal, Form, Input, Space, Popconfirm, Pagination, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { toast } from 'react-toastify';

const IframeList = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingIframe, setEditingIframe] = useState(null);
  const [form] = Form.useForm();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const queryClient = useQueryClient();

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
      setEditingIframe(null);
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

  // Delete iframe mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => instance.delete(`/iframe/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(["IFRAME"]);
      toast.success('Xóa iframe thành công!');
    },
    onError: (error) => {
      toast.error('Có lỗi xảy ra: ' + (error.response?.data?.message || error.message));
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
      viewers: record.viewers?.map(u => typeof u === 'string' ? u : u._id)
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
    },
    {
      title: 'Tên miền',
      dataIndex: 'domain',
      key: 'domain',
      render: (domain) =>
        domain ? (
          <a
            href={`${window.location.origin}/${domain}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 hover:underline"
          >
            {`${window.location.origin}/${domain}`}
          </a>
        ) : 'Chưa đặt',
    },
    {
      title: 'URL',
      dataIndex: 'url',
      key: 'url',
      render: (url) => (
        <a href={url} target="_blank" rel="noopener noreferrer">
          {url}
        </a>
      ),
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString('vi-VN'),
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
          >
          </Button>
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa iframe này?"
            onConfirm={() => handleDelete(record._id)}
            okText="Có"
            cancelText="Không"
          >
            <Button type="primary" danger icon={<DeleteOutlined />}>
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (error) {
    return <div>Có lỗi xảy ra: {error.message}</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý Iframe</h1>
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
        columns={columns}
        dataSource={data?.docs || []}
        loading={isLoading}
        rowKey="_id"
        pagination={false}
      />

      {data && (
        <div className="flex justify-center mt-4">
          <Pagination
            current={currentPage}
            total={data.totalDocs}
            pageSize={pageSize}
            showSizeChanger
            showQuickJumper
            showTotal={(total, range) =>
              `${range[0]}-${range[1]} của ${total} items`
            }
            onChange={(page, size) => {
              setCurrentPage(page);
              setPageSize(size);
            }}
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
            <Input.TextArea
              rows={4}
              placeholder="Nhập mô tả (không bắt buộc)"
            />
          </Form.Item>

          <Form.Item
            name="viewers"
            label="Người dùng được phép truy cập"
          >
            <Select
              mode="multiple"
              placeholder="Chọn người dùng"
              loading={loadingUsers}
              optionFilterProp="children"
              showSearch
              filterOption={(input, option) =>
                (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
              }
            >
              {userData?.map(user => (
                <Select.Option key={user._id} value={user._id}>
                  {user.name || user.email}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item className="mb-0">
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={createMutation.isPending || updateMutation.isPending}
              >
                {editingIframe ? 'Cập nhật' : 'Thêm'}
              </Button>
              <Button
                onClick={() => {
                  setIsModalVisible(false);
                  setEditingIframe(null);
                  form.resetFields();
                }}
              >
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
