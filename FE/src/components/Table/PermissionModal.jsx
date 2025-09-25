import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Select,
  Switch,
  Button,
  Tabs,
  Card,
  Space,
  Divider,
  Alert,
  Spin,
  message
} from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  CrownOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeInvisibleOutlined,
  SettingOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axiosConfig from '../../api/axiosConfig';
import { toast } from 'react-toastify';

const { TabPane } = Tabs;
const { Option } = Select;

const PermissionModal = ({ 
  visible, 
  onCancel, 
  tableId, 
  databaseId 
}) => {
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('table');
  const [targetType, setTargetType] = useState('specific_user');
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [permissionsData, setPermissionsData] = useState([]);
  const queryClient = useQueryClient();

  // Lấy danh sách thành viên database
  const { data: membersResponse, isLoading: membersLoading } = useQuery({
    queryKey: ['database-members', databaseId],
    queryFn: async () => {
      const response = await axiosConfig.get(`/permissions/databases/${databaseId}/members`);
      return response.data;
    },
    enabled: !!databaseId && visible
  });
  
  // Extract members array from response
  const members = membersResponse?.data || [];

  // Lấy danh sách quyền hiện tại
  const { data: permissions, isLoading: permissionsLoading } = useQuery({
    queryKey: ['table-permissions', tableId],
    queryFn: async () => {
      const response = await axiosConfig.get(`/permissions/tables/${tableId}/permissions`);
      console.log('PermissionModal - permissions loaded:', response.data.data);
      return response.data.data;
    },
    enabled: !!tableId && visible
  });

  // Initialize permissionsData when permissions are loaded
  useEffect(() => {
    if (permissions) {
      const initializedPermissions = permissions.map(permission => {
        return {
          ...permission,
          viewPermissions: permission.viewPermissions || {
            canView: false,
            canAddView: false,
            canEditView: false,
          }
        };
      });
      setPermissionsData(initializedPermissions);
    }
  }, [permissions]);

  // Reset permissionsData when modal closes
  useEffect(() => {
    if (!visible) {
      setPermissionsData([]);
    }
  }, [visible]);

  // Tạo quyền mới
  const createPermissionMutation = useMutation({
    mutationFn: async (data) => {
      const response = await axiosConfig.post(`/permissions/tables/${tableId}/permissions`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Phân quyền thành công!');
      queryClient.invalidateQueries(['table-permissions', tableId]);
      // Invalidate views queries to refresh view permissions
      queryClient.invalidateQueries(['allViews']);
      queryClient.invalidateQueries(['views', tableId]);
      form.resetFields();
      setTargetType('specific_user');
      setSelectedUser(null);
      setSelectedRole(null);
    },
    onError: (error) => {
      const errorMessage = error?.response?.data?.message || 'Không thể phân quyền. Vui lòng thử lại!';
      toast.error(errorMessage);
    }
  });

  // Cập nhật quyền
  const updatePermissionMutation = useMutation({
    mutationFn: async ({ permissionId, data }) => {
      console.log('PermissionModal - updatePermissionMutation - sending:', { permissionId, data });
      const response = await axiosConfig.put(`/permissions/permissions/${permissionId}`, data);
      console.log('PermissionModal - updatePermissionMutation - response:', response.data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      toast.success('Cập nhật quyền thành công!');
      
      // Update local permissionsData
      setPermissionsData(prev => {
        const updated = prev.map(permission => {
          if (permission._id === variables.permissionId) {
            const updatedPermission = { 
              ...permission,
              permissions: { ...permission.permissions },
              viewPermissions: { ...permission.viewPermissions }
            };
            if (variables.data.name !== undefined) {
              updatedPermission.name = variables.data.name;
            }
            if (variables.data.permissions) {
              updatedPermission.permissions = { ...updatedPermission.permissions, ...variables.data.permissions };
            }
            if (variables.data.viewPermissions) {
              updatedPermission.viewPermissions = { ...updatedPermission.viewPermissions, ...variables.data.viewPermissions };
            }
            return updatedPermission;
          }
          return { ...permission };
        });
        return updated;
      });
      
      queryClient.invalidateQueries(['table-permissions', tableId]);
      // Invalidate views queries to refresh view permissions
      queryClient.invalidateQueries(['allViews']);
      queryClient.invalidateQueries(['views', tableId]);
    },
    onError: (error) => {
      console.log('PermissionModal - updatePermissionMutation - error:', error);
      const errorMessage = error?.response?.data?.message || 'Không thể cập nhật quyền. Vui lòng thử lại!';
      toast.error(errorMessage);
    }
  });

  // Xóa quyền
  const deletePermissionMutation = useMutation({
    mutationFn: async (permissionId) => {
      const response = await axiosConfig.delete(`/permissions/permissions/${permissionId}`);
      return response.data;
    },
    onSuccess: (data, permissionId) => {
      toast.success('Xóa quyền thành công!');
      queryClient.invalidateQueries(['table-permissions', tableId]);
      // Invalidate views queries to refresh view permissions
      queryClient.invalidateQueries(['allViews']);
      queryClient.invalidateQueries(['views', tableId]);
    },
    onError: (error, permissionId) => {
      const errorMessage = error?.response?.data?.message || 'Không thể xóa quyền. Vui lòng thử lại!';
      toast.error(errorMessage);
    }
  });

  const handleSubmit = (values) => {
    const permissionData = {
      targetType,
      name: values.name || '',
      permissions: values.tablePermissions || {},
      viewPermissions: values.viewPermissions || {},
      note: values.note
    };

    if (targetType === 'specific_user') {
      permissionData.userId = selectedUser;
    } else if (targetType === 'specific_role') {
      permissionData.role = selectedRole;
    }

    console.log('PermissionModal - handleSubmit - tableId:', tableId);
    console.log('PermissionModal - handleSubmit - databaseId:', databaseId);
    console.log('PermissionModal - handleSubmit - permissionData:', permissionData);

    createPermissionMutation.mutate(permissionData);
  };

  const handleUpdatePermission = (permissionId, data) => {
    console.log('PermissionModal - handleUpdatePermission:', { permissionId, data });
    updatePermissionMutation.mutate({ permissionId, data });
  };

  const handleDeletePermission = (permissionId) => {
    const confirmed = window.confirm('Bạn có chắc chắn muốn xóa quyền này?');
    
    if (confirmed) {
      deletePermissionMutation.mutate(permissionId);
    }
  };

  const getTargetDisplay = (permission) => {
    switch (permission.targetType) {
      case 'all_members':
        return (
          <Space>
            <TeamOutlined />
            <span>Tất cả thành viên</span>
          </Space>
        );
      case 'specific_user':
        return (
          <Space>
            <UserOutlined />
            <span>{permission.userId?.name || permission.userId?.email}</span>
          </Space>
        );
      case 'specific_role':
        return (
          <Space>
            <CrownOutlined />
            <span>{permission.role === 'owner' ? 'Chủ sở hữu' : 
                   permission.role === 'manager' ? 'Quản lý' : 'Thành viên'}</span>
          </Space>
        );
      default:
        return 'Không xác định';
    }
  };

  const renderPermissionSwitch = (permission, key, type = 'table') => {
    const currentValue = type === 'table' ? 
      permission.permissions?.[key] : 
      permission.viewPermissions?.[key];
    
    console.log('PermissionModal - renderPermissionSwitch:', { 
      type, 
      key, 
      currentValue, 
      permission: permission._id,
      permissions: permission.permissions,
      viewPermissions: permission.viewPermissions,
      timestamp: new Date().toISOString()
    });

    return (
      <Switch
        key={`${permission._id}-${key}-${type}-${currentValue}`}
        checked={currentValue}
        onChange={(checked) => {
          const data = type === 'table' ? 
            { permissions: { [key]: checked } } :
            { viewPermissions: { [key]: checked } };
          handleUpdatePermission(permission._id, data);
        }}
        size="small"
      />
    );
  };

  // Validation check
  if (!tableId || !databaseId) {
    return (
      <Modal
        title="Phân quyền Table"
        open={visible}
        onCancel={onCancel}
        width={800}
        footer={null}
        destroyOnClose
      >
        <Alert
          message="Lỗi"
          description="Thiếu thông tin table hoặc database. Vui lòng thử lại."
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <div style={{ textAlign: 'right' }}>
          <Button onClick={onCancel}>Đóng</Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      title="Phân quyền Table"
      open={visible}
      onCancel={onCancel}
      width={800}
      footer={null}
      destroyOnClose
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="Tạo quyền mới" key="create">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            <Form.Item
              name="name"
              label="Tên quyền"
              rules={[{ required: true, message: 'Vui lòng nhập tên quyền' }]}
            >
              <input 
                type="text" 
                placeholder="Nhập tên quyền (để trống sẽ dùng tên mặc định)"
                style={{ 
                  width: '100%', 
                  padding: '8px 12px', 
                  border: '1px solid #d9d9d9', 
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
            </Form.Item>

            <Form.Item
              name="targetType"
              label="Phân quyền cho"
              rules={[{ required: true, message: 'Vui lòng chọn đối tượng phân quyền' }]}
            >
              <Select
                value={targetType}
                onChange={setTargetType}
                placeholder="Chọn đối tượng phân quyền"
              >
                <Option value="specific_user">
                  <Space>
                    <UserOutlined />
                    <span>Thành viên cụ thể</span>
                  </Space>
                </Option>
                <Option value="specific_role">
                  <Space>
                    <CrownOutlined />
                    <span>Vai trò cụ thể</span>
                  </Space>
                </Option>
              </Select>
            </Form.Item>

            {targetType === 'specific_user' && (
              <Form.Item
                name="userId"
                label="Chọn thành viên"
                rules={[{ required: true, message: 'Vui lòng chọn thành viên' }]}
              >
                <Select
                  value={selectedUser}
                  onChange={setSelectedUser}
                  placeholder="Chọn thành viên"
                  loading={membersLoading}
                >
                  {members?.map(member => {
                    // Skip if member or userId is undefined
                    if (!member || !member.userId) {
                      return null;
                    }
                    return (
                      <Option key={member.userId._id} value={member.userId._id}>
                        <Space>
                          <UserOutlined />
                          <span>{member.userId.name || member.userId.email || 'Unknown User'}</span>
                          <span style={{ color: '#999' }}>
                            ({member.role === 'owner' ? 'Chủ sở hữu' : 
                             member.role === 'manager' ? 'Quản lý' : 'Thành viên'})
                          </span>
                        </Space>
                      </Option>
                    );
                  })}
                </Select>
              </Form.Item>
            )}

            {targetType === 'specific_role' && (
              <Form.Item
                name="role"
                label="Chọn vai trò"
                rules={[{ required: true, message: 'Vui lòng chọn vai trò' }]}
              >
                <Select
                  value={selectedRole}
                  onChange={setSelectedRole}
                  placeholder="Chọn vai trò"
                >
                  <Option value="member">
                    <Space>
                      <UserOutlined />
                      <span>Thành viên</span>
                    </Space>
                  </Option>
                  <Option value="manager">
                    <Space>
                      <CrownOutlined />
                      <span>Quản lý</span>
                    </Space>
                  </Option>
                </Select>
              </Form.Item>
            )}

            <Divider>Quyền Table</Divider>
            
            <Form.Item name="tablePermissions" label="Quyền truy cập table">
              <Card size="small">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Space>
                      <EyeOutlined />
                      <span>Xem table</span>
                    </Space>
                    <Form.Item name={['tablePermissions', 'canView']} valuePropName="checked" style={{ margin: 0 }}>
                      <Switch />
                    </Form.Item>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Space>
                      <SettingOutlined />
                      <span>Chỉnh sửa cấu trúc</span>
                    </Space>
                    <Form.Item name={['tablePermissions', 'canEditStructure']} valuePropName="checked" style={{ margin: 0 }}>
                      <Switch />
                    </Form.Item>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Space>
                      <EditOutlined />
                      <span>Chỉnh sửa dữ liệu</span>
                    </Space>
                    <Form.Item name={['tablePermissions', 'canEditData']} valuePropName="checked" style={{ margin: 0 }}>
                      <Switch />
                    </Form.Item>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Space>
                      <UserOutlined />
                      <span>Chỉ được thêm dữ liệu</span>
                    </Space>
                    <Form.Item name={['tablePermissions', 'canAddData']} valuePropName="checked" style={{ margin: 0 }}>
                      <Switch />
                    </Form.Item>
                  </div>
                  
                </Space>
              </Card>
            </Form.Item>

            <Divider>Quyền View</Divider>
            
            <Form.Item name="viewPermissions" label="Quyền truy cập view">
              <Card size="small">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Space>
                      <EyeOutlined />
                      <span>Xem view</span>
                    </Space>
                    <Form.Item name={['viewPermissions', 'canView']} valuePropName="checked" style={{ margin: 0 }}>
                      <Switch />
                    </Form.Item>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Space>
                      <PlusOutlined />
                      <span>Thêm View</span>
                    </Space>
                    <Form.Item name={['viewPermissions', 'canAddView']} valuePropName="checked" style={{ margin: 0 }}>
                      <Switch />
                    </Form.Item>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Space>
                      <EditOutlined />
                      <span>Chỉnh sửa view</span>
                    </Space>
                    <Form.Item name={['viewPermissions', 'canEditView']} valuePropName="checked" style={{ margin: 0 }}>
                      <Switch />
                    </Form.Item>
                  </div>
                  
                </Space>
              </Card>
            </Form.Item>

            <Form.Item name="note" label="Ghi chú">
              <input 
                type="text" 
                placeholder="Ghi chú về quyền này (tùy chọn)"
                style={{ width: '100%', padding: '8px', border: '1px solid #d9d9d9', borderRadius: '6px' }}
              />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={createPermissionMutation.isLoading}
                >
                  Tạo quyền
                </Button>
                <Button onClick={onCancel}>
                  Hủy
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </TabPane>

        <TabPane tab="Quản lý quyền" key="manage">
          <Spin spinning={permissionsLoading}>
            <Space direction="vertical" style={{ width: '100%' }}>
              {permissionsData?.map(permission => (
                <Card key={permission._id} size="small">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', marginBottom: 4, color: '#1890ff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="text"
                          value={permission.name || ''}
                          onChange={(e) => {
                            const newName = e.target.value;
                            handleUpdatePermission(permission._id, { name: newName });
                          }}
                          onBlur={(e) => {
                            // Trigger save when user finishes editing
                            const newName = e.target.value;
                            if (newName !== permission.name) {
                              handleUpdatePermission(permission._id, { name: newName });
                            }
                          }}
                          placeholder="Nhập tên quyền"
                          style={{
                            border: 'none',
                            outline: 'none',
                            background: 'transparent',
                            fontWeight: 'bold',
                            color: '#1890ff',
                            fontSize: '14px',
                            width: '200px',
                            padding: '2px 4px',
                            borderBottom: '1px dashed #d9d9d9'
                          }}
                        />
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        {getTargetDisplay(permission)}
                      </div>
                      {permission.note && (
                        <div style={{ color: '#666', fontSize: '12px' }}>
                          {permission.note}
                        </div>
                      )}
                    </div>
                    {permission.isDefault === true ? (
                      <span style={{ fontSize: '12px', color: '#999' }}>
                        Mặc định
                      </span>
                    ) : (
                      <Button
                        type="text"
                        danger
                        size="small"
                        onClick={() => handleDeletePermission(permission._id)}
                        loading={deletePermissionMutation.isLoading}
                      >
                        Xóa
                      </Button>
                    )}
                  </div>
                  
                  <Divider style={{ margin: '12px 0' }} />
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Quyền Table</h4>
                      <Space direction="vertical" size="small">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Space size="small">
                            <EyeOutlined />
                            <span style={{ fontSize: '12px' }}>Xem</span>
                          </Space>
                          {renderPermissionSwitch(permission, 'canView', 'table')}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Space size="small">
                            <SettingOutlined />
                            <span style={{ fontSize: '12px' }}>Chỉnh sửa cấu trúc</span>
                          </Space>
                          {renderPermissionSwitch(permission, 'canEditStructure', 'table')}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Space size="small">
                            <EditOutlined />
                            <span style={{ fontSize: '12px' }}>Chỉnh sửa dữ liệu</span>
                          </Space>
                          {renderPermissionSwitch(permission, 'canEditData', 'table')}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Space size="small">
                            <UserOutlined />
                            <span style={{ fontSize: '12px' }}>Chỉ được thêm dữ liệu</span>
                          </Space>
                          {renderPermissionSwitch(permission, 'canAddData', 'table')}
                        </div>
                      </Space>
                    </div>
                    
                    <div>
                      <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Quyền View</h4>
                      <Space direction="vertical" size="small">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Space size="small">
                            <EyeOutlined />
                            <span style={{ fontSize: '12px' }}>Xem view</span>
                          </Space>
                          {renderPermissionSwitch(permission, 'canView', 'view')}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Space size="small">
                            <PlusOutlined />
                            <span style={{ fontSize: '12px' }}>Thêm View</span>
                          </Space>
                          {renderPermissionSwitch(permission, 'canAddView', 'view')}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Space size="small">
                            <EditOutlined />
                            <span style={{ fontSize: '12px' }}>Chỉnh sửa view</span>
                          </Space>
                          {renderPermissionSwitch(permission, 'canEditView', 'view')}
                        </div>
                      </Space>
                    </div>
                  </div>
                </Card>
              ))}
              
              {permissions?.length === 0 && (
                <Alert
                  message="Chưa có quyền nào được thiết lập"
                  description="Sử dụng tab 'Tạo quyền mới' để thiết lập quyền cho table này."
                  type="info"
                  showIcon
                />
              )}
            </Space>
          </Spin>
        </TabPane>
      </Tabs>
    </Modal>
  );
};

export default PermissionModal;
