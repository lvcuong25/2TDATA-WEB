import { useState, useContext } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Divider, Layout, Menu } from 'antd';
import { AuthContext } from '../core/Auth';
import {
  DashboardOutlined,
  ShoppingOutlined,
  UserOutlined,
  ShoppingCartOutlined,
  HeartOutlined,
  CommentOutlined,
  FileTextOutlined,
  FlagOutlined,
  LaptopOutlined,
  UnorderedListOutlined,
  FormOutlined,
  LinkOutlined,
  GlobalOutlined,
} from '@ant-design/icons';

const { Header, Sider, Content } = Layout;

const DashBoard = () => {
  const location = useLocation();
  const { currentUser } = useContext(AuthContext);
  const [collapsed, setCollapsed] = useState(false);
  const [activeLink, setActiveLink] = useState(location.pathname);

  const handleLinkClick = (link) => {
    setActiveLink(link);
  };

  // Build menu items based on user role
  const getMenuItems = () => {
    const baseItems = [
      {
        type: 'divider',
      },
      {
        key: '/admin',
        icon: <UserOutlined />,
        label: <Link to="/admin">Quản lý người dùng</Link>,
        onClick: () => handleLinkClick('/admin')
      },
    ];

    // Only super_admin can see service management
    if (currentUser?.role === 'super_admin' || currentUser?.role === 'superadmin') {
      baseItems.push({
        key: '/admin/services',
        icon: <ShoppingOutlined />,
        label: <Link to="/admin/services">Quản lý dịch vụ</Link>,
        onClick: () => handleLinkClick('/admin/services')
      });
    }

    // Common items for all admin types
    baseItems.push(
      {
        key: '/admin/blogs',
        icon: <FileTextOutlined />,
        label: <Link to="/admin/blogs">Quản lý blogs</Link>,
        onClick: () => handleLinkClick('/admin/blogs')
      },
      {
        key: 'status-submenu',
        icon: <FileTextOutlined />,
        label: 'Quản lý trạng thái',
        children: [
          {
            key: '/admin/status',
            label: <Link to="/admin/status">Trạng thái cá nhân</Link>,
            onClick: () => handleLinkClick('/admin/status')
          },
          {
            key: '/admin/status/org-status',
            label: <Link to="/admin/status/org-status">Trạng thái tổ chức</Link>,
            onClick: () => handleLinkClick('/admin/status/org-status')
          }
        ]
      },
      {
        key: '/admin/user-info',
        icon: <FormOutlined />,
        label: <Link to="/admin/user-info">Quản lý đăng ký</Link>,
        onClick: () => handleLinkClick('/admin/user-info')
      },
      {
        key: '/admin/iframe',
        icon: <LinkOutlined />,
        label: <Link to="/admin/iframe">Quản lý iframe</Link>,
        onClick: () => handleLinkClick('/admin/iframe')
      },
      {
        key: '/admin/organization',
        icon: <LaptopOutlined />,
        label: <Link to="/admin/organization">Quản lý tổ chức</Link>,
        onClick: () => handleLinkClick('/admin/organization')
      }
    );

    // Only super_admin can see site management
    if (currentUser?.role === 'super_admin' || currentUser?.role === 'superadmin') {
      baseItems.push({
        key: '/admin/sites',
        icon: <GlobalOutlined />,
        label: <Link to="/admin/sites">Quản lý trang web</Link>,
        onClick: () => handleLinkClick('/admin/sites')
      });
    }

    // Website link for all
    baseItems.push({
      key: '/',
      icon: <HeartOutlined />,
      label: <Link to="/">Website</Link>,
      onClick: () => handleLinkClick('/')
    });

    return baseItems;
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        width={250}
        collapsed={collapsed}
        onCollapse={setCollapsed}
        style={{ position: 'fixed', height: '100vh' }} // Fixed Sider
      >
      
<Menu 
  theme="dark" 
  defaultSelectedKeys={[activeLink]} 
  mode="inline"
  items={getMenuItems()}
/>
      </Sider>
      <Layout className="site-layout" style={{ marginLeft: collapsed ? 80 : 250 }}> 
        <Header className="site-layout-background" style={{ padding: 0, background: '#fff' }}>
          <h1 className="text-[22px] font-bold text-qblack italic" style={{ marginLeft: '16px' }}>
            DashBoard
          </h1>
        </Header>
        <Content style={{ margin: '16px' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default DashBoard;