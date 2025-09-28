import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  Tabs,
  Row,
  Col,
  Statistic,
  Typography,
  Tag,
  Space,
  Button,
  Tooltip
} from 'antd';
import {
  TeamOutlined,
  SettingOutlined,
  DatabaseOutlined,
  TableOutlined,
  UserOutlined,
  CrownOutlined,
  SafetyOutlined,
  EditOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import instance from '../../utils/axiosInstance-cookie-only';
import { useAuth } from '../core/Auth';
import MemberManagement from './MemberManagement';
import RolePermissionManagement from './RolePermissionManagement';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const BaseManagement = () => {
  const { databaseId } = useParams();
  const navigate = useNavigate();
  const { currentUser, currentOrganization } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // ===========================================
  // QUERIES
  // ===========================================

  // Fetch database details (base = database)
  const { data: baseData, isLoading: baseLoading } = useQuery({
    queryKey: ['databaseDetail', databaseId],
    queryFn: async () => {
      const response = await instance.get(`/database/databases/${databaseId}`);
      return response.data;
    },
    enabled: !!databaseId,
  });

  // Fetch user's role in this specific base
  const { data: userBaseRoleData } = useQuery({
    queryKey: ['userBaseRole', databaseId, currentUser?._id],
    queryFn: async () => {
      if (!databaseId || !currentUser?._id) return null;
      const response = await instance.get(`/database/databases/${databaseId}/me`);
      return response.data;
    },
    enabled: !!databaseId && !!currentUser?._id,
  });

  const userBaseRole = userBaseRoleData?.member?.role;
  const canManageBase = userBaseRole === 'owner' || userBaseRole === 'manager';

  // Fetch database members count
  const { data: membersData } = useQuery({
    queryKey: ['databaseMembers', databaseId],
    queryFn: async () => {
      const response = await instance.get(`/database/databases/${databaseId}/members`);
      return response.data;
    },
    enabled: !!databaseId,
  });

  // Fetch database roles (organization roles)
  const { data: rolesData } = useQuery({
    queryKey: ['databaseRoles', databaseId],
    queryFn: async () => {
      const response = await instance.get(`/database/databases/${databaseId}/roles`);
      return response.data;
    },
    enabled: !!databaseId,
  });

  // Fetch database tables count
  const { data: tablesData } = useQuery({
    queryKey: ['databaseTables', databaseId],
    queryFn: async () => {
      const response = await instance.get(`/database/databases/${databaseId}/tables`);
      return response.data;
    },
    enabled: !!databaseId,
  });

  // ===========================================
  // HELPER FUNCTIONS
  // ===========================================

  const getRoleIcon = (roleName) => {
    switch (roleName?.toLowerCase()) {
      case 'owner':
        return <CrownOutlined style={{ color: '#faad14' }} />;
      case 'manager':
        return <SafetyOutlined style={{ color: '#1890ff' }} />;
      case 'member':
        return <UserOutlined style={{ color: '#8c8c8c' }} />;
      default:
        return <UserOutlined />;
    }
  };

  const getRoleColor = (roleName) => {
    switch (roleName?.toLowerCase()) {
      case 'owner':
        return 'gold';
      case 'manager':
        return 'blue';
      case 'member':
        return 'default';
      default:
        return 'default';
    }
  };

  const baseDetail = baseData?.data;

  return (
    <div style={{ padding: '24px' }}>
      {/* Base Header */}
      <Card style={{ marginBottom: '24px' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2} style={{ margin: 0 }}>
              {baseDetail?.name || 'Base Management'}
            </Title>
            <Text type="secondary">
              {baseDetail?.description || 'Manage your base, members, and permissions'}
            </Text>
          </Col>
          <Col>
            <Space>
              <Tag color="blue">
                <DatabaseOutlined /> Database ID: {databaseId}
              </Tag>
              {baseDetail?.ownerId === currentUser?._id && (
                <Tag color="green">
                  <CrownOutlined /> Owner
                </Tag>
              )}
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Members"
              value={membersData?.data?.length || 0}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Roles"
              value={rolesData?.data?.length || 0}
              prefix={<SettingOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Tables"
              value={tablesData?.data?.length || 0}
              prefix={<TableOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Content Tabs */}
      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          size="large"
        >
          {canManageBase && (
            <TabPane 
              tab={
                <span>
                  <TeamOutlined />
                  Members
                </span>
              } 
              key="members"
            >
              <MemberManagement />
            </TabPane>
          )}
          
          {canManageBase && (
            <TabPane 
              tab={
                <span>
                  <SettingOutlined />
                  Roles & Permissions
                </span>
              } 
              key="roles"
            >
              <RolePermissionManagement />
            </TabPane>
          )}
          
          <TabPane 
            tab={
              <span>
                <UserOutlined />
                Overview
              </span>
            } 
            key="overview"
          >
            <div style={{ padding: '24px' }}>
              <Title level={3}>Base Overview</Title>
              
              {!canManageBase && userBaseRoleData?.isMember && (
                <div style={{ 
                  background: '#fff7e6', 
                  border: '1px solid #ffd591', 
                  borderRadius: '6px', 
                  padding: '16px', 
                  marginBottom: '24px' 
                }}>
                  <Text type="warning">
                    <EyeOutlined style={{ marginRight: '8px' }} />
                    You are viewing this base as a {userBaseRole}. Only database owners and managers can manage base settings and members.
                  </Text>
                </div>
              )}
              
              {!userBaseRoleData?.isMember && (
                <div style={{ 
                  background: '#ffebe6', 
                  border: '1px solid #ffb3a6', 
                  borderRadius: '6px', 
                  padding: '16px', 
                  marginBottom: '24px' 
                }}>
                  <Text type="danger">
                    <EyeOutlined style={{ marginRight: '8px' }} />
                    You are not a member of this base. Please contact the database owner to be added.
                  </Text>
                </div>
              )}
              
              <Row gutter={[24, 24]}>
                <Col span={12}>
                  <Card title="Base Information" size="small">
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <div>
                        <Text strong>Name: </Text>
                        <Text>{baseDetail?.name}</Text>
                      </div>
                      <div>
                        <Text strong>Description: </Text>
                        <Text>{baseDetail?.description || 'No description'}</Text>
                      </div>
                      <div>
                        <Text strong>Created: </Text>
                        <Text>{baseDetail?.createdAt ? new Date(baseDetail.createdAt).toLocaleDateString() : 'Unknown'}</Text>
                      </div>
                      <div>
                        <Text strong>Organization: </Text>
                        <Text>{currentOrganization?.name}</Text>
                      </div>
                    </Space>
                  </Card>
                </Col>
                
                <Col span={12}>
                  <Card title="Your Role" size="small">
                    <Space direction="vertical" style={{ width: '100%' }}>
                      {userBaseRoleData?.isMember ? (
                        <>
                          <div>
                            <Text strong>Role: </Text>
                            <Tag 
                              icon={getRoleIcon(userBaseRole)} 
                              color={getRoleColor(userBaseRole)}
                            >
                              {userBaseRole}
                            </Tag>
                          </div>
                          <div>
                            <Text strong>Joined: </Text>
                            <Text>
                              {userBaseRoleData?.member?.createdAt ? 
                                new Date(userBaseRoleData.member.createdAt).toLocaleDateString() : 
                                'Unknown'
                              }
                            </Text>
                          </div>
                        </>
                      ) : (
                        <Text type="secondary">You are not a member of this base</Text>
                      )}
                    </Space>
                  </Card>
                </Col>
              </Row>

              <Row gutter={[24, 24]} style={{ marginTop: '24px' }}>
                <Col span={24}>
                  <Card title="Quick Actions" size="small">
                    <Space wrap>
                      <Button 
                        type="primary" 
                        icon={<TeamOutlined />}
                        onClick={() => setActiveTab('members')}
                      >
                        Manage Members
                      </Button>
                      <Button 
                        icon={<SettingOutlined />}
                        onClick={() => setActiveTab('roles')}
                      >
                        Configure Permissions
                      </Button>
                      <Button 
                        icon={<DatabaseOutlined />}
                        onClick={() => navigate('/database')}
                      >
                        Database
                      </Button>
                    </Space>
                  </Card>
                </Col>
              </Row>
            </div>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default BaseManagement;
