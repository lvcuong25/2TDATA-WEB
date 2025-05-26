import { axiosGet } from "../../utils/axiosInstance";


export function getUserByToken() {
    return axiosGet('auth')
}