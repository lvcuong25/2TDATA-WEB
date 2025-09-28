import React, { useState, useEffect, useCallback } from 'react';
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
  List,
  Tooltip,
  Input
} from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  CrownOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import axiosConfig from '../../utils/axiosInstance-cookie-only';
import { toast } from 'react-toastify';

const { TabPane } = Tabs;
const { Option } = Select;

const RowColumnCellPermissionModal = ({ 
  visible, 
  onCancel, 
  type, // 'record', 'column', 'cell'
  recordId, 
  columnId, 
  tableId,
  databaseId 
}) => {
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState('create');
  const [targetType, setTargetType] = useState('specific_user');
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [permissionsData, setPermissionsData] = useState([]);
  const [debugLogs, setDebugLogs] = useState([]);
  
  // Debug permissionsData changes
  useEffect(() => {
    addDebugLog(`PERMISSIONS DATA CHANGED: ${permissionsData.length} permissions`);
  }, [permissionsData]);
  
  // Function to add debug logs
  const addDebugLog = useCallback((message) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLogs(prev => [...prev.slice(-9), `${timestamp}: ${message}`]);
  }, []);
  
  // Add initial debug log when component mounts
  useEffect(() => {
    addDebugLog(`COMPONENT MOUNTED: ${type} modal`);
  }, [addDebugLog, type]);
  
  // Debug modal visibility changes
  useEffect(() => {
    if (visible) {
      addDebugLog(`MODAL OPENED: ${type} - ${columnId || recordId}`);
    }
  }, [visible, type, recordId, columnId, tableId, databaseId]);
  const queryClient = useQueryClient();

  // Lấy danh sách thành viên database
  const { data: membersResponse, isLoading: membersLoading } = useQuery({
    queryKey: ['database-members', databaseId],
    queryFn: async () => {
      if (!databaseId) {
        throw new Error('databaseId is required');
      }
      const response = await axiosConfig.get(`/permissions/database/databases/${databaseId}/members`);
      return response.data;
    },
    enabled: !!databaseId && visible
  });
  
  // Extract members array from response
  const members = membersResponse?.data || [];

  // Lấy permissions dựa trên type
  const { data: permissions, isLoading: permissionsLoading } = useQuery({
    queryKey: [`${type}-permissions`, recordId, columnId],
    queryFn: async () => {
      let url = '';
      if (type === 'record') {
        if (!recordId) throw new Error('recordId is required for record permissions');
        url = `/permissions/records/${recordId}/permissions`;
      } else if (type === 'column') {
        if (!columnId) throw new Error('columnId is required for column permissions');
        url = `/permissions/columns/${columnId}/permissions`;
      } else if (type === 'cell') {
        if (!recordId || !columnId) throw new Error('recordId and columnId are required for cell permissions');
        url = `/permissions/cells/${recordId}/${columnId}/permissions`;
      } else {
        throw new Error(`Invalid permission type: ${type}`);
      }
      addDebugLog(`FETCHING PERMISSIONS: ${url}`);
      const response = await axiosConfig.get(url);
      addDebugLog(`PERMISSIONS API RESPONSE: ${response.data.data?.length || 0} permissions`);
      
      // Log detailed permission data
      if (response.data.data) {
        response.data.data.forEach((permission, index) => {
          addDebugLog(`Permission ${index}: ${JSON.stringify(permission)}`);
        });
      }
      
      return response.data.data;
    },
    enabled: visible && (
      (type === 'record' && !!recordId) || 
      (type === 'column' && !!columnId) || 
      (type === 'cell' && !!recordId && !!columnId)
    )
  });

  // Initialize permissionsData when permissions are loaded
  useEffect(() => {
    if (permissions) {
      addDebugLog(`PERMISSIONS REFETCHED: ${permissions.length} permissions`);
      
      // Log each permission's current state
      permissions.forEach(permission => {
        if (type === 'record') {
          addDebugLog(`Permission ${permission._id}: canView=${permission.canView}, canEdit=${permission.canEdit}`);
        } else if (type === 'column') {
          addDebugLog(`Permission ${permission._id}: canView=${permission.canView}, canEdit=${permission.canEdit}`);
        } else if (type === 'cell') {
          addDebugLog(`Permission ${permission._id}: canView=${permission.canView}, canEdit=${permission.canEdit}`);
        } else {
          addDebugLog(`Permission ${permission._id}: canView=${permission.canView}`);
        }
      });
      
      const initializedPermissions = permissions.map(permission => {
        const initialized = {
          ...permission,
          canView: permission.canView || false
        };
        
        // Add canEdit for column, record, and cell types
        if (type === 'column' || type === 'record' || type === 'cell') {
          initialized.canEdit = permission.canEdit || false;
        }
        
        return initialized;
      });
      setPermissionsData(initializedPermissions);
    } else {
      addDebugLog('NO PERMISSIONS FOUND');
    }
  }, [permissions, addDebugLog]);

  // Reset permissionsData when modal closes
  useEffect(() => {
    if (!visible) {
      setPermissionsData([]);
    }
  }, [visible]);

  // Tạo quyền mới
  const createPermissionMutation = useMutation({
    mutationFn: async (data) => {
      let url = '';
      if (type === 'record') {
        if (!recordId) throw new Error('recordId is required for record permissions');
        url = `/permissions/records/${recordId}/permissions`;
      } else if (type === 'column') {
        if (!columnId) throw new Error('columnId is required for column permissions');
        url = `/permissions/columns/${columnId}/permissions`;
      } else if (type === 'cell') {
        if (!recordId || !columnId) throw new Error('recordId and columnId are required for cell permissions');
        url = `/permissions/cells/${recordId}/${columnId}/permissions`;
      } else {
        throw new Error(`Invalid permission type: ${type}`);
      }
      const response = await axiosConfig.post(url, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Tạo quyền thành công!');
      // Invalidate the correct query based on type
      if (type === 'record') {
        queryClient.invalidateQueries([`${type}-permissions`, recordId]);
      } else if (type === 'column') {
        queryClient.invalidateQueries([`${type}-permissions`, columnId]);
      } else if (type === 'cell') {
        queryClient.invalidateQueries([`${type}-permissions`, recordId, columnId]);
      }
      form.resetFields();
      setTargetType('specific_user');
      setSelectedUser(null);
      setSelectedRole(null);
    },
    onError: (error) => {
      const errorMessage = error?.response?.data?.message || 'Không thể tạo quyền. Vui lòng thử lại!';
      toast.error(errorMessage);
    }
  });

  // Cập nhật quyền
  const updatePermissionMutation = useMutation({
    mutationFn: async ({ permissionId, data }) => {
      if (!permissionId) throw new Error('permissionId is required');
      let url = '';
      if (type === 'record') {
        url = `/permissions/records/permissions/${permissionId}`;
      } else if (type === 'column') {
        url = `/permissions/columns/permissions/${permissionId}`;
      } else if (type === 'cell') {
        url = `/permissions/cells/permissions/${permissionId}`;
      } else {
        throw new Error(`Invalid permission type: ${type}`);
      }
      const response = await axiosConfig.put(url, data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      addDebugLog(`UPDATE SUCCESS: ${variables.permissionId} - ${JSON.stringify(variables.data)}`);
      toast.success('Cập nhật quyền thành công!');
      
      // Force refetch the correct query based on type
      addDebugLog(`FORCE REFETCHING QUERY: ${type}-permissions`);
      if (type === 'record') {
        queryClient.refetchQueries([`${type}-permissions`, recordId]);
      } else if (type === 'column') {
        queryClient.refetchQueries([`${type}-permissions`, columnId]);
      } else if (type === 'cell') {
        queryClient.refetchQueries([`${type}-permissions`, recordId, columnId]);
      }
    },
    onError: (error) => {
      const errorMessage = error?.response?.data?.message || 'Không thể cập nhật quyền. Vui lòng thử lại!';
      addDebugLog(`UPDATE ERROR: ${errorMessage}`);
      toast.error(errorMessage);
    }
  });

  // Xóa quyền
  const deletePermissionMutation = useMutation({
    mutationFn: async (permissionId) => {
      if (!permissionId) throw new Error('permissionId is required');
      let url = '';
      if (type === 'record') {
        url = `/permissions/records/permissions/${permissionId}`;
      } else if (type === 'column') {
        url = `/permissions/columns/permissions/${permissionId}`;
      } else if (type === 'cell') {
        url = `/permissions/cells/permissions/${permissionId}`;
      } else {
        throw new Error(`Invalid permission type: ${type}`);
      }
      const response = await axiosConfig.delete(url);
      return response.data;
    },
    onSuccess: (data, permissionId) => {
      toast.success('Xóa quyền thành công!');
      // Invalidate the correct query based on type
      if (type === 'record') {
        queryClient.invalidateQueries([`${type}-permissions`, recordId]);
      } else if (type === 'column') {
        queryClient.invalidateQueries([`${type}-permissions`, columnId]);
      } else if (type === 'cell') {
        queryClient.invalidateQueries([`${type}-permissions`, recordId, columnId]);
      }
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
      note: values.note || ''
    };

    // Add permission fields based on type
    if (type === 'record') {
      permissionData.canView = values.permissions?.canView || false;
    } else if (type === 'column') {
      permissionData.canView = values.permissions?.canView || false;
      permissionData.canEdit = values.permissions?.canEdit || false;
    } else if (type === 'cell') {
      permissionData.canView = values.permissions?.canView || false;
      permissionData.canEdit = values.permissions?.canEdit || false;
    }

    // Thêm userId hoặc role tùy theo targetType
    if (targetType === 'specific_user') {
      permissionData.userId = selectedUser;
    } else if (targetType === 'specific_role') {
      permissionData.role = selectedRole;
    }

    createPermissionMutation.mutate(permissionData);
  };

  const handleUpdatePermission = (permissionId, data) => {
    addDebugLog(`UPDATE PERMISSION: ${permissionId} - ${JSON.stringify(data)}`);
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
      case 'specific_user':
        return (
          <Space>
            <UserOutlined />
            <span>{permission.userId?.name || 'Unknown User'}</span>
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
        return <span>Unknown</span>;
    }
  };

  const renderPermissionSwitch = (type, key, permission) => {
    const currentValue = permission[key] || false;
    
    return (
      <Switch
        key={`${permission._id}-${key}-${currentValue}`}
        checked={currentValue}
        onChange={(checked) => {
          console.log('🚨 SWITCH ONCHANGE TRIGGERED:', { key, checked, permissionId: permission._id });
          addDebugLog(`SWITCH CLICKED: ${key} = ${checked} for ${permission._id}`);
          const data = { [key]: checked };
          console.log('🚨 CALLING handleUpdatePermission with:', { permissionId: permission._id, data });
          handleUpdatePermission(permission._id, data);
        }}
        size="small"
      />
    );
  };

  const getPermissionTitle = () => {
    switch (type) {
      case 'record':
        return 'Quyền Record';
      case 'column':
        return 'Quyền Column';
      case 'cell':
        return 'Quyền Cell';
      default:
        return 'Quyền';
    }
  };

  const getPermissionDescription = () => {
    switch (type) {
      case 'record':
        return 'Quản lý quyền hiển thị và chỉnh sửa record. User không có quyền hiển thị sẽ bị ẩn record.';
      case 'column':
        return 'Quản lý quyền hiển thị và chỉnh sửa column. User không có quyền hiển thị sẽ bị ẩn column.';
      case 'cell':
        return 'Quản lý quyền hiển thị và chỉnh sửa cell. Cell bị khóa nếu không có quyền hiển thị.';
      default:
        return 'Quản lý quyền';
    }
  };

  const getPermissionFields = () => {
    switch (type) {
      case 'record':
        return [
          { key: 'canView', label: 'Hiển thị record', icon: <EyeOutlined /> },
          { key: 'canEdit', label: 'Chỉnh sửa record', icon: <EditOutlined /> }
        ];
      case 'column':
        return [
          { key: 'canView', label: 'Hiển thị column', icon: <EyeOutlined /> },
          { key: 'canEdit', label: 'Chỉnh sửa column', icon: <EditOutlined /> }
        ];
      case 'cell':
        return [
          { key: 'canView', label: 'Hiển thị cell', icon: <EyeOutlined /> },
          { key: 'canEdit', label: 'Chỉnh sửa cell', icon: <EditOutlined /> }
        ];
      default:
        return [];
    }
  };

  console.log('Modal render - visible:', visible, 'type:', type);
  
  return (
    <Modal
      title={
        <Space>
          <SettingOutlined />
          {getPermissionTitle()}
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={800}
      destroyOnClose
    >
      <Alert
        message={getPermissionDescription()}
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="Tạo quyền mới" key="create">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            <Form.Item
              label="Tên quyền"
              name="name"
              rules={[{ required: true, message: 'Vui lòng nhập tên quyền' }]}
            >
              <Input 
                placeholder="Nhập tên quyền (để trống sẽ dùng tên mặc định)"
              />
            </Form.Item>

            <Form.Item
              label="Đối tượng áp dụng"
              name="targetType"
              initialValue="specific_user"
            >
              <Select
                value={targetType}
                onChange={(value) => {
                  setTargetType(value);
                  setSelectedUser(null);
                  setSelectedRole(null);
                }}
              >
                <Option value="specific_user">
                  <Space>
                    <UserOutlined />
                    Thành viên cụ thể
                  </Space>
                </Option>
                <Option value="specific_role">
                  <Space>
                    <CrownOutlined />
                    Vai trò cụ thể
                  </Space>
                </Option>
              </Select>
            </Form.Item>

            {targetType === 'specific_user' && (
              <Form.Item label="Chọn thành viên">
                <Select
                  value={selectedUser}
                  onChange={setSelectedUser}
                  placeholder="Chọn thành viên"
                  loading={membersLoading}
                  showSearch
                  optionFilterProp="children"
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
                          {member.userId.name || member.userId.email || 'Unknown User'}
                        </Space>
                      </Option>
                    );
                  })}
                </Select>
              </Form.Item>
            )}

            {targetType === 'specific_role' && (
              <Form.Item label="Chọn vai trò">
                <Select
                  value={selectedRole}
                  onChange={setSelectedRole}
                  placeholder="Chọn vai trò"
                >
                  <Option value="owner">
                    <Space>
                      <CrownOutlined />
                      Chủ sở hữu
                    </Space>
                  </Option>
                  <Option value="manager">
                    <Space>
                      <CrownOutlined />
                      Quản lý
                    </Space>
                  </Option>
                  <Option value="member">
                    <Space>
                      <UserOutlined />
                      Thành viên
                    </Space>
                  </Option>
                </Select>
              </Form.Item>
            )}

            <Card title="Quyền" size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                {getPermissionFields().map(field => (
                  <div key={field.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Space>
                      {field.icon}
                      <span>{field.label}</span>
                    </Space>
                    <Form.Item name={['permissions', field.key]} valuePropName="checked" style={{ margin: 0 }}>
                      <Switch size="small" />
                    </Form.Item>
                  </div>
                ))}
              </Space>
            </Card>

            <Form.Item label="Ghi chú" name="note">
              <Select
                placeholder="Thêm ghi chú (tùy chọn)"
                allowClear
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={createPermissionMutation.isLoading}
                block
              >
                Tạo quyền
              </Button>
            </Form.Item>
          </Form>
        </TabPane>

        <TabPane tab="Quản lý quyền" key="manage">
          <Spin spinning={permissionsLoading}>
            <Space direction="vertical" style={{ width: '100%' }}>
              {console.log('🚨 RENDERING PERMISSIONS DATA:', permissionsData)}
              {permissionsData.map((permission, index) => (
                <Card key={permission._id} size="small">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', marginBottom: 4, color: '#1890ff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Input
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
                    {console.log('🚨 RENDERING PERMISSION FIELDS for permission:', permission)}
                    {getPermissionFields().map(field => (
                      <div key={field.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Space>
                          {field.icon}
                          <span style={{ fontSize: '14px' }}>{field.label}</span>
                        </Space>
                        {renderPermissionSwitch('permissions', field.key, permission)}
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
              
              {permissionsData.length === 0 && (
                <div style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                  Chưa có quyền nào được thiết lập
                </div>
              )}
            </Space>
          </Spin>
        </TabPane>
      </Tabs>
      
      {/* Debug Panel - Commented out */}
      {/* <div style={{ 
        marginTop: 16, 
        padding: 12, 
        backgroundColor: '#f5f5f5', 
        borderRadius: 6,
        border: '1px solid #d9d9d9'
      }}>
        <div style={{ 
          fontSize: 12, 
          fontWeight: 'bold', 
          marginBottom: 8, 
          color: '#666' 
        }}>
          🔍 Debug Logs:
        </div>
        <div style={{ 
          maxHeight: 150, 
          overflowY: 'auto', 
          fontSize: 11, 
          fontFamily: 'monospace',
          backgroundColor: '#fff',
          padding: 8,
          borderRadius: 4,
          border: '1px solid #e8e8e8'
        }}>
          {debugLogs.length === 0 ? (
            <div style={{ color: '#999', fontStyle: 'italic' }}>
              No debug logs yet...
            </div>
          ) : (
            debugLogs.map((log, index) => (
              <div key={index} style={{ 
                marginBottom: 2, 
                color: '#333',
                wordBreak: 'break-all'
              }}>
                {log}
              </div>
            ))
          )}
        </div>
      </div> */}
    </Modal>
  );
};

export default RowColumnCellPermissionModal;

