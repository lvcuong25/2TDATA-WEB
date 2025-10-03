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

// const { TabPane } = Tabs; // Deprecated, using items prop instead
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

  // Lấy danh sách users/roles có thể tạo quyền (chưa có quyền)
  const { data: availableTargetsResponse, isLoading: availableTargetsLoading } = useQuery({
    queryKey: ['available-permission-targets', tableId],
    queryFn: async () => {
      const response = await axiosConfig.get(`/permissions/tables/${tableId}/available-targets`);
      return response.data;
    },
    enabled: !!tableId && visible
  });
  
  // Extract available targets from response
  const availableUsers = availableTargetsResponse?.data?.users || [];
  const availableRoles = availableTargetsResponse?.data?.roles || [];
  const canCreateAllMembers = availableTargetsResponse?.data?.canCreateAllMembers || false;

  // Lấy danh sách quyền hiện tại
  const { data: permissions, isLoading: permissionsLoading } = useQuery({
    queryKey: ['table-permissions', tableId],
    queryFn: async () => {
      console.log('🔍 PermissionModal - fetching permissions for tableId:', tableId);
      const response = await axiosConfig.get(`/permissions/tables/${tableId}/permissions`);
      console.log('🔍 PermissionModal - full response:', response);
      console.log('🔍 PermissionModal - response.data:', response.data);
      console.log('🔍 PermissionModal - response.data.data:', response.data.data);
      console.log('🔍 PermissionModal - response.data.data type:', typeof response.data.data);
      console.log('🔍 PermissionModal - response.data.data isArray:', Array.isArray(response.data.data));
      // Ensure we always return an array
      const result = Array.isArray(response.data.data) ? response.data.data : [];
      console.log('🔍 PermissionModal - returning result:', result);
      console.log('🔍 PermissionModal - result type:', typeof result);
      console.log('🔍 PermissionModal - result isArray:', Array.isArray(result));
      return result;
    },
    enabled: !!tableId && visible,
    retry: 1,
    refetchOnWindowFocus: false,
    onSuccess: (data) => {
      console.log('🔍 PermissionModal - query onSuccess:', data);
    },
    onError: (error) => {
      console.error('🔍 PermissionModal - query onError:', error);
    }
  });

  // Initialize permissionsData when permissions are loaded
  useEffect(() => {
    console.log('🔍 PermissionModal - useEffect permissions:', {
      permissions,
      isArray: Array.isArray(permissions),
      length: permissions?.length,
      tableId,
      visible,
      enabled: !!tableId && visible
    });
    
    // Handle both array and object responses
    let permissionsArray = [];
    
    if (permissions) {
      if (Array.isArray(permissions)) {
        // Direct array response
        permissionsArray = permissions;
      } else if (permissions.data && Array.isArray(permissions.data)) {
        // Object with data property containing array
        permissionsArray = permissions.data;
      } else if (permissions.success && permissions.data && Array.isArray(permissions.data)) {
        // Full API response format
        permissionsArray = permissions.data;
      }
    }
    
    console.log('🔍 PermissionModal - processed permissionsArray:', permissionsArray);
    
    if (permissionsArray.length > 0) {
      const initializedPermissions = permissionsArray.map(permission => {
        return {
          ...permission,
          viewPermissions: permission.viewPermissions || {
            canView: false,
            canAddView: false,
            canEditView: false,
          }
        };
      });
      console.log('🔍 PermissionModal - setting permissionsData:', initializedPermissions);
      setPermissionsData(initializedPermissions);
    } else {
      console.log('🔍 PermissionModal - not setting permissionsData, permissionsArray empty:', permissionsArray);
      setPermissionsData([]);
    }
  }, [permissions, tableId, visible]);

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
        const response = await axiosConfig.put(`/permissions/tables/permissions/${permissionId}`, data);
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
        const response = await axiosConfig.delete(`/permissions/tables/permissions/${permissionId}`);
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
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        items={[
          {
            key: 'create',
            label: 'Tạo quyền mới',
            children: (
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
                loading={availableTargetsLoading}
                disabled={availableUsers.length === 0 && availableRoles.length === 0 && !canCreateAllMembers}
              >
                {availableUsers.length > 0 && (
                  <Option value="specific_user">
                    <Space>
                      <UserOutlined />
                      <span>Thành viên cụ thể ({availableUsers.length} người có thể chọn)</span>
                    </Space>
                  </Option>
                )}
                {availableRoles.length > 0 && (
                  <Option value="specific_role">
                    <Space>
                      <CrownOutlined />
                      <span>Vai trò cụ thể ({availableRoles.length} vai trò có thể chọn)</span>
                    </Space>
                  </Option>
                )}
                {canCreateAllMembers && (
                  <Option value="all_members">
                    <Space>
                      <TeamOutlined />
                      <span>Tất cả thành viên</span>
                    </Space>
                  </Option>
                )}
                {!availableTargetsLoading && availableUsers.length === 0 && availableRoles.length === 0 && !canCreateAllMembers && (
                  <Option value="" disabled>
                    <Space>
                      <span style={{ color: '#999' }}>Không có đối tượng nào có thể phân quyền</span>
                    </Space>
                  </Option>
                )}
              </Select>
            </Form.Item>

            {!availableTargetsLoading && availableUsers.length === 0 && availableRoles.length === 0 && !canCreateAllMembers && (
              <Alert
                message="Không có đối tượng nào có thể phân quyền"
                description="Tất cả thành viên và vai trò đã có quyền hoặc không thể phân quyền theo quy tắc hệ thống."
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}

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
                  loading={availableTargetsLoading}
                  disabled={availableUsers.length === 0}
                >
                  {availableUsers?.map(user => (
                    <Option key={user._id} value={user._id}>
                      <Space>
                        <UserOutlined />
                        <span>{user.name || user.email || 'Unknown User'}</span>
                        <span style={{ color: '#999' }}>
                          ({user.role === 'owner' ? 'Chủ sở hữu' : 
                           user.role === 'manager' ? 'Quản lý' : 'Thành viên'})
                        </span>
                      </Space>
                    </Option>
                  ))}
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
                  loading={availableTargetsLoading}
                  disabled={availableRoles.length === 0}
                >
                  {availableRoles?.map(role => (
                    <Option key={role.role} value={role.role}>
                      <Space>
                        <CrownOutlined />
                        <span>{role.displayName}</span>
                      </Space>
                    </Option>
                  ))}
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
            )
          },
          {
            key: 'manage',
            label: 'Quản lý quyền',
            children: (
          <Spin spinning={permissionsLoading}>
            <Space direction="vertical" style={{ width: '100%' }}>
              {console.log('🔍 PermissionModal - rendering permissionsData:', {
                permissionsData,
                length: permissionsData?.length,
                isLoading: permissionsLoading,
                permissions,
                permissionsLength: permissions?.length
              })}
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
              
              {!permissionsLoading && permissionsData?.length === 0 && (
                <Alert
                  message="Chưa có quyền nào được thiết lập"
                  description="Sử dụng tab 'Tạo quyền mới' để thiết lập quyền cho table này."
                  type="info"
                  showIcon
                />
              )}
            </Space>
          </Spin>
            )
          }
        ]}
      />
    </Modal>
  );
};

export default PermissionModal;
