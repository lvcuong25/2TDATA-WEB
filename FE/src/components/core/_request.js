import { axiosGet } from "../../utils/axiosInstance-cookie-only.jsx";

export function getUserByToken() {
    console.log('getUserByToken: Calling auth endpoint...');
    return axiosGet('auth')
}