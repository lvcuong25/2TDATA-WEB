import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import Logout from "./logout";
import image from "../image/image.jpg";
import image2 from "../image/image2.webp";
import image3 from "../image/image3.jpg";
import image5 from "../image/image5.png";
import image6 from "../image/image6.png";
import image7 from "../image/image7.png";
import image9 from "../image/image9.png";
import image1 from "../image/image1.png";
import image4 from "../image/image4.png";
import image8 from "../image/image8.png";
import image10 from "../image/image10.png";
import image11 from "../image/image11.png";
import image12 from "../image/image12.png";
import image13 from "../image/image13.png";
import image14 from "../image/image14.png";
import image15 from "../image/image15.png";
import image16 from "../image/image16.jpg";
import image17 from "../image/image17.png";
import Header from "./Header";
import Footer from "./Footer";
const Home = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("accessToken");
      setIsLoggedIn(!!token);
    };
    checkAuth();
  }, []);

  return (
    <div>
     <Header/>

      <section className="relative pt-[30px]">
        {/* Background image */}
        <img
          src={image9}
          alt=""
          className="absolute w-full h-[737px] lg:h-[737px] md:h-[600px] sm:h-[500px] object-cover"
        />

        <div className="relative container mx-auto h-[737px] lg:h-[737px] md:h-[600px] sm:h-[500px]">
          {/* Main content wrapper */}
          <div className="absolute inset-0 flex items-center">
            {/* Left side - Large building image */}
            <div className="relative w-[55%] lg:w-[55%] md:w-[50%] sm:w-[45%]">
              <img
                src={image6}
                alt="Building"
                className="w-full h-[737px] lg:h-[737px] md:h-[600px] sm:h-[500px] object-cover shadow-xl"
              />
            </div>

            {/* Right side content */}
            <div className="relative w-[45%] lg:w-[45%] md:w-[50%] sm:w-[55%] -ml-20 lg:-ml-20 md:-ml-10 sm:-ml-5">
              {/* Top images overlapping */}
              <div className="flex gap-4 mb-8 relative top-3.5">
                <div className="">
                  <img
                    src={image17}
                    alt="Chart"
                    className="w-[300px] lg:w-[300px] md:w-[250px] sm:w-[200px] h-[280px] lg:h-[280px] md:h-[230px] sm:h-[180px] object-cover shadow-xl"
                  />
                </div>
                <div className="flex justify-center items-center h-[300px] lg:h-[300px] md:h-[250px] sm:h-[200px]">
                  <img
                    src={image5}
                    alt="Business"
                    className="w-[280px] lg:w-[280px] md:w-[230px] sm:w-[180px] h-[200px] lg:h-[200px] md:h-[160px] sm:h-[140px] object-cover shadow-xl"
                  />
                </div>
              </div>

              {/* Blue content box */}
              <div className="bg-[#003399] text-white p-8 lg:p-8 md:p-6 sm:p-4 mr-[96px] lg:mr-[96px] md:mr-[48px] sm:mr-[24px] -ml-10 lg:-ml-10 md:-ml-5 sm:-ml-2 shadow-xl">
                <h2 className="text-2xl lg:text-2xl md:text-xl sm:text-lg font-bold mb-4">
                  Data Fusion – Biến Dữ Liệu Thành Lợi Thế Cạnh Tranh
                </h2>
                <p className="text-base lg:text-base md:text-sm sm:text-xs mb-6 leading-relaxed">
                  "Data Fusion – giải pháp báo cáo thông minh từ 2T Data
                  Solution tích hợp AI – giúp doanh nghiệp hợp nhất dữ liệu đa
                  nguồn, trực quan hóa thông tin và tối ưu quá trình ra quyết
                  định."
                </p>
                <div className="mt-6 sm:mt-8">
                  <button 
                    className="w-full py-3 px-6 bg-yellow-400 hover:bg-yellow-500 text-black font-bold rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50"
                  >
                    2T DATA TỰ TIN LÀ ĐƠN VỊ CUNG CẤP DỊCH VỤ TƯ VẤN
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto py-20">
        <h2 className="text-3xl lg:text-3xl md:text-2xl sm:text-xl font-bold text-center text-gray-800 mb-8">
          Về chúng tôi
        </h2>
        <div className="max-w-4xl mx-auto text-center text-gray-600 leading-relaxed mb-16">
          <p className="mb-4 lg:text-base md:text-sm sm:text-xs">
            Trong thời đại số, dữ liệu là tài sản quý giá nhất của doanh nghiệp.
            Tuy nhiên, dữ liệu thường phân tán trên nhiều nền tảng khác nhau,
            gây khó khăn trong việc tổng hợp và phân tích.
          </p>
          <p className="lg:text-base md:text-sm sm:text-xs">
            Data Fusion – giải pháp báo cáo thông minh từ 2T Data Solution giúp
            doanh nghiệp hợp nhất dữ liệu đa nguồn, trực quan hóa thông tin và
            tối ưu hóa quá trình ra quyết định.
          </p>
        </div>

        {/* Three cards section */}
        <div className="max-w-[1200px] mx-auto">
          <div className="flex justify-center items-stretch gap-[122px] lg:gap-[122px] md:gap-[60px] sm:gap-[30px]">
            {/* Card 1 */}
            <div className="relative flex flex-col w-[300px] lg:w-[300px] md:w-[250px] sm:w-[200px]">
              {/* Ảnh phía trên */}
              <div className="bg-white p-2 rounded shadow-md flex items-center justify-center h-[210px] lg:h-[210px] md:h-[180px] sm:h-[150px] w-[160px] lg:w-[160px] md:w-[140px] sm:w-[120px] mx-auto">
                <img
                  src={image2}
                  alt="Tầm nhìn"
                  className="w-[160px] lg:w-[160px] md:w-[140px] sm:w-[120px] h-[210px] lg:h-[210px] md:h-[180px] sm:h-[150px] object-cover rounded"
                />
              </div>

              {/* Box + Mũi tên tam giác khít liền */}
              <div className="relative mt-5 flex-1">
                {/* Mũi tên tam giác */}
                <div
                  className="absolute -top-[20px] left-1/2 -translate-x-1/2 w-[40px] lg:w-[40px] md:w-[30px] sm:w-[25px] h-[20px] lg:h-[20px] md:h-[15px] sm:h-[12px] bg-[#000080] z-10"
                  style={{
                    clipPath: "polygon(0 100%, 50% 0, 100% 100%)",
                  }}
                ></div>

                {/* Box nội dung */}
                <div className="bg-[#000080] text-white p-5 lg:p-5 md:p-4 sm:p-3 pt-6 lg:pt-6 md:pt-5 sm:pt-4 rounded shadow-xl h-full text-center">
                  <h3 className="text-lg lg:text-lg md:text-base sm:text-sm font-bold mb-2">Tầm nhìn</h3>
                  <p className="text-sm lg:text-sm md:text-xs sm:text-xs leading-relaxed">
                    Trở thành đơn vị tiên phong trong lĩnh vực tư vấn, số hóa quản
                    trị doanh nghiệp và cung cấp các giải pháp công nghệ giúp tối
                    ưu hiệu quả hoạt động kinh doanh.
                  </p>
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="relative flex flex-col w-[300px] lg:w-[300px] md:w-[250px] sm:w-[200px]">
              {/* Ảnh phía trên */}
              <div className="bg-white p-2 rounded shadow-md flex items-center justify-center h-[210px] lg:h-[210px] md:h-[180px] sm:h-[150px] w-[160px] lg:w-[160px] md:w-[140px] sm:w-[120px] mx-auto">
                <img
                  src={image17}
                  alt="Sứ mệnh"
                  className="w-[160px] lg:w-[160px] md:w-[140px] sm:w-[120px] h-[210px] lg:h-[210px] md:h-[180px] sm:h-[150px] object-cover rounded"
                />
              </div>

              {/* Box + Mũi tên tam giác khít liền */}
              <div className="relative mt-5 flex-1">
                {/* Mũi tên tam giác */}
                <div
                  className="absolute -top-[20px] left-1/2 -translate-x-1/2 w-[40px] lg:w-[40px] md:w-[30px] sm:w-[25px] h-[20px] lg:h-[20px] md:h-[15px] sm:h-[12px] bg-[#000080] z-10"
                  style={{
                    clipPath: "polygon(0 100%, 50% 0, 100% 100%)",
                  }}
                ></div>

                {/* Box nội dung */}
                <div className="bg-[#000080] text-white p-5 lg:p-5 md:p-4 sm:p-3 pt-6 lg:pt-6 md:pt-5 sm:pt-4 rounded shadow-xl h-full text-center">
                  <h3 className="text-lg lg:text-lg md:text-base sm:text-sm font-bold mb-2">Sứ mệnh</h3>
                  <p className="text-sm lg:text-sm md:text-xs sm:text-xs leading-relaxed">
                    Giải phóng các lãnh đạo thoát khỏi những rắc rối trong việc
                    điều hành và quản trị doanh nghiệp
                  </p>
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="relative flex flex-col w-[300px] lg:w-[300px] md:w-[250px] sm:w-[200px]">
              {/* Ảnh phía trên */}
              <div className="bg-white p-2 rounded shadow-md flex items-center justify-center h-[210px] lg:h-[210px] md:h-[180px] sm:h-[150px] w-[160px] lg:w-[160px] md:w-[140px] sm:w-[120px] mx-auto">
                <img
                  src={image15}
                  alt="Giá trị cốt lõi"
                  className="w-[160px] lg:w-[160px] md:w-[140px] sm:w-[120px] h-[210px] lg:h-[210px] md:h-[180px] sm:h-[150px] object-cover rounded"
                />
              </div>

              {/* Box + Mũi tên tam giác khít liền */}
              <div className="relative mt-5 flex-1">
                {/* Mũi tên tam giác */}
                <div
                  className="absolute -top-[20px] left-1/2 -translate-x-1/2 w-[40px] lg:w-[40px] md:w-[30px] sm:w-[25px] h-[20px] lg:h-[20px] md:h-[15px] sm:h-[12px] bg-[#000080] z-10"
                  style={{
                    clipPath: "polygon(0 100%, 50% 0, 100% 100%)",
                  }}
                ></div>

                {/* Box nội dung */}
                <div className="bg-[#000080] text-white p-5 lg:p-5 md:p-4 sm:p-3 pt-6 lg:pt-6 md:pt-5 sm:pt-4 rounded shadow-xl h-full text-center">
                  <h3 className="text-lg lg:text-lg md:text-base sm:text-sm font-bold mb-2">Giá trị cốt lõi</h3>
                  <p className="text-sm lg:text-sm md:text-xs sm:text-xs leading-relaxed">
                    Sáng tạo, đổi mới và không ngừng thích ứng với sự thay đổi.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

     

      <section className="container mx-auto py-10 md:py-20 px-4 ">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-center gap-20 lg:gap-20 md:gap-10 sm:gap-5 mt-8 sm:mt-12">
          {/* Left side - Image */}
          <div className="w-[500px] lg:w-[500px] md:w-[400px] sm:w-[300px] h-[400px] lg:h-[400px] md:h-[320px] sm:h-[240px] sm:mt-4">
            <img 
              src={image13} 
              alt="Data Analytics" 
              className="w-full h-full object-cover"
            />
          </div>

          {/* Right side - Content */}
          <div className="w-[500px] lg:w-[500px] md:w-[400px] sm:w-[300px] h-[400px] lg:h-[400px] md:h-[320px] sm:h-[240px] flex flex-col justify-between py-4 sm:mt-6">
            <h2 className="text-4xl lg:text-4xl md:text-3xl sm:text-2xl font-bold sm:mt-4">
              Vì Sao Doanh Nghiệp<br />
              Nên Chọn <span className="text-red-500">Data Fusion</span>?
            </h2>

            <div className="space-y-4 text-gray-600 sm:mt-6">
              <p className="lg:text-base md:text-sm sm:text-xs sm:mt-2">Giải pháp tùy chỉnh theo nhu cầu doanh nghiệp.</p>
              <p className="lg:text-base md:text-sm sm:text-xs sm:mt-2">Triển khai nhanh, dễ dùng, không cần IT chuyên sâu.</p>
              <p className="lg:text-base md:text-sm sm:text-xs sm:mt-2">Hỗ trợ chuyên nghiệp từ đội ngũ 2T Data Solution.</p>
              <p className="lg:text-base md:text-sm sm:text-xs sm:mt-2">Năng cấp linh hoạt, sẵn sàng mở rộng theo sự phát triển.</p>
            </div>

            <div className="bg-yellow-300 p-4 lg:p-4 md:p-3 sm:p-2 rounded-lg sm:mt-6">
              <button 
                className="w-full text-center font-medium lg:text-base md:text-sm sm:text-xs hover:bg-yellow-300 focus:ring-4  focus:outline-none transition-colors duration-200 rounded-lg"
              >
                "2T DATA TỰ TIN LÀ ĐƠN VỊ CUNG CẤP DỊCH VỤ TƯ VẤN"
              </button>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-1 gap-8 lg:gap-8 md:gap-6 sm:gap-4 mt-12 sm:mt-16">
          <div className="relative sm:mt-4">
            <img src={image11} alt="Data Analytics" className="w-full h-full object-cover" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 lg:p-6 md:p-4 sm:p-3 bg-white/90">
              <h3 className="text-[#003399] text-6xl lg:text-6xl md:text-5xl sm:text-4xl font-bold mb-4">01</h3>
              <h4 className="text-red-500 font-bold lg:text-lg md:text-base sm:text-sm mb-2">Tinh thực chiến cao</h4>
              <p className="text-sm lg:text-sm md:text-xs sm:text-xs text-gray-600 p-4 lg:p-4 md:p-3 sm:p-2 rounded">
                Các dự án tư vấn quản trị với kiến thức có đồng nhưng thực tế, các template với số liệu thực tế sẽ giúp các bạn tiếp cận và lĩnh hội kiến thức rất nhanh
              </p>
            </div>
          </div>

          <div className="relative sm:mt-4">
            <img src={image6} alt="Data Analytics" className="w-full h-full object-cover" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 lg:p-6 md:p-4 sm:p-3 bg-white/90">
              <h3 className="text-[#003399] text-6xl lg:text-6xl md:text-5xl sm:text-4xl font-bold mb-4">02</h3>
              <h4 className="text-red-500 font-bold lg:text-lg md:text-base sm:text-sm mb-2">Nắm bắt xu thế</h4>
              <p className="text-sm lg:text-sm md:text-xs sm:text-xs text-gray-600 p-4 lg:p-4 md:p-3 sm:p-2 rounded">
                Kiến thức quản trị được xây dựng và cập nhật liên tục, với kinh nghiệm triển khai thực tế của đội ngũ chuyên gia HCM, các bạn sẽ được tiếp cận những phương pháp, công nghệ tiên tiến nhất
              </p>
            </div>
          </div>

          <div className="relative sm:mt-4">
            <img src={image1} alt="Data Analytics" className="w-full h-full object-cover" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 lg:p-6 md:p-4 sm:p-3 bg-white/90">
              <h3 className="text-[#003399] text-6xl lg:text-6xl md:text-5xl sm:text-4xl font-bold mb-4">03</h3>
              <h4 className="text-red-500 font-bold lg:text-lg md:text-base sm:text-sm mb-2">Hệ thống bài bản</h4>
              <p className="text-sm lg:text-sm md:text-xs sm:text-xs text-gray-600 p-4 lg:p-4 md:p-3 sm:p-2 rounded">
                Tập trung vào các yếu tố then chốt trong quản trị doanh nghiệp: Quản trị mục tiêu, hiệu suất, quản trị quan hệ khách hàng, quản trị dòng tiền, tài chính, là khung 3 chân giúp doanh nghiệp phát triển bền vững
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

       <section className="relative">
        <div className="w-full h-[840px] bg-cover bg-center" style={{ backgroundImage: `url(${image14})` }}></div>
        <div className="absolute inset-0 bg-black/50">
          <div className="container mx-auto py-20 lg:py-20 md:py-16 sm:py-12">
            <div className="text-center mb-16 lg:mb-16 md:mb-12 sm:mb-8">
              <div className="w-12 h-12 lg:w-12 lg:h-12 md:w-10 md:h-10 sm:w-8 sm:h-8 bg-yellow-300 rounded-full mx-auto mb-6 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 lg:h-6 lg:w-6 md:h-5 md:w-5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h2 className="text-4xl lg:text-4xl md:text-3xl sm:text-2xl font-bold text-white mb-2">CÁC DỊCH VỤ CỦA CHÚNG TÔI</h2>
              <h3 className="text-2xl lg:text-2xl md:text-xl sm:text-lg font-bold text-red-500">1. TƯ VẤN QUẢN TRỊ DOANH NGHIỆP TỔNG THỂ</h3>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-2 md:grid-cols-1 sm:grid-cols-1 gap-6 lg:gap-6 md:gap-4 sm:gap-4 max-w-5xl mx-auto">
              {/* Box 1 */}
              <div className="bg-[#003399] p-8 lg:p-8 md:p-6 sm:p-4 text-white relative">
                <div className="bg-yellow-300 w-12 h-12 lg:w-12 lg:h-12 md:w-10 md:h-10 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-black font-bold text-xl lg:text-xl md:text-lg sm:text-base absolute -top-6 left-8">
                  1
                </div>
                <h4 className="text-xl lg:text-xl md:text-lg sm:text-base font-bold mb-4">QUẢN TRỊ TÀI CHÍNH DOANH NGHIỆP TOÀN DIỆN</h4>
                <ul className="space-y-2 text-sm lg:text-sm md:text-xs sm:text-xs">
                  <li>Thành thạo Google Cloud, ứng dụng BI trong quản trị tài chính.</li>
                  <li>Hoạch định tài chính & chiến lược Marketing (Case Study: HCM-ICT).</li>
                  <li>Phân tích SWOT-PEST, xây dựng Tầm nhìn - Sứ mệnh - Giá trị cốt lõi.</li>
                  <li>Lập kế hoạch kinh doanh & mục tiêu doanh số theo 3 chiều.</li>
                </ul>
              </div>

              {/* Box 2 */}
              <div className="bg-[#003399] p-8 lg:p-8 md:p-6 sm:p-4 text-white relative">
                <div className="bg-yellow-300 w-12 h-12 lg:w-12 lg:h-12 md:w-10 md:h-10 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-black font-bold text-xl lg:text-xl md:text-lg sm:text-base absolute -top-6 left-8">
                  2
                </div>
                <h4 className="text-xl lg:text-xl md:text-lg sm:text-base font-bold mb-4">QUẢN TRỊ KHÁCH HÀNG CHUYÊN NGHIỆP</h4>
                <ul className="space-y-2 text-sm lg:text-sm md:text-xs sm:text-xs">
                  <li>Quản trị quan hệ khách hàng chuyên nghiệp, ứng dụng CRM & Sales Pipeline.</li>
                  <li>Quản trị trải nghiệm khách hàng, xây dựng & đo lường Customer Journey.</li>
                </ul>
              </div>

              {/* Box 3 */}
              <div className="bg-[#003399] p-8 lg:p-8 md:p-6 sm:p-4 text-white relative">
                <div className="bg-yellow-300 w-12 h-12 lg:w-12 lg:h-12 md:w-10 md:h-10 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-black font-bold text-xl lg:text-xl md:text-lg sm:text-base absolute -top-6 left-8">
                  3
                </div>
                <h4 className="text-xl lg:text-xl md:text-lg sm:text-base font-bold mb-4">QUẢN TRỊ & KIỂM SOÁT NỘI BỘ</h4>
                <ul className="space-y-2 text-sm lg:text-sm md:text-xs sm:text-xs">
                  <li>Xây dựng quy trình vận hành doanh nghiệp, ứng dụng công cụ thông minh & Cloud.</li>
                  <li>Triển khai PDCA trong quản lý chất lượng & kiểm soát chiến lược.</li>
                </ul>
              </div>

              {/* Box 4 */}
              <div className="bg-[#003399] p-8 lg:p-8 md:p-6 sm:p-4 text-white relative">
                <div className="bg-yellow-300 w-12 h-12 lg:w-12 lg:h-12 md:w-10 md:h-10 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-black font-bold text-xl lg:text-xl md:text-lg sm:text-base absolute -top-6 left-8">
                  4
                </div>
                <h4 className="text-xl lg:text-xl md:text-lg sm:text-base font-bold mb-4">QUẢN TRỊ CHIẾN LƯỢC & HIỆU SUẤT NHÂN SỰ</h4>
                <ul className="space-y-2 text-sm lg:text-sm md:text-xs sm:text-xs">
                  <li>Lập Action Plan theo phương pháp 1H1P5W chuẩn quốc tế.</li>
                  <li>Xây dựng chiến lược phát triển bằng BSC/KPIs, ứng dụng công cụ thông minh.</li>
                  <li>Phân tích SWOT-PEST, định hướng Tầm nhìn - Sứ mệnh - Giá trị cốt lõi.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>


      <section className="container mx-auto py-10 md:py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-[#003399] mb-4 mt-8 sm:mt-12">
          2. DATA FUSION TÍCH HỢP AI
        </h2>
        
        <p className="text-base md:text-lg text-gray-600 mb-8 md:mb-12 italic mt-4 sm:mt-6">
          "Bứt phá doanh thu với Data Fusion AI – tích hợp dữ liệu từ sàn TMĐT và quảng cáo, phân tích sắc bén trên dashboard tối ưu."
        </p>

        <div className="flex flex-col lg:flex-row items-center gap-8 mt-6 sm:mt-10">
          {/* Left side - Images */}
          <div className="w-full lg:w-1/2 relative overflow-visible sm:mt-4">
            <img 
              src={image1} 
              alt="AI Technology" 
              className="w-full lg:w-[110%] h-auto shadow-xl lg:ml-auto"
            />
            <img 
              src={image4} 
              alt="Data Analytics Meeting" 
              className="w-[50%] h-auto shadow-lg absolute -left-[30px] lg:-left-[60px] top-1/4"
            />
          </div>

          {/* Right side - Content */}
          <div className="w-full lg:w-1/2 space-y-6 md:space-y-8 mt-4 sm:mt-8">
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-3 md:mb-4 sm:mt-4">
                Khai thác dữ liệu thông minh - Tối ưu chiến lược kinh doanh
              </h3>
              <p className="text-lg md:text-xl text-gray-700 mb-4 md:mb-6 sm:mt-4">
                Giải pháp đột phá cho doanh nghiệp của bạn
              </p>
            </div>

            <ul className="space-y-4 md:space-y-6 sm:mt-6">
              <li className="flex items-start gap-3 md:gap-4">
                <div className="w-2 h-2 rounded-full bg-blue-600 mt-2"></div>
                <p className="text-sm md:text-base text-gray-700">
                  <span className="font-semibold">Tích hợp dữ liệu toàn diện:</span> Thu thập và đồng bộ dữ liệu từ các sàn thương mại điện tử (Shopee, Lazada, Tiki...) và nền tảng quảng cáo (Google Ads, Meta Ads...).
                </p>
              </li>
              <li className="flex items-start gap-3 md:gap-4">
                <div className="w-2 h-2 rounded-full bg-blue-600 mt-2"></div>
                <p className="text-sm md:text-base text-gray-700">
                  <span className="font-semibold">Phân tích sâu bằng AI:</span> Biến dữ liệu thô thành insight giá trị với dashboard trực quan, dễ hiểu.
                </p>
              </li>
              <li className="flex items-start gap-3 md:gap-4">
                <div className="w-2 h-2 rounded-full bg-blue-600 mt-2"></div>
                <p className="text-sm md:text-base text-gray-700">
                  <span className="font-semibold">Tối ưu hóa tức thì:</span> Đưa ra quyết định nhanh chóng, tăng hiệu suất quảng cáo và doanh số bán hàng.
                </p>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    
    <section className="container mx-auto py-20">
      <div className="max-w-6xl mx-auto relative">
        {/* Background image */}
        <div className="relative pl-48 lg:pl-48 md:pl-32 sm:pl-4">
          <img 
            src={image16} 
            alt="Chatbot Interface" 
            className="w-full h-[500px] lg:h-[500px] md:h-[400px] sm:h-[300px] shadow-[0_2.8px_2.2px_rgba(0,_0,_0,_0.034),_0_6.7px_5.3px_rgba(0,_0,_0,_0.048),_0_12.5px_10px_rgba(0,_0,_0,_0.06),_0_22.3px_17.9px_rgba(0,_0,_0,_0.072),_0_41.8px_33.4px_rgba(0,_0,_0,_0.086),_0_100px_80px_rgba(0,_0,_0,_0.12)] object-cover"
          />
          
          {/* Blue box overlaying the image */}
          <div className="absolute left-0 bottom-0 w-[400px] lg:w-[400px] md:w-[320px] sm:w-[200px] h-[500px] lg:h-[500px] md:h-[400px] sm:h-[200px] bg-[#003399] text-white p-16 lg:p-16 md:p-12 sm:p-4 translate-y-1/2">
            <h2 className="text-4xl lg:text-4xl md:text-3xl sm:text-lg font-bold mb-6 sm:mb-3">3. AI CHATBOT</h2>
            <p className="text-lg lg:text-lg md:text-base sm:text-xs leading-relaxed">
              AI Chatbot của 2T Data Solution ứng dụng công nghệ trí tuệ nhân tạo (AI), giúp tự động hóa quy trình tương tác khách hàng, tối ưu trải nghiệm và gia tăng 50% tỷ lệ chuyển đổi trên Fanpage & Website.
            </p>
          </div>
        </div>

        {/* Description text below */}
        <div className="mt-16 lg:mt-16 md:mt-12 sm:mt-8 ml-[450px] lg:ml-[450px] md:ml-[320px] sm:ml-0 px-4 lg:px-16 md:px-6 sm:px-4 pr-4 lg:pr-16 md:pr-6 sm:pr-4">
          <p className="text-gray-700 lg:text-base md:text-sm sm:text-xs leading-relaxed">
            Chatbot AI hỗ trợ doanh nghiệp tự động hóa giao tiếp, tư vấn, chăm sóc khách hàng 24/7 trên các nền tảng như Facebook, Zalo, Website, đồng thời tối ưu hóa chuyển đổi và quy trình bán hàng. Hệ thống thông minh giúp quản lý công việc hiệu quả, tự động cập nhật tiến độ, nhắc nhở nhiệm vụ và nâng cao hiệu suất kinh doanh. Với khả năng tích hợp linh hoạt, Chatbot AI còn phân tích dữ liệu khách hàng, đưa ra insight giá trị để tối ưu chiến lược marketing, giúp doanh nghiệp tăng trưởng bền vững.
          </p>
        </div>
      </div>
    </section>
  
  
    <section className="container mx-auto py-10 md:py-20 px-4 md:px-0">
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-4 md:gap-8">
        {/* Left column - Content */}
        <div className="w-full lg:w-[70%]">
          {/* Top section with gray background */}
          <div className="bg-gray-50 p-4 md:p-8 mb-4 md:mb-8">
            <div className="flex flex-col md:flex-row gap-4 md:gap-8">
              {/* Title section */}
              <div className="w-full md:w-1/2">
                <h2 className="text-2xl md:text-4xl font-bold text-gray-800 mb-2">4. GIẢI PHÁP</h2>
                <h2 className="text-2xl md:text-4xl font-bold text-red-600">QUẢN LÝ DOANH</h2>
                <h2 className="text-2xl md:text-4xl font-bold text-red-600">NGHIỆP</h2>
              </div>
              {/* Quote section */}
              <div className="w-full md:w-1/2">
                <p className="text-gray-800 text-base md:text-lg">
                  "2T Data Solution cung cấp dịch vụ thiết kế ứng dụng quản lý doanh nghiệp trên nền tảng No-Code như AppSheet, Google Sheets, giúp doanh nghiệp tự động hóa quy trình và tích hợp dữ liệu thông minh."
                </p>
                <div className="flex justify-center my-6 md:mb-12">
                  <button className="bg-yellow-300 hover:bg-yellow-400 text-black font-bold py-2 md:py-3 px-6 md:px-8 rounded-full text-sm md:text-base">
                    2T DATA FUSION
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom section - Image and Description */}
          <div className="flex flex-col md:flex-row gap-4 md:gap-8">
            <div className="w-full md:w-[45%] relative">
              <div className="relative">
                <img 
                  src={image8} 
                  alt="Business Management" 
                  className="w-full h-[200px] md:h-[300px] object-cover md:-mt-20"
                />
              </div>
            </div>
            <div className="w-full md:w-[55%]">
              <p className="text-gray-700 leading-relaxed text-sm md:text-base">
                Giải pháp quản lý doanh nghiệp từ 2T Data Solution tích hợp AI, tự động hóa quy trình với Chatbot thông minh, hỗ trợ giao tiếp, chăm sóc khách hàng 24/7 trên Facebook, Zalo, Website, tối ưu chuyển đổi và quản lý công việc hiệu quả. Hệ thống đồng bộ dữ liệu từ Google Drive, CRM, ERP kết nối AppSheet, Google Sheets để phân tích, theo dõi hiệu suất kinh doanh, cung cấp giao diện thân thiện trên cả mobile và desktop, cùng khả năng mở rộng linh hoạt, giúp doanh nghiệp tăng trưởng bền vững.
              </p>
            </div>
          </div>
        </div>

        {/* Right column - Network Background */}
        <div className="w-full lg:w-[30%] mt-4 lg:mt-0">
          <img 
            src={image10} 
            alt="Network Background" 
            className="w-full h-[200px] md:h-full object-cover"
          />
        </div>
      </div>
    </div>

    
  </section>

    <section className="bg-[#FFDE59] py-16 md:py-24 lg:py-32 relative overflow-hidden">
      <div className="container mx-auto px-4">
        {/* SVG decoration */}
        <svg width="200" height="200" className="absolute top-0 left-0 w-[80px] md:w-[120px] lg:w-[180px] h-auto" viewBox="0 0 200 200">
          <rect x="94" y="0" width="12" height="60" fill="#003893" />
          <circle cx="100" cy="100" r="25" stroke="#003893" strokeWidth="10" fill="none" />
          <circle cx="30" cy="150" r="25" stroke="#003893" strokeWidth="10" fill="none" />
          <circle cx="180" cy="100" r="30" stroke="#003893" strokeWidth="10" fill="none" />
        </svg>
      
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12">
          {/* Left side content */}
          <div className="w-full lg:w-[45%]">
            <h2 className="text-2xl md:text-3xl text-[#003399] font-bold mb-6 md:mb-12">NỀN TẢNG CỦA 2T DATA</h2>
            <p className="text-gray-700 leading-relaxed mb-8 md:mb-16 text-sm md:text-base">
              Trong kỷ nguyên số, dữ liệu không chỉ là tài sản mà còn là lợi thế cạnh 
              tranh quan trọng của doanh nghiệp. Tuy nhiên, dữ liệu phân tán trên 
              nhiều nền tảng có thể trở thành rào cản lớn trong việc khai thác giá trị 
              thực sự. Giải pháp phân tích và tổng hợp dữ liệu thông minh từ 2T Data 
              Solution giúp doanh nghiệp kết nối dữ liệu từ nhiều nguồn, biến thông tin 
              rời rạc thành những insight có giá trị, hỗ trợ ra quyết định nhanh chóng 
              và chính xác hơn.
            </p>

            <div className="mt-8 md:mt-12">
              <button className="bg-red-600 text-white px-6 md:px-8 py-2 rounded-full font-bold text-sm md:text-base">
                DATA FUSION
              </button>
            </div>
          </div>

          {/* Right side image with floating circles */}
          <div className="w-full lg:w-[45%] relative mx-auto lg:mx-0 max-w-sm md:max-w-md lg:max-w-none flex justify-center items-center">
            <img 
              src={image13} 
              alt="Business Analytics" 
              className="w-full h-auto object-cover rounded-full max-w-[250px] md:max-w-[350px] lg:max-w-[500px] aspect-square"
            />
            {/* Floating feature circles */}
            <div className="absolute inset-0 flex justify-center items-center">
              {/* Top-right circle */}
              <div className="absolute top-[15%] right-[5%] transform translate-x-1/2 -translate-y-1/2 w-[80px] md:w-[100px] lg:w-[120px] h-auto flex flex-col items-center gap-1 md:gap-2 text-center">
                <img src={image10} alt="Hợp nhất dữ liệu từ nhiều nguồn" className="rounded-full w-[40px] md:w-[60px] lg:w-[80px] h-auto aspect-square object-cover border-2 border-blue-800"/>
                <p className="text-[8px] md:text-[10px] lg:text-sm text-[#003893] font-medium">Hợp nhất dữ liệu từ nhiều nguồn</p>
              </div>
              {/* Middle-right circle */}
              <div className="absolute top-[40%] right-[-5%] transform translate-x-1/2 -translate-y-1/2 w-[80px] md:w-[100px] lg:w-[120px] h-auto flex flex-col items-center gap-1 md:gap-2 text-center">
                <img src={image8} alt="Trực quan hóa dữ liệu thông minh" className="rounded-full w-[40px] md:w-[60px] lg:w-[80px] h-auto aspect-square object-cover border-2 border-blue-800"/>
                <p className="text-[8px] md:text-[10px] lg:text-sm font-medium text-[#003893]">Trực quan hóa dữ liệu thông minh</p>
              </div>
              {/* Bottom-right circle */}
              <div className="absolute top-[70%] right-[-7%] transform translate-x-1/2 -translate-y-1/2 w-[80px] md:w-[100px] lg:w-[120px] h-auto flex flex-col items-center gap-1 md:gap-2 text-center">
                <img src={image12} alt="Lưu trữ & bảo mật dữ liệu tuyệt đối" className="rounded-full w-[40px] md:w-[60px] lg:w-[80px] h-auto aspect-square object-cover border-2 border-blue-800"/>
                <p className="text-[8px] md:text-[10px] lg:text-sm font-medium text-[#003399]">Lưu trữ & bảo mật dữ liệu tuyệt đối</p>
              </div>
              {/* Bottom-left circle */}
              <div className="absolute bottom-[10%] left-[10%] transform -translate-x-1/2 translate-y-1/2 w-[80px] md:w-[100px] lg:w-[120px] h-auto flex flex-col items-center gap-1 md:gap-2 text-center">
                <img src={image11} alt="Hỗ trợ ra quyết định nhanh chóng & chính xác" className="rounded-full w-[40px] md:w-[60px] lg:w-[80px] h-auto aspect-square object-cover border-2 border-blue-800"/>
                <p className="text-[8px] md:text-[10px] lg:text-sm font-medium text-center text-[#003893]">Hỗ trợ ra quyết định nhanh chóng & chính xác</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section className="container mx-auto py-10 md:py-16 lg:py-20 px-4">
      <div className="max-w-[1000px] mx-auto">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12">
          {/* Left side - Registration Form */}
          <div className="w-full lg:w-[500px] bg-[#1a237e] p-6 md:p-8 lg:p-12 rounded-lg">
            <div className="bg-[#FFE17B] p-6 md:p-8 rounded-lg">
              <h3 className="text-[#003399] text-xl md:text-2xl font-bold text-center mb-3 md:mb-4">
                Nhận thông tin khuyến mãi
              </h3>
              <p className="text-center text-gray-600 mb-6 md:mb-8 text-sm md:text-base">
                Nhanh tay để nhận được ưu đãi nhất!
              </p>
              
              <form className="space-y-3 md:space-y-4">
                <input
                  type="text"
                  placeholder="Họ và tên"
                  className="w-full p-2 md:p-3 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500 text-sm md:text-base"
                />
                <input
                  type="email"
                  placeholder="Nhập Email"
                  className="w-full p-2 md:p-3 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500 text-sm md:text-base"
                />
                <input
                  type="tel"
                  placeholder="Nhập Số điện thoại"
                  className="w-full p-2 md:p-3 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500 text-sm md:text-base"
                />
                <button className="w-full bg-red-600 text-white py-2 md:py-3 rounded-lg font-bold hover:bg-red-700 transition-colors text-sm md:text-base">
                  GỬI ĐĂNG KÝ NGAY!
                </button>
              </form>
            </div>
          </div>

          {/* Right side - Content */}
          <div className="w-full lg:w-[500px] mt-8 lg:mt-0">
            <h2 className="text-[#003399] text-2xl md:text-3xl font-bold text-center mb-3 md:mb-4">
              2T Data Solution – Kết nối dữ liệu, tối ưu vận hành,<br className="hidden md:block"/>
              thúc đẩy tăng trưởng.
            </h2>
            <p className="text-lg md:text-xl text-center text-gray-600 mb-6 md:mb-8">
              Giải pháp thông minh cho doanh nghiệp số
            </p>
            
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <img 
                src={image13} 
                alt="Cloud Computing" 
                className="w-full md:w-[200px] h-[200px] rounded-lg shadow-lg"
              />
              <img 
                src={image4} 
                alt="Data Analytics" 
                className="w-full md:w-[200px] h-[200px] rounded-lg shadow-lg mt-4 md:mt-12"
              />
            </div>
          </div>
        </div>
      </div>
    </section>

   <Footer/>

    
    </div>
  );
};

export default Home;
