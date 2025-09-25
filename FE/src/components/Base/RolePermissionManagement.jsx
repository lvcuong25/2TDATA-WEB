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
  Divider,
  Row,
  Col,
  Typography,
  Switch,
  Tabs,
  Checkbox,
  Collapse
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SettingOutlined,
  CrownOutlined,
  SafetyOutlined,
  EyeOutlined,
  LockOutlined,
  UnlockOutlined
} from '@ant-design/icons';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import instance from '../../utils/axiosInstance-cookie-only';
import { useAuth } from '../core/Auth';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { Panel } = Collapse;

const RolePermissionManagement = () => {
  const { databaseId } = useParams();
  const queryClient = useQueryClient();
  const { currentUser, currentOrganization } = useAuth();
  
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [permissionModalVisible, setPermissionModalVisible] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [form] = Form.useForm();
  const [permissionForm] = Form.useForm();

  // ===========================================
  // QUERIES
  // ===========================================

  // Fetch base roles
  const { data: rolesData, isLoading: rolesLoading } = useQuery({
    queryKey: ['baseRoles', databaseId],
    queryFn: async () => {
      const response = await instance.get(`/database/databases/${databaseId}/roles`);
      return response.data;
    },
    enabled: !!databaseId,
  });

  // Fetch base tables for permission management
  const { data: tablesData, isLoading: tablesLoading } = useQuery({
    queryKey: ['baseTables', databaseId],
    queryFn: async () => {
      const response = await instance.get(`/database/databases/${databaseId}/tables`);
      return response.data;
    },
    enabled: !!databaseId,
  });

  // ===========================================
  // MUTATIONS
  // ===========================================

  // Create role mutation
  const createRoleMutation = useMutation({
    mutationFn: (values) => 
      instance.post(`/database/databases/${databaseId}/roles`, values),
    onSuccess: () => {
      queryClient.invalidateQueries(['baseRoles', databaseId]);
      setRoleModalVisible(false);
      form.resetFields();
      toast.success('Role created successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create role');
    },
  });

  // Update role permissions mutation
  const updateRolePermissionsMutation = useMutation({
    mutationFn: ({ roleId, permissions }) => 
      instance.post(`/database/databases/${databaseId}/roles/${roleId}/perms`, permissions),
    onSuccess: () => {
      queryClient.invalidateQueries(['baseRoles', databaseId]);
      setPermissionModalVisible(false);
      setEditingRole(null);
      permissionForm.resetFields();
      toast.success('Role permissions updated successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update permissions');
    },
  });

  // Delete role mutation
  const deleteRoleMutation = useMutation({
    mutationFn: (roleId) => 
      instance.delete(`/database/databases/${databaseId}/roles/${roleId}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['baseRoles', databaseId]);
      toast.success('Role deleted successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete role');
    },
  });

  // ===========================================
  // HANDLERS
  // ===========================================

  const handleCreateRole = () => {
    setEditingRole(null);
    setRoleModalVisible(true);
  };

  const handleEditPermissions = (role) => {
    setEditingRole(role);
    setPermissionModalVisible(true);
  };

  const handleDeleteRole = (roleId) => {
    deleteRoleMutation.mutate(roleId);
  };

  const handleCreateRoleSubmit = (values) => {
    createRoleMutation.mutate(values);
  };

  const handleUpdatePermissionsSubmit = (values) => {
    // Transform form values to API format
    const permissions = {
      flags: {
        canManageMembers: values.canManageMembers || false,
        canManageSchema: values.canManageSchema || false,
        canCreateTables: values.canCreateTables || false
      },
      tablePerms: {
        replaceAll: values.tablePermissions || []
      }
    };

    updateRolePermissionsMutation.mutate({
      roleId: editingRole._id,
      permissions
    });
  };

  // ===========================================
  // HELPER FUNCTIONS
  // ===========================================

  const getRoleIcon = (roleName) => {
    switch (roleName?.toLowerCase()) {
      case 'owner':
        return <CrownOutlined style={{ color: '#faad14' }} />;
      case 'admin':
        return <SafetyOutlined style={{ color: '#1890ff' }} />;
      case 'editor':
        return <EditOutlined style={{ color: '#52c41a' }} />;
      case 'viewer':
        return <EyeOutlined style={{ color: '#8c8c8c' }} />;
      default:
        return <SettingOutlined />;
    }
  };

  const getRoleColor = (roleName) => {
    switch (roleName?.toLowerCase()) {
      case 'owner':
        return 'gold';
      case 'admin':
        return 'blue';
      case 'editor':
        return 'green';
      case 'viewer':
        return 'default';
      default:
        return 'purple';
    }
  };

  // ===========================================
  // TABLE COLUMNS
  // ===========================================

  const roleColumns = [
    {
      title: 'Role Name',
      key: 'name',
      render: (_, record) => (
        <div>
          <Tag 
            icon={getRoleIcon(record.name)} 
            color={getRoleColor(record.name)}
            style={{ marginBottom: '4px' }}
          >
            {record.name}
          </Tag>
          {record.builtin && (
            <div>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Built-in Role
              </Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Permissions',
      key: 'permissions',
      render: (_, record) => (
        <div>
          {record.canManageMembers && (
            <Tag color="blue" size="small">Manage Members</Tag>
          )}
          {record.canManageSchema && (
            <Tag color="green" size="small">Manage Schema</Tag>
          )}
          {record.canCreateTables && (
            <Tag color="orange" size="small">Create Tables</Tag>
          )}
          {record.tablePerms?.length > 0 && (
            <Tag color="purple" size="small">
              {record.tablePerms.length} Table(s)
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit Permissions">
            <Button 
              icon={<SettingOutlined />} 
              onClick={() => handleEditPermissions(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Are you sure you want to delete this role?"
            onConfirm={() => handleDeleteRole(record._id)}
            okText="Yes"
            cancelText="No"
            disabled={record.builtin}
          >
            <Tooltip title="Delete Role">
              <Button 
                danger 
                icon={<DeleteOutlined />}
                disabled={record.builtin}
              />
            </Tooltip>
          </Popconfirm>
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
              <SettingOutlined /> Role & Permission Management
            </Title>
            <Text type="secondary">
              Create and manage roles with granular permissions
            </Text>
          </Col>
          <Col>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={handleCreateRole}
            >
              Create Role
            </Button>
          </Col>
        </Row>

        <Divider />

        <Table
          columns={roleColumns}
          dataSource={rolesData?.data || []}
          loading={rolesLoading}
          rowKey="_id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
        />
      </Card>

      {/* Create Role Modal */}
      <Modal
        title="Create New Role"
        open={roleModalVisible}
        onCancel={() => {
          setRoleModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateRoleSubmit}
        >
          <Form.Item
            name="name"
            label="Role Name"
            rules={[{ required: true, message: 'Please enter role name' }]}
          >
            <Input placeholder="Enter role name" />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="Description"
          >
            <Input.TextArea 
              placeholder="Enter role description"
              rows={3}
            />
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button 
                type="primary" 
                htmlType="submit"
                loading={createRoleMutation.isLoading}
              >
                Create Role
              </Button>
              <Button onClick={() => setRoleModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Permission Management Modal */}
      <Modal
        title={`Manage Permissions - ${editingRole?.name}`}
        open={permissionModalVisible}
        onCancel={() => {
          setPermissionModalVisible(false);
          setEditingRole(null);
          permissionForm.resetFields();
        }}
        footer={null}
        width={800}
      >
        {editingRole && (
          <Form
            form={permissionForm}
            layout="vertical"
            onFinish={handleUpdatePermissionsSubmit}
            initialValues={{
              canManageMembers: editingRole.canManageMembers || false,
              canManageSchema: editingRole.canManageSchema || false,
              canCreateTables: editingRole.canCreateTables || false,
            }}
          >
            <Tabs defaultActiveKey="general">
              <TabPane tab="General Permissions" key="general">
                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item
                      name="canManageMembers"
                      valuePropName="checked"
                    >
                      <div style={{ textAlign: 'center' }}>
                        <Switch />
                        <div style={{ marginTop: '8px' }}>
                          <Text strong>Manage Members</Text>
                          <br />
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            Add/remove members, change roles
                          </Text>
                        </div>
                      </div>
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      name="canManageSchema"
                      valuePropName="checked"
                    >
                      <div style={{ textAlign: 'center' }}>
                        <Switch />
                        <div style={{ marginTop: '8px' }}>
                          <Text strong>Manage Schema</Text>
                          <br />
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            Create/modify tables and columns
                          </Text>
                        </div>
                      </div>
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      name="canCreateTables"
                      valuePropName="checked"
                    >
                      <div style={{ textAlign: 'center' }}>
                        <Switch />
                        <div style={{ marginTop: '8px' }}>
                          <Text strong>Create Tables</Text>
                          <br />
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            Create new tables in this base
                          </Text>
                        </div>
                      </div>
                    </Form.Item>
                  </Col>
                </Row>
              </TabPane>

              <TabPane tab="Table Permissions" key="tables">
                <div style={{ marginBottom: '16px' }}>
                  <Text type="secondary">
                    Configure permissions for each table in this base
                  </Text>
                </div>
                
                <Form.List name="tablePermissions">
                  {(fields, { add, remove }) => (
                    <>
                      {fields.map(({ key, name, ...restField }) => (
                        <Card key={key} size="small" style={{ marginBottom: '8px' }}>
                          <Row gutter={16} align="middle">
                            <Col span={8}>
                              <Form.Item
                                {...restField}
                                name={[name, 'tableId']}
                                rules={[{ required: true, message: 'Select table' }]}
                              >
                                <Select placeholder="Select table">
                                  {tablesData?.data?.map(table => (
                                    <Option key={table._id} value={table._id}>
                                      {table.name}
                                    </Option>
                                  ))}
                                </Select>
                              </Form.Item>
                            </Col>
                            <Col span={4}>
                              <Form.Item
                                {...restField}
                                name={[name, 'create']}
                                valuePropName="checked"
                              >
                                <Checkbox>Create</Checkbox>
                              </Form.Item>
                            </Col>
                            <Col span={4}>
                              <Form.Item
                                {...restField}
                                name={[name, 'read']}
                                valuePropName="checked"
                              >
                                <Checkbox>Read</Checkbox>
                              </Form.Item>
                            </Col>
                            <Col span={4}>
                              <Form.Item
                                {...restField}
                                name={[name, 'update']}
                                valuePropName="checked"
                              >
                                <Checkbox>Update</Checkbox>
                              </Form.Item>
                            </Col>
                            <Col span={4}>
                              <Form.Item
                                {...restField}
                                name={[name, 'delete']}
                                valuePropName="checked"
                              >
                                <Checkbox>Delete</Checkbox>
                              </Form.Item>
                            </Col>
                          </Row>
                        </Card>
                      ))}
                      <Form.Item>
                        <Button 
                          type="dashed" 
                          onClick={() => add()} 
                          block 
                          icon={<PlusOutlined />}
                        >
                          Add Table Permission
                        </Button>
                      </Form.Item>
                    </>
                  )}
                </Form.List>
              </TabPane>
            </Tabs>
            
            <Divider />
            
            <Form.Item>
              <Space>
                <Button 
                  type="primary" 
                  htmlType="submit"
                  loading={updateRolePermissionsMutation.isLoading}
                >
                  Update Permissions
                </Button>
                <Button onClick={() => setPermissionModalVisible(false)}>
                  Cancel
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
};

export default RolePermissionManagement;
