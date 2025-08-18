import { useEffect, useState } from 'react';
import { 
  decodeStateFromUrl, 
  getUserInfoFromState, 
  getServiceInfoFromState, 
  hasStateInUrl,
  removeStateFromUrl 
} from '../utils/serviceStateHelper';
import { Card, Descriptions, Tag, Button, Space, Divider, Alert } from 'antd';
import { UserOutlined, AppstoreOutlined, LinkOutlined, CalendarOutlined } from '@ant-design/icons';

const ServiceRedirectHandler = () => {
  const [stateData, setStateData] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [serviceInfo, setServiceInfo] = useState(null);

  useEffect(() => {
    // Kiểm tra xem có state trong URL không
    if (hasStateInUrl()) {
      const decodedState = decodeStateFromUrl();
      if (decodedState) {
        setStateData(decodedState);
        
        // Tách thông tin user và service
        const user = getUserInfoFromState(decodedState);
        const service = getServiceInfoFromState(decodedState);
        
        setUserInfo(user);
        setServiceInfo(service);
        
        console.log('Received user info:', user);
        console.log('Received service info:', service);
        
        // Xóa state khỏi URL sau khi đã xử lý
        removeStateFromUrl();
      }
    }
  }, []);

  if (!stateData) {
    return (
      <div className="container mx-auto pt-[100px] py-12">
        <div className="max-w-4xl mx-auto">
          <Alert
            message="Không có dữ liệu redirect"
            description="Trang này được thiết kế để xử lý redirect từ các dịch vụ khác. Hiện tại không có thông tin redirect nào."
            type="info"
            showIcon
          />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto pt-[100px] py-12">
      <div className="max-w-4xl mx-auto">
        <Alert
          message="Đã nhận thông tin từ dịch vụ"
          description="Thông tin người dùng và dịch vụ đã được truyền thành công từ site khác."
          type="success"
          showIcon
          className="mb-6"
        />

        {/* Thông tin người dùng */}
        <Card 
          title={
            <Space>
              <UserOutlined />
              Thông tin người dùng
            </Space>
          }
          className="mb-6"
        >
          <Descriptions bordered column={2}>
            <Descriptions.Item label="User ID" span={2}>
              <code>{userInfo?.userId}</code>
            </Descriptions.Item>
            <Descriptions.Item label="Tên người dùng">
              {userInfo?.name}
            </Descriptions.Item>
            <Descriptions.Item label="Service ID">
              <code>{userInfo?.serviceId}</code>
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* Thông tin dịch vụ */}
        <Card 
          title={
            <Space>
              <AppstoreOutlined />
              Thông tin dịch vụ
            </Space>
          }
          className="mb-6"
        >
          <Descriptions bordered column={2}>
            <Descriptions.Item label="Tên dịch vụ" span={2}>
              <strong>{serviceInfo?.serviceName}</strong>
            </Descriptions.Item>
            <Descriptions.Item label="Slug">
              {serviceInfo?.serviceSlug}
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Tag color={serviceInfo?.userServiceStatus === 'approved' ? 'green' : 'orange'}>
                {serviceInfo?.userServiceStatus === 'approved' ? 'Đã xác nhận' : serviceInfo?.userServiceStatus}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Mô tả" span={2}>
              {serviceInfo?.serviceDescription || 'Không có mô tả'}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày tạo">
              {serviceInfo?.userServiceCreatedAt ? 
                new Date(serviceInfo.userServiceCreatedAt).toLocaleDateString('vi-VN') : 
                'N/A'
              }
            </Descriptions.Item>
            <Descriptions.Item label="Ngày cập nhật">
              {serviceInfo?.userServiceUpdatedAt ? 
                new Date(serviceInfo.userServiceUpdatedAt).toLocaleDateString('vi-VN') : 
                'N/A'
              }
            </Descriptions.Item>
          </Descriptions>

          {/* Hình ảnh dịch vụ */}
          {serviceInfo?.serviceImage && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">Hình ảnh dịch vụ:</p>
              <img 
                src={serviceInfo.serviceImage} 
                alt={serviceInfo.serviceName}
                className="w-32 h-32 object-cover rounded-lg border"
                onError={(e) => {
                  e.target.src = "https://t4.ftcdn.net/jpg/04/73/25/49/360_F_473254957_bxG9yf4ly7OBO5I0O5KABlN930GwaMQz.jpg";
                }}
              />
            </div>
          )}
        </Card>

        {/* Links kết quả */}
        {serviceInfo?.resultLinks && serviceInfo.resultLinks.length > 0 && (
          <Card 
            title={
              <Space>
                <LinkOutlined />
                Links kết quả ({serviceInfo.resultLinks.length})
              </Space>
            }
            className="mb-6"
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              {serviceInfo.resultLinks.map((link, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium">{link.title}</div>
                    <div className="text-sm text-gray-600">{link.description}</div>
                  </div>
                  <Button 
                    type="primary" 
                    href={link.url} 
                    target="_blank"
                    icon={<LinkOutlined />}
                  >
                    Mở link
                  </Button>
                </div>
              ))}
            </Space>
          </Card>
        )}

        {/* Links cập nhật */}
        {serviceInfo?.updateLinks && serviceInfo.updateLinks.length > 0 && (
          <Card 
            title={
              <Space>
                <LinkOutlined />
                Links cập nhật ({serviceInfo.updateLinks.length})
              </Space>
            }
            className="mb-6"
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              {serviceInfo.updateLinks.map((link, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium">{link.title || `Link ${index + 1}`}</div>
                    <div className="text-sm text-gray-600">{link.description || 'Không có mô tả'}</div>
                  </div>
                  <Button 
                    type="default" 
                    href={link.url} 
                    target="_blank"
                    icon={<LinkOutlined />}
                  >
                    Mở link
                  </Button>
                </div>
              ))}
            </Space>
          </Card>
        )}

        {/* Authorized Links */}
        {serviceInfo?.authorizedLinks && serviceInfo.authorizedLinks.length > 0 && (
          <Card 
            title={
              <Space>
                <LinkOutlined />
                Authorized Links ({serviceInfo.authorizedLinks.length})
              </Space>
            }
            className="mb-6"
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              {serviceInfo.authorizedLinks.map((link, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium">{link.title || `Authorized Link ${index + 1}`}</div>
                    <div className="text-sm text-gray-600">{link.description || 'Không có mô tả'}</div>
                  </div>
                  <Button 
                    type="primary" 
                    href={link.url} 
                    target="_blank"
                    icon={<LinkOutlined />}
                  >
                    Kết nối
                  </Button>
                </div>
              ))}
            </Space>
          </Card>
        )}

        {/* Return URL */}
        {stateData.returnUrl && (
          <Card 
            title={
              <Space>
                <CalendarOutlined />
                URL quay về
              </Space>
            }
          >
            <p className="text-sm text-gray-600 mb-2">URL để quay về trang gốc:</p>
            <code className="block p-2 bg-gray-100 rounded text-sm break-all">
              {stateData.returnUrl}
            </code>
            <Button 
              type="primary" 
              href={stateData.returnUrl}
              className="mt-2"
            >
              Quay về trang gốc
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ServiceRedirectHandler;
