import React, { useState, useContext } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Layout, Menu, Typography, Avatar, Button, Input, Modal, Space, Row, Dropdown } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../../utils/axiosInstance-cookie-only';
import { AuthContext } from '../../components/core/Auth';
import { toast } from 'react-toastify';
import {
  DatabaseOutlined,
  TableOutlined,
  HomeOutlined,
  UserOutlined,
  ArrowLeftOutlined,
  SettingOutlined,
  LogoutOutlined,
  SearchOutlined,
  PlusOutlined,
  DownOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  RightOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

const DatabaseLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const authContext = useContext(AuthContext);
  const currentUser = authContext?.currentUser;
  const [collapsed, setCollapsed] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [expandedDatabases, setExpandedDatabases] = useState(new Set());
  const [showCreateDatabaseModal, setShowCreateDatabaseModal] = useState(false);
  const [newDatabase, setNewDatabase] = useState({ name: '', description: '' });
  const [showCreateTableModal, setShowCreateTableModal] = useState(false);
  const [newTable, setNewTable] = useState({ name: '', description: '', databaseId: '' });
  
  // Edit/Delete states
  const [showEditDatabaseModal, setShowEditDatabaseModal] = useState(false);
  const [editingDatabase, setEditingDatabase] = useState({ _id: '', name: '', description: '' });
  const [showEditTableModal, setShowEditTableModal] = useState(false);
  const [editingTable, setEditingTable] = useState({ _id: '', name: '', description: '', databaseId: '' });

  // Fetch databases for sidebar
  const { data: databasesResponse } = useQuery({
    queryKey: ['databases'],
    queryFn: async () => {
      const response = await axiosInstance.get('/database/databases');
      return response.data;
    },
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const databases = databasesResponse?.data || [];

  // Fetch tables for all databases
  const { data: allTablesResponse } = useQuery({
    queryKey: ['allTables'],
    queryFn: async () => {
      const tablesPromises = databases.map(async (db) => {
        try {
          const response = await axiosInstance.get(`/database/databases/${db._id}/tables`);
          return { databaseId: db._id, tables: response.data.data || [] };
        } catch (error) {
          return { databaseId: db._id, tables: [] };
        }
      });
      const results = await Promise.all(tablesPromises);
      return results;
    },
    enabled: databases.length > 0,
  });

  const allTables = allTablesResponse || [];

  // Create database mutation
  const createDatabaseMutation = useMutation({
    mutationFn: async (databaseData) => {
      const response = await axiosInstance.post('/database/databases', databaseData);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Database created successfully');
      setShowCreateDatabaseModal(false);
      setNewDatabase({ name: '', description: '' });
      queryClient.invalidateQueries(['databases']);
    },
    onError: (error) => {
      console.error('Error creating database:', error);
      toast.error(error.response?.data?.message || 'Failed to create database');
    },
  });

  const handleCreateDatabase = async (e) => {
    e.preventDefault();
    if (!newDatabase.name.trim()) {
      toast.error('Database name is required');
      return;
    }
    createDatabaseMutation.mutate(newDatabase);
  };

  // Create table mutation
  const createTableMutation = useMutation({
    mutationFn: async (tableData) => {
      const response = await axiosInstance.post('/database/tables', {
        name: tableData.name,
        description: tableData.description,
        databaseId: tableData.databaseId
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Table created successfully');
      setShowCreateTableModal(false);
      setNewTable({ name: '', description: '' });
      queryClient.invalidateQueries(['allTables']);
    },
    onError: (error) => {
      console.error('Error creating table:', error);
      toast.error(error.response?.data?.message || 'Failed to create table');
    },
  });

  const handleCreateTable = async (e) => {
    e.preventDefault();
    if (!newTable.name.trim()) {
      toast.error('Table name is required');
      return;
    }
    createTableMutation.mutate(newTable);
  };

  // Edit database mutation
  const editDatabaseMutation = useMutation({
    mutationFn: async (databaseData) => {
      const response = await axiosInstance.put(`/database/databases/${databaseData._id}`, databaseData);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Database updated successfully');
      setShowEditDatabaseModal(false);
      setEditingDatabase({ _id: '', name: '', description: '' });
      queryClient.invalidateQueries(['databases']);
    },
    onError: (error) => {
      console.error('Error updating database:', error);
      toast.error(error.response?.data?.message || 'Failed to update database');
    },
  });

  // Delete database mutation
  const deleteDatabaseMutation = useMutation({
    mutationFn: async (databaseId) => {
      const response = await axiosInstance.delete(`/database/databases/${databaseId}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Database deleted successfully');
      queryClient.invalidateQueries(['databases']);
      queryClient.invalidateQueries(['allTables']);
    },
    onError: (error) => {
      console.error('Error deleting database:', error);
      toast.error(error.response?.data?.message || 'Failed to delete database');
    },
  });

  // Edit table mutation
  const editTableMutation = useMutation({
    mutationFn: async (tableData) => {
      const response = await axiosInstance.put(`/database/tables/${tableData._id}`, tableData);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Table updated successfully');
      setShowEditTableModal(false);
      setEditingTable({ _id: '', name: '', description: '', databaseId: '' });
      queryClient.invalidateQueries(['allTables']);
    },
    onError: (error) => {
      console.error('Error updating table:', error);
      toast.error(error.response?.data?.message || 'Failed to update table');
    },
  });

  // Delete table mutation
  const deleteTableMutation = useMutation({
    mutationFn: async (tableId) => {
      const response = await axiosInstance.delete(`/database/tables/${tableId}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Table deleted successfully');
      queryClient.invalidateQueries(['allTables']);
    },
    onError: (error) => {
      console.error('Error deleting table:', error);
      toast.error(error.response?.data?.message || 'Failed to delete table');
    },
  });

  const handleEditDatabase = async (e) => {
    e.preventDefault();
    if (!editingDatabase.name.trim()) {
      toast.error('Database name is required');
      return;
    }
    editDatabaseMutation.mutate(editingDatabase);
  };

  const handleEditTable = async (e) => {
    e.preventDefault();
    if (!editingTable.name.trim()) {
      toast.error('Table name is required');
      return;
    }
    editTableMutation.mutate(editingTable);
  };

  const handleLogout = async () => {
    try {
      await authContext?.logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getPageTitle = () => {
    if (location.pathname === '/database') return 'Databases';
    if (location.pathname.includes('/database/') && location.pathname.includes('/tables')) return 'Tables';
    if (location.pathname.includes('/database/') && location.pathname.includes('/table/')) return 'Table Detail';
    return 'Database Management';
  };

  // Filter databases based on search
  const filteredDatabases = databases.filter(db => 
    db.name.toLowerCase().includes(searchValue.toLowerCase()) ||
    (db.description && db.description.toLowerCase().includes(searchValue.toLowerCase()))
  );

  // Toggle database expansion
  const toggleDatabase = (databaseId) => {
    const newExpanded = new Set(expandedDatabases);
    if (newExpanded.has(databaseId)) {
      newExpanded.delete(databaseId);
    } else {
      newExpanded.add(databaseId);
    }
    setExpandedDatabases(newExpanded);
  };

  // Get tables for a specific database
  const getTablesForDatabase = (databaseId) => {
    const databaseTables = allTables.find(item => item.databaseId === databaseId);
    return databaseTables ? databaseTables.tables : [];
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        width={280}
        collapsed={collapsed}
        style={{ 
          position: 'fixed', 
          height: '100vh',
          zIndex: 1000,
          background: '#fff',
          borderRight: '1px solid #f0f0f0'
        }}
        theme="light"
      >
        {/* User Profile Section - Moved to top */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Avatar 
                size={collapsed ? 32 : 40} 
                icon={<UserOutlined />} 
                className="bg-blue-600 text-white font-bold"
              >
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
              </Avatar>
              {!collapsed && (
                <div className="ml-3 flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    {currentUser?.name || 'User'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {authContext?.isAdmin ? 
                      (authContext?.isSuperAdmin ? 'Quản trị tối cao' : 
                       currentUser?.role === 'site_admin' ? 'Quản trị site' : 'Quản trị viên') : 'Người dùng'}
                  </div>
                </div>
              )}
            </div>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              className="text-gray-500"
            />
          </div>
        </div>

        {/* Search Bar */}
        {!collapsed && (
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <SearchOutlined className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Quick search..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="pl-10 pr-20"
                size="large"
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">Ctrl K</span>
              </div>
            </div>
          </div>
        )}

        {/* Create Database Button */}
        {!collapsed && location.pathname === '/database' && (
          <div className="p-4 border-b border-gray-200">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              className="w-full"
              onClick={() => setShowCreateDatabaseModal(true)}
            >
              Create Database
            </Button>
          </div>
        )}

        {/* Create Table Button */}
        {!collapsed && location.pathname.includes('/tables') && (
          <div className="p-4 border-b border-gray-200">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              className="w-full"
              onClick={() => {
                // This would trigger the create table modal
                // You can add state management for this
              }}
            >
              + Create Table
            </Button>
          </div>
        )}

        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto">
          <Menu
            theme="light"
            mode="inline"
            selectedKeys={[location.pathname]}
            className="border-r-0"
            style={{ background: 'transparent' }}
          >
            <Menu.Item
              key="/database"
              icon={<HomeOutlined />}
              onClick={() => navigate('/database')}
              className="mx-2 rounded-lg"
            >
              Overview
            </Menu.Item>
          </Menu>

          {/* Databases Section */}
          {!collapsed && (
            <div className="px-4 py-2">
              
              {filteredDatabases.length === 0 ? (
                <div className="text-center py-4">
                  <div className="text-gray-400 mb-2">
                    <DatabaseOutlined style={{ fontSize: '24px' }} />
                  </div>
                  <div className="text-xs text-gray-500">
                    {searchValue ? 'No databases found' : 'No databases yet'}
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredDatabases.map((database) => {
                    const isExpanded = expandedDatabases.has(database._id);
                    const databaseTables = getTablesForDatabase(database._id);
                    const isActive = location.pathname.includes(`/database/${database._id}`);
                    
                    return (
                      <div key={database._id} className="space-y-1">
                        {/* Database Item */}
                        <Dropdown
                          menu={{
                            items: [
                              {
                                key: 'edit',
                                icon: <EditOutlined />,
                                label: 'Sửa tên',
                                onClick: () => {
                                  setEditingDatabase({
                                    _id: database._id,
                                    name: database.name,
                                    description: database.description || ''
                                  });
                                  setShowEditDatabaseModal(true);
                                }
                              },
                              {
                                key: 'delete',
                                icon: <DeleteOutlined />,
                                label: 'Xóa database',
                                danger: true,
                                onClick: () => {
                                  if (window.confirm(`Bạn có chắc muốn xóa database "${database.name}"?`)) {
                                    deleteDatabaseMutation.mutate(database._id);
                                  }
                                }
                              }
                            ]
                          }}
                          trigger={['contextMenu']}
                        >
                          <div
                            className={`flex items-center px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors ${
                              isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                            }`}
                            onClick={() => toggleDatabase(database._id)}
                          >
                            <DatabaseOutlined className="mr-3" />
                            <span className="truncate flex-1">{database.name}</span>
                            <div className="flex items-center">
                              {databaseTables.length > 0 && (
                                <span className="text-xs text-gray-400 mr-2">
                                  {databaseTables.length}
                                </span>
                              )}
                              <RightOutlined 
                                className={`text-xs transition-transform ${
                                  isExpanded ? 'rotate-90' : ''
                                }`}
                              />
                            </div>
                          </div>
                        </Dropdown>
                        
                        {/* Tables under this database */}
                        {isExpanded && (
                          <div className="ml-6 space-y-1">
                            {databaseTables.length > 0 ? (
                              <>
                                {databaseTables.map((table) => (
                                  <Dropdown
                                    key={table._id}
                                    menu={{
                                      items: [
                                        {
                                          key: 'edit',
                                          icon: <EditOutlined />,
                                          label: 'Sửa tên',
                                          onClick: () => {
                                            setEditingTable({
                                              _id: table._id,
                                              name: table.name,
                                              description: table.description || '',
                                              databaseId: database._id
                                            });
                                            setShowEditTableModal(true);
                                          }
                                        },
                                        {
                                          key: 'delete',
                                          icon: <DeleteOutlined />,
                                          label: 'Xóa table',
                                          danger: true,
                                          onClick: () => {
                                            if (window.confirm(`Bạn có chắc muốn xóa table "${table.name}"?`)) {
                                              deleteTableMutation.mutate(table._id);
                                            }
                                          }
                                        }
                                      ]
                                    }}
                                    trigger={['contextMenu']}
                                  >
                                    <div
                                      className={`flex items-center px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors ${
                                        location.pathname.includes(`/table/${table._id}`)
                                          ? 'bg-blue-50 text-blue-600'
                                          : 'text-gray-600 hover:bg-gray-100'
                                      }`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/database/${database._id}/table/${table._id}`);
                                      }}
                                    >
                                      <TableOutlined className="mr-3" />
                                      <span className="truncate flex-1">{table.name}</span>
                                    </div>
                                  </Dropdown>
                                ))}
                              </>
                            ) : (
                              <div className="text-xs text-gray-400 py-2 px-3">
                                Chưa có table nào
                              </div>
                            )}
                            
                            {/* Create Table Button - always show when expanded */}
                            <div className="mt-2">
                              <Button
                                type="text"
                                icon={<PlusOutlined />}
                                size="small"
                                className="w-full text-left text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setNewTable({ name: '', description: '', databaseId: database._id });
                                  setShowCreateTableModal(true);
                                }}
                              >
                                Tạo Table
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>


      </Sider>

      <Layout style={{ marginLeft: collapsed ? 80 : 280 }}>
        <Header 
          style={{ 
            padding: '0 24px', 
            background: '#fff',
            borderBottom: '1px solid #f0f0f0',
            position: 'sticky',
            top: 0,
            zIndex: 999,
          }}
        >
          <div className="flex items-center justify-between h-full">
            <div className="flex items-center">
              {location.pathname !== '/database' && (
                <Button
                  icon={<ArrowLeftOutlined />}
                  onClick={() => {
                    if (location.pathname.includes('/table/')) {
                      const databaseId = location.pathname.split('/')[2];
                      navigate(`/database/${databaseId}/tables`);
                    } else if (location.pathname.includes('/tables')) {
                      navigate('/database');
                    }
                  }}
                  style={{ marginRight: 16 }}
                >
                  Back
                </Button>
              )}
              <Title level={4} className="mb-0 text-gray-900">
                {getPageTitle()}
              </Title>
            </div>
          </div>
        </Header>

        <Content style={{ 
          margin: location.pathname.includes('/table/') ? '0' : '24px', 
          minHeight: 280 
        }}>
          <Outlet />
        </Content>
      </Layout>

      {/* Create Database Modal */}
      <Modal
        title="Create New Database"
        open={showCreateDatabaseModal}
        onCancel={() => setShowCreateDatabaseModal(false)}
        footer={null}
      >
        <form onSubmit={handleCreateDatabase}>
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div>
              <Typography.Text strong>Database Name</Typography.Text>
              <Input
                value={newDatabase.name}
                onChange={(e) => setNewDatabase({ ...newDatabase, name: e.target.value })}
                placeholder="Enter database name"
                required
              />
            </div>
            <div>
              <Typography.Text strong>Description (Optional)</Typography.Text>
              <Input.TextArea
                value={newDatabase.description}
                onChange={(e) => setNewDatabase({ ...newDatabase, description: e.target.value })}
                placeholder="Enter database description"
                rows={3}
              />
            </div>
            <Row justify="end">
              <Space>
                <Button onClick={() => setShowCreateDatabaseModal(false)}>
                  Cancel
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={createDatabaseMutation.isPending}
                >
                  Create Database
                </Button>
              </Space>
            </Row>
          </Space>
        </form>
      </Modal>

      {/* Create Table Modal */}
      <Modal
        title="Tạo Table mới"
        open={showCreateTableModal}
        onCancel={() => setShowCreateTableModal(false)}
        footer={null}
      >
        <form onSubmit={handleCreateTable}>
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div>
              <Typography.Text strong>Tên Table *</Typography.Text>
              <Input
                value={newTable.name}
                onChange={(e) => setNewTable({ ...newTable, name: e.target.value })}
                placeholder="Ví dụ: Products"
                required
              />
            </div>
            <div>
              <Typography.Text strong>Mô tả (tùy chọn)</Typography.Text>
              <Input.TextArea
                value={newTable.description}
                onChange={(e) => setNewTable({ ...newTable, description: e.target.value })}
                placeholder="Mô tả về table này..."
                rows={3}
              />
            </div>
            <Row justify="end">
              <Space>
                <Button onClick={() => setShowCreateTableModal(false)}>
                  Hủy
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={createTableMutation.isPending}
                >
                  Tạo Table
                </Button>
              </Space>
            </Row>
          </Space>
        </form>
      </Modal>

      {/* Edit Database Modal */}
      <Modal
        title="Sửa Database"
        open={showEditDatabaseModal}
        onCancel={() => setShowEditDatabaseModal(false)}
        footer={null}
      >
        <form onSubmit={handleEditDatabase}>
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div>
              <Typography.Text strong>Tên Database *</Typography.Text>
              <Input
                value={editingDatabase.name}
                onChange={(e) => setEditingDatabase({ ...editingDatabase, name: e.target.value })}
                placeholder="Nhập tên database"
                required
              />
            </div>
            <div>
              <Typography.Text strong>Mô tả (tùy chọn)</Typography.Text>
              <Input.TextArea
                value={editingDatabase.description}
                onChange={(e) => setEditingDatabase({ ...editingDatabase, description: e.target.value })}
                placeholder="Nhập mô tả database"
                rows={3}
              />
            </div>
            <Row justify="end">
              <Space>
                <Button onClick={() => setShowEditDatabaseModal(false)}>
                  Hủy
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={editDatabaseMutation.isPending}
                >
                  Cập nhật
                </Button>
              </Space>
            </Row>
          </Space>
        </form>
      </Modal>

      {/* Edit Table Modal */}
      <Modal
        title="Sửa Table"
        open={showEditTableModal}
        onCancel={() => setShowEditTableModal(false)}
        footer={null}
      >
        <form onSubmit={handleEditTable}>
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div>
              <Typography.Text strong>Tên Table *</Typography.Text>
              <Input
                value={editingTable.name}
                onChange={(e) => setEditingTable({ ...editingTable, name: e.target.value })}
                placeholder="Nhập tên table"
                required
              />
            </div>
            <div>
              <Typography.Text strong>Mô tả (tùy chọn)</Typography.Text>
              <Input.TextArea
                value={editingTable.description}
                onChange={(e) => setEditingTable({ ...editingTable, description: e.target.value })}
                placeholder="Nhập mô tả table"
                rows={3}
              />
            </div>
            <Row justify="end">
              <Space>
                <Button onClick={() => setShowEditTableModal(false)}>
                  Hủy
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={editTableMutation.isPending}
                >
                  Cập nhật
                </Button>
              </Space>
            </Row>
          </Space>
        </form>
      </Modal>
    </Layout>
  );
};

export default DatabaseLayout;
