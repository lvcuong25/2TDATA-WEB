import React from 'react';
import { 
  Card, 
  Statistic, 
  Row, 
  Col, 
  Progress, 
  Typography,
  Space,
  Tag
} from 'antd';
import { 
  DatabaseOutlined,
  EyeOutlined,
  StarOutlined,
  UserOutlined,
  TrendingUpOutlined,
  AppstoreOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

/**
 * TEMPLATE STATS CARD
 * 
 * Component hiển thị thống kê template
 * Giao diện giống database stats card
 */

const TemplateStatsCard = ({ 
  template,
  loading = false 
}) => {
  if (!template) return null;

  const stats = {
    usage_count: template.usage_count || 0,
    rating: template.rating || 0,
    tables_count: template.structure?.tables?.length || 0,
    columns_count: template.structure?.tables?.reduce((sum, table) => 
      sum + (table.columns?.length || 0), 0) || 0,
    views_count: template.structure?.views?.length || 0,
    created_at: template.created_at,
    updated_at: template.updated_at
  };

  const getRatingColor = (rating) => {
    if (rating >= 4.5) return '#52c41a';
    if (rating >= 3.5) return '#faad14';
    if (rating >= 2.5) return '#fa8c16';
    return '#f5222d';
  };

  const getUsageLevel = (count) => {
    if (count >= 100) return { level: 'High', color: '#52c41a' };
    if (count >= 50) return { level: 'Medium', color: '#faad14' };
    if (count >= 10) return { level: 'Low', color: '#fa8c16' };
    return { level: 'New', color: '#8c8c8c' };
  };

  const usageLevel = getUsageLevel(stats.usage_count);

  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <DatabaseOutlined style={{ fontSize: '18px', color: '#1890ff' }} />
          <span>Template Statistics</span>
        </div>
      }
      loading={loading}
      style={{ height: '100%' }}
    >
      <Row gutter={[16, 16]}>
        {/* Usage Count */}
        <Col xs={12} sm={8}>
          <Statistic
            title="Usage Count"
            value={stats.usage_count}
            prefix={<TrendingUpOutlined />}
            valueStyle={{ color: '#1890ff' }}
          />
          <div style={{ marginTop: '8px' }}>
            <Tag color={usageLevel.color} size="small">
              {usageLevel.level} Usage
            </Tag>
          </div>
        </Col>

        {/* Rating */}
        <Col xs={12} sm={8}>
          <Statistic
            title="Rating"
            value={stats.rating}
            prefix={<StarOutlined />}
            suffix="/ 5"
            valueStyle={{ color: getRatingColor(stats.rating) }}
          />
          <div style={{ marginTop: '8px' }}>
            <Progress 
              percent={(stats.rating / 5) * 100} 
              size="small" 
              strokeColor={getRatingColor(stats.rating)}
              showInfo={false}
            />
          </div>
        </Col>

        {/* Tables Count */}
        <Col xs={12} sm={8}>
          <Statistic
            title="Tables"
            value={stats.tables_count}
            prefix={<AppstoreOutlined />}
            valueStyle={{ color: '#52c41a' }}
          />
        </Col>

        {/* Columns Count */}
        <Col xs={12} sm={8}>
          <Statistic
            title="Columns"
            value={stats.columns_count}
            prefix={<DatabaseOutlined />}
            valueStyle={{ color: '#fa8c16' }}
          />
        </Col>

        {/* Views Count */}
        <Col xs={12} sm={8}>
          <Statistic
            title="Views"
            value={stats.views_count}
            prefix={<EyeOutlined />}
            valueStyle={{ color: '#722ed1' }}
          />
        </Col>

        {/* Creator */}
        <Col xs={12} sm={8}>
          <div style={{ textAlign: 'center' }}>
            <UserOutlined style={{ fontSize: '24px', color: '#8c8c8c' }} />
            <div style={{ marginTop: '4px' }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>Created by</Text>
              <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                {template.created_by?.name || 'Unknown'}
              </div>
            </div>
          </div>
        </Col>
      </Row>

      {/* Additional Info */}
      <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f0f0f0' }}>
        <Row gutter={[16, 8]}>
          <Col span={12}>
            <Text type="secondary" style={{ fontSize: '12px' }}>Created:</Text>
            <div style={{ fontSize: '12px', fontWeight: 'bold' }}>
              {stats.created_at ? new Date(stats.created_at).toLocaleDateString() : 'N/A'}
            </div>
          </Col>
          <Col span={12}>
            <Text type="secondary" style={{ fontSize: '12px' }}>Updated:</Text>
            <div style={{ fontSize: '12px', fontWeight: 'bold' }}>
              {stats.updated_at ? new Date(stats.updated_at).toLocaleDateString() : 'N/A'}
            </div>
          </Col>
        </Row>
      </div>

      {/* Template Tags */}
      {template.tags && template.tags.length > 0 && (
        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f0f0f0' }}>
          <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: '8px' }}>
            Tags:
          </Text>
          <Space wrap size="small">
            {template.tags.slice(0, 5).map((tag, index) => (
              <Tag key={index} color="default" size="small">
                {tag}
              </Tag>
            ))}
            {template.tags.length > 5 && (
              <Tag color="default" size="small">
                +{template.tags.length - 5}
              </Tag>
            )}
          </Space>
        </div>
      )}
    </Card>
  );
};

export default TemplateStatsCard;
