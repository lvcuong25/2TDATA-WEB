import React, { useState, useEffect, useContext } from "react";
import { toast } from "react-toastify";
import { Button, Input, Form, Spin, Select, Switch, Tag, Space, Card, Tooltip, Modal, Table, Popconfirm } from 'antd';
import instance from "../../../utils/axiosInstance-cookie-only";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { uploadFileCloudinary } from "../../admin/libs/uploadImageCloud";
import { InfoCircleOutlined, UserOutlined, MailOutlined, PhoneOutlined, EnvironmentOutlined, PlusOutlined, EditOutlined, DeleteOutlined, CopyOutlined } from '@ant-design/icons';
import { AuthContext } from '../../core/Auth';

const { Option } = Select;

const UsersEdit = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const queryClient = useQueryClient();
    const authContext = useContext(AuthContext);
    const currentUser = authContext?.currentUser;
    const [avatar, setAvatar] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isInfoModalVisible, setIsInfoModalVisible] = useState(false);
    const [editingInfo, setEditingInfo] = useState(null);
    const [infoForm] = Form.useForm();
    const [isCopied, setIsCopied] = useState(false);
    const [assignableRoles, setAssignableRoles] = useState([]);
    const [availableSites, setAvailableSites] = useState([]);
    const [showSiteSelect, setShowSiteSelect] = useState(false);
    const [pageSize, setPageSize] = useState(5);
    const [currentPage, setCurrentPage] = useState(1);

    const { control, handleSubmit, setValue, reset, watch, formState: { errors } } = useForm();
    const selectedRole = watch('role');

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

    // Query để lấy role metadata và sites
    const { data: metadataResponse, isLoading: metadataLoading } = useQuery({
        queryKey: ['USER_FORM_METADATA'],
        queryFn: async () => {
            const { data } = await instance.get('/admin/metadata/user-form');
            return data;
        },
        staleTime: 5 * 60 * 1000,
    });

    useEffect(() => {
        if (userData) {
            reset({
                email: userData.email,
                name: userData.name,
                phone: userData.phone,
                role: userData?.role,
                site_id: userData.site_id?._id,
                active: userData.active,
                service: userData.service?.map(s => ({
                    id: s.service._id,
                    status: s.status
                })) || [],
                address: userData.address
            });
            if (userData.avatar) setAvatar(userData.avatar);
            
            // Show site select if user has a site and is not super_admin
            if (userData?.role !== 'super_admin' && userData.site_id) {
                setShowSiteSelect(true);
            }
        }
    }, [userData, reset]);

    useEffect(() => {
        if (metadataResponse) {
            setAssignableRoles(metadataResponse.assignableRoles || []);
            setAvailableSites(metadataResponse.availableSites || []);
        }
    }, [metadataResponse]);

    useEffect(() => {
        // Show/hide site selection based on selected role
        if (selectedRole) {
            setShowSiteSelect(selectedRole !== 'super_admin' && availableSites.length > 0);
        }
    }, [selectedRole, availableSites]);

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
        // Debug log

        // Create update data object
        const updateData = {
            ...data,
            avatar
        };

        // Only include password if it's not empty
        if (data.password && data.password.trim() !== '') {
            updateData.password = data.password;
        }

        // Debug log

        mutation.mutate(updateData, {
            onSuccess: (response) => {
                // Debug log
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
                <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
                    {/* Left Column - Avatar & Basic Info */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Avatar Section */}
                        <Card className="text-center">
                            <div className="w-24 h-24 mx-auto mb-4">
                                <img
                                    src={avatar && avatar.trim() !== ""
              ? avatar
              : 'https://t4.ftcdn.net/jpg/04/73/25/49/360_F_473254957_bxG9yf4ly7OBO5I0O5KABlN930GwaMQz.jpg'}
                                    alt="Avatar preview"
                                    className="w-full h-full object-cover rounded-full border-2 border-gray-200 shadow-md"
                                />
                            </div>
                            <div className="space-y-4">
                                <div className="relative">
                                    <input
                                        type="file"
                                        id="file"
                                        accept="image/jpg, image/jpeg, image/png"
                                        onChange={handleImageChange}
                                        className="hidden"
                                        style={{ display: 'none' }}
                                    />
                                    <label 
                                        htmlFor="file"
                                        className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer transition-colors"
                                    >
                                        <span>📷</span>
                                        <span className="ml-2">Thay đổi ảnh</span>
                                    </label>
                                </div>
                                <p className="text-xs text-gray-500">Kích thước tối đa: 5MB</p>
                                {uploadMutation.isPending && (
                                    <div className="text-blue-600 text-sm">
                                        <Spin size="small" /> Đang tải ảnh...
                                    </div>
                                )}
                            </div>
                        </Card>

                        {/* Account Information */}
                        <Card title="Thông tin tài khoản" className="shadow-sm">
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
                        </Card>

                        {/* Personal Information */}
                        <Card title="Thông tin cá nhân" className="shadow-sm">
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
                        </Card>

                        {/* Role & Site Information */}
                        <Card title="Quyền hạn & Site" className="shadow-sm">
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
                                        <Select 
                                            {...field}
                                            loading={metadataLoading}
                                            placeholder={metadataLoading ? "Đang tải..." : "Chọn vai trò"}
                                            onChange={(value) => {
                                                field.onChange(value);
                                                // Show site selection for non-super_admin roles
                                                setShowSiteSelect(value !== 'super_admin' && availableSites.length > 0);
                                            }}
                                        >
                                            {metadataLoading ? (
                                                <Option value="" disabled>Đang tải danh sách vai trò...</Option>
                                            ) : assignableRoles.length > 0 ? (
                                                assignableRoles.map(role => (
                                                    <Option key={role.value} value={role.value}>
                                                        <span style={{ color: role.color }}>
                                                            {role.label}
                                                        </span>
                                                    </Option>
                                                ))
                                            ) : (
                                                <Option value="" disabled>Không có vai trò nào có thể gán</Option>
                                            )}
                                        </Select>
                                    )}
                                />
                            </Form.Item>

                            {/* Site selection - only show if needed */}
                            {showSiteSelect && (
                                <Form.Item 
                                    label="Site" 
                                    required
                                    validateStatus={errors.site_id ? "error" : ""}
                                    help={errors.site_id?.message}
                                >
                                    <Controller
                                        name="site_id"
                                        control={control}
                                        rules={{ 
                                            required: selectedRole !== 'super_admin' ? 'Site không được bỏ trống' : false 
                                        }}
                                        render={({ field }) => (
                                            <Select 
                                                {...field}
                                                placeholder="Chọn site"
                                            >
                                                {availableSites.map(site => (
                                                    <Option key={site.value} value={site.value}>
                                                        {site.label}
                                                        {site.domains && site.domains.length > 0 && (
                                                            <span className="text-gray-500 text-sm ml-2">
                                                                ({site.domains[0]})
                                                            </span>
                                                        )}
                                                    </Option>
                                                ))}
                                            </Select>
                                        )}
                                    />
                                </Form.Item>
                            )}

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
                    </div>

                    {/* Right Column - Services & Additional Info */}
                    <div className="lg:col-span-6 space-y-6">
                        <Card className="mt-4">
                            <h3 className="text-lg font-semibold mb-4">Dịch vụ hiện tại:</h3>
                            <Table
                                columns={[
                                    {
                                        title: "Hình ảnh",
                                        dataIndex: "image",
                                        key: "image",
                                        width: 80,
                                        render: (_, record) => (
                                            <img 
                                                src={record?.service?.image && record.service.image.trim() !== ""
              ? record.service.image
              : 'https://t4.ftcdn.net/jpg/04/73/25/49/360_F_473254957_bxG9yf4ly7OBO5I0O5KABlN930GwaMQz.jpg'} 
                                                alt={record?.service?.name}
                                                className="w-12 h-12 object-cover rounded"
                                            />
                                        ),
                                    },
                                    {
                                        title: "ID",
                                        dataIndex: ["service", "_id"],
                                        key: "id",
                                        width: 200,
                                        render: (text) => (
                                            <span className="text-xs font-mono">{text}</span>
                                        ),
                                    },
                                    {
                                        title: "Tên dịch vụ",
                                        dataIndex: ["service", "name"],
                                        key: "name",
                                        width: 150,
                                        render: (text) => (
                                            <Tag color="blue">{text}</Tag>
                                        ),
                                    },
                                    {
                                        title: "Trạng thái dịch vụ",
                                        dataIndex: ["service", "status"],
                                        key: "serviceStatus",
                                        width: 120,
                                        render: (status) => (
                                            <Tag color={status ? "green" : "red"}>
                                                {status ? "Hoạt động" : "Không hoạt động"}
                                            </Tag>
                                        ),
                                    },
                                    {
                                        title: "Xác nhận",
                                        dataIndex: "status",
                                        key: "confirmation",
                                        width: 120,
                                        render: (status) => (
                                            <Tag color={status === "waiting" ? "orange" : "green"}>
                                                {status === "waiting" ? "Chưa xác nhận" : "Đã xác nhận"}
                                            </Tag>
                                        ),
                                    },
                                    {
                                        title: "Đường dẫn",
                                        dataIndex: ["service", "slug"],
                                        key: "slug",
                                        width: 150,
                                        render: (slug) => (
                                            <a 
                                                href={`/service/slug/${slug}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:text-blue-800 hover:underline text-sm"
                                            >
                                                {slug}
                                            </a>
                                        ),
                                    },
                                ]}
                                dataSource={userData?.service || []}
                                rowKey={(record, index) => `${record?.service?._id}_${index}`}
                                pagination={{
                                    current: currentPage,
                                    pageSize: pageSize,
                                    showSizeChanger: true,
                                    showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} dịch vụ`,
                                    pageSizeOptions: [5, 10, 20],
                                    onChange: (page, pageSize) => {
                                        setCurrentPage(page);
                                        setPageSize(pageSize);
                                    },
                                }}
                                locale={{
                                    emptyText: (
                                        <div className="text-center py-8 text-gray-500">
                                            <p>Người dùng này chưa có dịch vụ nào</p>
                                        </div>
                                    )
                                }}
                                size="small"
                            />
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
                                rowKey={(record) => record._id}
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