import React, { useState, useContext, useEffect, useRef } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Layout, Menu, Typography, Avatar, Button, Input, Modal, Space, Row, Dropdown, Tabs, Card, List, Select, Tooltip, Checkbox } from 'antd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../../utils/axiosInstance-cookie-only';
import { AuthContext } from '../../components/core/Auth';
import { toast } from 'react-toastify';
import { TableProvider, useTableContext } from '../../contexts/TableContext';
import PermissionModal from '../../components/Table/PermissionModal';
import { getUserDatabaseRole } from './Utils/permissionUtils.jsx';
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
  DeleteOutlined,
  CopyOutlined,
  AppstoreOutlined,
  FormOutlined,
  PictureOutlined,
  BarsOutlined,
  CalendarOutlined,
  ShareAltOutlined,
  EyeOutlined,
  LockOutlined,
  ReloadOutlined,
  QuestionCircleOutlined,
  GlobalOutlined,
  MailOutlined
} from '@ant-design/icons';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

// Custom scrollbar styles for consistent scrollbars across all views
const customScrollbarStyles = `
  /* Global scrollbar styling */
  *::-webkit-scrollbar {
    width: 8px;
  }
  
  *::-webkit-scrollbar-track {
    background: #f8f9fa;
    border-radius: 4px;
  }
  
  *::-webkit-scrollbar-thumb {
    background: #e9ecef;
    border-radius: 4px;
    border: 1px solid #dee2e6;
  }
  
  *::-webkit-scrollbar-thumb:hover {
    background: #dee2e6;
  }

  /* Firefox scrollbar styling */
  * {
    scrollbar-width: thin;
    scrollbar-color: #e9ecef #f8f9fa;
  }
`;


