import Joi from "joi";
import { joiResolver } from "@hookform/resolvers/joi";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { toast } from 'react-toastify';
import instance from "../utils/axiosInstance";
import { useState } from "react";
import { EyeOutlined, EyeInvisibleOutlined } from "@ant-design/icons";
import CryptoJS from 'crypto-js';
import { useSearchParams } from 'react-router-dom';

// Secret key for encryption (in production, this should be stored securely)
const SECRET_KEY = 'your-secret-key-here';

const signinSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: false })
    .required()
    .messages({
      "string.empty": "Email không được để trống",
      "string.email": "Email không đúng định dạng",
      "any.required": "Email là bắt buộc",
    }),
  password: Joi.string()
    .required()
    .min(4)
    .messages({
      "string.empty": "Mật khẩu không được để trống",
      "string.min": "Mật khẩu phải có ít nhất {#limit} ký tự",
      "any.required": "Mật khẩu là bắt buộc",
    }),
});

const SignIn = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [searchParams] = useSearchParams();
  
  // Lấy redirect param từ URL nếu có
  const urlRedirect = searchParams.get('redirect');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: joiResolver(signinSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { mutate, isLoading } = useMutation({
    mutationFn: async (signinData) => {
      const { data } = await instance.post('auth/sign-in', signinData);
      return data;
    },
    onSuccess: (data) => {
      console.log('Login response:', data);
      console.log('Redirect path:', data.redirectPath);
      console.log('Redirect domain:', data.redirectDomain);
      console.log('User role:', data.data?.role);
      console.log('User service:', data.data?.service);
      localStorage.setItem('accessToken', data.accessToken);
      sessionStorage.setItem('accessToken', data.accessToken);
      toast.success('Đăng nhập thành công!');
      
      // Xử lý redirect với logic ưu tiên:
      // 1. Nếu có URL param redirect và user không phải admin -> dùng URL param
      // 2. Nếu không -> dùng redirect từ backend
      
      if (urlRedirect && data.data.role !== 'super_admin' && data.data.role !== 'site_admin' && data.data.role !== 'admin') {
        // User thường có thể dùng redirect param từ URL
        window.location.href = urlRedirect;
      } else {
        // Admin hoặc không có URL param -> dùng logic từ backend
        if (data.redirectDomain) {
          // Nếu backend trả về domain cụ thể (cho admin)
          const fullUrl = new URL(data.redirectPath, data.redirectDomain);
          window.location.href = fullUrl.toString();
        } else {
          // Redirect trong cùng domain
          window.location.href = data.redirectPath || '/';
        }
      }
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Email hoặc mật khẩu không đúng!';
      toast.error(message);
    },
  });

  const onSubmit = (data) => {
    mutate(data);
  };

  return (
    <div className="bg-sky-100 flex justify-center items-center h-screen">
      {/* Left: Image */}
      <div className="w-1/2 h-screen hidden lg:block">
        <img 
          src="https://img.freepik.com/fotos-premium/imagen-fondo_910766-187.jpg?w=826" 
          alt="Login background" 
          className="object-cover w-full h-full"
        />
      </div>
      {/* Right: Login Form */}
      <div className="lg:p-36 md:p-52 sm:20 p-8 w-full lg:w-1/2">
        <h1 className="text-2xl font-semibold mb-4">Đăng nhập</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email Input */}
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-600">Email</label>
            <input
              {...register('email')}
              type="email"
              id="email"
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
              placeholder="name@company.com"
              autoComplete="username"
            />
            {errors?.email && <span className="text-red-500 text-sm">{errors?.email?.message}</span>}
          </div>

          {/* Password Input */}
          <div className="mb-4">
            <label htmlFor="password" className="block text-gray-800">Mật khẩu</label>
            <div className="relative">
              <input
                {...register('password')}
                type={showPassword ? "text" : "password"}
                id="password"
                autoComplete="current-password"
                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
              </button>
            </div>
            {errors?.password && <span className="text-red-500 text-sm">{errors?.password?.message}</span>}
          </div>

          {/* Forgot Password Link */}
          <div className="mb-6 text-blue-500">
            <a href="/rest-password" className="hover:underline">Quên mật khẩu?</a>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            className="bg-red-500 hover:bg-blue-600 text-white font-semibold rounded-md py-2 px-4 w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Đang xử lý...' : 'Đăng nhập'}
          </button>
        </form>

        {/* Sign up Link */}
        <div className="mt-6 text-green-500 text-center">
          <a href="/logup" className="hover:underline">Đăng ký tại đây</a>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
