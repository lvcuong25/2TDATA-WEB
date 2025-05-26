import Joi from "joi";
import { useNavigate } from "react-router-dom";
import { joiResolver } from "@hookform/resolvers/joi";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { toast } from 'react-toastify';
import instance from "../utils/axiosInstance";


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
  const navigate = useNavigate();

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
      
      
      toast.success('Đăng nhập thành công!');
      localStorage.setItem('accessToken', data.accessToken);
      // localStorage.setItem('user', JSON.stringify(data.user));
      
      // Use window.location.href to refresh the page after redirect
      window.location.href = data.redirectPath;
    },
    onError: (error) => {
      toast.error('Email hoặc mật khẩu không đúng!');
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
            />
            {errors?.email && <span className="text-red-500 text-sm">{errors?.email?.message}</span>}
          </div>

          {/* Password Input */}
          <div className="mb-4">
            <label htmlFor="password" className="block text-gray-800">Mật khẩu</label>
            <input
              {...register('password')}
              type="password"
              id="password"
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
              placeholder="••••••••"
            />
            {errors?.password && <span className="text-red-500 text-sm">{errors?.password?.message}</span>}
          </div>

          {/* Remember Me Checkbox */}
          <div className="mb-4 flex items-center">
            <input type="checkbox" id="remember" className="text-red-500" />
            <label htmlFor="remember" className="text-green-900 ml-2">Ghi nhớ đăng nhập</label>
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
