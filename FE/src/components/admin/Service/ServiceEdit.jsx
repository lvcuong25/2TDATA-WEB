import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Button, Input, Form, Spin, Switch, Typography, Space, Tooltip } from 'antd';
import { Link, useNavigate, useParams } from "react-router-dom";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import instance from "../../../utils/axiosInstance";
import { uploadFileCloudinary } from "../libs/uploadImageCloud";
import dayjs from 'dayjs';
import { PlusOutlined, MinusCircleOutlined, EyeOutlined } from '@ant-design/icons';

const { Text } = Typography;

const ServiceEdit = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [image, setImage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm({
        defaultValues: {
            status: true,
            authorizedLinks: [{ url: '', title: '', description: '' }]
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "authorizedLinks"
    });

    // Add default link field when component mounts if none exists
    useEffect(() => {
        if (fields.length === 0) {
            append({ url: '', title: '', description: '' });
        }
    }, [fields.length, append]);

    const name = watch('name');

    // Generate slug from name
    React.useEffect(() => {
        if (name) {
            const slug = name
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[đĐ]/g, 'd')
                .replace(/([^0-9a-z-\s])/g, '')
                .replace(/(\s+)/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-+|-+$/g, '');
            setValue('slug', slug);
        }
    }, [name, setValue]);

    // Query để lấy dữ liệu service
    const { data: serviceData, isLoading: isFetchingService } = useQuery({
        queryKey: ['service', id],
        queryFn: async () => {
            const { data } = await instance.get(`/service/${id}`);
            return data;
        },
    });

    useEffect(() => {
        if (serviceData) {
            console.log('Service Data:', serviceData); // Debug log
            setValue('name', serviceData.name);
            setValue('slug', serviceData.slug);
            setValue('description', serviceData.description);
            setValue('status', serviceData.status);
            // Đảm bảo link là một mảng
            const links = Array.isArray(serviceData.authorizedLinks) ? serviceData.authorizedLinks : [];
            console.log('Setting links:', links); // Debug log
            setValue('authorizedLinks', links);
            setImage(serviceData.image);
        }
    }, [serviceData, setValue]);

    const mutation = useMutation({
        mutationFn: async (serviceData) => {
            const { data } = await instance.put(`/service/${id}`, serviceData);
            return data;
        },
        onSuccess: () => {
            toast.success("Dịch vụ đã được cập nhật thành công!");
            navigate("/admin/services");
        },
        onError: (error) => {
            console.error("Error updating service:", error);
            toast.error(error.response?.data?.message || "Không thể cập nhật dịch vụ");
        },
    });

    const uploadMutation = useMutation({
        mutationFn: uploadFileCloudinary,
        onSuccess: (data) => {
            setValue('image', data);
            setImage(data);
        },
        onError: (error) => {
            console.error("Error uploading image:", error);
            toast.error("Không thể tải ảnh lên");
        },
    });

    const onSubmit = (data) => {
        setIsLoading(true);
        // Lọc bỏ các link trống
        const filteredLinks = data.authorizedLinks.filter(link => link.url.trim() !== '');
        mutation.mutate({ ...data, image, authorizedLinks: filteredLinks }, {
            onSettled: () => setIsLoading(false)
        });
    };

    const handleImageChange = async ({ target }) => {
        if (target.files.length > 0) {
            const file = target.files[0];
            setImage(URL.createObjectURL(file));
            uploadMutation.mutate(file);
        }
    };

    if (isFetchingService) {
        return <Spin size="large" />;
    }

    return (
        <div className="p-4 bg-white rounded-lg shadow">
            <h1 className="text-2xl font-bold mb-4">Sửa thông tin Dịch vụ</h1>
            <div className="flex justify-end mb-4">
                <Link to="/admin/services">
                    <Button type="default">Quay lại</Button>
                </Link>
            </div>
            <Form onFinish={handleSubmit(onSubmit)} layout="vertical">
                <div className="flex flex-col md:flex-row gap-6">
                    <div className="md:w-1/4">
                        <Form.Item label="Ảnh Dịch vụ">
                            <div className="w-48 h-48 mx-auto">
                                <img src={image} alt="Service preview" className="w-full h-full object-cover rounded-lg mb-4" />
                            </div>
                            <div className="flex flex-col">
                                <button type="button"
                                    onClick={() => document.getElementById('file')?.click()}
                                    className="py-2 px-4 text-sm font-medium text-indigo-100 focus:outline-none bg-[#202142] rounded-lg border border-indigo-200 hover:bg-indigo-900 focus:z-10 focus:ring-4 focus:ring-indigo-200 ">
                                    Chọn ảnh mới
                                </button>
                                <input 
                                    type="file" 
                                    id="file" 
                                    accept="image/jpg, image/jpeg, image/png, image/WEBP" 
                                    onChange={handleImageChange}
                                    className="hidden" 
                                />
                            </div>
                        </Form.Item>
                    </div>
                    <div className="md:w-3/4">
                        <Form.Item 
                            label="Tên Dịch vụ" 
                            required
                            validateStatus={errors.name ? "error" : ""}
                            help={errors.name?.message}
                        >
                            <Controller
                                name="name"
                                control={control}
                                rules={{ 
                                    required: 'Tên dịch vụ không được bỏ trống',
                                    minLength: { value: 3, message: 'Tên dịch vụ phải có ít nhất 3 ký tự' }
                                }}
                                render={({ field }) => <Input {...field} />}
                            />
                        </Form.Item>
                        <Form.Item 
                            label="Slug" 
                            required
                            validateStatus={errors.slug ? "error" : ""}
                            help={errors.slug?.message}
                        >
                            <Controller
                                name="slug"
                                control={control}
                                rules={{ 
                                    required: 'Slug không được bỏ trống'
                                }}
                                render={({ field }) => (
                                    <Input {...field} disabled />
                                )}
                            />
                        </Form.Item>
                        <Form.Item label="Mô tả (không bắt buộc)">
                            <Controller
                                name="description"
                                control={control}
                                render={({ field }) => <Input.TextArea {...field} rows={4} placeholder="Nhập mô tả dịch vụ (nếu có)" />}
                            />
                        </Form.Item>

                        <Form.Item label="Link ủy quyền">
                            {fields.map((field, index) => (
                                <div key={field.id} className="mb-4 p-4 border rounded-lg">
                                    <Space direction="vertical" style={{ width: '100%' }} size="middle">
                                        <div className="flex items-center gap-2">
                                            <Controller
                                                name={`authorizedLinks.${index}.url`}
                                                control={control}
                                                rules={{ required: 'URL không được bỏ trống' }}
                                                render={({ field }) => (
                                                    <Input 
                                                        {...field} 
                                                        placeholder="URL" 
                                                        addonBefore="URL"
                                                        className="flex-1"
                                                    />
                                                )}
                                            />
                                            <Tooltip title="Xem link">
                                                <Link 
                                                    to={watch(`authorizedLinks.${index}.url`)} 
                                                    target="_blank"
                                                    className="text-blue-500 hover:text-blue-700"
                                                >
                                                    <EyeOutlined />
                                                </Link>
                                            </Tooltip>
                                        </div>
                                        <Controller
                                            name={`authorizedLinks.${index}.title`}
                                            control={control}
                                            rules={{ required: 'Tiêu đề không được bỏ trống' }}
                                            render={({ field }) => (
                                                <Input 
                                                    {...field} 
                                                    placeholder="Tiêu đề" 
                                                    addonBefore="Tiêu đề"
                                                />
                                            )}
                                        />
                                        <Controller
                                            name={`authorizedLinks.${index}.description`}
                                            control={control}
                                            render={({ field }) => (
                                                <Input.TextArea 
                                                    {...field} 
                                                    placeholder="Mô tả (không bắt buộc)" 
                                                    rows={2}
                                                />
                                            )}
                                        />
                                      {/*  <Button 
                                            type="text" 
                                            danger 
                                            icon={<MinusCircleOutlined />} 
                                            onClick={() => remove(index)}
                                            className="self-end"
                                        >
                                            Xóa link
                                        </Button>*/ }
                                    </Space>
                                </div>
                            ))}
                        {/*     <Button 
                                type="dashed" 
                                onClick={() => append({ url: '', title: '', description: '' })} 
                                block 
                                icon={<PlusOutlined />}
                            >
                                Thêm link
                            </Button>*/ }
                        </Form.Item>

                        <Form.Item 
                            label="Trạng thái hoạt động"
                            valuePropName="checked"
                        >
                            <Controller
                                name="status"
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
                        {serviceData && (
                            <div className="mb-4 space-y-2">
                                <div>
                                    <Text type="secondary">Ngày tạo: </Text>
                                    <Text>{dayjs(serviceData.createdAt).format('DD/MM/YYYY HH:mm')}</Text>
                                </div>
                                <div>
                                    <Text type="secondary">Cập nhật lần cuối: </Text>
                                    <Text>{dayjs(serviceData.updatedAt).format('DD/MM/YYYY HH:mm')}</Text>
                                </div>
                            </div>
                        )}
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

export default ServiceEdit;
