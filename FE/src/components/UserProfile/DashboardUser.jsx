import { useState, useContext } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Divider, Layout, Menu, Avatar, Typography } from 'antd';
import {
  UserOutlined,
  LockOutlined,
  ShoppingCartOutlined,
  FileTextOutlined,
  HomeOutlined,
  LogoutOutlined,
  SettingOutlined,
  TeamOutlined,
  AppstoreOutlined,
  UsergroupAddOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AuthContext } from '../core/Auth';
import { useQuery } from '@tanstack/react-query';
import instance from '../../utils/axiosInstance';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

const DashboardUser = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const { currentUser, removeCurrentUser } = useContext(AuthContext);

  // Kiểm tra user đã có tổ chức chưa
  const { data: orgData } = useQuery({
    queryKey: ['organization', currentUser?._id],
    queryFn: async () => {
      if (!currentUser?._id || currentUser.role === 'admin') return null;
      try {
        const res = await instance.get(`organization/user/${currentUser._id}`);
        return res;
      } catch {
        return null;
      }
    },
    enabled: !!currentUser?._id,
    retry: false,
  });
  const hasOrganization = !!orgData || currentUser?.role === 'admin';

  const handleLogout = () => {
    try {
      removeCurrentUser();
      toast.success('Đăng xuất thành công!');
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Có lỗi xảy ra khi đăng xuất!');
    }
  };

  const menuItems = [
    {
      key: '/profile',
      icon: <UserOutlined />,
      label: <Link to="/profile">Thông tin cá nhân</Link>,
    },
    {
      key: '/profile/change-password',
      icon: <LockOutlined />,
      label: <Link to="/profile/change-password">Đổi mật khẩu</Link>,
    },
    {
      key: '/service/my-service',
      icon: <ShoppingCartOutlined />,
      label: <Link to="/service/my-service">Dịch vụ của tôi</Link>,
    },
    {
      key: '/blogs',
      icon: <FileTextOutlined />,
      label: <Link to="/blogs">Bài viết</Link>,
    },
    {
      key: '/',
      icon: <HomeOutlined />,
      label: <Link to="/">Về trang chủ</Link>,
    },
  ];

  // Add admin menu if user is admin, super_admin, or site_admin
  if (currentUser?.role === 'admin' || currentUser?.role === 'super_admin' || currentUser?.role === 'site_admin') {
    menuItems.splice(4, 0, {
      key: '/admin',
      icon: <SettingOutlined />,
      label: <Link to="/admin">Quản trị</Link>,
    });
  }

  // Add organization menu if user has organization
  if (hasOrganization) {
    // Find index of 'Đổi mật khẩu'
    const changePasswordIdx = menuItems.findIndex(item => item.key === '/profile/change-password');
    // Insert organization group before 'Đổi mật khẩu'
    menuItems.splice(changePasswordIdx, 0, {
      key: 'organization-group',
      icon: <TeamOutlined />,
      label: 'Tổ chức',
      children: [
        {
          key: '/profile/organization',
          icon: <UsergroupAddOutlined />,
          label: <Link to="/profile/organization">Quản lý thành viên</Link>,
        },
        {
          key: '/profile/organization/services',
          icon: <AppstoreOutlined />,
          label: <Link to="/profile/organization/services">Quản lý dịch vụ</Link>,
        },
      ],
    });
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        width={250}
        collapsed={collapsed}
        onCollapse={setCollapsed}
        style={{ 
          position: 'fixed', 
          height: '100vh',
          zIndex: 1000,
        }}
        theme="light"
      >
        <div className="p-4">
          <div className="flex items-center mb-4">
            <Avatar 
              size={collapsed ? 32 : 48} 
              icon={<UserOutlined />} 
              className="bg-blue-600 text-white font-bold"
            >
              {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
            </Avatar>
            {!collapsed && (
              <div className="ml-3">
                <Title level={5} className="mb-0 text-gray-900">
                  {currentUser?.name || 'User'}
                </Title>
                <Text className="text-xs text-gray-500">
                  {(currentUser?.role === 'admin' || currentUser?.role === 'super_admin' || currentUser?.role === 'site_admin') ? 
                    (currentUser?.role === 'super_admin' ? 'Quản trị tối cao' : 
                     currentUser?.role === 'site_admin' ? 'Quản trị site' : 'Quản trị viên') : 'Người dùng'}
                </Text>
              </div>
            )}
          </div>
        </div>

        <Divider className="my-0" />

        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          className="border-r-0"
        />

        <div className="absolute bottom-0 w-full p-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
          >
            <LogoutOutlined className="mr-2" />
            {!collapsed && 'Đăng xuất'}
          </button>
        </div>
      </Sider>

      <Layout style={{ marginLeft: collapsed ? 80 : 250 }}>
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
            <Title level={4} className="mb-0 text-gray-900">
              {location.pathname === '/profile' && 'Thông tin cá nhân'}
              {location.pathname === '/profile/change-password' && 'Đổi mật khẩu'}
              {location.pathname === '/service/my-service' && 'Dịch vụ của tôi'}
              {location.pathname === '/blogs' && 'Bài viết'}
              {location.pathname === '/admin' && 'Quản trị'}
              {location.pathname === '/profile/organization' && 'Quản lý thành viên'}
              {location.pathname === '/profile/organization/services' && 'Quản lý dịch vụ'}
            </Title>
          </div>
        </Header>

        <Content style={{ margin: '24px', minHeight: 280 }}>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default DashboardUser;