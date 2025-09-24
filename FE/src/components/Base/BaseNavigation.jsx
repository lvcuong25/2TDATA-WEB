import React from 'react';
import { Card, Button, Space, Typography, Row, Col } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  TeamOutlined, 
  SettingOutlined, 
  DatabaseOutlined,
  ArrowLeftOutlined 
} from '@ant-design/icons';

const { Title, Text } = Typography;

const BaseNavigation = () => {
  const navigate = useNavigate();
  const { databaseId } = useParams();

  return (
    <Card style={{ marginBottom: '16px' }}>
      <Row justify="space-between" align="middle">
        <Col>
          <Space>
            <Button 
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/profile/base')}
            >
              Back to Base List
            </Button>
            <Title level={4} style={{ margin: 0 }}>
              Base Management
            </Title>
          </Space>
        </Col>
        <Col>
          <Space>
            <Button 
              type="primary"
              icon={<TeamOutlined />}
              onClick={() => navigate(`/profile/base/${databaseId}/management`)}
            >
              Manage Members
            </Button>
            <Button 
              icon={<SettingOutlined />}
              onClick={() => navigate(`/profile/base/${databaseId}/management`)}
            >
              Base Settings
            </Button>
          </Space>
        </Col>
      </Row>
    </Card>
  );
};

export default BaseNavigation;
