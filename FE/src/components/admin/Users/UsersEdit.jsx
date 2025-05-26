import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Button, Input, Form, Spin, Select, Switch, Tag, Space } from 'antd';
import instance from "../../../utils/axiosInstance";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { uploadFileCloudinary } from "../../admin/libs/uploadImageCloud";

const { Option } = Select;

const UsersEdit = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [avatar, setAvatar] = useState('');
    const [isLoading, setIsLoading] = useState(false);

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
                service: userData.service?.map(s => s._id) || [],
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
        },
        onError: (error) => {
            console.error("Error uploading image:", error);
            toast.error("Không thể tải ảnh lên");
        },
    });

    const onSubmit = (data) => {
        setIsLoading(true);
        mutation.mutate({ ...data, avatar }, {
            onSettled: () => setIsLoading(false)
        });
    };

    const handleImageChange = async ({ target }) => {
        if (target.files.length > 0) {
            const file = target.files[0];
            setAvatar(URL.createObjectURL(file));
            uploadMutation.mutate(file);
        }
    };

    if (isFetchingUser) {
        return <Spin size="large" />;
    }

    return (
        <div className="p-4 bg-white rounded-lg shadow">
            <h1 className="text-2xl font-bold mb-4">Sửa thông tin người dùng</h1>
            <div className="flex justify-end mb-4">
                <Link to="/admin">
                    <Button type="default">Quay lại</Button>
                </Link>
            </div>
            <Form onFinish={handleSubmit(onSubmit)} layout="vertical">
                <div className="flex flex-col md:flex-row gap-6">
                    <div className="md:w-1/3">
                        <Form.Item label="Ảnh đại diện">
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
                            </div>
                        </Form.Item>
                    </div>
                    <div className="md:w-2/3">
                        <Form.Item
                            label="Email"
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
                                render={({ field }) => <Input {...field} />}
                            />
                        </Form.Item>

                        <Form.Item
                            label="Tên"
                            required
                            validateStatus={errors.name ? "error" : ""}
                            help={errors.name?.message}
                        >
                            <Controller
                                name="name"
                                control={control}
                                // rules={{
                                //     required: 'Tên không được bỏ trống',
                                //     minLength: { value: 2, message: 'Tên phải có ít nhất 2 ký tự' }
                                // }}
                                render={({ field }) => <Input {...field} />}
                            />
                        </Form.Item>

                        <Form.Item
                            label="Số điện thoại"
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
                                render={({ field }) => <Input {...field} />}
                            />
                        </Form.Item>

                        <Form.Item
                            label="Địa chỉ"
                            validateStatus={errors.address ? "error" : ""}
                            help={errors.address?.message}
                        >
                            <Controller
                                name="address"
                                control={control}
                                render={({ field }) => <Input {...field} placeholder="Nhập địa chỉ của người dùng" />}
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
                                        checkedChildren=""
                                        unCheckedChildren=""
                                    />
                                )}
                            />
                        </Form.Item>

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
                                            {...field}
                                        >
                                            {servicesData?.map(service => (
                                                <Option key={service._id} value={service._id}>
                                                    {service.name}
                                                </Option>
                                            ))}
                                        </Select>
                                        <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                                            <h3 className="text-lg font-semibold mb-3">Thông tin dịch vụ đã chọn:</h3>
                                            <div className="space-y-4">
                                                {field.value?.map(serviceId => {
                                                    const service = servicesData?.find(s => s._id === serviceId);
                                                    return service ? (
                                                        <div key={service._id} className="p-4 border rounded-md bg-white shadow-sm hover:shadow-md transition-shadow">
                                                            <div className="flex gap-4">
                                                                <div className="w-24 h-24 flex-shrink-0">
                                                                    <img 
                                                                        src={service.image || 'https://t4.ftcdn.net/jpg/04/73/25/49/360_F_473254957_bxG9yf4ly7OBO5I0O5KABlN930GwaMQz.jpg'} 
                                                                        alt={service.name}
                                                                        className="w-full h-full object-cover rounded-lg"
                                                                    />
                                                                </div>
                                                                <div className="flex-grow">
                                                                    <div className="grid grid-cols-2 gap-3">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="font-medium text-gray-700">ID:</span>
                                                                            <span className="text-gray-600 text-sm">{service._id}</span>
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="font-medium text-gray-700">Tên:</span>
                                                                            <Tag color="blue" className="text-sm">{service.name}</Tag>
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="font-medium text-gray-700">Trạng thái:</span>
                                                                            <Tag color={service.status ? "green" : "red"} className="text-sm">
                                                                                {service.status ? "Hoạt động" : "Không hoạt động"}
                                                                            </Tag>
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="font-medium text-gray-700">Đường dẫn:</span>
                                                                            <a 
                                                                                href={`/service/slug/${service.slug}`}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="text-blue-600 hover:text-blue-800 hover:underline text-sm"
                                                                            >
                                                                                {service.slug}
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

                        <Form.Item>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={isLoading || mutation.isPending || uploadMutation.isPending}
                                disabled={isLoading || mutation.isPending || uploadMutation.isPending}
                                className="bg-blue-500"
                            >
                                {isLoading || mutation.isPending ? "Đang Cập nhật..." : "Cập nhật"}
                            </Button>
                        </Form.Item>
                    </div>
                </div>
            </Form>
        </div>
    );
}

export default UsersEdit;