import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Row, 
  Col, 
  Card, 
  Button, 
  Input, 
  Select, 
  Space, 
  Typography, 
  Spin, 
  Empty, 
  message,
  Modal,
  Tag,
  Tooltip,
  Rate
} from 'antd';
import { 
  PlusOutlined, 
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  PictureOutlined,
  FilterOutlined,
  SortAscendingOutlined,
  ShareAltOutlined
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../../utils/axiosInstance-cookie-only';
import { useTableContext } from '../../contexts/TableContext';
import CreateRecordModal from './Modals/CreateRecordModal';
import EditRecordModal from './Modals/EditRecordModal';
import RecordDetailModal from './Calendar/RecordDetailModal';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

const GalleryView = () => {
  const { databaseId, tableId, viewId } = useParams();
  const queryClient = useQueryClient();
  const { selectedRowKeys, setSelectedRowKeys } = useTableContext();
  
  // State management
  const [searchValue, setSearchValue] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [filterField, setFilterField] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Fetch table structure
  const { data: tableStructure, isLoading: structureLoading } = useQuery({
    queryKey: ['tableStructure', tableId],
    queryFn: async () => {
      const response = await axiosInstance.get(`/database/tables/${tableId}/structure`);
      return response.data;
    },
    enabled: !!tableId,
  });

  // Fetch records
  const { data: recordsData, isLoading: recordsLoading, refetch } = useQuery({
    queryKey: ['galleryRecords', tableId, searchValue, sortField, sortOrder, filterField, filterValue, currentPage, pageSize],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchValue) params.append('search', searchValue);
      if (sortField) params.append('sortField', sortField);
      if (sortOrder) params.append('sortOrder', sortOrder);
      if (filterField && filterValue) {
        params.append('filterField', filterField);
        params.append('filterValue', filterValue);
      }
      params.append('page', currentPage);
      params.append('limit', pageSize);

      console.log('API call:', `/database/tables/${tableId}/records?${params.toString()}`);
      const response = await axiosInstance.get(`/database/tables/${tableId}/records?${params.toString()}`);
      return response.data;
    },
    enabled: !!tableId,
  });

  const records = recordsData?.data || [];
  const totalRecords = recordsData?.pagination?.total || 0;
  const columns = tableStructure?.data?.columns || [];

  // Delete record mutation
  const deleteRecordMutation = useMutation({
    mutationFn: async (recordId) => {
      const response = await axiosInstance.delete(`/database/records/${recordId}`);
      return response.data;
    },
    onSuccess: () => {
      message.success('Record deleted successfully');
      refetch();
      queryClient.invalidateQueries(['galleryRecords']);
    },
    onError: (error) => {
      message.error(error.response?.data?.message || 'Failed to delete record');
    },
  });

  // Handle record actions
  const handleViewRecord = (record) => {
    setSelectedRecord(record);
    setShowDetailModal(true);
  };

  const handleEditRecord = (record) => {
    setSelectedRecord(record);
    setShowEditModal(true);
  };

  const handleDeleteRecord = (record) => {
    setSelectedRecord(record);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (selectedRecord) {
      deleteRecordMutation.mutate(selectedRecord._id);
      setShowDeleteModal(false);
      setSelectedRecord(null);
    }
  };

  // Render card content with dynamic data
  const renderCardContent = (record) => {
    if (!record || !record.data) {
      return <Card><Text>No data available</Text></Card>;
    }

    const data = record.data;
    const fields = Object.keys(data).filter(key => 
      data[key] !== null && data[key] !== undefined && data[key] !== ""
    );
    
    const getFieldValue = (field) => {
      if (typeof data[field] === "object" && data[field]?.label) {
        return data[field].label;
      }
      return data[field];
    };
    
    const title = fields[0] ? getFieldValue(fields[0]) : 'Untitled';
    const displayFields = fields.slice(1, 5);

    return (
      <Card
        hoverable
        style={{ 
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          border: "1px solid #f0f0f0"
        }}
        bodyStyle={{ padding: "16px" }}
         actions={[
           <Tooltip title="Edit" key="edit">
             <EditOutlined 
               onClick={() => handleEditRecord(record)} 
               style={{ color: '#52c41a' }}
             />
           </Tooltip>,
           <Tooltip title="Delete" key="delete">
             <DeleteOutlined 
               onClick={() => handleDeleteRecord(record)} 
               style={{ color: '#ff4d4f' }}
             />
           </Tooltip>,
         ]}
      >
        <div style={{ marginBottom: "12px" }}>
          <Text strong style={{ fontSize: "14px", color: "#262626" }}>
            {String(title).substring(0, 50)}
          </Text>
        </div>

        <div>
          {displayFields.map((fieldName) => {
            const value = getFieldValue(fieldName);
            const isRating = fieldName.toLowerCase().includes("đánh giá");
            const isPercentage = fieldName.toLowerCase().includes("%") || fieldName.toLowerCase().includes("hoàn thành");
            
            return (
              <div key={fieldName} style={{ marginBottom: "6px", display: "flex", justifyContent: "space-between" }}>
                <Text style={{ fontSize: "12px", color: "#8c8c8c" }}>
                  {fieldName}:
                </Text>
                <div>
                  {isRating ? (
                    <Rate disabled value={parseFloat(value)} style={{ fontSize: "12px" }} />
                  ) : isPercentage ? (
                    <Text strong style={{ 
                      color: parseFloat(value) >= 80 ? "#52c41a" : parseFloat(value) >= 50 ? "#fa8c16" : "#f5222d",
                      fontSize: "12px"
                    }}>
                      {value}%
                    </Text>
                  ) : typeof value === "boolean" ? (
                    <Tag color={value ? "green" : "red"} size="small">
                      {value ? "Yes" : "No"}
                    </Tag>
                  ) : (
                    <Text style={{ fontSize: "12px" }}>
                      {String(value).substring(0, 20)}
                    </Text>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: "8px", marginTop: "12px" }}>
          <Text style={{ fontSize: "11px", color: "#bfbfbf" }}>
            ID: {record._id?.slice(-8)}
          </Text>
        </div>
      </Card>
    );
  };

  if (structureLoading || recordsLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>
          <Text>Loading gallery...</Text>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-100">
        {/* Top Row - Search and Actions */}
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <div className="flex items-center gap-4 flex-1">
            <Search
              placeholder="Search records..."
              allowClear
              style={{ width: '320px' }}
              onSearch={setSearchValue}
              onChange={(e) => !e.target.value && setSearchValue('')}
              size="large"
            />
            
            <div className="flex items-center gap-2">
              <Select
                placeholder="Filter by field"
                style={{ width: '160px' }}
                allowClear
                onChange={setFilterField}
                value={filterField}
                size="large"
              >
                {columns.map((column) => (
                  <Option key={column.name} value={column.name}>
                    {column.name}
                  </Option>
                ))}
              </Select>

              {filterField && (
                <Input
                  placeholder="Filter value"
                  style={{ width: '160px' }}
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                  allowClear
                  size="large"
                />
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              icon={<FilterOutlined />}
              onClick={() => {/* TODO: Implement filter modal */}}
              size="large"
            >
              Filter
            </Button>
            <Button
              icon={<SortAscendingOutlined />}
              onClick={() => {/* TODO: Implement sort modal */}}
              size="large"
            >
              Sort
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setShowCreateModal(true)}
              size="large"
            >
              Add Record
            </Button>
          </div>
        </div>

        {/* Bottom Row - Stats and View Options */}
        <div className="flex justify-between items-center p-4">
          <div className="flex items-center gap-6">
            <div className="text-sm text-gray-600">
              <span className="font-medium text-gray-900">{totalRecords}</span> records
            </div>
            <div className="text-sm text-gray-600">
              Showing <span className="font-medium text-gray-900">{records.length}</span> of {totalRecords}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
          </div>
        </div>
      </div>

      {/* Gallery Content */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        {recordsLoading ? (
          <div className="text-center py-12">
            <Spin size="large" />
            <div className="mt-4">
              <Text>Loading records...</Text>
            </div>
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-12">
            <Empty
              description="No records found"
            >
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setShowCreateModal(true)}
              >
                Create First Record
              </Button>
            </Empty>
          </div>
        ) : (
          <Row gutter={[16, 16]}>
            {records.map((record) => (
              <Col key={record._id} xs={24} sm={12} md={8} lg={6} xl={4}>
                {renderCardContent(record)}
              </Col>
            ))}
          </Row>
        )}
      </div>

      {/* Pagination */}
      {totalRecords > pageSize && (
        <div className="mt-6 flex justify-center">
          <Space>
            <Button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              Previous
            </Button>
            <span>
              Page {currentPage} of {Math.ceil(totalRecords / pageSize)}
            </span>
            <Button
              disabled={currentPage >= Math.ceil(totalRecords / pageSize)}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Next
            </Button>
          </Space>
        </div>
      )}

      {/* Modals */}
      <CreateRecordModal
        open={showCreateModal}
        onCancel={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          refetch();
        }}
        tableId={tableId}
        tableColumns={{ data: tableStructure?.data?.columns || [] }}
        databaseId={databaseId}
      />

       {selectedRecord && (
         <>
           <EditRecordModal
             open={showEditModal}
             onCancel={() => {
               setShowEditModal(false);
               setSelectedRecord(null);
             }}
             onSuccess={() => {
               setShowEditModal(false);
               setSelectedRecord(null);
               refetch();
             }}
             record={selectedRecord}
             tableId={tableId}
             tableColumns={{ data: tableStructure?.data?.columns || [] }}
             databaseId={databaseId}
           />

           <RecordDetailModal
             visible={showDetailModal}
             onCancel={() => {
               setShowDetailModal(false);
               setSelectedRecord(null);
             }}
             record={selectedRecord}
             tableId={tableId}
             onEdit={() => {
               setShowDetailModal(false);
               setShowEditModal(true);
             }}
             onDelete={() => {
               setShowDetailModal(false);
               handleDeleteRecord(selectedRecord);
               setSelectedRecord(null);
             }}
           />

           {/* Delete Confirmation Modal */}
           <Modal
             title="Xác nhận xóa"
             open={showDeleteModal}
             onOk={confirmDelete}
             onCancel={() => {
               setShowDeleteModal(false);
               setSelectedRecord(null);
             }}
             okText="Xác nhận xóa"
             cancelText="Hủy"
             okType="danger"
           >
             <p>Bạn có chắc chắn muốn xóa bản ghi này? Hành động này không thể hoàn tác.</p>
           </Modal>
         </>
       )}
     </div>
   );
 };

export default GalleryView;
