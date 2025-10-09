import React from 'react';
import { Card, Button, Tag, Space, Avatar, Tooltip, Dropdown, Menu } from 'antd';
import { 
  EditOutlined, 
  DeleteOutlined, 
  CopyOutlined, 
  DownloadOutlined, 
  MoreOutlined,
  EyeOutlined,
  StarOutlined,
  UserOutlined,
  DatabaseOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

/**
 * TEMPLATE CARD COMPONENT
 * 
 * Component hiển thị template card trong danh sách templates
 * Giao diện giống database card nhưng cho templates
 */

const TemplateCard = ({ 
  template, 
  onEdit, 
  onDelete, 
  onCopy, 
  onExport, 
  onView,
  onApply,
  loading = false 
}) => {
  const navigate = useNavigate();

  const handleView = () => {
    if (onView) {
      onView(template);
    } else {
      navigate(`/templates/${template.id}`);
    }
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(template);
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(template);
    }
  };

  const handleCopy = (e) => {
    e.stopPropagation();
    if (onCopy) {
      onCopy(template);
    }
  };

  const handleExport = (e) => {
    e.stopPropagation();
    if (onExport) {
      onExport(template);
    }
  };

  const handleApply = (e) => {
    e.stopPropagation();
    if (onApply) {
      onApply(template);
    }
  };

  const menuItems = [
    {
      key: 'view',
      icon: <EyeOutlined />,
      label: 'View Details',
      onClick: handleView
    },
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: 'Edit Template',
      onClick: handleEdit
    },
    {
      key: 'copy',
      icon: <CopyOutlined />,
      label: 'Copy Template',
      onClick: handleCopy
    },
    {
      key: 'export',
      icon: <DownloadOutlined />,
      label: 'Export Template',
      onClick: handleExport
    },
    {
      type: 'divider'
    },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: 'Delete Template',
      danger: true,
      onClick: handleDelete
    }
  ];

  const menu = (
    <Menu items={menuItems} />
  );

  return (
    <Card
      hoverable
      loading={loading}
      className="template-card"
      style={{ 
        height: '100%',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        border: '1px solid #f0f0f0'
      }}
      actions={[
        <Tooltip title="View Details">
          <Button 
            type="text" 
            icon={<EyeOutlined />} 
            onClick={handleView}
            size="small"
          />
        </Tooltip>,
        <Tooltip title="Apply to Database">
          <Button 
            type="text" 
            icon={<DatabaseOutlined />} 
            onClick={handleApply}
            size="small"
          />
        </Tooltip>,
        <Tooltip title="More Actions">
          <Dropdown overlay={menu} trigger={['click']}>
            <Button type="text" icon={<MoreOutlined />} size="small" />
          </Dropdown>
        </Tooltip>
      ]}
    >
      <div className="template-card-content">
        {/* Template Header */}
        <div className="template-header">
          <div className="template-icon">
            <Avatar 
              size={40} 
              icon={<DatabaseOutlined />}
              style={{ 
                backgroundColor: '#1890ff',
                fontSize: '16px'
              }}
            />
          </div>
          <div className="template-info">
            <h3 className="template-name">{template.name}</h3>
            <p className="template-description">{template.description}</p>
          </div>
        </div>

        {/* Template Metadata */}
        <div className="template-metadata">
          <Space wrap size="small">
            <Tag color="blue" size="small">{template.category}</Tag>
            {template.is_public ? (
              <Tag color="green" size="small">Public</Tag>
            ) : (
              <Tag color="orange" size="small">Private</Tag>
            )}
            {template.version && (
              <Tag color="purple" size="small">v{template.version}</Tag>
            )}
          </Space>
        </div>

        {/* Template Stats */}
        <div className="template-stats">
          <div className="stat-item">
            <span className="stat-label">Usage</span>
            <span className="stat-value">{template.usage_count || 0}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Rating</span>
            <span className="stat-value">
              {template.rating ? `${template.rating}/5` : 'N/A'}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Tables</span>
            <span className="stat-value">
              {template.structure?.tables?.length || 0}
            </span>
          </div>
        </div>

        {/* Template Tags */}
        {template.tags && template.tags.length > 0 && (
          <div className="template-tags">
            <Space wrap size="small">
              {template.tags.slice(0, 3).map((tag, index) => (
                <Tag key={index} color="default" size="small">{tag}</Tag>
              ))}
              {template.tags.length > 3 && (
                <Tag color="default" size="small">+{template.tags.length - 3}</Tag>
              )}
            </Space>
          </div>
        )}

        {/* Template Creator */}
        <div className="template-creator">
          <Space size="small">
            <UserOutlined style={{ fontSize: '12px', color: '#8c8c8c' }} />
            <span style={{ fontSize: '12px', color: '#8c8c8c' }}>
              {template.created_by?.name || 'Unknown'}
            </span>
          </Space>
        </div>
      </div>

      <style jsx>{`
        .template-card-content {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .template-header {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .template-info {
          flex: 1;
          min-width: 0;
        }

        .template-name {
          margin: 0 0 4px 0;
          font-size: 16px;
          font-weight: 600;
          color: #262626;
          line-height: 1.4;
        }

        .template-description {
          margin: 0;
          font-size: 14px;
          color: #8c8c8c;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .template-metadata {
          margin-top: 8px;
        }

        .template-stats {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-top: 1px solid #f0f0f0;
          border-bottom: 1px solid #f0f0f0;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
        }

        .stat-label {
          font-size: 11px;
          color: #8c8c8c;
          text-transform: uppercase;
        }

        .stat-value {
          font-size: 14px;
          font-weight: 600;
          color: #262626;
        }

        .template-tags {
          margin-top: 8px;
        }

        .template-creator {
          margin-top: 8px;
          font-size: 12px;
          color: #8c8c8c;
        }
      `}</style>
    </Card>
  );
};

export default TemplateCard;