import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Button, Card, message, Space, Tag, Typography, Row, Col, Upload, ColorPicker } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftOutlined, PlusOutlined, DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import axiosInstance from '../../../axios/axiosInstance';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const SiteForm = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [domains, setDomains] = useState(['']);
  const [logoFileList, setLogoFileList] = useState([]);

  useEffect(() => {
    if (isEdit) {
      fetchSite();
    }
  }, [id, isEdit]);

  const fetchSite = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/sites/${id}`);
      const site = response.data.success ? response.data.data : response.data;
      
      // Set form values
      form.setFieldsValue({
        name: site.name,
        description: site.description,
        status: site.status,
        theme_config: {
          primary_color: site.theme_config?.primary_color || '#1890ff',
          secondary_color: site.theme_config?.secondary_color || '#f0f0f0',
          logo_position: site.theme_config?.logo_position || 'left',
          custom_css: site.theme_config?.custom_css || '',
        },
        settings: {
          iframeUrl: site.settings?.iframeUrl || ''
        }
      });

      // Set domains
      setDomains(site.domains?.length ? site.domains : ['']);
      
      // Set logo if exists
      if (site.logo_url) {
        setLogoFileList([{
          uid: '-1',
          name: 'logo.png',
          status: 'done',
          url: site.logo_url,
        }]);
      }
    } catch (error) {
      message.error('Không thể tải thông tin trang web');
      console.error('Error fetching site:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      // Filter out empty domains
      const validDomains = domains.filter(domain => domain.trim() !== '');
      
      // Convert color picker values to hex strings
      const processedThemeConfig = {
        ...values.theme_config,
        primary_color: typeof values.theme_config?.primary_color === 'object' && values.theme_config?.primary_color?.toHexString ? 
          values.theme_config.primary_color.toHexString() : 
          (typeof values.theme_config?.primary_color === 'string' ? 
            values.theme_config.primary_color : '#1890ff'),
        secondary_color: typeof values.theme_config?.secondary_color === 'object' && values.theme_config?.secondary_color?.toHexString ? 
          values.theme_config.secondary_color.toHexString() : 
          (typeof values.theme_config?.secondary_color === 'string' ? 
            values.theme_config.secondary_color : '#f0f0f0')
      };
      
      // Check if we have a file to upload
      const hasFileUpload = logoFileList.length > 0 && logoFileList[0].originFileObj;
      
      let response;
      if (hasFileUpload) {
        // Convert file to base64 and use FormData for consistency
        const file = logoFileList[0].originFileObj;
        const base64Logo = await convertFileToBase64(file);
        
        const formData = new FormData();
        formData.append('name', values.name);
        formData.append('description', values.description || '');
        formData.append('status', values.status);
        formData.append('domains', JSON.stringify(validDomains));
        formData.append('theme_config', JSON.stringify(processedThemeConfig));
        formData.append('settings', JSON.stringify(values.settings || {}));
        formData.append('logo', file);  // Keep file for multer to process

        if (isEdit) {
          response = await axiosInstance.put(`/admin/sites/edit/${id}`, formData);
        } else {
          response = await axiosInstance.post('/admin/sites', formData);
        }
      } else {
        // Use JSON for normal data
        const data = {
          name: values.name,
          description: values.description || '',
          status: values.status,
          domains: validDomains,
          theme_config: processedThemeConfig,
          settings: values.settings || {}
        };

        if (isEdit) {
          response = await axiosInstance.put(`/admin/sites/${id}`, data);
        } else {
          response = await axiosInstance.post('/admin/sites', data);
        }
      }

      message.success(isEdit ? 'Cập nhật trang web thành công' : 'Tạo trang web thành công');
      navigate('/admin/sites');
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Có lỗi xảy ra';
      message.error(errorMsg);
      console.error('Error saving site:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // Helper function to convert file to base64
  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  const handleDomainChange = (index, value) => {
    const newDomains = [...domains];
    newDomains[index] = value;
    setDomains(newDomains);
  };

  const addDomain = () => {
    setDomains([...domains, '']);
  };

  const removeDomain = (index) => {
    if (domains.length > 1) {
      const newDomains = domains.filter((_, i) => i !== index);
      setDomains(newDomains);
    }
  };

  const handleLogoChange = (info) => {
    let fileList = [...info.fileList];
    fileList = fileList.slice(-1); // Only keep the last uploaded file
    setLogoFileList(fileList);
  };

  const beforeUpload = (file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('Chỉ có thể tải lên file hình ảnh!');
      return false;
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('Kích thước file phải nhỏ hơn 2MB!');
      return false;
    }
    return true;
  };

  return (
    <Card loading={loading}>
      <div style={{ marginBottom: 16 }}>
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/admin/sites')}
          style={{ marginRight: 16 }}
        >
          Quay lại
        </Button>
        <Title level={3} style={{ display: 'inline', margin: 0 }}>
          {isEdit ? 'Chỉnh sửa trang web' : 'Thêm trang web mới'}
        </Title>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          status: 'active',
          theme_config: {
            primary_color: '#1890ff',
            secondary_color: '#f0f0f0',
            logo_position: 'left',
            custom_css: '',
          }
        }}
      >
        <Row gutter={24}>
          <Col span={16}>
            <Card title="Thông tin cơ bản" style={{ marginBottom: 16 }}>
              <Form.Item
                label="Tên trang web"
                name="name"
                rules={[
                  { required: true, message: 'Vui lòng nhập tên trang web!' },
                  { min: 2, message: 'Tên trang web phải có ít nhất 2 ký tự!' }
                ]}
              >
                <Input placeholder="Nhập tên trang web" />
              </Form.Item>

              <Form.Item
                label="Mô tả"
                name="description"
              >
                <TextArea rows={3} placeholder="Nhập mô tả trang web" />
              </Form.Item>

              <Form.Item
                label="Trạng thái"
                name="status"
                rules={[{ required: true, message: 'Vui lòng chọn trạng thái!' }]}
              >
                <Select>
                  <Option value="active">Hoạt động</Option>
                  <Option value="inactive">Không hoạt động</Option>
                  <Option value="maintenance">Bảo trì</Option>
                </Select>
              </Form.Item>
            </Card>

            <Card title="Tên miền" style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 16 }}>
                <Text type="secondary">
                  Thêm các tên miền mà trang web này sẽ phục vụ. Tên miền đầu tiên sẽ là tên miền chính.
                </Text>
              </div>
              
              {domains.map((domain, index) => (
                <div key={index} style={{ display: 'flex', marginBottom: 8, alignItems: 'center' }}>
                  <Input
                    placeholder="ví dụ: example.com hoặc subdomain.example.com"
                    value={domain}
                    onChange={(e) => handleDomainChange(index, e.target.value)}
                    style={{ marginRight: 8 }}
                  />
                  {index === 0 && <Tag color="blue">Chính</Tag>}
                  {index > 0 && (
                    <Button 
                      type="text" 
                      danger 
                      icon={<DeleteOutlined />}
                      onClick={() => removeDomain(index)}
                    />
                  )}
                </div>
              ))}
              
              <Button
                type="dashed"
                onClick={addDomain}
                icon={<PlusOutlined />}
                style={{ width: '100%' }}
              >
                Thêm tên miền
              </Button>
            </Card>
          </Col>

          <Col span={8}>
            <Card title="Logo" style={{ marginBottom: 16 }}>
              <Form.Item>
                <Upload
                  name="logo"
                  listType="picture-card"
                  fileList={logoFileList}
                  onChange={handleLogoChange}
                  beforeUpload={beforeUpload}
                  maxCount={1}
                >
                  {logoFileList.length === 0 && (
                    <div>
                      <UploadOutlined />
                      <div style={{ marginTop: 8 }}>Tải lên logo</div>
                    </div>
                  )}
                </Upload>
              </Form.Item>
            </Card>

            <Card title="Cấu hình giao diện">
              <Form.Item
                label="Màu chính"
                name={['theme_config', 'primary_color']}
              >
                <ColorPicker showText />
              </Form.Item>

              <Form.Item
                label="Màu phụ"
                name={['theme_config', 'secondary_color']}
              >
                <ColorPicker showText />
              </Form.Item>

              <Form.Item
                label="Vị trí logo"
                name={['theme_config', 'logo_position']}
              >
                <Select>
                  <Option value="left">Trái</Option>
                  <Option value="center">Giữa</Option>
                  <Option value="right">Phải</Option>
                </Select>
              </Form.Item>

              <Form.Item
                label="CSS tùy chỉnh"
                name={['theme_config', 'custom_css']}
              >
                <TextArea 
                  rows={4} 
                  placeholder="/* CSS tùy chỉnh cho trang web */"
                  style={{ fontFamily: 'monospace' }}
                />
              </Form.Item>

              <Form.Item
                label="URL Iframe Homepage"
                name={['settings', 'iframeUrl']}
              >
                <Input 
                  placeholder="https://example.com/homepage"
                  addonBefore="🌐"
                />
              </Form.Item>
            </Card>
          </Col>
        </Row>

        <div style={{ marginTop: 24, textAlign: 'right' }}>
          <Space>
            <Button onClick={() => navigate('/admin/sites')}>
              Hủy
            </Button>
            <Button type="primary" htmlType="submit" loading={submitting}>
              {isEdit ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </Space>
        </div>
      </Form>
    </Card>
  );
};

export default SiteForm;
