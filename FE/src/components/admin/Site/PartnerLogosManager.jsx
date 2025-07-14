import React, { useState } from 'react';
import { Upload, Button, Card, List, message, Modal, Input, Form, Space } from 'antd';
import { UploadOutlined, DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import instance from '../../../axios/axiosInstance';

const PartnerLogosManager = ({ logos = [], onChange, siteName = 'site' }) => {
  const [uploading, setUploading] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [form] = Form.useForm();

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

  // Delete logo
  const handleDelete = async (index) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc muốn xóa logo này?',
      onOk: async () => {
        const logo = logos[index];
        
        // Delete from server if it's an uploaded file
        if (logo.image && logo.image.startsWith('/uploads/')) {
          const filename = logo.image.split('/').pop();
          try {
            await instance.delete(`/footer/delete/${filename}`);
          } catch (error) {
            console.error('Delete file error:', error);
          }
        }
        
        // Remove from array
        const newLogos = logos.filter((_, i) => i !== index);
        onChange(newLogos);
        message.success('Đã xóa logo');
      }
    });
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
      <Upload
        beforeUpload={(file) => handleUpload(file)}
        showUploadList={false}
        accept="image/*"
      >
        <Button icon={<PlusOutlined />} loading={uploading}>
          Thêm logo mới
        </Button>
      </Upload>
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
                <DeleteOutlined key="delete" onClick={() => handleDelete(index)} style={{color: 'red'}} />
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
