import React, { useState } from "react";
import { toast } from "react-toastify";
import { Button, Input, Form, Space, Card, Tooltip } from 'antd';
import { Link, useNavigate } from "react-router-dom";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import instance from "../../../utils/axiosInstance";
import { uploadFileCloudinary } from "../libs/uploadImageCloud";
import { PlusOutlined, MinusCircleOutlined, LinkOutlined, EyeOutlined } from '@ant-design/icons';

const ServiceForm = () => {
    const navigate = useNavigate();
    const [image, setImage] = useState('https://t4.ftcdn.net/jpg/04/73/25/49/360_F_473254957_bxG9yf4ly7OBO5I0O5KABlN930GwaMQz.jpg');

    const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm({
        defaultValues: {
            authorizedLinks: [{ url: '', title: '', description: '' }]
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "authorizedLinks"
    });

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

    const mutation = useMutation({
        mutationFn: async (serviceData) => {
            const { data } = await instance.post(`/service`, serviceData);
            return data;
        },
        onSuccess: () => {
            toast.success("Dịch vụ đã được thêm thành công!");
            navigate("/admin/services");
        },
        onError: (error) => {
            console.error("Error adding service:", error);
            toast.error(error.response?.data?.message || "Không thể thêm dịch vụ");
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
        // Lọc bỏ các link trống và format lại dữ liệu
        const filteredLinks = data.authorizedLinks
            .filter(link => link.url.trim() !== '')
            .map(link => ({
                url: link.url.trim(),
                title: link.title.trim(),
                description: link.description?.trim() || ''
            }));

        const formData = {
            ...data,
            image,
            authorizedLinks: filteredLinks
        };

        mutation.mutate(formData);
    };

    const handleImageChange = async ({ target }) => {
        if (target.files.length > 0) {
            const file = target.files[0];
            setImage(URL.createObjectURL(file));
            uploadMutation.mutate(file);
        }
    };

    return (
        <div className="p-4 bg-white rounded-lg shadow">
            <h1 className="text-2xl font-bold mb-4">Thêm thông tin Dịch vụ</h1>
            <div className="flex justify-end mb-4">
                <Link to="/admin/services">
                    <Button type="default">Quay lại</Button>
                </Link>
            </div>
            <Form onFinish={handleSubmit(onSubmit)} layout="vertical">
                <div className="flex flex-col md:flex-row gap-6">
                    <div className="md:w-1/3">
                        <Form.Item label="Ảnh Dịch vụ">
                            <img src={image} alt="Service preview" className="w-full h-auto object-cover rounded-lg mb-4" />
                            <div className="flex flex-col">
                                <button type="button"
                                    onClick={() => document.getElementById('file')?.click()}
                                    className="py-3.5 px-7 text-base font-medium text-indigo-100 focus:outline-none bg-[#202142] rounded-lg border border-indigo-200 hover:bg-indigo-900 focus:z-10 focus:ring-4 focus:ring-indigo-200 ">
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

                        <Card 
                            title={
                                <div className="flex items-center gap-2">
                                    <LinkOutlined />
                                    <span>Links ủy quyền</span>
                                </div>
                            }
                            className="mb-4"
                        >
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
                                        {/*   <Button 
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
                        </Card>

                        <Form.Item>
                            <Button 
                                type="primary" 
                                htmlType="submit" 
                                loading={mutation.isPending || uploadMutation.isPending}
                                disabled={mutation.isPending || uploadMutation.isPending}
                                className="bg-blue-500"
                            >
                                {mutation.isPending ? "Đang Thêm..." : "Thêm"}
                            </Button>
                        </Form.Item>
                    </div>
                </div>
            </Form>
        </div>
    );
}

export default ServiceForm;