import React, { useState, useEffect } from 'react';
import {
  Modal,
  Button,
  List,
  Card,
  Space,
  Typography,
  Divider,
  Empty,
  Popconfirm,
  message,
  Tooltip,
  Badge
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SettingOutlined,
  FormatPainterOutlined
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../../utils/axiosInstance-cookie-only';
import RuleBuilder from './RuleBuilder';
import PreviewTable from './PreviewTable';

const { Title, Text } = Typography;

const ConditionalFormattingModal = ({ 
  visible, 
  onClose, 
  tableId, 
  databaseId,
  columns = [],
  records = []
}) => {
  const [showRuleBuilder, setShowRuleBuilder] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const queryClient = useQueryClient();

  // Fetch formatting rules
  const { data: rulesResponse, isLoading: rulesLoading, refetch: refetchRules } = useQuery({
    queryKey: ['conditional-formatting-rules', tableId],
    queryFn: async () => {
      const response = await axiosInstance.get(`/conditional-formatting/tables/${tableId}/rules`);
      return response.data;
    },
    enabled: visible && !!tableId,
    refetchOnMount: true
  });

  const rules = rulesResponse?.data || [];

  // Delete rule mutation
  const deleteRuleMutation = useMutation({
    mutationFn: async (ruleId) => {
      const response = await axiosInstance.delete(`/conditional-formatting/rules/${ruleId}`);
      return response.data;
    },
    onSuccess: () => {
      message.success('Formatting rule deleted successfully');
      refetchRules();
    },
    onError: (error) => {
      message.error(error.response?.data?.message || 'Failed to delete rule');
    }
  });

  // Preview mutation
  const previewMutation = useMutation({
    mutationFn: async (data) => {
      const response = await axiosInstance.post(`/conditional-formatting/tables/${tableId}/preview`, data);
      return response.data;
    },
    onSuccess: (data) => {
      setPreviewData(data.data);
      setShowPreview(true);
    },
    onError: (error) => {
      message.error(error.response?.data?.message || 'Failed to preview formatting');
    }
  });

  const handleCreateRule = () => {
    setEditingRule(null);
    setShowRuleBuilder(true);
  };

  const handleEditRule = (rule) => {
    setEditingRule(rule);
    setShowRuleBuilder(true);
  };

  const handleDeleteRule = (ruleId) => {
    deleteRuleMutation.mutate(ruleId);
  };

  const handlePreview = () => {
    if (records.length === 0) {
      message.warning('No records available for preview');
      return;
    }

    const previewPayload = {
      records: records.slice(0, 10), // Limit to first 10 records for preview
      columns: columns
    };

    previewMutation.mutate(previewPayload);
  };

  const handleRuleBuilderClose = () => {
    setShowRuleBuilder(false);
    setEditingRule(null);
    refetchRules();
  };

  const getRuleTypeIcon = (ruleType) => {
    switch (ruleType) {
      case 'cell_value':
        return '🔢';
      case 'date':
        return '📅';
      case 'text_contains':
        return '📝';
      case 'formula':
        return '🧮';
      case 'cross_column':
        return '🔗';
      default:
        return '⚙️';
    }
  };

  const getRuleTypeLabel = (ruleType) => {
    switch (ruleType) {
      case 'cell_value':
        return 'Cell Value';
      case 'date':
        return 'Date';
      case 'text_contains':
        return 'Text Contains';
      case 'formula':
        return 'Formula';
      case 'cross_column':
        return 'Cross Column';
      default:
        return 'Unknown';
    }
  };

  const getTargetTypeLabel = (targetType) => {
    switch (targetType) {
      case 'all_members':
        return 'All Members';
      case 'specific_user':
        return 'Specific User';
      case 'specific_role':
        return 'Specific Role';
      default:
        return 'Unknown';
    }
  };

  return (
    <>
      <Modal
        title={
          <Space>
            <FormatPainterOutlined />
            <span>Conditional Formatting</span>
            {rules.length > 0 && <Badge count={rules.length} />}
          </Space>
        }
        open={visible}
        onCancel={onClose}
        width={800}
        footer={[
          <Button key="preview" icon={<EyeOutlined />} onClick={handlePreview} loading={previewMutation.isPending}>
            Preview
          </Button>,
          <Button key="close" onClick={onClose}>
            Close
          </Button>
        ]}
      >
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={handleCreateRule}
            >
              Add Rule
            </Button>
            <Text type="secondary">
              {rules.length} rule{rules.length !== 1 ? 's' : ''} configured
            </Text>
          </Space>
        </div>

        <Divider />

        {rulesLoading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Text>Loading formatting rules...</Text>
          </div>
        ) : rules.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No formatting rules configured"
          >
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateRule}>
              Create First Rule
            </Button>
          </Empty>
        ) : (
          <List
            dataSource={rules}
            renderItem={(rule) => (
              <List.Item>
                <Card
                  size="small"
                  style={{ width: '100%' }}
                  title={
                    <Space>
                      <span>{getRuleTypeIcon(rule.ruleType)}</span>
                      <Text strong>{rule.ruleName}</Text>
                      <Badge 
                        count={rule.priority} 
                        style={{ backgroundColor: '#52c41a' }}
                        title="Priority"
                      />
                    </Space>
                  }
                  extra={
                    <Space>
                      <Tooltip title="Edit Rule">
                        <Button 
                          type="text" 
                          icon={<EditOutlined />} 
                          onClick={() => handleEditRule(rule)}
                        />
                      </Tooltip>
                      <Popconfirm
                        title="Delete Rule"
                        description="Are you sure you want to delete this formatting rule?"
                        onConfirm={() => handleDeleteRule(rule.id)}
                        okText="Yes"
                        cancelText="No"
                      >
                        <Tooltip title="Delete Rule">
                          <Button 
                            type="text" 
                            danger 
                            icon={<DeleteOutlined />}
                            loading={deleteRuleMutation.isPending}
                          />
                        </Tooltip>
                      </Popconfirm>
                    </Space>
                  }
                >
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                      <Text type="secondary">Type: </Text>
                      <Text>{getRuleTypeLabel(rule.ruleType)}</Text>
                    </div>
                    
                    {rule.columnId && (
                      <div>
                        <Text type="secondary">Column: </Text>
                        <Text>{rule.column?.name || 'Unknown Column'}</Text>
                      </div>
                    )}
                    
                    <div>
                      <Text type="secondary">Target: </Text>
                      <Text>{getTargetTypeLabel(rule.targetType)}</Text>
                    </div>
                    
                    <div>
                      <Text type="secondary">Conditions: </Text>
                      <Text>{rule.conditions?.length || 0} condition{(rule.conditions?.length || 0) !== 1 ? 's' : ''}</Text>
                    </div>
                    
                    {rule.formatting && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Text type="secondary">Formatting: </Text>
                        {rule.formatting.backgroundColor && (
                          <div
                            style={{
                              width: 16,
                              height: 16,
                              backgroundColor: rule.formatting.backgroundColor,
                              border: '1px solid #d9d9d9',
                              borderRadius: 2
                            }}
                            title={`Background: ${rule.formatting.backgroundColor}`}
                          />
                        )}
                        {rule.formatting.textColor && (
                          <div
                            style={{
                              width: 16,
                              height: 16,
                              backgroundColor: rule.formatting.textColor,
                              border: '1px solid #d9d9d9',
                              borderRadius: 2
                            }}
                            title={`Text: ${rule.formatting.textColor}`}
                          />
                        )}
                        {rule.formatting.fontWeight === 'bold' && (
                          <Text strong>Bold</Text>
                        )}
                      </div>
                    )}
                  </Space>
                </Card>
              </List.Item>
            )}
          />
        )}
      </Modal>

      {/* Rule Builder Modal */}
      <RuleBuilder
        visible={showRuleBuilder}
        onClose={handleRuleBuilderClose}
        tableId={tableId}
        databaseId={databaseId}
        columns={columns}
        editingRule={editingRule}
      />

      {/* Preview Modal */}
      <PreviewTable
        visible={showPreview}
        onClose={() => setShowPreview(false)}
        data={previewData}
        columns={columns}
      />
    </>
  );
};

export default ConditionalFormattingModal;
