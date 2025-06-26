import { joiResolver } from "@hookform/resolvers/joi";
import { useMutation } from "@tanstack/react-query";
import React, { useState } from "react";

import Joi from "joi";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import instance from "../utils/axiosInstance";
import { EyeOutlined, EyeInvisibleOutlined } from "@ant-design/icons";


const signupChema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .min(3)
    .messages({
      'string.email': 'Email không hợp lệ',
      'string.empty': 'Email là bắt buộc',
      'string.min': 'Email phải có ít nhất 3 ký tự',
    }),

  password: Joi.string()
    .required()
    .min(6)
    .messages({
      'string.empty': 'Mật khẩu là bắt buộc',
      'string.min': 'Mật khẩu phải có ít nhất 6 ký tự',
    }),

  confirmPassword: Joi.string()
    .valid(Joi.ref('password'))
    .required()
    .messages({
      'string.empty': 'Cần xác nhận mật khẩu',
      'any.only': 'Mật khẩu xác nhận không khớp',
    }),
  role: Joi.string().default('member'),
});

const SignUp = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: joiResolver(signupChema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
   
      role: "member"
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (signup) => {
      const { data } = await instance.post(
        `auth/sign-up`,
        signup
      );
      return data;
    },
    onSuccess: (data) => {
      localStorage.setItem('accessToken', data.accessToken);
      toast.success("Tài khoản đã được thêm thành công!");
      navigate("/login");
    },
    onError: () => {
      toast.error("Tài khoản không được thêm");
      navigate("/logup");
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
          alt="Placeholder Image" 
          className="object-cover w-full h-full"
        />
      </div>
      {/* Right: Signup Form */}
      <div className="lg:p-36 md:p-52 sm:20 p-8 w-full lg:w-1/2">
        <h1 className="text-2xl font-semibold mb-4">Tạo tài khoản mới</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email Input */}
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-600">Email</label>
            <input
              {...register("email", { required: true })}
              type="email"
              id="email"
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
              placeholder="email"
              autoComplete="off"
            />
            {errors?.email && <span className="text-red-500 text-sm">{errors?.email?.message}</span>}
          </div>

          {/* Password Input */}
          <div className="mb-4">
            <label htmlFor="password" className="block text-gray-800">Mật khẩu</label>
            <div className="relative">
              <input
                {...register("password", { required: true })}
                type={showPassword ? "text" : "password"}
                id="password"
                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
                placeholder="••••••••"
                autoComplete="off"
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

          {/* Confirm Password Input */}
          <div className="mb-4">
            <label htmlFor="confirm-password" className="block text-gray-800">Xác nhận mật khẩu</label>
            <div className="relative">
              <input
                {...register("confirmPassword", { required: true })}
                type={showConfirmPassword ? "text" : "password"}
                id="confirm-password"
                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:border-blue-500"
                placeholder="••••••••"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
              </button>
            </div>
            {errors?.confirmPassword && (
              <span className="text-red-500 text-sm">{errors?.confirmPassword?.message}</span>
            )}
          </div>

          {/* Hidden Role Input */}
          <div>
            <input
              {...register("role")}
              type="hidden"
            />
          </div>

          {/* Signup Button */}
          <button
            type="submit"
            className="bg-red-500 hover:bg-blue-600 text-white font-semibold rounded-md py-2 px-4 w-full"
            disabled={isPending}
          >
            {isPending ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
          </button>
        </form>

        {/* Login Link */}
        <div className="mt-6 text-green-500 text-center">
          <p className="text-sm font-light text-gray-500">
            Bạn đã có tài khoản?{" "}
            <a href="/login" className="hover:underline">
              Đăng nhập tại đây
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
