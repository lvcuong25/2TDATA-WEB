import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Divider, Layout, Menu } from 'antd';
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
  const [collapsed, setCollapsed] = useState(false);
  const [activeLink, setActiveLink] = useState(location.pathname);

  const handleLinkClick = (link) => {
    setActiveLink(link);
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
          items={[
            {
              type: 'divider',
            },
            {
              key: '/admin',
              icon: <UserOutlined />,
              label: <Link to="/admin">Quản lý người dùng</Link>,
              onClick: () => handleLinkClick('/admin')
            },
            {
              key: '/admin/services',
              icon: <ShoppingOutlined />,
              label: <Link to="/admin/services">Quản lý dịch vụ</Link>,
              onClick: () => handleLinkClick('/admin/services')
            },
            {
              key: '/admin/blogs',
              icon: <FileTextOutlined />,
              label: <Link to="/admin/blogs">Quản lý blogs</Link>,
              onClick: () => handleLinkClick('/admin/blogs')
            },
            {
              key: '/admin/status',
              icon: <FileTextOutlined />,
              label: <Link to="/admin/status">Quản lý trạng thái</Link>,
              onClick: () => handleLinkClick('/admin/status')
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
              key: '/admin/sites',
              icon: <GlobalOutlined />,
              label: <Link to="/admin/sites">Quản lý trang web</Link>,
              onClick: () => handleLinkClick('/admin/sites')
            },
            {
              key: '/',
              icon: <HeartOutlined />,
              label: <Link to="/">Website</Link>,
              onClick: () => handleLinkClick('/')
            }
          ]}
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