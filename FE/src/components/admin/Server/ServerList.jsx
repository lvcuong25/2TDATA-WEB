import React, { useEffect, useState } from 'react';
import { Table, Button, Tag, Modal, Popconfirm, Space, Select, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import axios from '../../../api/axiosConfig';
import ServerForm from './ServerForm';
import './ServerList.css';

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
  // Thêm state để lưu chi tiết server khi xem
  const [serverDetail, setServerDetail] = useState(null);

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

  // Hàm lấy chi tiết server
  const fetchServerDetail = async (id) => {
    setLoading(true);
    try {
      const res = await axios.get(`/server/${id}`);
      setServerDetail(res.data.data);
    } catch {
      // handle error (bỏ qua)
    }
    setLoading(false);
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
      title: 'Người dùng',
      dataIndex: 'users',
      key: 'users',
      render: (users) => Array.isArray(users) && users.length > 0 ? `${users.length} người dùng` : '-',
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
      width: 200,
      ellipsis: true,
      render: (text) => (
        <Tooltip title={text} placement="topLeft">
          <span className="api-code-ellipsis">{text}</span>
        </Tooltip>
      ),
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      width: 220,
      ellipsis: true,
      render: (text) => (
        <Tooltip title={text} placement="topLeft">
          <span className="description-ellipsis">{text}</span>
        </Tooltip>
      ),
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
          <Button icon={<EyeOutlined />} onClick={() => { fetchServerDetail(record._id); setViewServer(record); }} />
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
        width={1200}
        bodyStyle={{ padding: 16 }}
      >
        {(() => {
          // Merge users mặc định với các user đang gán cho server (nếu chưa có)
          const allUserIds = new Set(users.map(u => u._id));
          const mergedUsers = [
            ...users,
            ...(editingServer?.users?.filter(u => !allUserIds.has(u._id)) || [])
          ];
          return (
            <ServerForm
              initialValues={editingServer ? {
                ...editingServer,
                users: Array.isArray(editingServer.users)
                  ? editingServer.users.map(u => (typeof u === 'string' ? u : u._id))
                  : []
              } : { status: 'active', users: [] }}
              onSubmit={handleSubmit}
              loading={loading}
              users={mergedUsers}
            />
          );
        })()}
      </Modal>
      <Modal
        open={!!viewServer}
        title="Chi tiết server"
        onCancel={() => { setViewServer(null); setServerDetail(null); }}
        footer={null}
        width={900}
        bodyStyle={{ padding: 32 }}
      >
        {serverDetail && (
          <div>
            <div style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12 }}>Người dùng:</div>
            {Array.isArray(serverDetail.users) && serverDetail.users.length > 0 ? (
              <div style={{ maxHeight: 340, overflow: 'auto', marginBottom: 24 }}>
                <Table
                  dataSource={serverDetail.users}
                  rowKey="_id"
                  pagination={false}
                  size="middle"
                  style={{ minWidth: 600 }}
                  columns={[
                    {
                      title: 'Tên',
                      dataIndex: 'name',
                      key: 'name',
                      render: (text, u) => (
                        <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10 }}>
                          <img
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || 'U')}&background=0D8ABC&color=fff&size=32`}
                            alt={u.name}
                            style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', background: '#e5e7eb', marginRight: 8 }}
                          />
                          {text}
                        </span>
                      )
                    },
                    {
                      title: 'Email',
                      dataIndex: 'email',
                      key: 'email',
                    },
                    {
                      title: 'Site',
                      dataIndex: ['site_id', 'name'],
                      key: 'site',
                      render: (_, u) => u.site_id && u.site_id.name ? u.site_id.name : '-',
                    },
                  ]}
                  rowClassName={() => 'custom-user-row'}
                />
              </div>
            ) : (
              <span>-</span>
            )}
            <div style={{ fontSize: 16, marginBottom: 8 }}><b>Link:</b> <a href={serverDetail.link} target="_blank" rel="noopener noreferrer">{serverDetail.link}</a></div>
            <div style={{ fontSize: 16, marginBottom: 8 }}><b>API Code:</b> {serverDetail.apiCode}</div>
            <div style={{ fontSize: 16, marginBottom: 8 }}><b>Mô tả:</b> {serverDetail.description}</div>
            <div style={{ fontSize: 16, marginBottom: 8 }}><b>Trạng thái:</b> <Tag color={statusColors[serverDetail.status]}>{serverDetail.status}</Tag></div>
            <div style={{ fontSize: 16 }}><b>Ngày tạo:</b> {serverDetail.createdAt ? new Date(serverDetail.createdAt).toLocaleString('vi-VN') : ''}</div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ServerList; 