import React from 'react';
import { Button } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';

const TemplateBulkDeleteActions = ({ 
  selectedRowKeys, 
  deleteMultipleRecordsMutation,
  onDeleteSelected 
}) => {
  // Only show delete button when rows are selected
  if (selectedRowKeys.length === 0) {
    return null;
  }

  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      <Button
        danger
        icon={<DeleteOutlined />}
        loading={deleteMultipleRecordsMutation.isPending}
        onClick={onDeleteSelected}
      >
        Delete Selected ({selectedRowKeys.length})
      </Button>
    </div>
  );
};

export default TemplateBulkDeleteActions;
