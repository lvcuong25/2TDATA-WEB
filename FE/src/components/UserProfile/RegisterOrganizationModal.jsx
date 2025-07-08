import React, { useState } from 'react';
import { Modal, Form, Input, Button, Alert } from 'antd';
import axiosInstance from '../../axios/axiosInstance';
import { toast } from 'react-toastify';

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
      destroyOnClose
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
        >
          <Input placeholder="Tên tổ chức" />
        </Form.Item>
        <Form.Item
          label="Email liên hệ"
          name="email"
          rules={[{ required: true, message: 'Vui lòng nhập email!' }, { type: 'email', message: 'Email không hợp lệ!' }]}
        >
          <Input placeholder="Email liên hệ" />
        </Form.Item>
        <Form.Item
          label="Số điện thoại liên hệ"
          name="phone"
          rules={[{ required: true, message: 'Vui lòng nhập số điện thoại!' }]}
        >
          <Input placeholder="Số điện thoại liên hệ" />
        </Form.Item>
        <Form.Item
          label="Địa chỉ tổ chức"
          name="address"
          rules={[{ required: true, message: 'Vui lòng nhập địa chỉ!' }]}
        >
          <Input placeholder="Địa chỉ tổ chức" />
        </Form.Item>
        <Form.Item
          label="Mã định danh"
          name="identifier"
        >
          <Input placeholder="Mã định danh (nếu có)" />
        </Form.Item>
        <Form.Item
          label="Mã số thuế"
          name="taxCode"
        >
          <Input placeholder="Mã số thuế (nếu có)" />
        </Form.Item>
        <Form.Item
          label="Logo (URL)"
          name="logo"
        >
          <Input placeholder="Logo (URL)" />
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