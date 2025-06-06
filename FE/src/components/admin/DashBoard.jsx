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
      
        <Menu theme="dark" defaultSelectedKeys={[activeLink]} mode="inline">
        <Divider />

        
        <Menu.Item key="/admin" icon={<UserOutlined />} onClick={() => handleLinkClick('/admin')}>
            <Link to="/admin">Quản lý người dùng</Link>
          </Menu.Item>
    
        <Menu.Item key="/admin/services" icon={<ShoppingOutlined />} onClick={() => handleLinkClick('/admin/services')}>
            <Link to="/admin/services">Quản lý dịch vụ</Link>
          </Menu.Item>
       
        <Menu.Item key="/admin/blogs" icon={<FileTextOutlined />} onClick={() => handleLinkClick('/admin/blogs')}>
            <Link to="/admin/blogs">Quản lý blogs</Link>
          </Menu.Item>

          <Menu.Item key="/admin/status" icon={<FileTextOutlined />} onClick={() => handleLinkClick('/admin/status')}>
            <Link to="/admin/status">Quản lý trạng thái</Link>
          </Menu.Item>

          <Menu.Item key="/admin/user-info" icon={<FormOutlined />} onClick={() => handleLinkClick('/admin/user-info')}>
            <Link to="/admin/user-info">Quản lý đăng ký</Link>
          </Menu.Item>
       
          <Menu.Item key="/" icon={<HeartOutlined />} onClick={() => handleLinkClick('/')}>
            <Link to="/">Website</Link>
          </Menu.Item>
        </Menu>
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