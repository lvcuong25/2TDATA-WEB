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
   {/* 
      <section className="relative pt-[30px]">
        
        <img
          src={image9}
          alt=""
          className="absolute w-full h-[737px] object-cover"
        />

        <div className="relative container mx-auto h-[737px]">
         
          <div className="absolute inset-0 flex items-center">
            <div className="relative w-[55%]">
              <img
                src={image6}
                alt="Building"
                className="w-full h-[737px] object-cover  shadow-xl"
              />
            </div>

           
            <div className="relative w-[45%] -ml-20">
          
              <div className="flex gap-4 mb-8 relative top-3.5 ">
                <div className="">
                  <img
                    src={image17}
                    alt="Chart"
                    className="w-[300px] h-[280px] object-cover  shadow-xl"
                  />
                </div>
                <div className="flex justify-center items-center h-[300px]">
                  <img
                    src={image5}
                    alt="Business"
                    className="w-[280px] h-[200px]  object-cover shadow-xl"
                  />
                </div>
              </div>

              <div className="bg-[#003399] text-white p-8 mr-[96px]   -ml-10 shadow-xl">
                <h2 className="text-2xl font-bold mb-4">
                  Data Fusion – Biến Dữ Liệu Thành Lợi Thế Cạnh Tranh
                </h2>
                <p className="text-base mb-6 leading-relaxed">
                  "Data Fusion – giải pháp báo cáo thông minh từ 2T Data
                  Solution tích hợp AI – giúp doanh nghiệp hợp nhất dữ liệu đa
                  nguồn, trực quan hóa thông tin và tối ưu quá trình ra quyết
                  định."
                </p>
                <button className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3 px-8 rounded-full transition-colors">
                  TÌM HIỂU THÊM
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto py-20">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
          Về chúng tôi
        </h2>
        <div className="max-w-4xl mx-auto text-center text-gray-600 leading-relaxed mb-16">
          <p className="mb-4">
            Trong thời đại số, dữ liệu là tài sản quý giá nhất của doanh nghiệp.
            Tuy nhiên, dữ liệu thường phân tán trên nhiều nền tảng khác nhau,
            gây khó khăn trong việc tổng hợp và phân tích.
          </p>
          <p>
            Data Fusion – giải pháp báo cáo thông minh từ 2T Data Solution giúp
            doanh nghiệp hợp nhất dữ liệu đa nguồn, trực quan hóa thông tin và
            tối ưu hóa quá trình ra quyết định.
          </p>
        </div>

       
        <div className="max-w-[1200px] mx-auto">
          <div className="flex justify-center items-stretch gap-[122px]">
      
            <div className="relative flex flex-col w-[300px]">
        
              <div className="bg-white p-2 rounded shadow-md flex items-center justify-center h-[210px] w-[160px] mx-auto">
                <img
                  src={image2}
                  alt="Tầm nhìn"
                  className="w-[160px] h-[210px] object-cover rounded"
                />
              </div>

            
              <div className="relative mt-5 flex-1">

                <div
                  className="absolute -top-[20px] left-1/2 -translate-x-1/2 w-[40px] h-[20px] bg-[#000080] z-10"
                  style={{
                    clipPath: "polygon(0 100%, 50% 0, 100% 100%)",
                  }}
                ></div>

                
                <div className="bg-[#000080] text-white p-5 pt-6 rounded shadow-xl h-full text-center">
                  <h3 className="text-lg font-bold mb-2">Tầm nhìn</h3>
                  <p className="text-sm leading-relaxed">
                    Trở thành đơn vị tiên phong trong lĩnh vực tư vấn, số hóa quản
                    trị doanh nghiệp và cung cấp các giải pháp công nghệ giúp tối
                    ưu hiệu quả hoạt động kinh doanh.
                  </p>
                </div>
              </div>
            </div>

         
            <div className="relative flex flex-col w-[300px]">
           
              <div className="bg-white p-2 rounded shadow-md flex items-center justify-center h-[210px] w-[160px] mx-auto">
                <img
                  src={image17}
                  alt="Sứ mệnh"
                  className="w-[160px] h-[210px] object-cover rounded"
                />
              </div>

              
              <div className="relative mt-5 flex-1">
           
                <div
                  className="absolute -top-[20px] left-1/2 -translate-x-1/2 w-[40px] h-[20px] bg-[#000080] z-10"
                  style={{
                    clipPath: "polygon(0 100%, 50% 0, 100% 100%)",
                  }}
                ></div>

                <div className="bg-[#000080] text-white p-5 pt-6 rounded shadow-xl h-full text-center">
                  <h3 className="text-lg font-bold mb-2">Sứ mệnh</h3>
                  <p className="text-sm leading-relaxed">
                    Giải phóng các lãnh đạo thoát khỏi những rắc rối trong việc
                    điều hành và quản trị doanh nghiệp
                  </p>
                </div>
              </div>
            </div>

            <div className="relative flex flex-col w-[300px]">
             
              <div className="bg-white p-2 rounded shadow-md flex items-center justify-center h-[210px] w-[160px] mx-auto">
                <img
                  src={image15}
                  alt="Giá trị cốt lõi"
                  className="w-[160px] h-[210px] object-cover rounded"
                />
              </div>

              <div className="relative mt-5 flex-1">
           
                <div
                  className="absolute -top-[20px] left-1/2 -translate-x-1/2 w-[40px] h-[20px] bg-[#000080] z-10"
                  style={{
                    clipPath: "polygon(0 100%, 50% 0, 100% 100%)",
                  }}
                ></div>

              
                <div className="bg-[#000080] text-white p-5 pt-6 rounded shadow-xl h-full text-center">
                  <h3 className="text-lg font-bold mb-2">Giá trị cốt lõi</h3>
                  <p className="text-sm leading-relaxed">
                    Sáng tạo, đổi mới và không ngừng thích ứng với sự thay đổi.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

     

      <section className="container mx-auto py-20">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center gap-20">
          
            <div className="w-[500px] h-[400px]">
              <img 
                src={image13} 
                alt="Data Analytics" 
                className="w-full h-full object-cover"
              />
            </div>

            <div className="w-[500px] h-[400px] flex flex-col justify-between py-4">
              <h2 className="text-4xl font-bold">
                Vì Sao Doanh Nghiệp<br />
                Nên Chọn <span className="text-red-500">Data Fusion</span>?
              </h2>

              <div className="space-y-4 text-gray-600">
                <p>Giải pháp tùy chỉnh theo nhu cầu doanh nghiệp.</p>
                <p>Triển khai nhanh, dễ dùng, không cần IT chuyên sâu.</p>
                <p>Hỗ trợ chuyên nghiệp từ đội ngũ 2T Data Solution.</p>
                <p>Năng cấp linh hoạt, sẵn sàng mở rộng theo sự phát triển.</p>
              </div>

              <div className="bg-yellow-200 p-4 rounded-lg">
                <p className="text-center font-medium">
                  "2T DATA TỰ TIN LÀ ĐƠN VỊ CUNG CẤP DỊCH VỤ TƯ VẤN"
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-8 mt-12">
        <div className="relative">
        <img src={image11} alt="Data Analytics" className="w-full h-full object-cover" />
      
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-white/90">
          <h3 className="text-[#003399] text-6xl font-bold mb-4">01</h3>
          <h4 className="text-red-500 font-bold mb-2">Tinh thực chiến cao</h4>
          <p className="text-sm text-gray-600 p-4 rounded">
            Các dự án tư vấn quản trị với kiến thức có đồng nhưng thực tế, các template với số liệu thực tế sẽ giúp các bạn tiếp cận và lĩnh hội kiến thức rất nhanh
          </p>
        </div>
      </div>
      

      <div className="relative">
      <img src={image6} alt="Data Analytics" className="w-full h-full object-cover" />
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-white/90">
        <h3 className="text-[#003399] text-6xl font-bold mb-4">02</h3>
        <h4 className="text-red-500 font-bold mb-2">Nắm bắt xu thế</h4>
        <p className="text-sm text-gray-600 p-4 rounded">
          Kiến thức quản trị được xây dựng và cập nhật liên tục, với kinh nghiệm triển khai thực tế của đội ngũ chuyên gia HCM, các bạn sẽ được tiếp cận những phương pháp, công nghệ tiên tiến nhất
        </p>
      </div>
    </div>
    
    <div className="relative">
      <img src={image1} alt="Data Analytics" className="w-full h-full object-cover" />
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-white/90">
        <h3 className="text-[#003399] text-6xl font-bold mb-4">03</h3>
        <h4 className="text-red-500 font-bold mb-2">Hệ thống bài bản</h4>
        <p className="text-sm text-gray-600 p-4 rounded">
          Tập trung vào các yếu tố then chốt trong quản trị doanh nghiệp: Quản trị mục tiêu, hiệu suất, quản trị quan hệ khách hàng, quản trị dòng tiền, tài chính, là khung 3 chân giúp doanh nghiệp phát triển bền vững
        </p>
      </div>
    </div>
    
        </div>
      </section>

      <section className="relative">
        <img src={image14} alt="" className="w-full h-[840px]  object-cover"/>
        <div className="absolute inset-0 bg-black/50">
          <div className="container mx-auto py-20">
            <div className="text-center mb-16">
              <div className="w-12 h-12 bg-yellow-300 rounded-full mx-auto mb-6 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h2 className="text-4xl font-bold text-white mb-2">CÁC DỊCH VỤ CỦA CHÚNG TÔI</h2>
              <h3 className="text-2xl font-bold text-red-500">1. TƯ VẤN QUẢN TRỊ DOANH NGHIỆP TỔNG THỂ</h3>
            </div>

            <div className="grid grid-cols-2 gap-6 max-w-5xl mx-auto">
     
              <div className="bg-[#003399] p-8 text-white relative">
                <div className="bg-yellow-300 w-12 h-12 rounded-full flex items-center justify-center text-black font-bold text-xl absolute -top-6 left-8">
                  1
                </div>
                <h4 className="text-xl font-bold mb-4">QUẢN TRỊ TÀI CHÍNH DOANH NGHIỆP TOÀN DIỆN</h4>
                <ul className="space-y-2 text-sm">
                  <li>Thành thạo Google Cloud, ứng dụng BI trong quản trị tài chính.</li>
                  <li>Hoạch định tài chính & chiến lược Marketing (Case Study: HCM-ICT).</li>
                  <li>Phân tích SWOT-PEST, xây dựng Tầm nhìn - Sứ mệnh - Giá trị cốt lõi.</li>
                  <li>Lập kế hoạch kinh doanh & mục tiêu doanh số theo 3 chiều.</li>
                </ul>
              </div>

        
              <div className="bg-[#003399] p-8 text-white relative">
                <div className="bg-yellow-300 w-12 h-12 rounded-full flex items-center justify-center text-black font-bold text-xl absolute -top-6 left-8">
                  2
                </div>
                <h4 className="text-xl font-bold mb-4">QUẢN TRỊ KHÁCH HÀNG CHUYÊN NGHIỆP</h4>
                <ul className="space-y-2 text-sm">
                  <li>Quản trị quan hệ khách hàng chuyên nghiệp, ứng dụng CRM & Sales Pipeline.</li>
                  <li>Quản trị trải nghiệm khách hàng, xây dựng & đo lường Customer Journey.</li>
                </ul>
              </div>

          
              <div className="bg-[#003399] p-8 text-white relative">
                <div className="bg-yellow-300 w-12 h-12 rounded-full flex items-center justify-center text-black font-bold text-xl absolute -top-6 left-8">
                  3
                </div>
                <h4 className="text-xl font-bold mb-4">QUẢN TRỊ & KIỂM SOÁT NỘI BỘ</h4>
                <ul className="space-y-2 text-sm">
                  <li>Xây dựng quy trình vận hành doanh nghiệp, ứng dụng công cụ thông minh & Cloud.</li>
                  <li>Triển khai PDCA trong quản lý chất lượng & kiểm soát chiến lược.</li>
                </ul>
              </div>

         
              <div className="bg-[#003399] p-8 text-white relative">
                <div className="bg-yellow-300 w-12 h-12 rounded-full flex items-center justify-center text-black font-bold text-xl absolute -top-6 left-8">
                  4
                </div>
                <h4 className="text-xl font-bold mb-4">QUẢN TRỊ CHIẾN LƯỢC & HIỆU SUẤT NHÂN SỰ</h4>
                <ul className="space-y-2 text-sm">
                  <li>Lập Action Plan theo phương pháp 1H1P5W chuẩn quốc tế.</li>
                  <li>Xây dựng chiến lược phát triển bằng BSC/KPIs, ứng dụng công cụ thông minh.</li>
                  <li>Phân tích SWOT-PEST, định hướng Tầm nhìn - Sứ mệnh - Giá trị cốt lõi.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>


      <section className="container mx-auto py-20">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-[#003399] mb-4">
          2. DATA FUSION TÍCH HỢP AI
        </h2>
        
        <p className="text-lg text-gray-600 mb-12 italic">
          "Bứt phá doanh thu với Data Fusion AI – tích hợp dữ liệu từ sàn TMĐT và quảng cáo, phân tích sắc bén trên dashboard tối ưu."
        </p>

        <div className="flex items-center gap-8">
          <div className="w-1/2 relative overflow-visible">
            <img 
              src={image1} 
              alt="AI Technology" 
              className="w-[110%] h-auto  shadow-xl ml-auto"
            />
            <img 
              src={image4} 
              alt="Data Analytics Meeting" 
              className="w-[50%] h-auto  shadow-lg absolute -left-[60px] top-1/4 "
            />
          </div>

          <div className="w-1/2 space-y-8">
            <div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                Khai thác dữ liệu thông minh - Tối ưu chiến lược kinh doanh
              </h3>
              <p className="text-xl text-gray-700 mb-6">
                Giải pháp đột phá cho doanh nghiệp của bạn
              </p>
            </div>

            <ul className="space-y-6">
              <li className="flex items-start gap-4">
                <div className="w-2 h-2 rounded-full bg-blue-600 mt-2"></div>
                <p className="text-gray-700">
                  <span className="font-semibold">Tích hợp dữ liệu toàn diện:</span> Thu thập và đồng bộ dữ liệu từ các sàn thương mại điện tử (Shopee, Lazada, Tiki...) và nền tảng quảng cáo (Google Ads, Meta Ads...).
                </p>
              </li>
              <li className="flex items-start gap-4">
                <div className="w-2 h-2 rounded-full bg-blue-600 mt-2"></div>
                <p className="text-gray-700">
                  <span className="font-semibold">Phân tích sâu bằng AI:</span> Biến dữ liệu thô thành insight giá trị với dashboard trực quan, dễ hiểu.
                </p>
              </li>
              <li className="flex items-start gap-4">
                <div className="w-2 h-2 rounded-full bg-blue-600 mt-2"></div>
                <p className="text-gray-700">
                  <span className="font-semibold">Tối ưu hóa tức thì:</span> Đưa ra quyết định nhanh chóng, tăng hiệu suất quảng cáo và doanh số bán hàng.
                </p>
              </li>
            </ul>
          </div>
        </div>

    
      </div>
    </section>
    */}
     {/* 
    <section className="container mx-auto py-20">
      <div className="max-w-6xl mx-auto relative">
        
        <div className="relative pl-48">
          <img 
            src={image16} 
            alt="Chatbot Interface" 
            className="w-full h-[500px] shadow-[0_2.8px_2.2px_rgba(0,_0,_0,_0.034),_0_6.7px_5.3px_rgba(0,_0,_0,_0.048),_0_12.5px_10px_rgba(0,_0,_0,_0.06),_0_22.3px_17.9px_rgba(0,_0,_0,_0.072),_0_41.8px_33.4px_rgba(0,_0,_0,_0.086),_0_100px_80px_rgba(0,_0,_0,_0.12)] object-cover"
          />
          
       
          <div className="absolute left-0 bottom-0 w-[400px] h-[500px]   bg-[#003399] text-white p-16 translate-y-1/2">
            <h2 className="text-4xl font-bold mb-6">3. AI CHATBOT</h2>
            <p className="text-lg leading-relaxed">
              AI Chatbot của 2T Data Solution ứng dụng công nghệ trí tuệ nhân tạo (AI), giúp tự động hóa quy trình tương tác khách hàng, tối ưu trải nghiệm và gia tăng 50% tỷ lệ chuyển đổi trên Fanpage & Website.
            </p>
          </div>
        </div>

       
        <div className="mt-16 ml-[450px]">
          <p className="text-gray-700 leading-relaxed">
            Chatbot AI hỗ trợ doanh nghiệp tự động hóa giao tiếp, tư vấn, chăm sóc khách hàng 24/7 trên các nền tảng như Facebook, Zalo, Website, đồng thời tối ưu hóa chuyển đổi và quy trình bán hàng. Hệ thống thông minh giúp quản lý công việc hiệu quả, tự động cập nhật tiến độ, nhắc nhở nhiệm vụ và nâng cao hiệu suất kinh doanh. Với khả năng tích hợp linh hoạt, Chatbot AI còn phân tích dữ liệu khách hàng, đưa ra insight giá trị để tối ưu chiến lược marketing, giúp doanh nghiệp tăng trưởng bền vững.
          </p>
        </div>
      </div>
    </section>
    */}
  
        {/* 
    <section className="container mx-auto py-20">
    <div className="max-w-7xl mx-auto">
      <div className="flex gap-8">
        
        <div className="w-[70%]">
       
          <div className="bg-gray-50 p-8 mb-8">
            <div className="flex gap-8">
              
              <div className="w-1/2">
                <h2 className="text-4xl font-bold text-gray-800 mb-2">4. GIẢI PHÁP</h2>
                <h2 className="text-4xl font-bold text-red-600">QUẢN LÝ DOANH</h2>
                <h2 className="text-4xl font-bold text-red-600">NGHIỆP</h2>
              </div>
         
              <div className="w-1/2">
                <p className="text-gray-800 text-lg">
                  "2T Data Solution cung cấp dịch vụ thiết kế ứng dụng quản lý doanh nghiệp trên nền tảng No-Code như AppSheet, Google Sheets, giúp doanh nghiệp tự động hóa quy trình và tích hợp dữ liệu thông minh."
                </p>
                <div className="flex justify-center mb-12">
            <button className="bg-yellow-300 hover:bg-yellow-400 text-black font-bold py-3 px-8 rounded-full">
              2T DATA FUSION
            </button>
          </div>
              </div>
            </div>
          </div>

        
          
          <div className="flex gap-8">
            <div className="w-[45%] relative">
              <div className="relative">
                <img 
                  src={image8} 
                  alt="Business Management" 
                  className="w-full h-[300px] object-cover -mt-20"
                />
              
              </div>
            </div>
            <div className="w-[55%]">
              <p className="text-gray-700 leading-relaxed">
                Giải pháp quản lý doanh nghiệp từ 2T Data Solution tích hợp AI, tự động hóa quy trình với Chatbot thông minh, hỗ trợ giao tiếp, chăm sóc khách hàng 24/7 trên Facebook, Zalo, Website, tối ưu chuyển đổi và quản lý công việc hiệu quả. Hệ thống đồng bộ dữ liệu từ Google Drive, CRM, ERP kết nối AppSheet, Google Sheets để phân tích, theo dõi hiệu suất kinh doanh, cung cấp giao diện thân thiện trên cả mobile và desktop, cùng khả năng mở rộng linh hoạt, giúp doanh nghiệp tăng trưởng bền vững.
              </p>
            </div>
          </div>
        </div>

        <div className="w-[30%]">
          <img 
            src={image10} 
            alt="Network Background" 
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </div>
    

    
  </section>*/}
{/*  
    <section className="bg-[#FFDE59] py-32 relative overflow-hidden">
    

      <div className="container mx-auto">
      <svg width="200" height="200" className="absolute  top-0" viewBox="0 0 200 200">
   
      <rect x="94" y="0" width="12" height="60" fill="#003893" />
    
    
      <circle cx="100" cy="100" r="25" stroke="#003893" strokeWidth="10" fill="none" />
      <circle cx="30" cy="150" r="25" stroke="#003893" strokeWidth="10" fill="none" />
      <circle cx="160" cy="160" r="30" stroke="#003893" strokeWidth="10" fill="none" />
    </svg>
     
        <div className="flex items-center justify-between">
     
          <div className="w-[45%]">
            <h2 className="text-3xl text-[#003399] font-bold mb-12">NỀN TẢNG CỦA 2T DATA</h2>
            <div className="flex items-center gap-4 mb-8">
            </div>
            <p className="text-gray-700 leading-relaxed mb-16">
              Trong kỷ nguyên số, dữ liệu không chỉ là tài sản mà còn là lợi thế cạnh 
              tranh quan trọng của doanh nghiệp. Tuy nhiên, dữ liệu phân tán trên 
              nhiều nền tảng có thể trở thành rào cản lớn trong việc khai thác giá trị 
              thực sự. Giải pháp phân tích và tổng hợp dữ liệu thông minh từ 2T Data 
              Solution giúp doanh nghiệp kết nối dữ liệu từ nhiều nguồn, biến thông tin 
              rời rạc thành những insight có giá trị, hỗ trợ ra quyết định nhanh chóng 
              và chính xác hơn.
            </p>

            <div className="mt-12">
              <button className="bg-red-600 text-white px-8 py-2 rounded-full font-bold">
                DATA FUSION
              </button>
            </div>
          </div>

          
          <div className="w-[45%] relative">
            <img 
              src={image13} 
              alt="Business Analytics" 
              className="w-[500px] object-cover h-[500px] rounded-full"
            />
           
            <div className="absolute -right-4 top-4">
              <div className=" p-4 rounded-full shadow-lg flex items-center gap-4">
                <img src={image10} alt="" className="rounded-full w-[100px] h-[100px]"/>
                <p className="text-sm text-[#003893] font-medium text-center flex-1">Hợp nhất dữ liệu từ nhiều nguồn</p>
              </div>
            </div>
            <div className="absolute -right-8 top-[26%]">
              <div className=" p-4 rounded-full shadow-lg flex items-center gap-4">
                <img src={image8} alt="" className="rounded-full w-[100px] h-[100px]"/>
                <p className="text-sm font-medium text-[#003893] text-center flex-1">Trực quan hóa dữ liệu thông minh</p>
              </div>
            </div>
            <div className="absolute -right-6 top-[50%]">
              <div className=" p-4 rounded-full shadow-lg flex items-center gap-4">
                <img src={image12} alt="" className="rounded-full w-[100px] h-[100px]"/>
                <p className="text-sm font-medium text-[#003893] text-center flex-1">Lưu trữ & bảo mật dữ liệu tuyệt đối</p>
              </div>
            </div>
            <div className="absolute -right-10 bottom-0">
              <div className=" p-4 rounded-full shadow-lg flex items-center gap-4">
                <img src={image11} alt="" className="rounded-full w-[100px] h-[100px]"/>
                <p className="text-sm font-medium text-center text-[#003893] flex-1">Hỗ trợ ra quyết định nhanh chóng & chính xác</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    */}    
          {/* 
    <section className="container mx-auto py-20">
      <div className="max-w-[1000px] mx-auto">
        <div className="flex items-center justify-between gap-12">
         
          <div className="w-[500px] bg-[#1a237e] p-12 rounded-lg">
            <div className="bg-[#FFE17B] p-8 rounded-lg">
              <h3 className="text-[#003399] text-2xl font-bold text-center mb-4">
                Nhận thông tin khuyến mãi
              </h3>
              <p className="text-center text-gray-600 mb-8">
                Nhanh tay để nhận được ưu đãi nhất!
              </p>
              
              <form className="space-y-4">
                <input
                  type="text"
                  placeholder="Họ và tên"
                  className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500"
                />
                <input
                  type="email"
                  placeholder="Nhập Email"
                  className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500"
                />
                <input
                  type="tel"
                  placeholder="Nhập Số điện thoại"
                  className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500"
                />
                <button className="w-full bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 transition-colors">
                  GỬI ĐĂNG KÝ NGAY!
                </button>
              </form>
            </div>
          </div>
 
          <div className="w-[500px]">
            <h2 className="text-[#003399] text-3xl font-bold text-center mb-4">
              2T Data Solution – Kết nối dữ liệu, tối ưu vận hành,<br/>
              thúc đẩy tăng trưởng.
            </h2>
            <p className="text-xl text-center text-gray-600 mb-8">
              Giải pháp thông minh cho doanh nghiệp số
            </p>
            
            <div className="flex gap-4 justify-center">
              <img 
                src={image13} 
                alt="Cloud Computing" 
                className="w-[200px] h-[200px] rounded-lg shadow-lg"
              />
              <img 
                src={image4} 
                alt="Data Analytics" 
                className="w-[200px] h-[200px] rounded-lg shadow-lg mt-12"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
    */}
    <iframe 
      src="https://www.hcwvietnam.com/2tdata_soltuion"
      title="2T Data Solution" 
      className="w-full h-screen border-0"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
 

    <footer/>
    </div>
  );
};

export default Home;
