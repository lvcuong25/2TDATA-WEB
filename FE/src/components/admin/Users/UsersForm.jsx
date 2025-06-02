import React, { useState } from "react";
import { toast } from "react-toastify";
import { Button, Input, Form, Select, Upload } from 'antd';
import { Link, useNavigate, useParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { UploadOutlined, UserOutlined } from "@ant-design/icons";
import instance from "../../../utils/axiosInstance";
import { uploadFileCloudinary } from "../../admin/libs/uploadImageCloud";

const { Option } = Select;

const UsersForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [avatar, setAvatar] = useState('https://t4.ftcdn.net/jpg/04/73/25/49/360_F_473254957_bxG9yf4ly7OBO5I0O5KABlN930GwaMQz.jpg');

    const { control, handleSubmit, setValue, formState: { errors } } = useForm();

    // Fetch user data if editing
    const { data: userData } = useQuery({
        queryKey: ["USER", id],
        queryFn: async () => {
            const { data } = await instance.get(`/user/${id}`);
            return data.data;
        },
        enabled: !!id,
        onSuccess: (data) => {
            if (data) {
                setValue('email', data.email);
                setValue('name', data.name);
                setValue('phone', data.phone);
                setValue('role', data.role);
                if (data.avatar) setAvatar(data.avatar);
            }
        }
    });

    const mutation = useMutation({
        mutationFn: async (userData) => {
            if (id) {
                const { data } = await instance.put(`/user/${id}`, userData);
                return data;
            } else {
                const { data } = await instance.post(`/user`, userData);
                return data;
            }
        },
        onSuccess: () => {
            toast.success(`Người dùng đã được ${id ? 'cập nhật' : 'thêm'} thành công!`);
            navigate("/admin");
        },
        onError: (error) => {
            console.error("Error:", error);
            toast.error(error.response?.data?.message || `Không thể ${id ? 'cập nhật' : 'thêm'} người dùng`);
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
        mutation.mutate({ ...data, avatar });
    };

    const handleImageChange = async ({ target }) => {
        if (target.files.length > 0) {
            const file = target.files[0];
            setAvatar(URL.createObjectURL(file));
            uploadMutation.mutate(file);
        }
    };

    return (
        <div className="p-4 bg-white rounded-lg shadow">
            <h1 className="text-2xl font-bold mb-4">{id ? 'Cập nhật' : 'Thêm'} thông tin người dùng</h1>
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
                                    src={avatar} 
                                    alt="Avatar preview" 
                                    className="w-full h-full object-cover rounded-full" 
                                />
                            </div>
                            <div className="flex flex-col">
                                <button type="button"
                                    onClick={() => document.getElementById('file')?.click()}
                                    className="py-3.5 px-7 text-base font-medium text-indigo-100 focus:outline-none bg-[#202142] rounded-lg border border-indigo-200 hover:bg-indigo-900 focus:z-10 focus:ring-4 focus:ring-indigo-200">
                                    Chọn ảnh
                                </button>
                                <input 
                                    type="file" 
                                    id="file" 
                                    accept="image/jpg, image/jpeg, image/png" 
                                    onChange={handleImageChange}
                                    className="hidden" 
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
                                rules={{ 
                                    required: 'Tên không được bỏ trống',
                                    minLength: { value: 2, message: 'Tên phải có ít nhất 2 ký tự' }
                                }}
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

                        {!id && (
                            <Form.Item 
                                label="Mật khẩu" 
                                required
                                validateStatus={errors.password ? "error" : ""}
                                help={errors.password?.message}
                            >
                                <Controller
                                    name="password"
                                    control={control}
                                    rules={{ 
                                        required: 'Mật khẩu không được bỏ trống',
                                        minLength: { value: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' }
                                    }}
                                    render={({ field }) => <Input.Password {...field} />}
                                />
                            </Form.Item>
                        )}

                        <Form.Item>
                            <Button 
                                type="primary" 
                                htmlType="submit" 
                                loading={mutation.isPending || uploadMutation.isPending}
                                disabled={mutation.isPending || uploadMutation.isPending}
                                className="bg-blue-500"
                            >
                                {mutation.isPending ? "Đang xử lý..." : (id ? "Cập nhật" : "Thêm")}
                            </Button>
                        </Form.Item>
                    </div>
                </div>
            </Form>
        </div>
    );
}

export default UsersForm;