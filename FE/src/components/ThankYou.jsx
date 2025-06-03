import React from 'react'
import Header from "./Header";
import Footer from "./Footer";
import { Link } from 'react-router-dom';

const ThankYou = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="container mx-auto flex-grow flex flex-col items-center justify-center text-center py-12 px-4">
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full mt-[100px]">
          <svg className="mx-auto mb-6 w-16 h-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">Cảm ơn bạn đã đăng ký!</h1>
          <p className="text-base md:text-lg text-gray-600 mb-8">Yêu cầu đăng ký dịch vụ của bạn đã được gửi thành công. Vui lòng chờ admin xác nhận.</p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Link to="/service" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-md transition-colors duration-300 ease-in-out shadow hover:shadow-lg">
              Xem thêm dịch vụ khác
            </Link>
            {/* Assuming you have a route for My Services. Update '/my-services' if needed. */}
            <Link to="/my-services" className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold px-8 py-3 rounded-md transition-colors duration-300 ease-in-out shadow hover:shadow-lg">
              Xem dịch vụ của tôi
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default ThankYou
