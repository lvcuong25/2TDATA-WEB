import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Tag,
  message,
  Popconfirm,
  Checkbox
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined } from '@ant-design/icons';
import axios from '../../../api/axiosConfig';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const { Option } = Select;

const SiteAdminList = () => {
  const { siteId } = useParams();
  const [siteAdmins, setSiteAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchSiteAdmins();
  }, [siteId]);

  const fetchSiteAdmins = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/site-admins/site/${siteId}`);
      setSiteAdmins(response.data.data);
      toast.success('Tải danh sách quản trị viên thành công!');
    } catch (error) {
      console.error('Error fetching site admins:', error);
      toast.error('Không thể tải danh sách quản trị viên');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingAdmin(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (admin) => {
    setEditingAdmin(admin);
    form.setFieldsValue({
      user_id: admin.user_id,
      email: admin.email,
      role: admin.role,
      permissions: admin.permissions || [],
      is_active: admin.is_active
    });
    setModalVisible(true);
  };

  const handleDelete = async (adminId) => {
    try {
      await axios.delete(`/api/site-admins/${adminId}`);
      toast.success('Site administrator deleted successfully');
      fetchSiteAdmins();
    } catch (error) {
      console.error('Error deleting site admin:', error);
      toast.error('Failed to delete site administrator');
    }
  };

  const handleSubmit = async (values) => {
    try {
      const adminData = {
        ...values,
        site_id: siteId
      };

      if (editingAdmin) {
        await axios.put(`/api/site-admins/${editingAdmin._id}`, adminData);
        toast.success('Cập nhật quản trị viên thành công!');
      } else {
        await axios.post('/api/site-admins', adminData);
        toast.success('Thêm quản trị viên thành công!');
      }

      setModalVisible(false);
      fetchSiteAdmins();
    } catch (error) {
      console.error('Error saving site admin:', error);
      toast.error('Lưu quản trị viên thất bại!');
    }
  };

  const columns = [
    {
      title: 'User ID',
      dataIndex: 'user_id',
      key: 'user_id',
      render: (text) => (
        <Space>
          <UserOutlined />
          {text}
        </Space>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role) => (
        <Tag color={role === 'admin' ? 'blue' : 'green'}>
          {role?.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Permissions',
      dataIndex: 'permissions',
      key: 'permissions',
      render: (permissions) => (
        <div>
          {permissions?.map((permission) => (
            <Tag key={permission} color="cyan">
              {permission}
            </Tag>
          ))}
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this site administrator?"
            onConfirm={() => handleDelete(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              danger
              size="small"
              icon={<DeleteOutlined />}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const permissionOptions = [
    'manage_content',
    'manage_users',
    'manage_settings',
    'view_analytics',
    'manage_themes',
    'manage_domains'
  ];

  return (
    <Card
      title="Site Administrators"
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAdd}
        >
          Add Site Administrator
        </Button>
      }
    >
      <Table
        columns={columns}
        dataSource={siteAdmins}
        loading={loading}
        rowKey="_id"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
        }}
      />

      <Modal
        title={editingAdmin ? 'Edit Site Administrator' : 'Add Site Administrator'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="user_id"
            label="User ID"
            rules={[{ required: true, message: 'Please enter user ID' }]}
          >
            <Input placeholder="Enter user ID" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please enter email' },
              { type: 'email', message: 'Please enter valid email' }
            ]}
          >
            <Input placeholder="Enter email address" />
          </Form.Item>

          <Form.Item
            name="role"
            label="Role"
            rules={[{ required: true, message: 'Please select role' }]}
          >
            <Select placeholder="Select role">
              <Option value="admin">Admin</Option>
              <Option value="editor">Editor</Option>
              <Option value="moderator">Moderator</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="permissions"
            label="Permissions"
          >
            <Checkbox.Group>
              {permissionOptions.map((permission) => (
                <Checkbox key={permission} value={permission}>
                  {permission.replace('_', ' ').toUpperCase()}
                </Checkbox>
              ))}
            </Checkbox.Group>
          </Form.Item>

          <Form.Item
            name="is_active"
            label="Status"
            valuePropName="checked"
            initialValue={true}
          >
            <Checkbox>Active</Checkbox>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingAdmin ? 'Update' : 'Create'}
              </Button>
              <Button onClick={() => setModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default SiteAdminList;