// View Type Dropdown Component
const ViewTypeDropdown = ({ visible, position, onClose, onSelectViewType }) => {
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (visible) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [visible, onClose]);

  const viewTypes = [
    {
      key: 'grid',
      label: 'Grid',
      icon: <AppstoreOutlined style={{ color: '#1890ff' }} />,
      description: 'Hiển thị dữ liệu dạng bảng'
    },
    {
      key: 'form',
      label: 'Form',
      icon: <FormOutlined style={{ color: '#722ed1' }} />,
      description: 'Tạo form nhập liệu'
    },
    {
      key: 'gallery',
      label: 'Gallery',
      icon: <PictureOutlined style={{ color: '#eb2f96' }} />,
      description: 'Hiển thị dữ liệu dạng thư viện ảnh'
    },
    {
      key: 'kanban',
      label: 'Kanban',
      icon: <BarsOutlined style={{ color: '#fa8c16' }} />,
      description: 'Quản lý công việc theo bảng'
    },
    {
      key: 'calendar',
      label: 'Calendar',
      icon: <CalendarOutlined style={{ color: '#f5222d' }} />,
      description: 'Hiển thị dữ liệu theo lịch'
    }
  ];

  if (!visible) {
    console.log('ViewTypeDropdown: Not visible');
    return null;
  }

  console.log('ViewTypeDropdown: Rendering with position:', position);

  return (
    <div
      ref={dropdownRef}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 9999,
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
        border: '1px solid #f0f0f0',
        padding: '16px',
        width: 320,
        minHeight: 'auto'
      }}
    >
      <div style={{ marginBottom: '12px' }}>
        <Typography.Title level={5} style={{ margin: 0, color: '#262626' }}>
          Tạo View mới
        </Typography.Title>
        <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
          Chọn loại view để tạo
        </Typography.Text>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {viewTypes.map((viewType) => (
          <div
            key={viewType.key}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid #f0f0f0',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: 'white'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = viewType.key === 'grid' ? '#1890ff' :
                                                viewType.key === 'form' ? '#722ed1' :
                                                viewType.key === 'gallery' ? '#eb2f96' :
                                                viewType.key === 'kanban' ? '#fa8c16' :
                                                '#f5222d';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#f0f0f0';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            onClick={(e) => {
              e.stopPropagation();
              onSelectViewType(viewType.key);
              onClose();
            }}
          >
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '16px',
                background: '#f8f9fa',
                border: '1px solid #e9ecef'
              }}
            >
              <span style={{ color: '#6c757d', fontSize: '20px' }}>
                {viewType.icon}
              </span>
            </div>
            
            <div style={{ flex: 1 }}>
              <div style={{ 
                fontWeight: 600, 
                fontSize: '16px',
                color: '#262626',
                marginBottom: '4px'
              }}>
                {viewType.label}
              </div>
              <div style={{ 
                fontSize: '13px',
                color: '#8c8c8c',
                lineHeight: '1.4'
              }}>
                {viewType.description}
              </div>
            </div>
            
            <Button
              type="text"
              shape="circle"
              size="small"
              icon={<PlusOutlined />}
              style={{
                width: '32px',
                height: '32px',
                color: '#6c757d'
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

// Component to handle delete functionality in header
const TableHeaderActions = () => {
  const { selectedRowKeys } = useTableContext();
  const queryClient = useQueryClient();
  const location = useLocation();
  
  // Extract table ID from current path
  const getTableId = () => {
    if (location.pathname.includes('/table/')) {
      const pathParts = location.pathname.split('/');
      return pathParts[pathParts.length - 1];
    }
    return null;
  };

  // Extract database ID from current path
  const getDatabaseId = () => {
    if (location.pathname.includes('/database/')) {
      const pathParts = location.pathname.split('/');
      const dbIndex = pathParts.indexOf('database');
      if (dbIndex !== -1 && pathParts[dbIndex + 1]) {
        return pathParts[dbIndex + 1];
      }
    }
    return null;
  };
  
  // Get current user and user role
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const databaseId = getDatabaseId();
  
  // Get database members to determine user role
  const { data: databaseMembersResponse } = useQuery({
    queryKey: ['database-members', databaseId],
    queryFn: async () => {
      const response = await axiosInstance.get(`/database/databases/${databaseId}/members`);
      return response.data;
    },
    enabled: !!databaseId,
  });
  
  const userRole = getUserDatabaseRole(databaseMembersResponse?.data || [], currentUser);

  const tableId = getTableId();

  // Bulk delete records mutation
  const deleteMultipleRecordsMutation = useMutation({
    mutationFn: async (recordIds) => {
      const response = await axiosInstance.delete('/database/records/bulk', {
        data: { recordIds }
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Records deleted successfully');
      queryClient.invalidateQueries(['tableRecords', tableId]);
    },
    onError: (error) => {
      console.error('Error deleting records:', error);
      toast.error(error.response?.data?.message || 'Failed to delete records');
    },
  });

  const handleDeleteSelected = () => {
    if (selectedRowKeys.length === 0) {
      return;
    }
    deleteMultipleRecordsMutation.mutate(selectedRowKeys);
  };


  // Only show delete button when on table detail page and rows are selected
  if (!location.pathname.includes('/table/') || selectedRowKeys.length === 0) {
    return null;
  }

  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      <Button
        danger
        icon={<DeleteOutlined />}
        loading={deleteMultipleRecordsMutation.isPending}
        onClick={handleDeleteSelected}
      >
        Delete Selected ({selectedRowKeys.length})
      </Button>
      
    </div>
  );
};

const DatabaseLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const authContext = useContext(AuthContext);
  const currentUser = authContext?.currentUser;
  const [collapsed, setCollapsed] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [expandedDatabases, setExpandedDatabases] = useState(new Set());
  const [expandedTables, setExpandedTables] = useState(new Set());
  const [expandedTemplates, setExpandedTemplates] = useState(new Set());
  const [activeSection, setActiveSection] = useState('databases'); // 'databases' or 'templates'
  
  // Auto-detect active section based on current path
  useEffect(() => {
    if (location.pathname.includes('/templates')) {
      setActiveSection('templates');
    } else {
      setActiveSection('databases'); // Default to databases
    }
  }, [location.pathname]);
  const [showCreateDatabaseModal, setShowCreateDatabaseModal] = useState(false);
  const [newDatabase, setNewDatabase] = useState({ name: '', description: '' });
  const [showCreateTableModal, setShowCreateTableModal] = useState(false);
  const [newTable, setNewTable] = useState({ name: '', description: '', databaseId: '' });
  
  // Edit/Delete states
  const [showEditDatabaseModal, setShowEditDatabaseModal] = useState(false);
  const [editingDatabase, setEditingDatabase] = useState({ _id: '', name: '', description: '' });
  const [showEditTableModal, setShowEditTableModal] = useState(false);
  const [editingTable, setEditingTable] = useState({ _id: '', name: '', description: '', databaseId: '' });
  
  // Copy states
  const [showCopyDatabaseModal, setShowCopyDatabaseModal] = useState(false);
  const [copyingDatabase, setCopyingDatabase] = useState({ _id: '', name: '', description: '' });
  const [showCopyTableModal, setShowCopyTableModal] = useState(false);
  const [copyingTable, setCopyingTable] = useState({ _id: '', name: '', description: '', targetDatabaseId: '' });
  
  // Permission states
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [selectedTableForPermission, setSelectedTableForPermission] = useState(null);
  
  // View states
  const [showViewTypeDropdown, setShowViewTypeDropdown] = useState(false);
  const [viewDropdownPosition, setViewDropdownPosition] = useState({ x: 0, y: 0 });
  const [selectedContext, setSelectedContext] = useState({ type: '', id: '', databaseId: '' });
  const [showCreateViewModal, setShowCreateViewModal] = useState(false);
  const [newView, setNewView] = useState({ name: '', description: '', type: '', tableId: '' });
  const [showEditViewModal, setShowEditViewModal] = useState(false);
  const [editingView, setEditingView] = useState({ _id: '', name: '', description: '', type: '' });
  
  // Header states
  const [activeTab, setActiveTab] = useState('data');
  
  // Share modal states
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareTarget, setShareTarget] = useState({ type: '', name: '', id: '' });
  
  // Template modal states
  const [showCreateTemplateModal, setShowCreateTemplateModal] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: '', description: '' });
  const [showEditTemplateModal, setShowEditTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState({ _id: '', name: '', description: '' });
  const [showEditTemplateTableModal, setShowEditTemplateTableModal] = useState(false);
  const [editingTemplateTable, setEditingTemplateTable] = useState({ templateId: '', tableIndex: -1, name: '', description: '' });
  const [showCreateTemplateTableModal, setShowCreateTemplateTableModal] = useState(false);
  const [newTemplateTable, setNewTemplateTable] = useState({ name: '', description: '' });
  const [currentTemplateId, setCurrentTemplateId] = useState(null);
  
  // Context menu states
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, type: '', item: null, databaseId: '', tableId: '' });
  
  // Super Admin check
  const isSuperAdmin = authContext?.isSuperAdmin || false;

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

  // Fetch templates count for sidebar
  const { data: templatesCountResponse } = useQuery({
    queryKey: ['templates-count'],
    queryFn: async () => {
      const response = await axiosInstance.get('/templates/public');
      return response.data;
    },
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const databases = Array.isArray(databasesResponse?.data) ? databasesResponse.data : [];

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

  // Fetch views for all tables
  const { data: allViewsResponse } = useQuery({
    queryKey: ['allViews', allTablesResponse?.length || 0],
    queryFn: async () => {
      const allTables = allTablesResponse || [];
      const viewsPromises = allTables.flatMap(item => 
        item.tables.map(async (table) => {
          try {
            const response = await axiosInstance.get(`/database/tables/${table._id}/views`);
            const views = response.data.data || [];
            console.log(`Loaded ${views.length} views for table ${table.name}`);
            return { tableId: table._id, views: views };
          } catch (error) {
            console.warn(`Failed to load views for table ${table.name}:`, error.response?.data?.message || error.message);
            return { tableId: table._id, views: [] };
          }
        })
      );
      const results = await Promise.all(viewsPromises);
      return results;
    },
    enabled: allTablesResponse && allTablesResponse.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: false,
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
      // Redirect to database list after successful deletion
      navigate('/database');
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


  // Delete view mutation
  const deleteViewMutation = useMutation({
    mutationFn: async (viewId) => {
      const response = await axiosInstance.delete(`/database/views/${viewId}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success("View deleted successfully");
      queryClient.invalidateQueries(["allViews"]);
      queryClient.refetchQueries(["allViews"]);
    },
    onError: (error) => {
      console.error("Error deleting view:", error);
      toast.error(error.response?.data?.message || "Failed to delete view");
    },
  });
  // Copy database mutation
  const copyDatabaseMutation = useMutation({
    mutationFn: async (databaseData) => {
      const response = await axiosInstance.post(`/database/databases/${databaseData._id}/copy`, {
        name: databaseData.name,
        description: databaseData.description
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Database copied successfully');
      setShowCopyDatabaseModal(false);
      setCopyingDatabase({ _id: '', name: '', description: '' });
      queryClient.invalidateQueries(['databases']);
      queryClient.invalidateQueries(['allTables']);
    },
    onError: (error) => {
      console.error('Error copying database:', error);
      toast.error(error.response?.data?.message || 'Failed to copy database');
    },
  });

  // Copy table mutation
  const copyTableMutation = useMutation({
    mutationFn: async (tableData) => {
      const response = await axiosInstance.post(`/database/tables/${tableData._id}/copy`, {
        name: tableData.name,
        description: tableData.description,
        targetDatabaseId: tableData.targetDatabaseId
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Table copied successfully');
      setShowCopyTableModal(false);
      setCopyingTable({ _id: '', name: '', description: '', targetDatabaseId: '' });
      queryClient.invalidateQueries(['allTables']);
    },
    onError: (error) => {
      console.error('Error copying table:', error);
      toast.error(error.response?.data?.message || 'Failed to copy table');
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

  const handleCopyDatabase = async (e) => {
    e.preventDefault();
    if (!copyingDatabase.name.trim()) {
      toast.error('Database name is required');
      return;
    }
    copyDatabaseMutation.mutate(copyingDatabase);
  };

  const handleCopyTable = async (e) => {
    e.preventDefault();
    if (!copyingTable.name.trim()) {
      toast.error('Table name is required');
      return;
    }
    if (!copyingTable.targetDatabaseId) {
      toast.error('Target database is required');
      return;
    }
    copyTableMutation.mutate(copyingTable);
  };

  const handleLogout = async () => {
    try {
      await authContext?.logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Handle view type selection
  const handleCreateViewClick = (context) => {
    console.log('handleCreateViewClick called with:', context);
    
    // Position popup in the top area, below the header
    const x = 300; // Left margin to avoid sidebar
    const y = 100; // Below header
    
    setViewDropdownPosition({ x, y });
    setSelectedContext(context);
    setShowViewTypeDropdown(true);
    console.log('Dropdown should be visible now');
    console.log('Position:', { x, y });
    console.log('Context:', context);
  };

  const handleSelectViewType = (viewType) => {
    console.log('Selected view type:', viewType, 'for context:', selectedContext);

    // Get existing views for this table to generate unique name
    const allViews = allViewsResponse || [];
    const tableViews = allViews.find(item => item.tableId === selectedContext.id);
    const existingViews = tableViews ? tableViews.views : [];

    // Count existing views of this type
    const existingViewsOfType = existingViews.filter(view => view.type === viewType);
    const viewNumber = existingViewsOfType.length + 1;

    // Generate unique name
    const baseName = viewType.charAt(0).toUpperCase() + viewType.slice(1);
    const viewName = existingViewsOfType.length === 0
      ? `${baseName} View`
      : `${baseName} View ${viewNumber}`;

    // Set up new view data and show modal
    setNewView({
      name: viewName,
      description: `Auto-generated ${viewType} view`,
      type: viewType,
      tableId: selectedContext.id
    });
    setShowCreateViewModal(true);
  };

  const handleCloseViewDropdown = () => {
    setShowViewTypeDropdown(false);
    setSelectedContext({ type: '', id: '', databaseId: '' });
  };

  // Create view mutation
  const createViewMutation = useMutation({
    mutationFn: async (viewData) => {
      const response = await axiosInstance.post('/database/views', {
        tableId: viewData.tableId,
        name: viewData.name,
        type: viewData.type,
        description: viewData.description,
        config: {},
        isDefault: false,
        isPublic: false
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success(`"${newView.name}" created successfully!`);
      setShowCreateViewModal(false);
      setNewView({ name: '', description: '', type: '', tableId: '' });
      queryClient.invalidateQueries(['allViews']);
      queryClient.refetchQueries(['allViews']);
      
      // Auto expand the table to show the new view
      if (newView.tableId) {
        setExpandedTables(prev => new Set([...prev, newView.tableId]));
        
        // Also expand the database if needed
        const allTables = allTablesResponse || [];
        const tableData = allTables.find(item => 
          item.tables.some(table => table._id === newView.tableId)
        );
        if (tableData) {
          setExpandedDatabases(prev => new Set([...prev, tableData.databaseId]));
        }
      }
    },
    onError: (error) => {
      console.error('Error creating view:', error);
      toast.error(error.response?.data?.message || 'Failed to create view');
    },
  });

  // Create template view mutation
  const createTemplateViewMutation = useMutation({
    mutationFn: async (viewData) => {
      const response = await axiosInstance.post(`/templates/${viewData.templateId}/views`, {
        templateId: viewData.templateId,
        tableIndex: viewData.tableIndex,
        name: viewData.name,
        type: viewData.type,
        description: viewData.description,
        config: {},
        isDefault: false,
        isPublic: false
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success(`"${newView.name}" created successfully!`);
      setShowCreateViewModal(false);
      setNewView({ name: '', description: '', type: '', tableId: '' });
      queryClient.invalidateQueries(['templates']);
      queryClient.invalidateQueries(['templates-count']);
    },
    onError: (error) => {
      console.error('Error creating template view:', error);
      toast.error(error.response?.data?.message || 'Failed to create template view');
    },
  });

  const handleCreateView = async (e) => {
    e.preventDefault();
    if (!newView.name.trim()) {
      toast.error('View name is required');
      return;
    }
    
    // Only handle database views now
    createViewMutation.mutate(newView);
  };

  // Edit view mutation
  const editViewMutation = useMutation({
    mutationFn: async (viewData) => {
      const response = await axiosInstance.put(`/database/views/${viewData._id}`, {
        name: viewData.name,
        description: viewData.description
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success(`"${editingView.name}" updated successfully!`);
      setShowEditViewModal(false);
      setEditingView({ _id: '', name: '', description: '', type: '' });
      queryClient.invalidateQueries(['allViews']);
      queryClient.refetchQueries(['allViews']);
    },
    onError: (error) => {
      console.error('Error updating view:', error);
      toast.error(error.response?.data?.message || 'Failed to update view');
    },
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: async (templateData) => {
      const response = await axiosInstance.post('/templates/admin', templateData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['templates']);
      queryClient.invalidateQueries(['templates-count']);
      setShowCreateTemplateModal(false);
      setNewTemplate({ name: '', description: '' });
      toast.success('Template created successfully');
    },
    onError: (error) => {
      console.error('Error creating template:', error);
      toast.error(error.response?.data?.message || 'Failed to create template');
    }
  });

  // Edit template mutation
  const editTemplateMutation = useMutation({
    mutationFn: async (templateData) => {
      const response = await axiosInstance.put(`/templates/admin/${templateData._id}`, {
        name: templateData.name,
        description: templateData.description
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['templates']);
      queryClient.invalidateQueries(['templates-count']);
      setShowEditTemplateModal(false);
      setEditingTemplate({ _id: '', name: '', description: '' });
      toast.success('Template updated successfully');
    },
    onError: (error) => {
      console.error('Error updating template:', error);
      toast.error(error.response?.data?.message || 'Failed to update template');
    }
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId) => {
      const response = await axiosInstance.delete(`/templates/admin/${templateId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['templates']);
      queryClient.invalidateQueries(['templates-count']);
      toast.success('Template deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting template:', error);
      toast.error(error.response?.data?.message || 'Failed to delete template');
    }
  });

  // Update template structure mutation (for editing/deleting tables)
  const updateTemplateStructureMutation = useMutation({
    mutationFn: async ({ templateId, tables }) => {
      const response = await axiosInstance.put(`/templates/admin/${templateId}`, { tables });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['templates']);
      queryClient.invalidateQueries(['templates-count']);
      queryClient.invalidateQueries(['template']);
      toast.success('Template table updated successfully');
    },
    onError: (error) => {
      console.error('Error updating template table:', error);
      toast.error(error.response?.data?.message || 'Failed to update template table');
    }
  });

  const handleEditView = async (e) => {
    e.preventDefault();
    if (!editingView.name.trim()) {
      toast.error('View name is required');
      return;
    }
    editViewMutation.mutate(editingView);
  };

  // Handle create template
  const handleCreateTemplate = async (e) => {
    e.preventDefault();
    if (!newTemplate.name.trim()) {
      toast.error('Template name is required');
      return;
    }
    createTemplateMutation.mutate(newTemplate);
  };

  // Handle create template table
  const handleCreateTemplateTable = async (e) => {
    e.preventDefault();
    if (!newTemplateTable.name.trim()) {
      toast.error('Table name is required');
      return;
    }
    
    if (!currentTemplateId) {
      toast.error('Template ID is missing');
      return;
    }

    // Fetch current template to get existing tables
    try {
      const templateResponse = await axiosInstance.get(`/templates/${currentTemplateId}`);
      const template = templateResponse.data.data;
      
      const updatedTables = [...(template.tables || []), {
        name: newTemplateTable.name,
        description: newTemplateTable.description,
        columns: [],
        sampleData: []
      }];

      updateTemplateStructureMutation.mutate({
        templateId: currentTemplateId,
        tables: updatedTables
      });

      setNewTemplateTable({ name: '', description: '' });
      setShowCreateTemplateTableModal(false);
      setCurrentTemplateId(null);
    } catch (error) {
      console.error('Error creating template table:', error);
      toast.error('Failed to create template table');
    }
  };

  // Handle edit template
  const handleEditTemplate = async (e) => {
    e.preventDefault();
    if (!editingTemplate.name.trim()) {
      toast.error('Template name is required');
      return;
    }
    editTemplateMutation.mutate(editingTemplate);
  };

  // Handle edit template table
  const handleEditTemplateTable = async (e) => {
    e.preventDefault();
    if (!editingTemplateTable.name.trim()) {
      toast.error('Table name is required');
      return;
    }

    // Fetch current template to get tables array
    const templateResponse = await axiosInstance.get(`/templates/${editingTemplateTable.templateId}`);
    const template = templateResponse.data.data;
    
    const updatedTables = [...(template.tables || [])];
    updatedTables[editingTemplateTable.tableIndex] = {
      ...updatedTables[editingTemplateTable.tableIndex],
      name: editingTemplateTable.name,
      description: editingTemplateTable.description
    };

    updateTemplateStructureMutation.mutate({
      templateId: editingTemplateTable.templateId,
      tables: updatedTables
    });

    setEditingTemplateTable({ templateId: '', tableIndex: -1, name: '', description: '' });
    setShowEditTemplateTableModal(false);
  };

  // Handle context menu
  const handleContextMenu = (e, type, item, databaseId = '', tableId = '') => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      type,
      item,
      databaseId,
      tableId
    });
  };

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClick = () => {
      if (contextMenu.visible) {
        setContextMenu({ visible: false, x: 0, y: 0, type: '', item: null, databaseId: '', tableId: '' });
      }
    };

    if (contextMenu.visible) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [contextMenu.visible]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showViewTypeDropdown) {
        // Check if click is outside the dropdown
        const dropdown = document.querySelector('.view-type-dropdown');
        if (dropdown && !dropdown.contains(event.target)) {
          setShowViewTypeDropdown(false);
          setSelectedContext({ type: '', id: '', databaseId: '' });
        }
      }
    };

    if (showViewTypeDropdown) {
      // Add delay to prevent immediate closing when context menu closes
      setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
      }, 200);
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [showViewTypeDropdown]);

  const getPageTitle = () => {
    if (location.pathname === '/database') return 'Databases';
    if (location.pathname.includes('/database/') && location.pathname.includes('/tables')) return 'Tables';
    if (location.pathname.includes('/database/') && location.pathname.includes('/table/')) {
      // Extract table ID from path and find the table name
      const pathParts = location.pathname.split('/');
      const tableId = pathParts[pathParts.length - 1];
      const table = allTables
        .flatMap(item => item.tables)
        .find(t => t._id === tableId);
      return table ? table.name : 'Table Detail';
    }
    return 'Database Management';
  };

  // Get breadcrumb path for form view
  const getBreadcrumbPath = () => {
    if (location.pathname.includes('/view/') || location.pathname.includes('/grid/') || location.pathname.includes('/kanban/') || location.pathname.includes('/calendar/') || location.pathname.includes('/gallery/')) {
      // Extract database ID, table ID, and view ID from path
      const pathParts = location.pathname.split('/');
      const databaseId = pathParts[2];
      const tableId = pathParts[4];
      const viewId = pathParts[6];
      
      // Find database name
      const database = databases.find(db => db._id === databaseId);
      const databaseName = database ? database.name : 'Database';
      
      // Find table name
      const table = allTables
        .flatMap(item => item.tables)
        .find(t => t._id === tableId);
      const tableName = table ? table.name : 'Table';
      
      // Find view name
      const allViews = allViewsResponse || [];
      const tableViews = allViews.find(item => item.tableId === tableId);
      const view = tableViews ? tableViews.views.find(v => v._id === viewId) : null;
      const viewName = view ? view.name : 'View';
      
      return `/${databaseName} / ${tableName} / ${viewName}`;
    }
    return '';
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

  // Toggle table expansion
  const toggleTable = (tableId) => {
    const newExpanded = new Set(expandedTables);
    if (newExpanded.has(tableId)) {
      newExpanded.delete(tableId);
    } else {
      newExpanded.add(tableId);
    }
    setExpandedTables(newExpanded);
  };

  // Toggle template expansion
  const toggleTemplate = (templateId) => {
    const newExpanded = new Set(expandedTemplates);
    if (newExpanded.has(templateId)) {
      newExpanded.delete(templateId);
    } else {
      newExpanded.add(templateId);
    }
    setExpandedTemplates(newExpanded);
  };

  // Get tables for a specific database
  const getTablesForDatabase = (databaseId) => {
    const databaseTables = allTables.find(item => item.databaseId === databaseId);
    return databaseTables ? databaseTables.tables : [];
  };

  // Get tables for a specific template
  const getTablesForTemplate = (templateId) => {
    // This would need to be implemented based on your template API
    // For now, return empty array - you can implement this later
    return [];
  };

  // Get views for a specific table
  const getViewsForTable = (tableId) => {
    const allViews = allViewsResponse || [];
    const tableViews = allViews.find(item => item.tableId === tableId);
    const views = tableViews ? tableViews.views : [];
    
    // Debug logging when no views found
    if (views.length === 0 && allViews.length > 0) {
      console.log(`No views found for table ${tableId}. Total views data:`, allViews.length);
    }
    
    return views;
  };

  return (
    <TableProvider>
      <Layout style={{ minHeight: '100vh' }}>
      <style dangerouslySetInnerHTML={{ __html: customScrollbarStyles }} />
      <Sider
        width={280}
        collapsed={collapsed}
        style={{ 
          position: 'fixed', 
          height: '100vh',
          zIndex: 1000,
          background: '#fff',
          borderRight: '1px solid #f0f0f0',
          display: 'flex',
          flexDirection: 'column'
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
        {!collapsed && location.pathname === '/database' && !location.pathname.includes('/templates') && (
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

        {/* Create Template Button - Only for Super Admin */}
        {!collapsed && location.pathname === '/templates' && isSuperAdmin && (
          <div className="p-4 border-b border-gray-200">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              className="w-full"
              onClick={() => setShowCreateTemplateModal(true)}
            >
              Create Template
            </Button>
          </div>
        )}

        {/* Create Template Table Button - Only for Super Admin */}
        {!collapsed && (() => {
          const isTemplateDetailPage = location.pathname.match(/^\/templates\/[^/]+$/);
          console.log('🔍 Check Create Table Button:', {
            pathname: location.pathname,
            isTemplateDetailPage,
            isSuperAdmin,
            collapsed
          });
          return isTemplateDetailPage && isSuperAdmin;
        })() && (
          <div className="p-4 border-b border-gray-200">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              className="w-full"
              onClick={() => {
                const pathParts = location.pathname.split('/');
                const templateId = pathParts[2];
                console.log('🔍 Creating table for template:', templateId);
                setCurrentTemplateId(templateId);
                setShowCreateTemplateTableModal(true);
              }}
            >
              + Create Table
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
        <div className="flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)', paddingBottom: '100px' }}>
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
              onClick={() => {
                navigate('/database');
                setActiveSection('databases');
              }}
              className="mx-2 rounded-lg"
            >
              Overview
            </Menu.Item>
            <Menu.Item
              key="/templates"
              icon={<AppstoreOutlined />}
              onClick={() => {
                navigate('/templates');
                setActiveSection('templates');
              }}
              className="mx-2 rounded-lg"
            >
              Templates
            </Menu.Item>
          </Menu>

          {/* Templates Section */}
          {!collapsed && activeSection === 'templates' && (
            <div className="px-4 py-2" style={{ paddingBottom: '20px' }}>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                Templates
              </div>
              <div className="space-y-1">
                <div 
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => navigate('/templates')}
                >
                  <div className="flex items-center">
                    <AppstoreOutlined className="text-blue-500 mr-2" />
                    <span className="text-sm text-gray-700">Template Gallery</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-xs text-gray-400 mr-2">
                      {templatesCountResponse?.data?.length || 0}
                    </span>
                    <RightOutlined className="text-gray-400 text-xs" />
                  </div>
                </div>
                
                {/* Template List */}
                {templatesCountResponse?.data && templatesCountResponse.data.length > 0 && (
                  <div className="space-y-1">
                    {templatesCountResponse.data.map((template) => {
                      const isExpanded = expandedTemplates.has(template._id || template.id);
                      const templateTables = getTablesForTemplate(template._id || template.id);
                      const isActive = location.pathname.includes(`/templates/${template._id || template.id}`);
                      
                      return (
                        <div key={template._id || template.id} className="space-y-1">
                          {/* Template Item */}
                          <div
                            className={`flex items-center px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors ${
                              isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                            }`}
                            onClick={() => toggleTemplate(template._id || template.id)}
                            onContextMenu={(e) => handleContextMenu(e, 'template', template)}
                          >
                            <AppstoreOutlined className="mr-3" />
                            <span className="truncate flex-1">{template.name}</span>
                            <div className="flex items-center">
                              <span className="text-xs text-gray-400 mr-2">
                                {template.tables?.length || 0}
                              </span>
                              <RightOutlined 
                                className={`text-xs transition-transform ${
                                  isExpanded ? 'rotate-90' : ''
                                }`}
                              />
                            </div>
                          </div>
                          
                          {/* Tables under this template */}
                          {isExpanded && (
                            <div className="ml-6 space-y-1" style={{ maxHeight: 'none', overflow: 'visible' }}>
                              {template.tables && template.tables.length > 0 ? (
                                template.tables.map((table, tableIndex) => (
                                  <div
                                    key={table._id || table.id || tableIndex}
                                    className={`flex items-center px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors ${
                                      location.pathname.includes(`/templates/${template._id || template.id}/table/${tableIndex}`)
                                        ? "bg-blue-50 text-blue-600"
                                        : "text-gray-600 hover:bg-gray-100"
                                    }`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/templates/${template._id || template.id}/table/${tableIndex}`);
                                    }}
                                    onContextMenu={(e) => handleContextMenu(e, 'template-table', table, template._id || template.id, tableIndex)}
                                  >
                                    <AppstoreOutlined className="mr-3" />
                                    <span className="truncate flex-1">{table.name}</span>
                                    <div className="flex items-center">
                                      <span className="text-xs text-gray-400 mr-2">
                                        {table.records?.length || 0}
                                      </span>
                                      <RightOutlined className="text-gray-400 text-xs" />
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="text-xs text-gray-400 py-2 px-3">
                                  Chưa có table nào
                                </div>
                              )}
                              
                              {/* Create Table Button - Only for Super Admin */}
                              {isSuperAdmin && (
                                <div className="mt-2">
                                  <button
                                    className="w-full text-left text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors text-sm font-medium"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const templateId = template._id || template.id;
                                      console.log('🔍 Create table for template:', templateId);
                                      setCurrentTemplateId(templateId);
                                      setShowCreateTemplateTableModal(true);
                                    }}
                                  >
                                    + Tạo Table
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Databases Section */}
          {!collapsed && activeSection === 'databases' && (
            <div className="px-4 py-2" style={{ paddingBottom: '20px' }}>
              
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
                <div className="space-y-1" style={{ maxHeight: 'none', overflow: 'visible' }}>
                  {filteredDatabases.map((database) => {
                    const isExpanded = expandedDatabases.has(database._id);
                    const databaseTables = getTablesForDatabase(database._id);
                    const isActive = location.pathname.includes(`/database/${database._id}`);
                    
                    return (
                      <div key={database._id} className="space-y-1">
                        {/* Database Item */}
                        <div
                          className={`flex items-center px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors ${
                            isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                          }`}
                          onClick={() => toggleDatabase(database._id)}
                          onContextMenu={(e) => handleContextMenu(e, 'database', database)}
                        >
                          <DatabaseOutlined className="mr-3" />
                          <span className="truncate flex-1">{database.name}</span>
                          <div className="flex items-center">
                            <span className="text-xs text-gray-400 mr-2">
                              {databaseTables.length}
                            </span>
                            <RightOutlined 
                              className={`text-xs transition-transform ${
                                isExpanded ? 'rotate-90' : ''
                              }`}
                            />
                          </div>
                        </div>
                        
                        {/* Tables under this database */}
                        {isExpanded && (
                          <div className="ml-6 space-y-1" style={{ maxHeight: 'none', overflow: 'visible' }}>
                            {databaseTables.length > 0 ? (
                              <>
                                {databaseTables.map((table) => {
                                  const tableViews = getViewsForTable(table._id);
                                  const isTableExpanded = expandedTables.has(table._id);
                                  
                                  return (
                                    <div key={table._id}>
                                  <div
                                    className={`flex items-center px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors ${
                                      location.pathname.includes(`/table/${table._id}`)
                                            ? "bg-blue-50 text-blue-600"
                                            : "text-gray-600 hover:bg-gray-100"
                                    }`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/database/${database._id}/table/${table._id}`);
                                    }}
                                    onContextMenu={(e) => handleContextMenu(e, 'table', table, database._id)}
                                  >
                                    <TableOutlined className="mr-3" />
                                    <span className="truncate flex-1">{table.name}</span>
                                        <div className="flex items-center">
                                          <span className="text-xs text-gray-400 mr-2">
                                            {tableViews.length}
                                          </span>
                                          <RightOutlined 
                                            className={`text-xs transition-transform ${
                                              isTableExpanded ? "rotate-90" : ""
                                            }`}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleTable(table._id);
                                            }}
                                          />
                                        </div>
                                  </div>
                                      
                                      {/* Views for this table */}
                                      {isTableExpanded && (
                                        <div className="ml-6 space-y-1" style={{ maxHeight: 'none', overflow: 'visible' }}>
                                          {tableViews.length > 0 ? (
                                            tableViews.map((view) => (
                                              <div
                                                key={view._id}
                                                className={`flex items-center px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors ml-6 ${
                                                  location.pathname.includes(`/view/${view._id}`) || 
                                                  location.pathname.includes(`/grid/${view._id}`) ||
                                                  location.pathname.includes(`/kanban/${view._id}`) ||
                                                  location.pathname.includes(`/calendar/${view._id}`) ||
                                                  location.pathname.includes(`/gallery/${view._id}`)
                                                    ? "bg-green-50 text-green-600"
                                                    : "text-gray-500 hover:bg-gray-50"
                                                }`}
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  if (view.type === 'form') {
                                                    navigate(`/database/${database._id}/table/${table._id}/view/${view._id}`);
                                                  } else if (view.type === 'grid') {
                                                    navigate(`/database/${database._id}/table/${table._id}/grid/${view._id}`);
                                                  } else if (view.type === 'kanban') {
                                                    navigate(`/database/${database._id}/table/${table._id}/kanban/${view._id}`);
                                                  } else if (view.type === 'calendar') {
                                                    navigate(`/database/${database._id}/table/${table._id}/calendar/${view._id}`);
                                                  } else if (view.type === 'gallery') {
                                                    navigate(`/database/${database._id}/table/${table._id}/gallery/${view._id}`);
                                                  } else {
                                                    console.log("Navigate to view:", view._id, "type:", view.type);
                                                  }
                                                }}
                                                onContextMenu={(e) => handleContextMenu(e, 'view', view, database._id, table._id)}
                                              >
                                                <div className="mr-3 text-xs">
                                                  {view.type === "grid" && <AppstoreOutlined style={{ color: "#1890ff" }} />}
                                                  {view.type === "form" && <FormOutlined style={{ color: "#722ed1" }} />}
                                                  {view.type === "gallery" && <PictureOutlined style={{ color: "#eb2f96" }} />}
                                                  {view.type === "kanban" && <BarsOutlined style={{ color: "#fa8c16" }} />}
                                                  {view.type === "calendar" && <CalendarOutlined style={{ color: "#f5222d" }} />}
                                                </div>
                                                <span className="truncate flex-1">{view.name}</span>
                                              </div>
                                            ))
                                          ) : (
                                            <div className="text-xs text-gray-400 py-2 px-3 ml-6">
                                              Chưa có view nào
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                                
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

        {/* Navigation Buttons at bottom of screen */}
        {!collapsed && (
          <div 
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              width: '280px',
              padding: '16px',
              borderTop: '1px solid #e5e7eb',
              backgroundColor: '#fff',
              zIndex: 1001,
              boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.1)'
            }}
          >
            <div className="space-y-2">
              <button
                onClick={() => navigate('/')}
                className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                <HomeOutlined className="mr-2" />
                Về trang chủ
              </button>
              <button
                onClick={() => navigate('/profile/base')}
                className="w-full flex items-center px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              >
                <AppstoreOutlined className="mr-2" />
                Quản lý Base
              </button>
            </div>
          </div>
        )}

      </Sider>

      <Layout style={{ marginLeft: collapsed ? 80 : 280 }}>
        <Header 
          style={{ 
            padding: '0 24px', 
            background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
            borderBottom: '1px solid #e8eaed',
            position: 'sticky',
            top: 0,
            zIndex: 999,
            minHeight: (location.pathname.includes('/view/') || location.pathname.includes('/grid/') || location.pathname.includes('/kanban/') || location.pathname.includes('/calendar/') || location.pathname.includes('/gallery/')) ? '120px' : '64px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
          }}
        >
          <div className="flex items-center justify-between" style={{ height: '64px' }}>
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
            <div className="flex items-center" style={{ gap: '8px' }}>
              <TableHeaderActions />
            </div>
          </div>
          
          {/* Tabs and Breadcrumb Section - Only show on form view pages */}
          {(location.pathname.includes('/view/') || location.pathname.includes('/kanban/') || location.pathname.includes('/calendar/') || location.pathname.includes('/gallery/')) && (
            <div className="flex items-center justify-between">
              <div className="flex items-center" style={{ gap: '36px' }}>
                {/* Tabs */}
                <Tabs
                  activeKey={activeTab}
                  onChange={setActiveTab}
                  items={[
                    {
                      key: 'data',
                      label: (
                        <span style={{ 
                          fontSize: '14px', 
                          fontWeight: 500,
                          color: activeTab === 'data' ? '#1890ff' : '#5f6368'
                        }}>
                          Data
                        </span>
                      ),
                    },
                    {
                      key: 'details',
                      label: (
                        <span style={{ 
                          fontSize: '14px', 
                          fontWeight: 500,
                          color: activeTab === 'details' ? '#1890ff' : '#5f6368'
                        }}>
                          Details
                        </span>
                      ),
                    },
                  ]}
                  style={{ margin: 0 }}
                  tabBarStyle={{ 
                    margin: 0,
                    borderBottom: 'none'
                  }}
                  tabBarGutter={28}
                />
                
                {/* Breadcrumb */}
                <div style={{ 
                  fontSize: '13px',
                  color: '#5f6368',
                  fontWeight: 400,
                  letterSpacing: '0.2px'
                }}>
                  {getBreadcrumbPath()}
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center" style={{ gap: '6px' }}>
                <Button
                  icon={<ReloadOutlined />}
                  type="text"
                  style={{ 
                    color: '#5f6368',
                    height: '32px',
                    width: '32px',
                    borderRadius: '6px',
                    border: '1px solid #e8eaed',
                    background: '#fff'
                  }}
                />
                <Button
                  icon={<EyeOutlined />}
                  style={{ 
                    backgroundColor: '#fff', 
                    borderColor: '#e8eaed',
                    color: '#5f6368',
                    height: '32px',
                    borderRadius: '6px',
                    fontWeight: 500,
                    fontSize: '13px'
                  }}
                  onClick={() => {
                    // Extract database ID and table ID from current path
                    const pathParts = location.pathname.split('/');
                    const databaseId = pathParts[2];
                    const tableId = pathParts[4];
                    navigate(`/database/${databaseId}/table/${tableId}`);
                  }}
                >
                  Xem dữ liệu
                </Button>
                <Button
                  icon={<LockOutlined />}
                  type="text"
                  style={{ 
                    color: '#5f6368',
                    height: '32px',
                    width: '32px',
                    borderRadius: '6px',
                    border: '1px solid #e8eaed',
                    background: '#fff'
                  }}
                />
              </div>
            </div>
          )}

          {/* Grid View Header - Simple breadcrumb only */}
          {location.pathname.includes('/grid/') && (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {/* Breadcrumb */}
                <div style={{ 
                  fontSize: '13px',
                  color: '#5f6368',
                  fontWeight: 400,
                  letterSpacing: '0.2px'
                }}>
                  {getBreadcrumbPath()}
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center" style={{ gap: '6px' }}>
                <Button
                  icon={<ReloadOutlined />}
                  type="text"
                  style={{ 
                    color: '#5f6368',
                    height: '32px',
                    width: '32px',
                    borderRadius: '6px',
                    border: '1px solid #e8eaed',
                    background: '#fff'
                  }}
                />
                <Button
                  icon={<EyeOutlined />}
                  style={{ 
                    backgroundColor: '#fff', 
                    borderColor: '#e8eaed',
                    color: '#5f6368',
                    height: '32px',
                    borderRadius: '6px',
                    fontWeight: 500,
                    fontSize: '13px'
                  }}
                  onClick={() => {
                    // Extract database ID and table ID from current path
                    const pathParts = location.pathname.split('/');
                    const databaseId = pathParts[2];
                    const tableId = pathParts[4];
                    navigate(`/database/${databaseId}/table/${tableId}`);
                  }}
                >
                  Xem dữ liệu
                </Button>
                <Button
                  icon={<LockOutlined />}
                  type="text"
                  style={{ 
                    color: '#5f6368',
                    height: '32px',
                    width: '32px',
                    borderRadius: '6px',
                    border: '1px solid #e8eaed',
                    background: '#fff'
                  }}
                />
              </div>
            </div>
          )}
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

      {/* Copy Database Modal */}
      <Modal
        title="Sao chép Database"
        open={showCopyDatabaseModal}
        onCancel={() => setShowCopyDatabaseModal(false)}
        footer={null}
      >
        <form onSubmit={handleCopyDatabase}>
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div>
              <Typography.Text strong>Tên Database mới *</Typography.Text>
              <Input
                value={copyingDatabase.name}
                onChange={(e) => setCopyingDatabase({ ...copyingDatabase, name: e.target.value })}
                placeholder="Ví dụ: ShopDB - Copy"
                required
              />
            </div>
            <div>
              <Typography.Text strong>Mô tả (tùy chọn)</Typography.Text>
              <Input.TextArea
                value={copyingDatabase.description}
                onChange={(e) => setCopyingDatabase({ ...copyingDatabase, description: e.target.value })}
                placeholder="Mô tả về database này..."
                rows={3}
              />
            </div>
            <div style={{ padding: '12px', background: '#fff7e6', border: '1px solid #ffd591', borderRadius: '6px' }}>
              <Typography.Text style={{ color: '#d46b08', fontSize: '14px' }}>
                <strong>Lưu ý:</strong> Việc sao chép sẽ tạo ra một database mới với tất cả tables, columns và dữ liệu từ database gốc.
              </Typography.Text>
            </div>
            <Row justify="end">
              <Space>
                <Button onClick={() => setShowCopyDatabaseModal(false)}>
                  Hủy
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={copyDatabaseMutation.isPending}
                  style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                >
                  Sao chép
                </Button>
              </Space>
            </Row>
          </Space>
        </form>
      </Modal>

      {/* Copy Table Modal */}
      <Modal
        title="Sao chép Table"
        open={showCopyTableModal}
        onCancel={() => setShowCopyTableModal(false)}
        footer={null}
      >
        <form onSubmit={handleCopyTable}>
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div>
              <Typography.Text strong>Tên Table mới *</Typography.Text>
              <Input
                value={copyingTable.name}
                onChange={(e) => setCopyingTable({ ...copyingTable, name: e.target.value })}
                placeholder="Ví dụ: Products - Copy"
                required
              />
            </div>
            <div>
              <Typography.Text strong>Database đích *</Typography.Text>
              <select
                value={copyingTable.targetDatabaseId}
                onChange={(e) => setCopyingTable({ ...copyingTable, targetDatabaseId: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
                required
              >
                <option value="">Chọn database đích</option>
                {databases.map((db) => (
                  <option key={db._id} value={db._id}>
                    {db.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Typography.Text strong>Mô tả (tùy chọn)</Typography.Text>
              <Input.TextArea
                value={copyingTable.description}
                onChange={(e) => setCopyingTable({ ...copyingTable, description: e.target.value })}
                placeholder="Mô tả về table này..."
                rows={3}
              />
            </div>
            <div style={{ padding: '12px', background: '#fff7e6', border: '1px solid #ffd591', borderRadius: '6px' }}>
              <Typography.Text style={{ color: '#d46b08', fontSize: '14px' }}>
                <strong>Lưu ý:</strong> Việc sao chép sẽ tạo ra một table mới với tất cả columns và dữ liệu từ table gốc.
              </Typography.Text>
            </div>
            <Row justify="end">
              <Space>
                <Button onClick={() => setShowCopyTableModal(false)}>
                  Hủy
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={copyTableMutation.isPending}
                  style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                >
                  Sao chép
                </Button>
              </Space>
            </Row>
          </Space>
        </form>
      </Modal>

      {/* Edit View Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {editingView.type === 'grid' && <AppstoreOutlined style={{ color: '#1890ff' }} />}
            {editingView.type === 'form' && <FormOutlined style={{ color: '#722ed1' }} />}
            {editingView.type === 'gallery' && <PictureOutlined style={{ color: '#eb2f96' }} />}
            {editingView.type === 'kanban' && <BarsOutlined style={{ color: '#fa8c16' }} />}
            {editingView.type === 'calendar' && <CalendarOutlined style={{ color: '#f5222d' }} />}
            <span>Edit {editingView.type ? editingView.type.charAt(0).toUpperCase() + editingView.type.slice(1) : ''} View</span>
          </div>
        }
        open={showEditViewModal}
        onCancel={() => setShowEditViewModal(false)}
        footer={null}
        width={500}
      >
        <form onSubmit={handleEditView}>
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div>
              <Typography.Text strong>View Name *</Typography.Text>
              <Input
                value={editingView.name}
                onChange={(e) => setEditingView({ ...editingView, name: e.target.value })}
                placeholder="Enter view name"
                required
                size="large"
              />
            </div>
            <div>
              <Button
                type="text"
                icon={<PlusOutlined />}
                onClick={() => {
                  // Toggle description field
                  if (editingView.description) {
                    setEditingView({ ...editingView, description: '' });
                  } else {
                    setEditingView({ ...editingView, description: `Auto-generated ${editingView.type} view` });
                  }
                }}
                style={{ 
                  padding: '4px 8px',
                  height: 'auto',
                  color: '#1890ff'
                }}
              >
                Add description
              </Button>
              {editingView.description && (
                <Input.TextArea
                  value={editingView.description}
                  onChange={(e) => setEditingView({ ...editingView, description: e.target.value })}
                  placeholder="Enter view description"
                  rows={3}
                  style={{ marginTop: '8px' }}
                />
              )}
            </div>
            <Row justify="end">
              <Space>
                <Button onClick={() => setShowEditViewModal(false)}>
                  Cancel
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={editViewMutation.isPending}
                >
                  Update view
                </Button>
              </Space>
            </Row>
          </Space>
        </form>
      </Modal>

      {/* Create View Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {newView.type === 'grid' && <AppstoreOutlined style={{ color: '#1890ff' }} />}
            {newView.type === 'form' && <FormOutlined style={{ color: '#722ed1' }} />}
            {newView.type === 'gallery' && <PictureOutlined style={{ color: '#eb2f96' }} />}
            {newView.type === 'kanban' && <BarsOutlined style={{ color: '#fa8c16' }} />}
            {newView.type === 'calendar' && <CalendarOutlined style={{ color: '#f5222d' }} />}
            <span>Create {newView.type ? newView.type.charAt(0).toUpperCase() + newView.type.slice(1) : ''} View</span>
          </div>
        }
        open={showCreateViewModal}
        onCancel={() => setShowCreateViewModal(false)}
        footer={null}
        width={500}
      >
        <form onSubmit={handleCreateView}>
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div>
              <Typography.Text strong>View Name *</Typography.Text>
              <Input
                value={newView.name}
                onChange={(e) => setNewView({ ...newView, name: e.target.value })}
                placeholder="Enter view name"
                required
                size="large"
              />
            </div>
            <div>
              <Button
                type="text"
                icon={<PlusOutlined />}
                onClick={() => {
                  // Toggle description field
                  if (newView.description) {
                    setNewView({ ...newView, description: '' });
                  } else {
                    setNewView({ ...newView, description: `Auto-generated ${newView.type} view` });
                  }
                }}
                style={{ 
                  padding: '4px 8px',
                  height: 'auto',
                  color: '#1890ff'
                }}
              >
                Add description
              </Button>
              {newView.description && (
                <Input.TextArea
                  value={newView.description}
                  onChange={(e) => setNewView({ ...newView, description: e.target.value })}
                  placeholder="Enter view description"
                  rows={3}
                  style={{ marginTop: '8px' }}
                />
              )}
            </div>
            <Row justify="end">
              <Space>
                <Button onClick={() => setShowCreateViewModal(false)}>
                  Cancel
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={createViewMutation.isPending}
                >
                  Create view
                </Button>
              </Space>
            </Row>
          </Space>
        </form>
      </Modal>

      {/* View Type Dropdown */}
      <ViewTypeDropdown
        visible={showViewTypeDropdown}
        position={viewDropdownPosition}
        onClose={handleCloseViewDropdown}
        onSelectViewType={handleSelectViewType}
      />

      {/* Share Modal - Google Docs Style */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingRight: '30px' }}>
            <span style={{ fontSize: '18px', fontWeight: 500 }}>
              Chia sẻ "{shareTarget.name || getPageTitle()}"
            </span>
            <Tooltip title="Trợ giúp">
              <QuestionCircleOutlined style={{ color: '#8c8c8c', fontSize: '16px' }} />
            </Tooltip>
          </div>
        }
        open={showShareModal}
        onCancel={() => {
          setShowShareModal(false);
          setShareTarget({ type: '', name: '', id: '' });
        }}
        footer={null}
        width={600}
        style={{ top: 50 }}
        className="share-modal"
      >
        <div style={{ padding: '0' }}>
          {/* Add People Section */}
          <div style={{ marginBottom: '24px' }}>
            <Input
              placeholder="Thêm người, nhóm và sự kiện trên lịch"
              style={{
                height: '40px',
                fontSize: '14px',
                borderRadius: '6px'
              }}
            />
          </div>

          {/* People with Access Section */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              marginBottom: '12px'
            }}>
              <Text strong style={{ fontSize: '14px' }}>Những người có quyền truy cập</Text>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Tooltip title="Sao chép">
                  <Button type="text" icon={<CopyOutlined />} size="small" />
                </Tooltip>
                <Tooltip title="Gửi email">
                  <Button type="text" icon={<MailOutlined />} size="small" />
                </Tooltip>
              </div>
            </div>
            
            {/* User Entry */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px 12px',
              border: '1px solid #f0f0f0',
              borderRadius: '6px',
              backgroundColor: '#fafafa'
            }}>
              <Avatar 
                size={32} 
                icon={<UserOutlined />}
                style={{ backgroundColor: '#1890ff', marginRight: '12px' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: 500, color: '#262626' }}>
                  {currentUser?.email || 'trunglqhe170149@fpt.edu.vn'}
                </div>
                <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                  {currentUser?.email || 'trunglqhe170149@fpt.edu.vn'}
                </div>
              </div>
              <Text style={{ fontSize: '12px', color: '#8c8c8c' }}>Chủ sở hữu</Text>
            </div>
          </div>

          {/* General Access Section */}
          <div style={{ marginBottom: '24px' }}>
            <Text strong style={{ fontSize: '14px', marginBottom: '12px', display: 'block' }}>
              Quyền truy cập chung
            </Text>
            
          <div style={{
            padding: '12px',
            border: '1px solid #d9d9d9',
            borderRadius: '6px',
            backgroundColor: '#fff'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '16px',
              marginBottom: '12px'
            }}>
              <GlobalOutlined style={{ color: '#52c41a', fontSize: '16px', marginTop: '6px', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <Select
                  defaultValue="anyone"
                  style={{ width: '100%', marginBottom: '8px' }}
                  options={[
                    { value: 'anyone', label: 'Bất kỳ ai có đường liên kết' },
                    { value: 'specific', label: 'Những người cụ thể' }
                  ]}
                />
                <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                  Bất kỳ ai có kết nối Internet và có đường liên kết này đều có thể chỉnh sửa
                </div>
              </div>
            </div>
            
            {/* Permissions Section */}
            <div style={{ marginTop: '16px' }}>
              <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '12px', color: '#262626' }}>
                Quyền hạn chi tiết
              </div>
              <div style={{ 
                display: 'flex', 
                flexDirection: 'row', 
                flexWrap: 'wrap', 
                gap: '16px 24px',
                alignItems: 'flex-start'
              }}>
                <Checkbox defaultChecked>
                  Xem dữ liệu
                </Checkbox>
                <Checkbox defaultChecked>
                  Chỉnh sửa dữ liệu
                </Checkbox>
                <Checkbox>
                  Thêm bản ghi mới
                </Checkbox>
                <Checkbox>
                  Xóa bản ghi
                </Checkbox>
                <Checkbox>
                  Chỉnh sửa cấu trúc
                </Checkbox>
                <Checkbox>
                  Quản lý quyền
                </Checkbox>
                <Checkbox>
                  Xuất dữ liệu
                </Checkbox>
                <Checkbox>
                  Tạo view mới
                </Checkbox>
              </div>
            </div>
          </div>
          </div>

          {/* Action Buttons */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            paddingTop: '16px',
            borderTop: '1px solid #f0f0f0'
          }}>
            <Button
              icon={<CopyOutlined />}
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}${location.pathname}`);
                toast.success('Đường liên kết đã được sao chép!');
              }}
              style={{
                borderColor: '#1890ff',
                color: '#1890ff',
                backgroundColor: '#f6ffed'
              }}
            >
              Sao chép đường liên kết
            </Button>
            
            <Button
              type="primary"
              onClick={() => {
                toast.success('Cài đặt chia sẻ đã được lưu!');
                setShowShareModal(false);
                setShareTarget({ type: '', name: '', id: '' });
              }}
              style={{
                backgroundColor: '#1890ff',
                borderColor: '#1890ff'
              }}
            >
              Xong
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create Template Modal */}
      <Modal
        title="Tạo Template mới"
        open={showCreateTemplateModal}
        onCancel={() => setShowCreateTemplateModal(false)}
        footer={null}
        width={500}
      >
        <form onSubmit={handleCreateTemplate}>
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div>
              <Typography.Text strong>Template Name *</Typography.Text>
              <Input
                placeholder="Nhập tên template"
                value={newTemplate.name}
                onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                style={{ marginTop: 8 }}
              />
            </div>
            <div>
              <Typography.Text strong>Description</Typography.Text>
              <Input.TextArea
                placeholder="Nhập mô tả template"
                value={newTemplate.description}
                onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                style={{ marginTop: 8 }}
                rows={3}
              />
            </div>
            <Row justify="end">
              <Space>
                <Button onClick={() => setShowCreateTemplateModal(false)}>
                  Cancel
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={createTemplateMutation.isPending}
                >
                  Create Template
                </Button>
              </Space>
            </Row>
          </Space>
        </form>
      </Modal>

      {/* Context Menu */}
      {contextMenu.visible && (
        <div
          style={{
            position: 'fixed',
            left: contextMenu.x,
            top: contextMenu.y,
            zIndex: 9999,
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            border: '1px solid #e8e8e8',
            minWidth: '200px',
            padding: '4px 0'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Database Context Menu */}
          {contextMenu.type === 'database' && (
            <>
              <div
                className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center"
                onClick={() => {
                  setEditingDatabase({
                    _id: contextMenu.item._id,
                    name: contextMenu.item.name,
                    description: contextMenu.item.description || ''
                  });
                  setShowEditDatabaseModal(true);
                  setContextMenu({ visible: false, x: 0, y: 0, type: '', item: null, databaseId: '', tableId: '' });
                }}
              >
                <EditOutlined className="mr-2" />
                Sửa Database
              </div>
              <div
                className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center"
                onClick={() => {
                  setCopyingDatabase({
                    _id: contextMenu.item._id,
                    name: contextMenu.item.name + ' - Copy',
                    description: contextMenu.item.description || ''
                  });
                  setShowCopyDatabaseModal(true);
                  setContextMenu({ visible: false, x: 0, y: 0, type: '', item: null, databaseId: '', tableId: '' });
                }}
              >
                <CopyOutlined className="mr-2" />
                Sao chép Database
              </div>
              <div
                className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center"
                onClick={() => {
                  setShareTarget({ type: 'database', name: contextMenu.item.name, id: contextMenu.item._id });
                  setShowShareModal(true);
                  setContextMenu({ visible: false, x: 0, y: 0, type: '', item: null, databaseId: '', tableId: '' });
                }}
              >
                <ShareAltOutlined className="mr-2" />
                Chia sẻ
              </div>
              <div
                className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center"
                onClick={() => {
                  handleCreateViewClick({ type: 'database', id: contextMenu.item._id, databaseId: contextMenu.item._id });
                  setContextMenu({ visible: false, x: 0, y: 0, type: '', item: null, databaseId: '', tableId: '' });
                }}
              >
                <PlusOutlined className="mr-2" />
                Tạo View
              </div>
              <div className="border-t border-gray-200 my-1"></div>
              <div
                className="px-4 py-2 hover:bg-red-50 cursor-pointer flex items-center text-red-600"
                onClick={() => {
                  if (window.confirm(`Bạn có chắc chắn muốn xóa database "${contextMenu.item.name}"?`)) {
                    deleteDatabaseMutation.mutate(contextMenu.item._id);
                  }
                  setContextMenu({ visible: false, x: 0, y: 0, type: '', item: null, databaseId: '', tableId: '' });
                }}
              >
                <DeleteOutlined className="mr-2" />
                Xóa Database
              </div>
            </>
          )}

          {/* Table Context Menu */}
          {contextMenu.type === 'table' && (
            <>
              <div
                className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center"
                onClick={() => {
                  setEditingTable({
                    _id: contextMenu.item._id,
                    name: contextMenu.item.name,
                    description: contextMenu.item.description || '',
                    databaseId: contextMenu.databaseId
                  });
                  setShowEditTableModal(true);
                  setContextMenu({ visible: false, x: 0, y: 0, type: '', item: null, databaseId: '', tableId: '' });
                }}
              >
                <EditOutlined className="mr-2" />
                Sửa Table
              </div>
              <div
                className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center"
                onClick={() => {
                  setCopyingTable({
                    _id: contextMenu.item._id,
                    name: contextMenu.item.name + ' - Copy',
                    description: contextMenu.item.description || '',
                    targetDatabaseId: contextMenu.databaseId
                  });
                  setShowCopyTableModal(true);
                  setContextMenu({ visible: false, x: 0, y: 0, type: '', item: null, databaseId: '', tableId: '' });
                }}
              >
                <CopyOutlined className="mr-2" />
                Sao chép Table
              </div>
              <div
                className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center"
                onClick={() => {
                  setShareTarget({ type: 'table', name: contextMenu.item.name, id: contextMenu.item._id });
                  setShowShareModal(true);
                  setContextMenu({ visible: false, x: 0, y: 0, type: '', item: null, databaseId: '', tableId: '' });
                }}
              >
                <ShareAltOutlined className="mr-2" />
                Chia sẻ
              </div>
              <div
                className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center"
                onClick={() => {
                  handleCreateViewClick({ type: 'table', id: contextMenu.item._id, databaseId: contextMenu.databaseId });
                  setContextMenu({ visible: false, x: 0, y: 0, type: '', item: null, databaseId: '', tableId: '' });
                }}
              >
                <PlusOutlined className="mr-2" />
                Tạo View
              </div>
              <div className="border-t border-gray-200 my-1"></div>
              <div
                className="px-4 py-2 hover:bg-red-50 cursor-pointer flex items-center text-red-600"
                onClick={() => {
                  if (window.confirm(`Bạn có chắc chắn muốn xóa table "${contextMenu.item.name}"?`)) {
                    deleteTableMutation.mutate(contextMenu.item._id);
                  }
                  setContextMenu({ visible: false, x: 0, y: 0, type: '', item: null, databaseId: '', tableId: '' });
                }}
              >
                <DeleteOutlined className="mr-2" />
                Xóa Table
              </div>
            </>
          )}

          {/* View Context Menu */}
          {contextMenu.type === 'view' && (
            <>
              <div
                className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center"
                onClick={() => {
                  setEditingView({
                    _id: contextMenu.item._id,
                    name: contextMenu.item.name,
                    description: contextMenu.item.description || '',
                    type: contextMenu.item.type
                  });
                  setShowEditViewModal(true);
                  setContextMenu({ visible: false, x: 0, y: 0, type: '', item: null, databaseId: '', tableId: '' });
                }}
              >
                <EditOutlined className="mr-2" />
                Sửa View
              </div>
              <div
                className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center"
                onClick={() => {
                  setShareTarget({ type: 'view', name: contextMenu.item.name, id: contextMenu.item._id });
                  setShowShareModal(true);
                  setContextMenu({ visible: false, x: 0, y: 0, type: '', item: null, databaseId: '', tableId: '' });
                }}
              >
                <ShareAltOutlined className="mr-2" />
                Chia sẻ
              </div>
              <div className="border-t border-gray-200 my-1"></div>
              <div
                className="px-4 py-2 hover:bg-red-50 cursor-pointer flex items-center text-red-600"
                onClick={() => {
                  if (window.confirm(`Bạn có chắc chắn muốn xóa view "${contextMenu.item.name}"?`)) {
                    deleteViewMutation.mutate(contextMenu.item._id);
                  }
                  setContextMenu({ visible: false, x: 0, y: 0, type: '', item: null, databaseId: '', tableId: '' });
                }}
              >
                <DeleteOutlined className="mr-2" />
                Xóa View
              </div>
            </>
          )}

          {/* Template Context Menu */}
          {contextMenu.type === 'template' && isSuperAdmin && (
            <>
              <div
                className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center"
                onClick={() => {
                  navigate(`/templates/${contextMenu.item._id || contextMenu.item.id}`);
                  setContextMenu({ visible: false, x: 0, y: 0, type: '', item: null, databaseId: '', tableId: '' });
                }}
              >
                <EyeOutlined className="mr-2" />
                Xem Template
              </div>
              <div
                className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center"
                onClick={() => {
                  setEditingTemplate({
                    _id: contextMenu.item._id || contextMenu.item.id,
                    name: contextMenu.item.name,
                    description: contextMenu.item.description || ''
                  });
                  setShowEditTemplateModal(true);
                  setContextMenu({ visible: false, x: 0, y: 0, type: '', item: null, databaseId: '', tableId: '' });
                }}
              >
                <EditOutlined className="mr-2" />
                Sửa Template
              </div>
              <div
                className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center"
                onClick={() => {
                  setShareTarget({ type: 'template', name: contextMenu.item.name, id: contextMenu.item._id || contextMenu.item.id });
                  setShowShareModal(true);
                  setContextMenu({ visible: false, x: 0, y: 0, type: '', item: null, databaseId: '', tableId: '' });
                }}
              >
                <ShareAltOutlined className="mr-2" />
                Chia sẻ
              </div>
              <div className="border-t border-gray-200 my-1"></div>
              <div
                className="px-4 py-2 hover:bg-red-50 cursor-pointer flex items-center text-red-600"
                onClick={() => {
                  if (window.confirm(`Bạn có chắc chắn muốn xóa template "${contextMenu.item.name}"?`)) {
                    deleteTemplateMutation.mutate(contextMenu.item._id || contextMenu.item.id);
                  }
                  setContextMenu({ visible: false, x: 0, y: 0, type: '', item: null, databaseId: '', tableId: '' });
                }}
              >
                <DeleteOutlined className="mr-2" />
                Xóa Template
              </div>
            </>
          )}

          {/* Template Context Menu for Regular Users */}
          {contextMenu.type === 'template' && !isSuperAdmin && (
            <>
              <div
                className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center"
                onClick={() => {
                  navigate(`/templates/${contextMenu.item._id || contextMenu.item.id}`);
                  setContextMenu({ visible: false, x: 0, y: 0, type: '', item: null, databaseId: '', tableId: '' });
                }}
              >
                <EyeOutlined className="mr-2" />
                Xem Template
              </div>
              <div
                className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center"
                onClick={() => {
                  // Open modal to create database from template
                  toast.info('Use template feature - navigate to template detail page');
                  navigate(`/templates/${contextMenu.item._id || contextMenu.item.id}`);
                  setContextMenu({ visible: false, x: 0, y: 0, type: '', item: null, databaseId: '', tableId: '' });
                }}
              >
                <CopyOutlined className="mr-2" />
                Sử dụng Template
              </div>
            </>
          )}

          {/* Template Table Context Menu for Super Admin */}
          {contextMenu.type === 'template-table' && isSuperAdmin && (
            <>
              <div
                className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center"
                onClick={() => {
                  navigate(`/templates/${contextMenu.databaseId}/table/${contextMenu.tableId}`);
                  setContextMenu({ visible: false, x: 0, y: 0, type: '', item: null, databaseId: '', tableId: '' });
                }}
              >
                <EyeOutlined className="mr-2" />
                Xem Table
              </div>
              <div
                className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center"
                onClick={async () => {
                  // Find table index in template's tables array
                  const templateResponse = await axiosInstance.get(`/templates/${contextMenu.databaseId}`);
                  const template = templateResponse.data.data;
                  const tableIndex = template.tables?.findIndex(t => 
                    (t._id || t.id) === (contextMenu.item._id || contextMenu.item.id) ||
                    t.name === contextMenu.item.name
                  );
                  
                  if (tableIndex !== -1) {
                    setEditingTemplateTable({
                      templateId: contextMenu.databaseId,
                      tableIndex: tableIndex,
                      name: contextMenu.item.name,
                      description: contextMenu.item.description || ''
                    });
                    setShowEditTemplateTableModal(true);
                  }
                  setContextMenu({ visible: false, x: 0, y: 0, type: '', item: null, databaseId: '', tableId: '' });
                }}
              >
                <EditOutlined className="mr-2" />
                Sửa Table
              </div>
              <div className="border-t border-gray-200 my-1"></div>
              <div
                className="px-4 py-2 hover:bg-red-50 cursor-pointer flex items-center text-red-600"
                onClick={async () => {
                  if (window.confirm(`Bạn có chắc chắn muốn xóa table "${contextMenu.item.name}"?`)) {
                    // Fetch current template
                    const templateResponse = await axiosInstance.get(`/templates/${contextMenu.databaseId}`);
                    const template = templateResponse.data.data;
                    
                    // Find and remove the table
                    const updatedTables = (template.tables || []).filter(t => 
                      (t._id || t.id) !== (contextMenu.item._id || contextMenu.item.id) &&
                      t.name !== contextMenu.item.name
                    );
                    
                    // Update template
                    updateTemplateStructureMutation.mutate({
                      templateId: contextMenu.databaseId,
                      tables: updatedTables
                    });
                  }
                  setContextMenu({ visible: false, x: 0, y: 0, type: '', item: null, databaseId: '', tableId: '' });
                }}
              >
                <DeleteOutlined className="mr-2" />
                Xóa Table
              </div>
            </>
          )}

          {/* Template Table Context Menu for All Users */}
          {contextMenu.type === 'template-table' && !isSuperAdmin && (
            <>
              <div
                className="px-4 py-2 hover:bg-gray-50 cursor-pointer flex items-center"
                onClick={() => {
                  navigate(`/templates/${contextMenu.databaseId}/table/${contextMenu.tableId}`);
                  setContextMenu({ visible: false, x: 0, y: 0, type: '', item: null, databaseId: '', tableId: '' });
                }}
              >
                <EyeOutlined className="mr-2" />
                Xem Table
              </div>
            </>
          )}
        </div>
      )}

      {/* Edit Template Modal */}
      <Modal
        title="Sửa Template"
        open={showEditTemplateModal}
        onCancel={() => setShowEditTemplateModal(false)}
        footer={null}
        width={500}
      >
        <form onSubmit={handleEditTemplate}>
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div>
              <Typography.Text strong>Tên Template *</Typography.Text>
              <Input
                value={editingTemplate.name}
                onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                placeholder="Ví dụ: CRM System"
                required
                size="large"
              />
            </div>
            <div>
              <Typography.Text strong>Mô tả (tùy chọn)</Typography.Text>
              <Input.TextArea
                value={editingTemplate.description}
                onChange={(e) => setEditingTemplate({ ...editingTemplate, description: e.target.value })}
                placeholder="Mô tả về template này..."
                rows={3}
              />
            </div>
            <Row justify="end">
              <Space>
                <Button onClick={() => setShowEditTemplateModal(false)}>
                  Hủy
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={editTemplateMutation.isPending}
                >
                  Cập nhật Template
                </Button>
              </Space>
            </Row>
          </Space>
        </form>
      </Modal>

      {/* Create Template Table Modal */}
      <Modal
        title="Tạo Table cho Template"
        open={showCreateTemplateTableModal}
        onCancel={() => {
          setShowCreateTemplateTableModal(false);
          setNewTemplateTable({ name: '', description: '' });
          setCurrentTemplateId(null);
        }}
        footer={null}
        width={500}
      >
        <form onSubmit={handleCreateTemplateTable}>
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div>
              <Typography.Text strong>Tên Table *</Typography.Text>
              <Input
                value={newTemplateTable.name}
                onChange={(e) => setNewTemplateTable({ ...newTemplateTable, name: e.target.value })}
                placeholder="Ví dụ: Customers"
                required
                size="large"
              />
            </div>
            <div>
              <Typography.Text strong>Mô tả (tùy chọn)</Typography.Text>
              <Input.TextArea
                value={newTemplateTable.description}
                onChange={(e) => setNewTemplateTable({ ...newTemplateTable, description: e.target.value })}
                placeholder="Mô tả về table này..."
                rows={3}
              />
            </div>
            <Row justify="end">
              <Space>
                <Button onClick={() => {
                  setShowCreateTemplateTableModal(false);
                  setNewTemplateTable({ name: '', description: '' });
                  setCurrentTemplateId(null);
                }}>
                  Hủy
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={updateTemplateStructureMutation.isPending}
                >
                  Tạo Table
                </Button>
              </Space>
            </Row>
          </Space>
        </form>
      </Modal>

      {/* Edit Template Table Modal */}
      <Modal
        title="Sửa Template Table"
        open={showEditTemplateTableModal}
        onCancel={() => setShowEditTemplateTableModal(false)}
        footer={null}
        width={500}
      >
        <form onSubmit={handleEditTemplateTable}>
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div>
              <Typography.Text strong>Tên Table *</Typography.Text>
              <Input
                value={editingTemplateTable.name}
                onChange={(e) => setEditingTemplateTable({ ...editingTemplateTable, name: e.target.value })}
                placeholder="Ví dụ: Customers"
                required
                size="large"
              />
            </div>
            <div>
              <Typography.Text strong>Mô tả (tùy chọn)</Typography.Text>
              <Input.TextArea
                value={editingTemplateTable.description}
                onChange={(e) => setEditingTemplateTable({ ...editingTemplateTable, description: e.target.value })}
                placeholder="Mô tả về table này..."
                rows={3}
              />
            </div>
            <Row justify="end">
              <Space>
                <Button onClick={() => setShowEditTemplateTableModal(false)}>
                  Hủy
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={updateTemplateStructureMutation.isPending}
                >
                  Cập nhật Table
                </Button>
              </Space>
            </Row>
          </Space>
        </form>
      </Modal>

      {/* Permission Modal */}
      {showPermissionModal && selectedTableForPermission && (
        <PermissionModal
          visible={showPermissionModal}
          onCancel={() => {
            setShowPermissionModal(false);
            setSelectedTableForPermission(null);
          }}
          tableId={selectedTableForPermission.tableId}
          databaseId={selectedTableForPermission.databaseId}
        />
      )}
      </Layout>
    </TableProvider>
  );
};

export default DatabaseLayout;
