import React, { useState } from 'react';
import { Modal, Form, Input, Button, Alert } from 'antd';
import axiosInstance from '../../axios/axiosInstance';
import { toast } from 'react-toastify';
import { AppstoreOutlined, MailOutlined, PhoneOutlined, HomeOutlined, IdcardOutlined, NumberOutlined, PictureOutlined } from '@ant-design/icons';

const RegisterOrganizationModal = ({ isOpen, onClose, onSuccess, hasOrganization, isAdmin }) => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      await axiosInstance.post('/organization', values);
      toast.success('Đăng ký tổ chức thành công!');
      onSuccess && onSuccess();
      onClose();
      form.resetFields();
    } catch (err) {
      toast.error(err?.error || 'Đăng ký tổ chức thất bại!');
    } finally {
      setLoading(false);
    }
  };

  const disableForm = hasOrganization && !isAdmin;

  return (
    <Modal
      title="Đăng ký tổ chức"
      open={isOpen}
      onCancel={() => { onClose(); form.resetFields(); }}
      footer={null}
      destroyOnHidden
      width={600}
    >
      {disableForm && (
        <Alert
          message="Bạn chỉ được đăng ký 1 tổ chức. Nếu cần thay đổi, vui lòng liên hệ quản trị viên."
          type="warning"
          showIcon
          className="mb-4"
        />
      )}
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        disabled={disableForm}
      >
        <Form.Item
          label="Tên tổ chức"
          name="name"
          rules={[{ required: true, message: 'Vui lòng nhập tên tổ chức!' }]}
          help="Nhập tên đầy đủ của tổ chức"
        >
          <Input placeholder="Tên tổ chức" prefix={<AppstoreOutlined />} />
        </Form.Item>
        <Form.Item
          label="Email liên hệ"
          name="email"
          rules={[{ required: true, message: 'Vui lòng nhập email!' }, { type: 'email', message: 'Email không hợp lệ!' }]}
          help="Email liên hệ của tổ chức"
        >
          <Input placeholder="Email liên hệ" prefix={<MailOutlined />} />
        </Form.Item>
        <Form.Item
          label="Số điện thoại liên hệ"
          name="phone"
          rules={[{ required: true, message: 'Vui lòng nhập số điện thoại!' }]}
          help="Số điện thoại liên hệ của tổ chức"
        >
          <Input placeholder="Số điện thoại liên hệ" prefix={<PhoneOutlined />} />
        </Form.Item>
        <Form.Item
          label="Địa chỉ tổ chức"
          name="address"
          rules={[{ required: true, message: 'Vui lòng nhập địa chỉ!' }]}
          help="Địa chỉ tổ chức"
        >
          <Input placeholder="Địa chỉ tổ chức" prefix={<HomeOutlined />} />
        </Form.Item>
        <Form.Item
          label="Mã định danh"
          name="identifier"
          rules={[{ pattern: /^\d{12}$/, message: 'Mã định danh phải gồm đúng 12 số!' }]}
          help="Mã định danh tổ chức gồm đúng 12 số"
        >
          <Input placeholder="Ví dụ: 012345678901" maxLength={12} prefix={<IdcardOutlined />} />
        </Form.Item>
        <Form.Item
          label="Mã số thuế"
          name="taxCode"
          rules={[{ pattern: /^(\d{10}|\d{13})$/, message: 'Mã số thuế phải gồm 10 hoặc 13 số!' }]}
          help="Mã số thuế tổ chức gồm 10 hoặc 13 số (nếu có)"
        >
          <Input placeholder="Ví dụ: 0123456789 hoặc 0123456789012" maxLength={13} prefix={<NumberOutlined />} />
        </Form.Item>
        <Form.Item
          label="Logo (URL)"
          name="logo"
          help="Đường dẫn URL logo tổ chức (nếu có)"
        >
          <Input placeholder="Logo (URL)" prefix={<PictureOutlined />} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block disabled={disableForm}>
            Đăng ký
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default RegisterOrganizationModal; 