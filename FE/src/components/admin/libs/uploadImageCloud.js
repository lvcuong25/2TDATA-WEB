import axios from 'axios';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const uploadFileCloudinary = async (file) => {
    try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", "ml_default");
        formData.append('folder', "reactjs");
        const response = await axios.post(
            "https://api.cloudinary.com/v1_1/dvvlskvo6/upload",
            formData,
        );
        return response.data.url;
    } catch (error) {
        console.error(error);
    }
};

export { uploadFileCloudinary };