import React, { useState } from 'react';
import { Upload, Button, Card, List, message, Modal, Input, Form, Space, Popconfirm } from 'antd';
import { UploadOutlined, DeleteOutlined, EditOutlined, PlusOutlined, UndoOutlined } from '@ant-design/icons';
import instance from '../../../axios/axiosInstance';

const PartnerLogosManager = ({ logos = [], onChange, siteName = 'site' }) => {
  const [uploading, setUploading] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [form] = Form.useForm();
  const [deletedLogos, setDeletedLogos] = useState([]); // Store deleted logos for undo

  // Generate standardized filename
  const generateFilename = (originalName, index) => {
    const ext = originalName.split('.').pop().toLowerCase();
    const sanitizedSiteName = siteName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const timestamp = Date.now();
    return `${sanitizedSiteName}_partner_${index}_${timestamp}.${ext}`;
  };

  // Handle file upload
  const handleUpload = async (file, index) => {
    setUploading(true);
    const formData = new FormData();
    
    // Rename file before upload
    const newFilename = generateFilename(file.name, index);
    const renamedFile = new File([file], newFilename, { type: file.type });
    
    formData.append('image', renamedFile);
    formData.append('type', 'partner');

    try {
      const response = await instance.post('/footer/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        const { url, webpUrl } = response.data.data;
        
        // Update logos array
        const newLogos = [...logos];
        if (index !== undefined && index < logos.length) {
          // Replace existing
          newLogos[index] = {
            ...newLogos[index],
            image: url,
            webpUrl: webpUrl
          };
        } else {
          // Add new
          newLogos.push({
            image: url,
            webpUrl: webpUrl,
            alt: 'Partner Logo',
            link: '#',
            height: '60px'
          });
        }
        
        onChange(newLogos);
        message.success('Upload logo thành công!');
      }
    } catch (error) {
      message.error('Lỗi upload: ' + (error.response?.data?.message || error.message));
    } finally {
      setUploading(false);
    }
    
    return false; // Prevent default upload
  };

  // Delete logo - simplified version
  const handleDelete = (index) => {
    // Store deleted logo with its original index for undo
    const deletedLogo = { ...logos[index], originalIndex: index };
    setDeletedLogos(prev => [...prev, deletedLogo]);
    
    // Remove from array
    const newLogos = logos.filter((_, i) => i !== index);
    onChange(newLogos);
    message.success('Đã xóa logo');
  };

  // Undo last delete
  const handleUndo = () => {
    if (deletedLogos.length === 0) {
      message.info('Không có logo nào để khôi phục');
      return;
    }

    // Get the last deleted logo
    const lastDeleted = deletedLogos[deletedLogos.length - 1];
    const { originalIndex, ...logoData } = lastDeleted;
    
    // Insert back at original position or at the end
    const newLogos = [...logos];
    if (originalIndex <= newLogos.length) {
      newLogos.splice(originalIndex, 0, logoData);
    } else {
      newLogos.push(logoData);
    }
    
    onChange(newLogos);
    
    // Remove from deleted history
    setDeletedLogos(prev => prev.slice(0, -1));
    message.success('Đã khôi phục logo');
  };

  // Edit logo details
  const handleEdit = (index) => {
    const logo = logos[index];
    form.setFieldsValue({
      alt: logo.alt || '',
      link: logo.link || '#',
      height: logo.height || '60px'
    });
    setEditingIndex(index);
    setEditModal(true);
  };

  // Save edited details
  const handleSaveEdit = () => {
    form.validateFields().then(values => {
      const newLogos = [...logos];
      newLogos[editingIndex] = {
        ...newLogos[editingIndex],
        ...values
      };
      onChange(newLogos);
      setEditModal(false);
      message.success('Đã cập nhật thông tin logo');
    });
  };

  return (
    <Card title="Logo đối tác (Thành viên 2T Group)" extra={
      <Space>
        {deletedLogos.length > 0 && (
          <Button 
            icon={<UndoOutlined />} 
            onClick={handleUndo}
            type="text"
          >
            Hoàn tác ({deletedLogos.length})
          </Button>
        )}
        <Upload
          beforeUpload={(file) => handleUpload(file)}
          showUploadList={false}
          accept="image/*"
        >
          <Button icon={<PlusOutlined />} loading={uploading}>
            Thêm logo mới
          </Button>
        </Upload>
      </Space>
    }>
      <List
        grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 3 }}
        dataSource={logos}
        renderItem={(logo, index) => (
          <List.Item>
            <Card
              hoverable
              cover={
                <div style={{ padding: '10px', background: '#f0f0f0', textAlign: 'center' }}>
                  <img 
                    alt={logo.alt || 'Partner'} 
                    src={logo.image} 
                    style={{ 
                      height: logo.height || '60px', 
                      width: 'auto',
                      objectFit: 'contain'
                    }}
                  />
                </div>
              }
              actions={[
                <Upload
                  beforeUpload={(file) => handleUpload(file, index)}
                  showUploadList={false}
                  accept="image/*"
                >
                  <UploadOutlined key="upload" />
                </Upload>,
                <EditOutlined key="edit" onClick={() => handleEdit(index)} />,
                <Popconfirm
                  key="delete"
                  title="Xác nhận xóa"
                  description="Bạn có chắc muốn xóa logo này?"
                  onConfirm={() => handleDelete(index)}
                  okText="Xóa"
                  cancelText="Hủy"
                >
                  <DeleteOutlined style={{color: 'red'}} />
                </Popconfirm>
              ]}
            >
              <Card.Meta
                title={logo.alt || 'Partner Logo'}
                description={
                  <div style={{ fontSize: '12px' }}>
                    <div>Link: {logo.link || '#'}</div>
                    <div>Height: {logo.height || '60px'}</div>
                  </div>
                }
              />
            </Card>
          </List.Item>
        )}
      />

      <Modal
        title="Chỉnh sửa thông tin logo"
        open={editModal}
        onOk={handleSaveEdit}
        onCancel={() => setEditModal(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Tên logo (Alt text)"
            name="alt"
            rules={[{ required: true, message: 'Vui lòng nhập tên logo' }]}
          >
            <Input placeholder="VD: HCW, REMOBPO..." />
          </Form.Item>
          <Form.Item
            label="Link website"
            name="link"
            rules={[{ required: true, message: 'Vui lòng nhập link' }]}
          >
            <Input placeholder="https://example.com hoặc #" />
          </Form.Item>
          <Form.Item
            label="Chiều cao"
            name="height"
            rules={[{ required: true, message: 'Vui lòng nhập chiều cao' }]}
          >
            <Input placeholder="60px, 80px, 100px..." />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default PartnerLogosManager;
