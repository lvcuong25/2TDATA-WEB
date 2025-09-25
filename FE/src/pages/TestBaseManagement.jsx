import React from 'react';
import { Card, Typography, Space, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { DatabaseOutlined, TeamOutlined, SettingOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const TestBaseManagement = () => {
  const navigate = useNavigate();

  const testDatabaseId = '68d3c571d26bac81d94eef99'; // Database ID từ test trước

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Title level={2}>Test Base Management UI</Title>
      <Text type="secondary">
        Test giao diện quản lý base với hệ thống role của tổ chức
      </Text>

      <div style={{ marginTop: '24px' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Card>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <Title level={4}>
                  <DatabaseOutlined style={{ marginRight: '8px' }} />
                  Database Management
                </Title>
                <Text>
                  Test database ID: <Text code>{testDatabaseId}</Text>
                </Text>
              </div>
              
              <Space wrap>
                <Button 
                  type="primary" 
                  icon={<TeamOutlined />}
                  onClick={() => navigate(`/base-management/${testDatabaseId}`)}
                >
                  Test Member Management
                </Button>
                
                <Button 
                  icon={<SettingOutlined />}
                  onClick={() => navigate(`/base-management/${testDatabaseId}`)}
                >
                  Test Base Management
                </Button>
              </Space>
            </Space>
          </Card>

          <Card title="API Test Results">
            <Space direction="vertical" size="small">
              <div>
                <Text strong>✅ GET /database/databases/{testDatabaseId}/members</Text>
                <br />
                <Text type="secondary">Returns: 1 member (Super Admin - Owner)</Text>
              </div>
              
              <div>
                <Text strong>✅ GET /database/databases/{testDatabaseId}/roles</Text>
                <br />
                <Text type="secondary">Returns: 3 roles (Owner, Manager, Member)</Text>
              </div>
              
              <div>
                <Text strong>✅ POST /database/databases/{testDatabaseId}/members</Text>
                <br />
                <Text type="secondary">Can add members with organization roles</Text>
              </div>
            </Space>
          </Card>

          <Card title="Role System">
            <Space direction="vertical" size="small">
              <div>
                <Text strong>👑 Owner:</Text> Can manage database (add/edit/delete)
              </div>
              <div>
                <Text strong>🛡️ Manager:</Text> Can manage database (add/edit/delete)
              </div>
              <div>
                <Text strong>👥 Member:</Text> Read-only access, cannot manage database
              </div>
            </Space>
          </Card>
        </Space>
      </div>
    </div>
  );
};

export default TestBaseManagement;
