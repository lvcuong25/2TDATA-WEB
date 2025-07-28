import React, { useState, useEffect } from 'react';
import { Card, Descriptions, Button, Tag, Space, Typography, Row, Col, Avatar, Spin, Modal, Statistic } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftOutlined, EditOutlined, DeleteOutlined, UserOutlined, GlobalOutlined, SettingOutlined } from '@ant-design/icons';
import axiosInstance from '../../../axios/axiosInstance';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const { Title, Text, Paragraph } = Typography;
const { confirm } = Modal;

const SiteDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [site, setSite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});

  useEffect(() => {
    fetchSiteDetail();
    fetchSiteStats();
  }, [id]);

  const fetchSiteDetail = async () => {
    try {
      const response = await axiosInstance.get(`/sites/${id}`);
      setSite(response.data.data || response.data);
      toast.success('Tải chi tiết trang web thành công!');
    } catch (error) {
      toast.error('Không thể tải thông tin trang web');
      console.error('Error fetching site:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSiteStats = async () => {
    try {
      const response = await axiosInstance.get(`/sites/${id}/stats`);
      setStats(response.data.data || response.data);
      toast.success('Tải thống kê trang web thành công!');
    } catch (error) {
      toast.error('Không thể tải thống kê trang web');
      console.error('Error fetching site stats:', error);
    }
  };

  const handleEdit = () => {
    navigate(`/admin/sites/edit/${id}`);
  };

  const handleDelete = () => {
    confirm({
      title: 'Xác nhận xóa trang web',
      content: `Bạn có chắc chắn muốn xóa trang web "${site?.name}"? Hành động này không thể hoàn tác.`,
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await axiosInstance.delete(`/sites/${id}`);
          toast.success('Xóa trang web thành công');
          navigate('/admin/sites');
        } catch (error) {
          const errorMsg = error.response?.data?.message || 'Có lỗi xảy ra khi xóa trang web';
          toast.error(errorMsg);
        }
      },
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      active: 'green',
      inactive: 'red',
      maintenance: 'orange'
    };
    return colors[status] || 'default';
  };

  const getStatusText = (status) => {
    const texts = {
      active: 'Hoạt động',
      inactive: 'Không hoạt động',
      maintenance: 'Bảo trì'
    };
    return texts[status] || status;
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!site) {
    return (
      <Card>
        <Text>Không tìm thấy thông tin trang web</Text>
      </Card>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/admin/sites')}
          style={{ marginRight: 16 }}
        >
          Quay lại
        </Button>
        <Title level={3} style={{ display: 'inline', margin: 0 }}>
          Chi tiết trang web: {site.name}
        </Title>
        <div style={{ float: 'right' }}>
          <Space>
            <Button 
              type="primary" 
              icon={<EditOutlined />} 
              onClick={handleEdit}
            >
              Chỉnh sửa
            </Button>
            <Button 
              icon={<UserOutlined />} 
              onClick={() => navigate(`/admin/sites/${id}/admins`)}
            >
              Quản lý Admin
            </Button>
            <Button 
              danger 
              icon={<DeleteOutlined />} 
              onClick={handleDelete}
            >
              Xóa
            </Button>
          </Space>
        </div>
      </div>

      <Row gutter={24}>
        <Col span={16}>
          <Card title="Thông tin cơ bản" style={{ marginBottom: 16 }}>
            <Descriptions column={1} bordered>
              <Descriptions.Item label="Tên trang web">
                {site.name}
              </Descriptions.Item>
              <Descriptions.Item label="Mô tả">
                {site.description || 'Chưa có mô tả'}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color={getStatusColor(site.status)}>
                  {getStatusText(site.status)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Ngày tạo">
                {new Date(site.createdAt || site.created_at).toLocaleString('vi-VN')}
              </Descriptions.Item>
              <Descriptions.Item label="Cập nhật lần cuối">
                {new Date(site.updatedAt || site.updated_at).toLocaleString('vi-VN')}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="Tên miền" style={{ marginBottom: 16 }}>
            {site.domains && site.domains.length > 0 ? (
              <div>
                {site.domains.map((domain, index) => (
                  <div key={index} style={{ marginBottom: 8 }}>
                    <GlobalOutlined style={{ marginRight: 8 }} />
                    <Text code>{domain}</Text>
                    {index === 0 && <Tag color="blue" style={{ marginLeft: 8 }}>Chính</Tag>}
                  </div>
                ))}
              </div>
            ) : (
              <Text type="secondary">Chưa có tên miền nào được cấu hình</Text>
            )}
          </Card>

          <Card title="Quản trị viên" style={{ marginBottom: 16 }}>
            {site.site_admins && site.site_admins.length > 0 ? (
              <div>
                {site.site_admins.map((admin, index) => (
                  <div key={index} style={{ marginBottom: 8, display: 'flex', alignItems: 'center' }}>
                    <Avatar size="small" icon={<UserOutlined />} style={{ marginRight: 8 }} />
                    <Text>{admin.user_id?.name || admin.user_id?.email || admin.user_id}</Text>
                    <Tag color="blue" style={{ marginLeft: 8 }}>{admin.role}</Tag>
                  </div>
                ))}
              </div>
            ) : (
              <Text type="secondary">Chưa có quản trị viên nào</Text>
            )}
          </Card>
        </Col>

        <Col span={8}>
          <Card title="Thống kê" style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={12}>
                <Statistic 
                  title="Người dùng" 
                  value={stats.totalUsers || stats.users || 0} 
                  prefix={<UserOutlined />}
                />
              </Col>
              <Col span={12}>
                <Statistic 
                  title="Tên miền" 
                  value={site.domains ? site.domains.length : 0}
                  prefix={<GlobalOutlined />}
                />
              </Col>
            </Row>
          </Card>

          {site.logo_url && (
            <Card title="Logo" style={{ marginBottom: 16 }}>
              <div style={{ textAlign: 'center' }}>
                <img 
                  src={site.logo_url} 
                  alt="Site Logo" 
                  style={{ maxWidth: '100%', maxHeight: '200px' }}
                />
              </div>
            </Card>
          )}

          <Card title="Cấu hình giao diện" style={{ marginBottom: 16 }}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Màu chính">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div 
                    style={{ 
                      width: 20, 
                      height: 20, 
                      backgroundColor: site.theme_config?.primary_color || '#1890ff',
                      border: '1px solid #d9d9d9',
                      marginRight: 8
                    }}
                  />
                  <Text code>{site.theme_config?.primary_color || '#1890ff'}</Text>
                </div>
              </Descriptions.Item>
              <Descriptions.Item label="Màu phụ">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div 
                    style={{ 
                      width: 20, 
                      height: 20, 
                      backgroundColor: site.theme_config?.secondary_color || '#f0f0f0',
                      border: '1px solid #d9d9d9',
                      marginRight: 8
                    }}
                  />
                  <Text code>{site.theme_config?.secondary_color || '#f0f0f0'}</Text>
                </div>
              </Descriptions.Item>
              <Descriptions.Item label="Vị trí logo">
                {site.theme_config?.logo_position || 'left'}
              </Descriptions.Item>
            </Descriptions>
            
            {site.theme_config?.custom_css && (
              <div style={{ marginTop: 16 }}>
                <Text strong>CSS tùy chỉnh:</Text>
                <div style={{ 
                  marginTop: 8, 
                  padding: 12, 
                  backgroundColor: '#f5f5f5', 
                  border: '1px solid #d9d9d9',
                  borderRadius: 4,
                  fontFamily: 'monospace',
                  fontSize: 12,
                  maxHeight: 200,
                  overflow: 'auto'
                }}>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                    {site.theme_config.custom_css}
                  </pre>
                </div>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default SiteDetail;
