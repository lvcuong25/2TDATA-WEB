import axios from 'axios';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const uploadFileCloudinary = async (file) => {
    try {
        if (!file) { throw new Error('Không có file để tải lên'); }
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) { throw new Error('Chỉ hỗ trợ file ảnh (JPEG, PNG, GIF, WebP)'); }
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) { throw new Error('File quá lớn. Kích thước tối đa là 5MB'); }
        
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", "ml_default");
        formData.append('folder', "reactjs");
        const response = await axios.post(
            "https://api.cloudinary.com/v1_1/dvvlskvo6/upload",
            formData,
            { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 30000 }
        );
        
        if (!response.data.url) { throw new Error('Không nhận được URL từ Cloudinary'); }
        
        return {
            url: response.data.url,
            public_id: response.data.public_id
        };
    } catch (error) {
        console.error('Upload error:', error);
        if (error.response) { throw new Error(`Lỗi server: ${error.response.data?.error?.message || error.response.statusText}`); }
        else if (error.request) { throw new Error('Lỗi kết nối mạng. Vui lòng thử lại'); }
        else { throw new Error(error.message || 'Lỗi không xác định'); }
    }
};

export { uploadFileCloudinary };