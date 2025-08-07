import Joi from "joi";

export const registerSchema = Joi.object({
    email: Joi.string().email().pattern(new RegExp('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$')).required().messages({
        "string.base": "Email phải là một chuỗi!",
        "string.empty": "Email không được để trống!",
        "string.email": "Email không đúng định dạng!",
    }),
    password: Joi.string().min(6).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\\$%\\^\&\\*])(?=.{8,})')).required().messages({
        "string.base": "Password phải là một chuỗi!",
        "string.empty": "Password không được để trống!",
        "string.min": "Password phải có ít nhất 6 ký tự!",
        "string.pattern.base": "Password phải chứa ít nhất 1 chữ thường, 1 chữ hoa, 1 số và 1 ký tự đặc biệt!",
    }),
    
    // Thêm validation cho các checkbox điều khoản
    agreeTermsOfService: Joi.boolean().valid(true).required().messages({
        "boolean.base": "Bạn phải đồng ý với Điều khoản sử dụng dịch vụ!",
        "any.only": "Bạn phải đồng ý với Điều khoản sử dụng dịch vụ!",
        "any.required": "Bạn phải đồng ý với Điều khoản sử dụng dịch vụ!",
    }),
    
    agreeDataPolicy: Joi.boolean().valid(true).required().messages({
        "boolean.base": "Bạn phải đồng ý với Chính sách thu thập và xử lý dữ liệu cá nhân!",
        "any.only": "Bạn phải đồng ý với Chính sách thu thập và xử lý dữ liệu cá nhân!",
        "any.required": "Bạn phải đồng ý với Chính sách thu thập và xử lý dữ liệu cá nhân!",
    }),
    
    agreeSecurityPolicy: Joi.boolean().valid(true).required().messages({
        "boolean.base": "Bạn phải đồng ý với Chính sách bảo mật và xử lý dữ liệu khách hàng!",
        "any.only": "Bạn phải đồng ý với Chính sách bảo mật và xử lý dữ liệu khách hàng!",
        "any.required": "Bạn phải đồng ý với Chính sách bảo mật và xử lý dữ liệu khách hàng!",
    }),
}).unknown();

export const otpSchema = Joi.object({
    otp: Joi.number().required().messages({
        "number.base": "OTP phải là một số!",
        "number.empty": "OTP không được để trống!",
    }),
}).unknown();

export const resetPasswordSchema = Joi.object({
    password: Joi.string().min(6).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\\$%\\^\&\\*])(?=.{8,})')).required().messages({
        "string.base": "Password phải là một chuỗi!",
        "string.empty": "Password không được để trống!",
        "string.min": "Password phải có ít nhất 6 ký tự!",
        "string.pattern.base": "Password phải chứa ít nhất 1 chữ thường, 1 chữ hoa, 1 số và 1 ký tự đặc biệt!",
    }),
}).unknown();
