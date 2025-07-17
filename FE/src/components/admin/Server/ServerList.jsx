import React, { useEffect, useState } from 'react';
import { Table, Button, Tag, Modal, Popconfirm, Space, Select, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import axios from '../../../api/axiosConfig';
import ServerForm from './ServerForm';

const { Option } = Select;

const statusColors = {
  active: 'green',
  inactive: 'red',
  maintenance: 'orange',
};

const ServerList = () => {
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingServer, setEditingServer] = useState(null);
  const [users, setUsers] = useState([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [viewServer, setViewServer] = useState(null);

  // Fetch servers
  const fetchServers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      const res = await axios.get('/server', { params });
      setServers(res.data.data || []);
    } catch {
      // handle error (bỏ qua)
    }
    setLoading(false);
  };

  // Fetch users for select
  const fetchUsers = async () => {
    try {
      const res = await axios.get('/user', { params: { limit: 100 } });
      setUsers(res.data.data?.docs || []);
    } catch {
      // handle error (bỏ qua)
    }
  };

  useEffect(() => {
    fetchServers();
  }, [filterStatus]);

  useEffect(() => {
    fetchUsers();
  }, []);

  // Add or update server
  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      if (editingServer) {
        await axios.put(`/server/${editingServer._id}`, values);
      } else {
        await axios.post('/server', values);
      }
      setModalOpen(false);
      setEditingServer(null);
      fetchServers();
    } catch {
      // handle error (bỏ qua)
    }
    setLoading(false);
  };

  // Delete server
  const handleDelete = async (id) => {
    setLoading(true);
    try {
      await axios.delete(`/server/${id}`);
      fetchServers();
    } catch {
      // handle error (bỏ qua)
    }
    setLoading(false);
  };

  // Table columns
  const columns = [
    {
      title: 'User',
      dataIndex: 'userId',
      key: 'userId',
      render: (user) => user ? (
        <Tooltip title={user.email}><span>{user.name}</span></Tooltip>
      ) : '-',
    },
    {
      title: 'Link',
      dataIndex: 'link',
      key: 'link',
      render: (text) => <a href={text} target="_blank" rel="noopener noreferrer">{text}</a>,
    },
    {
      title: 'API Code',
      dataIndex: 'apiCode',
      key: 'apiCode',
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color={statusColors[status] || 'default'}>{status}</Tag>,
      filters: [
        { text: 'Hoạt động', value: 'active' },
        { text: 'Ngừng hoạt động', value: 'inactive' },
        { text: 'Bảo trì', value: 'maintenance' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => date ? new Date(date).toLocaleString('vi-VN') : '',
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button icon={<EyeOutlined />} onClick={() => setViewServer(record)} />
          <Button icon={<EditOutlined />} onClick={() => { setEditingServer(record); setModalOpen(true); }} />
          <Popconfirm title="Xóa server này?" onConfirm={() => handleDelete(record._id)}>
            <Button icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Quản lý Server</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingServer(null); setModalOpen(true); }}>
          Thêm server
        </Button>
      </div>
      <div className="mb-4">
        <Select
          placeholder="Lọc theo trạng thái"
          allowClear
          style={{ width: 200 }}
          value={filterStatus || undefined}
          onChange={setFilterStatus}
        >
          <Option value="active">Hoạt động</Option>
          <Option value="inactive">Ngừng hoạt động</Option>
          <Option value="maintenance">Bảo trì</Option>
        </Select>
      </div>
      <Table
        columns={columns}
        dataSource={servers}
        rowKey="_id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
      <Modal
        open={modalOpen}
        title={editingServer ? 'Sửa server' : 'Thêm server'}
        onCancel={() => { setModalOpen(false); setEditingServer(null); }}
        footer={null}
        destroyOnClose
      >
        <ServerForm
          initialValues={editingServer || { status: 'active' }}
          onSubmit={handleSubmit}
          loading={loading}
          users={users}
        />
      </Modal>
      <Modal
        open={!!viewServer}
        title="Chi tiết server"
        onCancel={() => setViewServer(null)}
        footer={null}
      >
        {viewServer && (
          <div>
            <p><b>User:</b> {viewServer.userId?.name} ({viewServer.userId?.email})</p>
            <p><b>Link:</b> <a href={viewServer.link} target="_blank" rel="noopener noreferrer">{viewServer.link}</a></p>
            <p><b>API Code:</b> {viewServer.apiCode}</p>
            <p><b>Mô tả:</b> {viewServer.description}</p>
            <p><b>Trạng thái:</b> <Tag color={statusColors[viewServer.status]}>{viewServer.status}</Tag></p>
            <p><b>Ngày tạo:</b> {viewServer.createdAt ? new Date(viewServer.createdAt).toLocaleString('vi-VN') : ''}</p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ServerList; 