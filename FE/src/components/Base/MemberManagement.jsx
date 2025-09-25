import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Space,
  Popconfirm,
  message,
  Tag,
  Tooltip,
  Alert,
  Divider,
  Row,
  Col,
  Typography
} from 'antd';
import {
  PlusOutlined,
  UserAddOutlined,
  EditOutlined,
  DeleteOutlined,
  TeamOutlined,
  CrownOutlined,
  SafetyOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import instance from '../../utils/axiosInstance-cookie-only';
import { useAuth } from '../core/Auth';

const { Title, Text } = Typography;
const { Option } = Select;

const MemberManagement = () => {
  const { databaseId } = useParams();
  const queryClient = useQueryClient();
  const { currentUser, currentOrganization } = useAuth();
  
  const [addMemberModalVisible, setAddMemberModalVisible] = useState(false);
  const [editMemberModalVisible, setEditMemberModalVisible] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  // ===========================================
  // QUERIES
  // ===========================================

  // Fetch database members
  const { data: membersData, isLoading: membersLoading } = useQuery({
    queryKey: ['databaseMembers', databaseId],
    queryFn: async () => {
      const response = await instance.get(`/database/databases/${databaseId}/members`);
      return response.data;
    },
    enabled: !!databaseId,
  });

  // Fetch available roles for this database (organization roles)
  const { data: rolesData, isLoading: rolesLoading } = useQuery({
    queryKey: ['databaseRoles', databaseId],
    queryFn: async () => {
      const response = await instance.get(`/database/databases/${databaseId}/roles`);
      return response.data;
    },
    enabled: !!databaseId,
  });

  // Fetch available users in organization (not yet added to database)
  const { data: orgUsersData, isLoading: orgUsersLoading } = useQuery({
    queryKey: ['availableUsers', databaseId],
    queryFn: async () => {
      const response = await instance.get(`/database/databases/${databaseId}/available-users`);
      return response.data;
    },
    enabled: !!databaseId,
  });

  // ===========================================
  // MUTATIONS
  // ===========================================

  // Add member mutation
  const addMemberMutation = useMutation({
    mutationFn: async (values) => {
      const response = await instance.post(`/database/databases/${databaseId}/members`, values);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['databaseMembers', databaseId]);
      setAddMemberModalVisible(false);
      form.resetFields();
      toast.success('Thêm thành viên thành công!');
    },
    onError: (error) => {
      console.error('Add member error:', error);
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.error || 
                          'Không thể thêm thành viên. Vui lòng thử lại!';
      toast.error(errorMessage);
    },
  });

  // Update member role mutation
  const updateMemberRoleMutation = useMutation({
    mutationFn: async ({ userId, role }) => {
      console.log('Making PATCH request to:', `/database/databases/${databaseId}/members/${userId}`);
      console.log('Request body:', { role });
      const response = await instance.patch(`/database/databases/${databaseId}/members/${userId}`, { role });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['databaseMembers', databaseId]);
      setEditMemberModalVisible(false);
      setEditingMember(null);
      editForm.resetFields();
      toast.success('Cập nhật vai trò thành công!');
    },
    onError: (error) => {
      console.error('Update member role error:', error);
      const errorMessage = error?.response?.data?.error || 
                          error?.response?.data?.message || 
                          'Không thể cập nhật vai trò. Vui lòng thử lại!';
      toast.error(errorMessage);
    },
  });

  // Delete member mutation
  const deleteMemberMutation = useMutation({
    mutationFn: async (userId) => {
      const response = await instance.delete(`/database/databases/${databaseId}/members/${userId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['databaseMembers', databaseId]);
      toast.success('Xóa thành viên thành công!');
    },
    onError: (error) => {
      console.error('Delete member error:', error);
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.error || 
                          'Không thể xóa thành viên. Vui lòng thử lại!';
      toast.error(errorMessage);
    },
  });

  // ===========================================
  // HANDLERS
  // ===========================================

  const handleAddMember = () => {
    setAddMemberModalVisible(true);
  };

  const handleEditMember = (member) => {
    setEditingMember(member);
    editForm.setFieldsValue({
      role: member.role // Use role string instead of roleId
    });
    setEditMemberModalVisible(true);
  };

  const handleAddMemberSubmit = (values) => {
    addMemberMutation.mutate(values);
  };

  const handleEditMemberSubmit = (values) => {
    console.log('Updating member role:', {
      userId: editingMember.user._id,
      role: values.role,
      databaseId: databaseId
    });
    updateMemberRoleMutation.mutate({
      userId: editingMember.user._id,
      role: values.role // Use role string instead of roleId
    });
  };

  const handleDeleteMember = (member) => {
    deleteMemberMutation.mutate(member.user._id);
  };

  // ===========================================
  // HELPER FUNCTIONS
  // ===========================================

  const getRoleIcon = (roleName) => {
    switch (roleName?.toLowerCase()) {
      case 'owner':
        return <CrownOutlined style={{ color: '#faad14' }} />;
      case 'manager':
        return <SafetyOutlined style={{ color: '#1890ff' }} />;
      case 'member':
        return <TeamOutlined style={{ color: '#8c8c8c' }} />;
      default:
        return <TeamOutlined />;
    }
  };

  const getRoleColor = (roleName) => {
    switch (roleName?.toLowerCase()) {
      case 'owner':
        return 'gold';
      case 'manager':
        return 'blue';
      case 'member':
        return 'default';
      default:
        return 'default';
    }
  };

  // Available users are already filtered by the API
  const availableUsers = orgUsersData?.data || [];

  // ===========================================
  // TABLE COLUMNS
  // ===========================================

  const memberColumns = [
    {
      title: 'User',
      key: 'user',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{record.user?.name || record.user?.email}</div>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.user?.email}
          </Text>
        </div>
      ),
    },
    {
      title: 'Role',
      key: 'role',
      render: (_, record) => (
        <Tag 
          icon={getRoleIcon(record.role)} 
          color={getRoleColor(record.role)}
        >
          {record.role}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit Role">
            <Button 
              icon={<EditOutlined />} 
              onClick={() => handleEditMember(record)}
              disabled={record.role?.toLowerCase() === 'owner'}
            />
          </Tooltip>
          <Tooltip title="Remove Member">
            <Popconfirm
              title="Are you sure you want to remove this member?"
              description="This action cannot be undone."
              onConfirm={() => handleDeleteMember(record)}
              okText="Yes, Remove"
              cancelText="Cancel"
              disabled={record.role?.toLowerCase() === 'owner'}
            >
              <Button 
                danger
                icon={<DeleteOutlined />} 
                disabled={record.role?.toLowerCase() === 'owner'}
                loading={deleteMemberMutation.isLoading}
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: '16px' }}>
          <Col>
            <Title level={4} style={{ margin: 0 }}>
              <TeamOutlined /> Base Members
            </Title>
            <Text type="secondary">
              Manage members and their permissions in this base
            </Text>
          </Col>
          <Col>
            <Button 
              type="primary" 
              icon={<UserAddOutlined />}
              onClick={handleAddMember}
            >
              Add Member
            </Button>
          </Col>
        </Row>

        <Divider />

        <Table
          columns={memberColumns}
          dataSource={membersData?.data || []}
          loading={membersLoading}
          rowKey="_id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
        />
      </Card>

      {/* Add Member Modal */}
      <Modal
        title="Thêm thành viên vào Base"
        open={addMemberModalVisible}
        onCancel={() => {
          setAddMemberModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddMemberSubmit}
        >
          {addMemberMutation.error && (
            <Alert
              message="Lỗi"
              description={addMemberMutation.error?.response?.data?.message || 
                          addMemberMutation.error?.response?.data?.error || 
                          'Không thể thêm thành viên. Vui lòng thử lại!'}
              type="error"
              showIcon
              style={{ marginBottom: 16 }}
              closable
              onClose={() => addMemberMutation.reset()}
            />
          )}
          <Form.Item
            name="userId"
            label="Chọn người dùng"
            rules={[{ required: true, message: 'Vui lòng chọn người dùng' }]}
          >
            <Select
              placeholder="Chọn người dùng từ tổ chức của bạn"
              loading={orgUsersLoading}
              showSearch
              optionFilterProp="label"
              filterOption={(input, option) =>
                option.label.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
              style={{ width: '100%' }}
              dropdownStyle={{ maxHeight: 300, overflow: 'auto' }}
              optionLabelProp="label"
            >
              {availableUsers.map(user => (
                <Option 
                  key={user._id} 
                  value={user._id}
                  label={`${user.name || user.email} (${user.email})`}
                >
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    lineHeight: '1.4',
                    padding: '4px 0',
                    minHeight: 'auto'
                  }}>
                    <div style={{ 
                      fontWeight: 500, 
                      color: '#262626',
                      fontSize: '14px',
                      marginBottom: '2px'
                    }}>
                      {user.name || user.email}
                    </div>
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#8c8c8c',
                      lineHeight: '1.2'
                    }}>
                      {user.email}
                    </div>
                  </div>
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="role"
            label="Gán vai trò"
            rules={[{ required: true, message: 'Vui lòng chọn vai trò' }]}
          >
            <Select
              placeholder="Chọn vai trò cho thành viên này"
              loading={rolesLoading}
            >
              {rolesData?.data?.map(role => (
                <Option key={role.role} value={role.role}>
                  <Tag 
                    icon={getRoleIcon(role.role)} 
                    color={getRoleColor(role.role)}
                    style={{ marginRight: '8px' }}
                  >
                    {role.name}
                  </Tag>
                  {role.canManageDatabase ? '(Có thể quản lý Database)' : '(Chỉ đọc)'}
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button 
                type="primary" 
                htmlType="submit"
                loading={addMemberMutation.isLoading}
                disabled={addMemberMutation.isLoading}
              >
                {addMemberMutation.isLoading ? 'Đang thêm...' : 'Thêm thành viên'}
              </Button>
              <Button 
                onClick={() => setAddMemberModalVisible(false)}
                disabled={addMemberMutation.isLoading}
              >
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Member Modal */}
      <Modal
        title="Edit Member Role"
        open={editMemberModalVisible}
        onCancel={() => {
          setEditMemberModalVisible(false);
          setEditingMember(null);
          editForm.resetFields();
        }}
        footer={null}
        width={500}
      >
        {editingMember && (
          <div style={{ marginBottom: '16px' }}>
            <Text strong>User: </Text>
            <Text>{editingMember.user?.name || editingMember.user?.email}</Text>
            <br />
            <Text strong>Current Role: </Text>
            <Tag 
              icon={getRoleIcon(editingMember.role)} 
              color={getRoleColor(editingMember.role)}
            >
              {editingMember.role}
            </Tag>
          </div>
        )}
        
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleEditMemberSubmit}
        >
          <Form.Item
            name="role"
            label="New Role"
            rules={[{ required: true, message: 'Please select a role' }]}
          >
            <Select
              placeholder="Choose a new role for this member"
              loading={rolesLoading}
            >
              {rolesData?.data?.map(role => (
                <Option key={role.role} value={role.role}>
                  <Tag 
                    icon={getRoleIcon(role.role)} 
                    color={getRoleColor(role.role)}
                    style={{ marginRight: '8px' }}
                  >
                    {role.name}
                  </Tag>
                  {role.canManageDatabase ? '(Có thể quản lý Database)' : '(Chỉ đọc)'}
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button 
                type="primary" 
                htmlType="submit"
                loading={updateMemberRoleMutation.isLoading}
              >
                Update Role
              </Button>
              <Button onClick={() => setEditMemberModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MemberManagement;
