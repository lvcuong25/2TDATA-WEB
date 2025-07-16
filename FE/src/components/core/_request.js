import { axiosGet } from "../../utils/axiosInstance.jsx";

export function getUserByToken() {
    return axiosGet('auth')
}