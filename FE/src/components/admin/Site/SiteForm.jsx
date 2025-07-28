import React, { useState, useEffect, useCallback } from 'react';
import { 
  Form, Input, Select, Button, Card, message, Space, Tag, Typography, 
  Row, Col, Upload, ColorPicker, Tabs, Modal
} from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftOutlined, PlusOutlined, DeleteOutlined, UploadOutlined, EyeOutlined } from '@ant-design/icons';
import axiosInstance from '../../../axios/axiosInstance';
import DynamicFooter from '../../DynamicFooter';
import PartnerLogosManager from './PartnerLogosManager';
import { defaultFooterConfig } from '../../../config/footerConfig';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

const SiteForm = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [domains, setDomains] = useState(['']);
  const [logoFileList, setLogoFileList] = useState([]);
  const [footerConfig, setFooterConfig] = useState(defaultFooterConfig);
  const [isFooterPreviewVisible, setIsFooterPreviewVisible] = useState(false);

  const fetchSite = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/sites/${id}`);
      const site = response.data.success ? response.data.data : response.data;
      
      // Convert color strings to objects for ColorPicker
      const processedThemeConfig = {
        ...site.theme_config,
        primary_color: site.theme_config?.primary_color || '#1890ff',
        secondary_color: site.theme_config?.secondary_color || '#f0f0f0'
      };
      
      form.setFieldsValue({
        name: site.name,
        description: site.description,
        status: site.status,
        theme_config: processedThemeConfig,
        settings: site.settings || {},
        footer_config: site.footer_config || defaultFooterConfig
      });

      setDomains(site.domains?.length ? site.domains : ['']);
      setFooterConfig(site.footer_config || defaultFooterConfig);

      if (site.logo_url) {
        setLogoFileList([{
          uid: '-1',
          name: 'logo.png',
          status: 'done',
          url: site.logo_url,
        }]);
      }
    } catch (error) {
      toast.error('Không thể tải thông tin trang web');
      console.error('Error fetching site:', error);
    } finally {
      setLoading(false);
    }
  }, [id, form]);

  useEffect(() => {
    if (isEdit) {
      fetchSite();
    }
  }, [id, isEdit, fetchSite]);

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      const validDomains = domains.filter(domain => domain.trim() !== '');
      
      // Process color values
      const processedThemeConfig = {
        ...values.theme_config,
        primary_color: typeof values.theme_config?.primary_color === 'object' && values.theme_config?.primary_color?.toHexString ? 
          values.theme_config.primary_color.toHexString() : 
          values.theme_config?.primary_color || '#1890ff',
        secondary_color: typeof values.theme_config?.secondary_color === 'object' && values.theme_config?.secondary_color?.toHexString ? 
          values.theme_config.secondary_color.toHexString() : 
          values.theme_config?.secondary_color || '#f0f0f0'
      };

      // Process footer colors
      const processedFooterConfig = {
        ...footerConfig,
        styles: {
          ...footerConfig.styles,
          backgroundColor: typeof footerConfig.styles?.backgroundColor === 'object' ? 
            footerConfig.styles.backgroundColor.toHexString() : footerConfig.styles?.backgroundColor,
          textColor: typeof footerConfig.styles?.textColor === 'object' ? 
            footerConfig.styles.textColor.toHexString() : footerConfig.styles?.textColor,
          copyrightBgColor: typeof footerConfig.styles?.copyrightBgColor === 'object' ? 
            footerConfig.styles.copyrightBgColor.toHexString() : footerConfig.styles?.copyrightBgColor,
          copyrightTextColor: typeof footerConfig.styles?.copyrightTextColor === 'object' ? 
            footerConfig.styles.copyrightTextColor.toHexString() : footerConfig.styles?.copyrightTextColor,
          linkHoverColor: typeof footerConfig.styles?.linkHoverColor === 'object' ? 
            footerConfig.styles.linkHoverColor.toHexString() : footerConfig.styles?.linkHoverColor
        }
      };
      
      // Check if we have a file to upload
      const hasFileUpload = logoFileList.length > 0 && logoFileList[0].originFileObj;
      
      if (hasFileUpload) {
        const formData = new FormData();
        formData.append('name', values.name);
        formData.append('description', values.description || '');
        formData.append('status', values.status);
        formData.append('domains', JSON.stringify(validDomains));
        formData.append('theme_config', JSON.stringify(processedThemeConfig));
        formData.append('settings', JSON.stringify(values.settings || {}));
        formData.append('footer_config', JSON.stringify(processedFooterConfig));
        formData.append('logo', logoFileList[0].originFileObj);

        if (isEdit) {
          await axiosInstance.put(`/admin/sites/edit/${id}`, formData);
        } else {
          await axiosInstance.post('/admin/sites', formData);
        }
      } else {
        const data = {
          name: values.name,
          description: values.description || '',
          status: values.status,
          domains: validDomains,
          theme_config: processedThemeConfig,
          settings: values.settings || {},
          footer_config: processedFooterConfig
        };

        if (isEdit) {
          await axiosInstance.put(`/admin/sites/${id}`, data);
        } else {
          await axiosInstance.post('/admin/sites', data);
        }
      }

      toast.success(isEdit ? 'Cập nhật trang web thành công' : 'Tạo trang web thành công');
      navigate('/admin/sites');
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Có lỗi xảy ra';
      toast.error(errorMsg);
      console.error('Error saving site:', error);
    } finally {
      setSubmitting(false);
    }
  };
  
  // Handle partner logos change
  const handlePartnerLogosChange = (newLogos) => {
    setFooterConfig(prev => ({
      ...prev,
      logos: {
        ...prev.logos,
        partners: newLogos
      }
    }));
    form.setFieldsValue({
      footer_config: {
        ...form.getFieldValue('footer_config'),
        logos: {
          ...form.getFieldValue(['footer_config', 'logos']),
          partners: newLogos
        }
      }
    });
  };


  const handleFormChange = (changedValues) => {
    if (changedValues.footer_config) {
      // Deep merge for nested objects like styles
      setFooterConfig(prev => {
        const newConfig = { ...prev };
        
        // Handle nested updates
        Object.keys(changedValues.footer_config).forEach(key => {
          if (typeof changedValues.footer_config[key] === "object" && !Array.isArray(changedValues.footer_config[key])) {
            // Merge nested objects
            newConfig[key] = {
              ...prev[key],
              ...changedValues.footer_config[key]
            };
          } else {
            // Direct assignment for non-objects
            newConfig[key] = changedValues.footer_config[key];
          }
        });
        
        return newConfig;
      });
    }
  };

  const handleDomainChange = (index, value) => {
    const newDomains = [...domains];
    newDomains[index] = value;
    setDomains(newDomains);
  };

  const addDomain = () => {
    setDomains([...domains, '']);
    toast.success('Đã thêm tên miền mới!');
  };

  const removeDomain = (index) => {
    if (domains.length > 1) {
      const newDomains = domains.filter((_, i) => i !== index);
      setDomains(newDomains);
      toast.success('Đã xóa tên miền!');
    }
  };

  const handleLogoChange = (info) => {
    let fileList = [...info.fileList];
    fileList = fileList.slice(-1);
    setLogoFileList(fileList);
    if (info.file.status === 'done') {
      toast.success('Tải logo thành công!');
    } else if (info.file.status === 'error') {
      toast.error('Tải logo thất bại!');
    }
  };

  const beforeUpload = (file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      toast.error('Chỉ có thể tải lên file hình ảnh!');
      return false;
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      toast.error('Kích thước file phải nhỏ hơn 2MB!');
      return false;
    }
    return true;
  };

  return (
    <Card loading={loading}>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
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
        <Space>
          <Button icon={<EyeOutlined />} onClick={() => setIsFooterPreviewVisible(true)}>
            Xem trước Footer
          </Button>
          <Button type="primary" htmlType="submit" loading={submitting} onClick={() => form.submit()}>
            {isEdit ? 'Cập nhật' : 'Tạo mới'}
          </Button>
        </Space>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        onValuesChange={handleFormChange}
        initialValues={{ 
          status: 'active',
          theme_config: {
            primary_color: '#1890ff',
            secondary_color: '#f0f0f0',
            logo_position: 'left',
            custom_css: ''
          },
          footer_config: defaultFooterConfig 
        }}
      >
        <Tabs defaultActiveKey="1">
          <TabPane tab="Cấu hình chung" key="1">
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
          </TabPane>

          <TabPane tab="Cấu hình Footer" key="2">
            <Row gutter={24}>
              <Col span={12}>
                <Card title="Thông tin công ty">
                  <Form.Item label="Tên công ty" name={['footer_config', 'companyInfo', 'name']}>
                    <Input />
                  </Form.Item>
                  <Form.Item label="Địa chỉ" name={['footer_config', 'companyInfo', 'address']}>
                    <Input />
                  </Form.Item>
                  <Form.Item label="Hotline" name={['footer_config', 'companyInfo', 'hotline']}>
                    <Input />
                  </Form.Item>
                  <Form.Item label="Email" name={['footer_config', 'companyInfo', 'email']}>
                    <Input />
                  </Form.Item>
                  <Form.Item label="Website" name={['footer_config', 'companyInfo', 'website']}>
                    <Input />
                  </Form.Item>
                </Card>
                
                <Card title="Bản quyền" style={{marginTop: 16}}>
                  <Form.Item label="Copyright Text" name={['footer_config', 'copyright']}>
                    <Input />
                  </Form.Item>
                </Card>
              </Col>
              
              <Col span={12}>
                <Card title="Màu sắc">
                  <Form.Item label="Màu nền" name={['footer_config', 'styles', 'backgroundColor']}>
                    <ColorPicker showText/>
                  </Form.Item>
                  <Form.Item label="Màu chữ" name={['footer_config', 'styles', 'textColor']}>
                    <ColorPicker showText/>
                  </Form.Item>
                  <Form.Item label="Màu nền Copyright" name={['footer_config', 'styles', 'copyrightBgColor']}>
                    <ColorPicker showText/>
                  </Form.Item>
                  <Form.Item label="Màu chữ Copyright" name={['footer_config', 'styles', 'copyrightTextColor']}>
                    <ColorPicker showText/>
                  </Form.Item>
                  <Form.Item label="Màu hover của link" name={['footer_config', 'styles', 'linkHoverColor']}>
                    <ColorPicker showText/>
                  </Form.Item>
                </Card>
              </Col>
            </Row>
            
            <Row gutter={24} style={{marginTop: 16}}>
              <Col span={24}>
                <Card title="Tiêu đề Logo Đối tác" size="small">
                  <Form.Item label="Tiêu đề" name={["footer_config", "partnersTitle"]}>
                    <Input placeholder="Nhập tiêu đề cho phần logo đối tác (VD: Thành viên 2T Group)" />
                  </Form.Item>
                </Card>
              </Col>
            </Row>
            <Row gutter={24} style={{marginTop: 16}}>
              <Col span={24}>
                <PartnerLogosManager 
                  logos={footerConfig?.logos?.partners || []}
                  onChange={handlePartnerLogosChange}
                  siteName={form.getFieldValue("name") || "site"}
                />
              </Col>
            </Row>
          </TabPane>
        </Tabs>
      </Form>

      <Modal
        title="Xem trước Footer"
        visible={isFooterPreviewVisible}
        onCancel={() => setIsFooterPreviewVisible(false)}
        footer={null}
        width="80%"
        destroyOnClose
      >
        <div style={{ pointerEvents: 'none', marginTop: '20px' }}>
          <DynamicFooter config={footerConfig} preview={true} />
        </div>
      </Modal>
    </Card>
  );
};

export default SiteForm;
