import React, { useState } from "react";
import { toast } from "react-toastify";
import { Editor } from '@tinymce/tinymce-react';

import { Button, Input, Form } from 'antd';
import { Link, useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import instance from "../../../utils/axiosInstance-cookie-only";
import { uploadFileCloudinary } from "../libs/uploadImageCloud";
import { getSafeImageUrl } from "../../../utils/imageUtils";

const BlogForm = () => {
    const navigate = useNavigate();
    const [content, setContent] = useState("");
    const [image, setImage] = useState('https://t4.ftcdn.net/jpg/04/73/25/49/360_F_473254957_bxG9yf4ly7OBO5I0O5KABlN930GwaMQz.jpg');

    const { control, handleSubmit, setValue, formState: { errors } } = useForm();

    const mutation = useMutation({
        mutationFn: async (blogData) => {
            const { data } = await instance.post(`/blogs`, blogData);
            return data;
        },
        onSuccess: () => {
            toast.success("Blog đã được thêm thành công!");
            navigate("/admin/blogs");
        },
        onError: (error) => {
            console.error("Error adding blog:", error);
            toast.error(error.response?.data?.message || "Không thể thêm blog");
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
        mutation.mutate({ ...data, content, image });
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
            <h1 className="text-2xl font-bold mb-4">Thêm thông tin Blog</h1>
            <div className="flex justify-end mb-4">
                <Link to="/admin/blogs">
                    <Button type="default">Quay lại</Button>
                </Link>
            </div>
            <Form onFinish={handleSubmit(onSubmit)} layout="vertical">
                <div className="flex flex-col md:flex-row gap-6">
                    <div className="md:w-1/3">
                        <Form.Item label="Ảnh Blog">
                            <img src={getSafeImageUrl(image)} alt="Blog preview" className="w-full h-auto object-cover rounded-lg mb-4" />
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
                            label="Tiêu đề Blog" 
                            required
                            validateStatus={errors.title ? "error" : ""}
                            help={errors.title?.message}
                        >
                            <Controller
                                name="title"
                                control={control}
                                rules={{ 
                                    required: 'Tiêu đề không được bỏ trống',
                                    minLength: { value: 5, message: 'Tiêu đề phải có ít nhất 5 ký tự' }
                                }}
                                render={({ field }) => <Input {...field} />}
                            />
                        </Form.Item>
                        <Form.Item label="Nội dung Blog" required>
                            <Editor
                                apiKey="853mkibb12dzlp0m1qpm80m4uvwnhwwkc66oylham0jzvz8s"
                                value={content}
                                onEditorChange={(newContent) => setContent(newContent)}
                                init={{
                                    height: 500,
                                    menubar: true,
                                    plugins: [
                                        'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                                        'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                                        'insertdatetime', 'media', 'table', 'help', 'wordcount'
                                    ],
                                    toolbar: 'undo redo | blocks | ' +
                                        'bold italic forecolor | alignleft aligncenter ' +
                                        'alignright alignjustify | bullist numlist outdent indent | ' +
                                        'removeformat | help',
                                    content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
                                    images_upload_handler: function (blobInfo, success, failure) {
                                        const maxSize = 5 * 1024 * 1024; // 5MB
                                        if (blobInfo.blob().size > maxSize) {
                                            failure('Image size exceeds 5MB limit');
                                            return;
                                        }
                                        // Convert to base64
                                        const reader = new FileReader();
                                        reader.onload = function() {
                                            success(reader.result);
                                        };
                                        reader.readAsDataURL(blobInfo.blob());
                                    },
                                    automatic_uploads: true,
                                    images_reuse_filename: true,
                                    paste_data_images: true,
                                    image_advtab: true,
                                    image_dimensions: true,
                                    image_class_list: [
                                        {title: 'None', value: ''},
                                        {title: 'Responsive', value: 'img-fluid'}
                                    ]
                                }}
                            />
                        </Form.Item>
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

export default BlogForm;