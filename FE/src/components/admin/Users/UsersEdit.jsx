import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Button, Input, Form, Spin, Select, Switch, Tag, Space, Card, Tooltip, Modal, Table, Popconfirm } from 'antd';
import instance from "../../../utils/axiosInstance";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { uploadFileCloudinary } from "../../admin/libs/uploadImageCloud";
import { InfoCircleOutlined, UserOutlined, MailOutlined, PhoneOutlined, EnvironmentOutlined, PlusOutlined, EditOutlined, DeleteOutlined, CopyOutlined } from '@ant-design/icons';

const { Option } = Select;

const UsersEdit = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const queryClient = useQueryClient();
    const [avatar, setAvatar] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isInfoModalVisible, setIsInfoModalVisible] = useState(false);
    const [editingInfo, setEditingInfo] = useState(null);
    const [infoForm] = Form.useForm();
    const [isCopied, setIsCopied] = useState(false);

    const { control, handleSubmit, setValue, reset, formState: { errors } } = useForm();

    // Query để lấy dữ liệu user
    const { data: userData, isLoading: isFetchingUser } = useQuery({
        queryKey: ['user', id],
        queryFn: async () => {
            const { data } = await instance.get(`/user/${id}`);
            return data.data;
        },
    });

    // Query để lấy danh sách dịch vụ
    const { data: servicesData } = useQuery({
        queryKey: ['services'],
        queryFn: async () => {
            const { data } = await instance.get('/service');
            return data;
        },
    });

    useEffect(() => {
        if (userData) {
            reset({
                email: userData.email,
                name: userData.name,
                phone: userData.phone,
                role: userData.role,
                active: userData.active,
                service: userData.service?.map(s => ({
                    id: s.service._id,
                    status: s.status
                })) || [],
                address: userData.address
            });
            if (userData.avatar) setAvatar(userData.avatar);
        }
    }, [userData, reset]);

    const mutation = useMutation({
        mutationFn: async (userData) => {
            const { data } = await instance.put(`/user/${id}`, userData);
            return data;
        },
        onSuccess: () => {
            toast.success("Thông tin người dùng đã được cập nhật thành công!");
            navigate("/admin");
        },
        onError: (error) => {
            console.error("Error updating user:", error);
            toast.error(error.response?.data?.message || "Không thể cập nhật thông tin người dùng");
        },
    });

    const uploadMutation = useMutation({
        mutationFn: uploadFileCloudinary,
        onSuccess: (data) => {
            setValue('avatar', data);
            setAvatar(data);
            toast.success("Ảnh đại diện đã được cập nhật!");
        },
        onError: (error) => {
            console.error("Error uploading image:", error);
            toast.error("Không thể tải ảnh lên");
        },
    });

    // Add information mutation
    const addInfoMutation = useMutation({
        mutationFn: async (values) => {
            const response = await instance.post('/user/information', {
                ...values,
                userId: id
            });
            return response.data;
        },
        onSuccess: () => {
            toast.success('Thêm thông tin thành công');
            queryClient.invalidateQueries(['user', id]);
            setIsInfoModalVisible(false);
            infoForm.resetFields();
        },
        onError: (error) => {
            toast.error('Thêm thông tin thất bại: ' + error.message);
        }
    });

    // Update information mutation
    const updateInfoMutation = useMutation({
        mutationFn: async ({ id: infoId, values }) => {
            const response = await instance.put(`/user/information/${infoId}`, {
                ...values,
                userId: id
            });
            return response.data;
        },
        onSuccess: () => {
            toast.success('Cập nhật thông tin thành công');
            queryClient.invalidateQueries(['user', id]);
            setIsInfoModalVisible(false);
            infoForm.resetFields();
            setEditingInfo(null);
        },
        onError: (error) => {
            toast.error('Cập nhật thông tin thất bại: ' + error.message);
        }
    });

    // Delete information mutation
    const deleteInfoMutation = useMutation({
        mutationFn: (infoId) => instance.delete(`/user/information/${infoId}`),
        onSuccess: () => {
            queryClient.invalidateQueries(['user', id]);
            toast.success("Thông tin đã được xóa thành công!");
        },
        onError: (error) => {
            toast.error("Không thể xóa thông tin: " + error.message);
        }
    });

    const onSubmit = (data) => {
        setIsLoading(true);
        console.log('Form data before submission:', data); // Debug log

        // Create update data object
        const updateData = {
            ...data,
            avatar
        };

        // Only include password if it's not empty
        if (data.password && data.password.trim() !== '') {
            updateData.password = data.password;
        }

        console.log('Update data being sent:', updateData); // Debug log

        mutation.mutate(updateData, {
            onSuccess: (response) => {
                console.log('Update successful:', response); // Debug log
                toast.success("Thông tin người dùng đã được cập nhật thành công!");
                navigate("/admin");
            },
            onError: (error) => {
                console.error("Error updating user:", error);
                toast.error(error.response?.data?.message || "Không thể cập nhật thông tin người dùng");
            },
            onSettled: () => setIsLoading(false)
        });
    };

    const handleImageChange = async ({ target }) => {
        if (target.files.length > 0) {
            const file = target.files[0];
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                toast.error("Kích thước ảnh không được vượt quá 5MB");
                return;
            }
            setAvatar(URL.createObjectURL(file));
            uploadMutation.mutate(file);
        }
    };

    const handleAddInfo = () => {
        setEditingInfo(null);
        infoForm.resetFields();
        setIsInfoModalVisible(true);
    };

    const handleEditInfo = (info) => {
        setEditingInfo(info);
        infoForm.setFieldsValue({
            code: info.code,
            title: info.title,
            description: info.description
        });
        setIsInfoModalVisible(true);
    };

    const handleDeleteInfo = (infoId) => {
        deleteInfoMutation.mutate(infoId);
    };

    const handleInfoModalOk = () => {
        infoForm.validateFields().then(values => {
            if (editingInfo) {
                updateInfoMutation.mutate({ id: editingInfo._id, values });
            } else {
                addInfoMutation.mutate(values);
            }
        });
    };

    const infoColumns = [
        {
            title: "Mã",
            dataIndex: "code",
            key: "code",
            width: 450,
            render: (text) => (
                <span>{text?.length > 50 ? `${text.substring(0, 50)}...` : text}</span>
            ),
        },
        {
            title: "Tiêu đề",
            dataIndex: "title",
            key: "title",
            width: 150,
        },
        {
            title: "Mô tả",
            dataIndex: "description",
            key: "description",
            width: 200,
            render: (text) => (
                <span>{text?.length > 50 ? `${text.substring(0, 50)}...` : text}</span>
            ),
        },
        {
            title: "Thao tác",
            key: "action",
            width: 120,
            render: (_, record) => (
                <Space>
                    <Button 
                        type="primary" 
                        icon={<EditOutlined />} 
                        onClick={() => handleEditInfo(record)}
                        size="small"
                    />
                    <Popconfirm
                        title="Bạn có chắc chắn muốn xóa thông tin này?"
                        onConfirm={() => handleDeleteInfo(record._id)}
                        okText="Có"
                        cancelText="Không"
                    >
                        <Button 
                            type="primary" 
                            danger
                            icon={<DeleteOutlined />} 
                            size="small"
                            loading={deleteInfoMutation.isPending && deleteInfoMutation.variables === record._id}
                        />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    if (isFetchingUser) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div className="p-4 bg-white rounded-lg shadow">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Sửa thông tin người dùng</h1>
                <Link to="/admin">
                    <Button type="default">Quay lại</Button>
                </Link>
            </div>
            <Form onFinish={handleSubmit(onSubmit)} layout="vertical">
                <div className="flex flex-col md:flex-row gap-6">
                    <div className="md:w-1/3">
                        <Card className="text-center">
                            <div className="w-32 h-32 mx-auto mb-4">
                                <img
                                    src={avatar || 'https://t4.ftcdn.net/jpg/04/73/25/49/360_F_473254957_bxG9yf4ly7OBO5I0O5KABlN930GwaMQz.jpg'}
                                    alt="Avatar preview"
                                    className="w-full h-full object-cover rounded-full"
                                />
                            </div>
                            <div className="flex flex-col">
                                <input
                                    type="file"
                                    id="file"
                                    accept="image/jpg, image/jpeg, image/png"
                                    onChange={handleImageChange}
                                    className="py-3.5 px-7 text-base font-medium text-indigo-100 focus:outline-none bg-[#202142] rounded-lg border border-indigo-200 hover:bg-indigo-900 focus:z-10 focus:ring-4 focus:ring-indigo-200 cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                />
                                <p className="text-sm text-gray-500 mt-2">Kích thước tối đa: 5MB</p>
                            </div>
                        </Card>
                    </div>
                    <div className="md:w-2/3">
                        <Card>
                            <Form.Item
                                label={
                                    <Space>
                                        <span>Email</span>
                                        <Tooltip title="Email sẽ được sử dụng để đăng nhập">
                                            <InfoCircleOutlined />
                                        </Tooltip>
                                    </Space>
                                }
                                required
                                validateStatus={errors.email ? "error" : ""}
                                help={errors.email?.message}
                            >
                                <Controller
                                    name="email"
                                    control={control}
                                    rules={{
                                        required: 'Email không được bỏ trống',
                                        pattern: {
                                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                            message: 'Email không hợp lệ'
                                        }
                                    }}
                                    render={({ field }) => (
                                        <Input 
                                            {...field} 
                                            prefix={<MailOutlined />}
                                            placeholder="Nhập email của người dùng"
                                        />
                                    )}
                                />
                            </Form.Item>

                            <Form.Item
                                label={
                                    <Space>
                                        <span>Tên</span>
                                        <Tooltip title="Tên hiển thị của người dùng">
                                            <InfoCircleOutlined />
                                        </Tooltip>
                                    </Space>
                                }
                                required
                                validateStatus={errors.name ? "error" : ""}
                                help={errors.name?.message}
                            >
                                <Controller
                                    name="name"
                                    control={control}
                                    rules={{
                                        required: 'Tên không được bỏ trống',
                                        minLength: { value: 2, message: 'Tên phải có ít nhất 2 ký tự' }
                                    }}
                                    render={({ field }) => (
                                        <Input 
                                            {...field} 
                                            prefix={<UserOutlined />}
                                            placeholder="Nhập tên người dùng"
                                        />
                                    )}
                                />
                            </Form.Item>

                            <Form.Item
                                label={
                                    <Space>
                                        <span>Số điện thoại</span>
                                        <Tooltip title="Số điện thoại liên hệ">
                                            <InfoCircleOutlined />
                                        </Tooltip>
                                    </Space>
                                }
                                validateStatus={errors.phone ? "error" : ""}
                                help={errors.phone?.message}
                            >
                                <Controller
                                    name="phone"
                                    control={control}
                                    rules={{
                                        pattern: {
                                            value: /^[0-9]{10}$/,
                                            message: 'Số điện thoại không hợp lệ'
                                        }
                                    }}
                                    render={({ field }) => (
                                        <Input 
                                            {...field} 
                                            prefix={<PhoneOutlined />}
                                            placeholder="Nhập số điện thoại"
                                        />
                                    )}
                                />
                            </Form.Item>
                             <Form.Item
                                label={
                                    <Space>
                                        <span>Mật khẩu</span>
                                        <Tooltip title="Để trống nếu không muốn thay đổi mật khẩu">
                                            <InfoCircleOutlined />
                                        </Tooltip>
                                    </Space>
                                }
                                validateStatus={errors.password ? "error" : ""}
                                help={errors.password?.message}
                            >
                                <Controller
                                    name="password"
                                    control={control}
                                    rules={{
                                        minLength: { 
                                            value: 6, 
                                            message: 'Mật khẩu phải có ít nhất 6 ký tự' 
                                        },
                                        pattern: {
                                            value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z0-9!@#$%^&*()_+\-\[\]{};':"\\|,.<>/?]{6,}$/,
                                            message: 'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số'
                                        }
                                    }}
                                    render={({ field }) => (
                                        <Input.Password 
                                            {...field} 
                                            placeholder="Nhập mật khẩu mới"
                                            visibilityToggle
                                        />
                                    )}
                                />
                            </Form.Item>

                            <Form.Item
                                label={
                                    <Space>
                                        <span>Địa chỉ</span>
                                        <Tooltip title="Địa chỉ liên hệ của người dùng">
                                            <InfoCircleOutlined />
                                        </Tooltip>
                                    </Space>
                                }
                                validateStatus={errors.address ? "error" : ""}
                                help={errors.address?.message}
                            >
                                <Controller
                                    name="address"
                                    control={control}
                                    render={({ field }) => (
                                        <Input 
                                            {...field} 
                                            prefix={<EnvironmentOutlined />}
                                            placeholder="Nhập địa chỉ của người dùng"
                                        />
                                    )}
                                />
                            </Form.Item>

                            <Form.Item
                                label="Vai trò"
                                required
                                validateStatus={errors.role ? "error" : ""}
                                help={errors.role?.message}
                            >
                                <Controller
                                    name="role"
                                    control={control}
                                    rules={{ required: 'Vai trò không được bỏ trống' }}
                                    render={({ field }) => (
                                        <Select {...field}>
                                            <Option value="admin">Admin</Option>
                                            <Option value="member">Member</Option>
                                        </Select>
                                    )}
                                />
                            </Form.Item>

                            <Form.Item
                                label="Trạng thái hoạt động"
                                validateStatus={errors.active ? "error" : ""}
                                help={errors.active?.message}
                            >
                                <Controller
                                    name="active"
                                    control={control}
                                    render={({ field }) => (
                                        <Switch
                                            checked={field.value}
                                            onChange={field.onChange}
                                        
                                        />
                                    )}
                                />
                            </Form.Item>
                        </Card>

                        <Card className="mt-4">
                            <Form.Item
                                label="Dịch vụ"
                                validateStatus={errors.service ? "error" : ""}
                                help={errors.service?.message}
                            >
                                <Controller
                                    name="service"
                                    control={control}
                                    render={({ field }) => (
                                        <>
                                            <Select
                                                mode="multiple"
                                                placeholder="Chọn dịch vụ"
                                                value={field.value?.map(s => s.id)}
                                                onChange={(values) => {
                                                    const newServices = values.map(id => ({
                                                        id,
                                                        status: field.value?.find(s => s.id === id)?.status || 'waiting'
                                                    }));
                                                    field.onChange(newServices);
                                                }}
                                            >
                                                {servicesData?.data?.docs?.map((service, idx) => (
                                                    <Option key={`${service._id}_${service.customSlug || service.createdAt || idx}`} value={service._id}>
                                                        {service.name}
                                                    </Option>
                                                ))}
                                            </Select>
                                            <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                                                <h3 className="text-lg font-semibold mb-3">Thông tin dịch vụ đã chọn:</h3>
                                                <div className="space-y-4">
                                                    {field.value?.map((service, idx) => {
                                                        const serviceInfo = servicesData?.data?.docs?.find(s => s?._id === (service?.id || service?.service?._id)) || service?.service;
                                                        return serviceInfo ? (
                                                            <div key={`${serviceInfo._id}_${serviceInfo.customSlug || serviceInfo.createdAt || idx}`} className="p-4 border rounded-md bg-white shadow-sm hover:shadow-md transition-shadow">
                                                                <div className="flex gap-4">
                                                                    <div className="w-24 h-24 flex-shrink-0">
                                                                        <img 
                                                                            src={serviceInfo?.image || 'https://t4.ftcdn.net/jpg/04/73/25/49/360_F_473254957_bxG9yf4ly7OBO5I0O5KABlN930GwaMQz.jpg'} 
                                                                            alt={serviceInfo?.name}
                                                                            className="w-full h-full object-cover rounded-lg"
                                                                        />
                                                                    </div>
                                                                    <div className="flex-grow">
                                                                        <div className="grid grid-cols-2 gap-3">
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="font-medium text-gray-700">ID:</span>
                                                                                <span className="text-gray-600 text-sm">{serviceInfo?._id}</span>
                                                                            </div>
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="font-medium text-gray-700">Tên:</span>
                                                                                <Tag color="blue" className="text-sm">{serviceInfo?.name}</Tag>
                                                                            </div>
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="font-medium text-gray-700">Trạng thái:</span>
                                                                                <Tag color={serviceInfo?.status ? "green" : "red"} className="text-sm">
                                                                                    {serviceInfo?.status ? "Hoạt động" : "Không hoạt động"}
                                                                                </Tag>
                                                                            </div>
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="font-medium text-gray-700">Xác nhận:</span>
                                                                                <Tag color={service?.status === "waiting" ? "orange" : "green"} className="text-sm">
                                                                                    {service?.status === "waiting" ? "Chưa xác nhận" : "Đã xác nhận"}
                                                                                </Tag>
                                                                            </div>
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="font-medium text-gray-700">Đường dẫn:</span>
                                                                                <a 
                                                                                    href={`/service/slug/${serviceInfo?.slug}`}
                                                                                    target="_blank"
                                                                                    rel="noopener noreferrer"
                                                                                    className="text-blue-600 hover:text-blue-800 hover:underline text-sm"
                                                                                >
                                                                                    {serviceInfo?.slug}
                                                                                </a>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ) : null;
                                                    })}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                />
                            </Form.Item>
                        </Card>

                        <Card className="mt-4">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-semibold">Thông tin bổ sung</h2>
                                <Button 
                                    type="primary" 
                                    icon={<PlusOutlined />}
                                    onClick={handleAddInfo}
                                >
                                    Thêm thông tin
                                </Button>
                            </div>
                            <Table
                                columns={infoColumns}
                                dataSource={userData?.information || []}
                                rowKey={(record, idx) => `${record._id}_${idx}`}
                                pagination={false}
                            />
                        </Card>

                        <div className="mt-4 flex justify-end">
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={isLoading || mutation.isPending || uploadMutation.isPending}
                                disabled={isLoading || mutation.isPending || uploadMutation.isPending}
                                className="bg-blue-500"
                            >
                                {isLoading || mutation.isPending ? "Đang Cập nhật..." : "Cập nhật"}
                            </Button>
                        </div>
                    </div>
                </div>
            </Form>

            {/* Information Modal */}
            <Modal
                title={editingInfo ? "Sửa thông tin" : "Thêm thông tin mới"}
                open={isInfoModalVisible}
                onOk={handleInfoModalOk}
                onCancel={() => {
                    setIsInfoModalVisible(false);
                    infoForm.resetFields();
                    setEditingInfo(null);
                }}
                confirmLoading={addInfoMutation.isPending || updateInfoMutation.isPending}
                width={800}
                bodyStyle={{ padding: '24px' }}
            >
                <Form
                    form={infoForm}
                    layout="vertical"
                    size="large"
                >
                    <Form.Item
                        name="code"
                        label="Mã"
                        rules={[{ required: true, message: 'Vui lòng nhập mã!' }]}
                    >
                        <Input 
                            style={{ fontSize: '16px' }} 
                            suffix={
                                editingInfo ? (
                                    <Button
                                        type="text"
                                        icon={isCopied ? null : <CopyOutlined />}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const codeValue = infoForm.getFieldValue('code');
                                            if (codeValue) {
                                                navigator.clipboard.writeText(codeValue);
                                                setIsCopied(true);
                                                setTimeout(() => {
                                                    setIsCopied(false);
                                                }, 2000);
                                            }
                                        }}
                                    >
                                        {isCopied ? 'Đã sao chép' : null}
                                    </Button>
                                ) : null
                            }
                        />
                    </Form.Item>
                    <Form.Item
                        name="title"
                        label="Tiêu đề"
                        rules={[{ required: true, message: 'Vui lòng nhập tiêu đề!' }]}
                    >
                        <Input style={{ fontSize: '16px' }} />
                    </Form.Item>
                    <Form.Item
                        name="description"
                        label="Mô tả"
                    >
                        <Input.TextArea rows={6} style={{ fontSize: '16px' }} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}

export default UsersEdit;