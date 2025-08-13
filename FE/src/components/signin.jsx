import Joi from "joi";
import { joiResolver } from "@hookform/resolvers/joi";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { toast } from 'react-toastify';
import instance from "../utils/axiosInstance-cookie-only";
import { useState, useEffect } from "react";
import { EyeOutlined, EyeInvisibleOutlined } from "@ant-design/icons";
import CryptoJS from 'crypto-js';
import { useSearchParams, useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();
  
  // Lấy redirect param từ URL nếu có
  const urlRedirect = searchParams.get('redirect');
  
  // Debug URL parameters
  console.log('Signin component loaded');
  console.log('Current URL:', window.location.href);
  console.log('URL redirect parameter:', urlRedirect);
  console.log('All search params:', Object.fromEntries(searchParams.entries()));
  
  // Kiểm tra nếu user đã đăng nhập thì redirect ngay
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser && urlRedirect) {
      try {
        const userData = JSON.parse(storedUser);
        if (userData._id) {
          console.log('User already logged in, redirecting to:', urlRedirect);
          const redirectPath = decodeURIComponent(urlRedirect);
          console.log('Decoded redirect path:', redirectPath);
          
          // Thêm delay nhỏ để tránh redirect loop
          setTimeout(() => {
            console.log('Executing auto-redirect to:', redirectPath);
            window.location.href = redirectPath;
          }, 100);
        }
      } catch (error) {
        console.log('Error parsing stored user data:', error);
        // Clear invalid user data
        localStorage.removeItem('user');
      }
    }
  }, [urlRedirect]);

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
      
      // ✅ Cookie-only authentication: Token được tự động set vào HTTP-only cookie bởi backend
      // ❌ Không lưu token vào localStorage/sessionStorage để tăng bảo mật
      // 🔒 Cookie HttpOnly ngăn chặn XSS attacks và không thể truy cập bởi JavaScript
      
      // Lưu user data vào localStorage để Auth component có thể đọc
      try {
        localStorage.setItem('user', JSON.stringify(data.data));
        console.log('User data saved to localStorage:', data.data);
      } catch (error) {
        console.error('Error saving user data to localStorage:', error);
      }
      
      // Force refresh Auth context bằng nhiều cách
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('authUpdate', { detail: data.data }));
      console.log('Auth events dispatched');
      
      toast.success('Đăng nhập thành công!');
      
      // Xử lý redirect đơn giản hơn
      let redirectPath = '/';
      
      // Ưu tiên URL param redirect nếu có (decode URL parameter)
      if (urlRedirect) {
        try {
          redirectPath = decodeURIComponent(urlRedirect);
          console.log('URL redirect parameter (encoded):', urlRedirect);
          console.log('URL redirect parameter (decoded):', redirectPath);
        } catch (error) {
          console.error('Error decoding redirect URL:', error);
          redirectPath = urlRedirect; // Fallback to original
        }
      } else if (data.redirectPath) {
        // Nếu không có URL param, dùng redirect từ backend
        redirectPath = data.redirectPath;
        console.log('Using backend redirect path:', redirectPath);
      } else if (data.data?.role === 'super_admin' || data.data?.role === 'site_admin' || data.data?.role === 'admin') {
        // Admin redirect về admin page
        redirectPath = '/admin';
        console.log('Using admin default redirect:', redirectPath);
      } else {
        // User thường redirect về my-service
        redirectPath = '/service/my-service';
        console.log('Using user default redirect:', redirectPath);
      }
      
      // Đảm bảo redirectPath bắt đầu bằng /
      if (!redirectPath.startsWith('/')) {
        redirectPath = '/' + redirectPath;
      }
      
      console.log('Redirecting to:', redirectPath);
      
      // Tăng delay để đảm bảo Auth context được cập nhật hoàn toàn
      setTimeout(() => {
        try {
          // Kiểm tra lại user data trước khi redirect
          const storedUser = localStorage.getItem('user');
          console.log('Before redirect - stored user:', storedUser ? 'exists' : 'not found');
          
          if (storedUser) {
            // Sử dụng window.location.href để force redirect
            console.log('Executing redirect to:', redirectPath);
            window.location.href = redirectPath;
          } else {
            console.log('User data not found, waiting longer...');
            // Nếu user data chưa có, đợi thêm
            setTimeout(() => {
              console.log('Executing redirect to:', redirectPath);
              window.location.href = redirectPath;
            }, 1000);
          }
        } catch (error) {
          console.error('Error during redirect:', error);
          // Fallback redirect
          window.location.href = '/admin';
        }
      }, 1000); // Tăng delay từ 500ms lên 1000ms
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
