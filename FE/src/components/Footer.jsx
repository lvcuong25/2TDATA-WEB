import React from 'react'
import image from "../image/image.jpg";
import hcw from "../image/hcw.png";
import remobpo from "../image/remobpo.png";
const Footer = () => {
  return (
    <div>
       <footer className="bg-white pt-12 border-t">
            <div className="container mx-auto">
              <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-start">
                  {/* Logo and Company Info */}
                  <div className="w-1/3">
                    <div className="flex flex-col items-start">
                   <h1 className="text-xl font-bold mb-6">2T DATA SOLUTION</h1>
                         <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>Địa chỉ: Tầng 6, 26 Phố Dương Đình Nghệ, Yên Hòa, Cầu Giấy, Hà Nội</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <span>Hotline: 0968 335 486</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span>Email: sales@2tdata.com</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                          </svg>
                          <span>Website: https://2tdata.com/</span>
                        </div>
                      </div>
                      {/* THÀNH VIÊN CỦA 2T GROUP section with centered logos */}
                    
                    </div>
                  </div>
      
                  {/* Quick Links */}
                  <div className="w-1/3">
                    <h3 className="text-lg font-bold mb-6">Liên kết</h3>
                    <ul className="space-y-3">
                      <li><a href="#" className="hover:text-blue-600">Trang chủ</a></li>
                      <li><a href="#" className="hover:text-blue-600">Dịch vụ</a></li>
                      <li><a href="#" className="hover:text-blue-600">Chính sách bán hàng</a></li>
                      <li><a href="#" className="hover:text-blue-600">Liên hệ</a></li>
                    </ul>
                  </div>
                  
                </div>

                <div className="font-semibold text-2xl  mt-6">THÀNH VIÊN CỦA 2T GROUP</div>
                <div className="mt-6 flex flex-col items-center text-center">
                
              
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-12 items-center mt-4">
                  <a href="https://hcw.com.vn/" target="_blank" rel="noopener noreferrer">
                    <img src={hcw} alt="HCW" className="h-[60px] w-auto object-contain mx-auto" />
                  </a>
                  
                  <img src={image} alt="2T DATA" className="h-[90px] w-auto object-contain mx-auto" />
                  
                  <a href="https://remobpo.com/" target="_blank" rel="noopener noreferrer">
                    <img src={remobpo} alt="REMOBPO" className="h-[60px] w-auto object-contain mx-auto" />
                  </a>
                </div>
              </div>
              
              </div>
            </div>
            <div className="bg-[#003399] text-white text-center py-2 mt-8">
              <p>Copyright © 2025 2T Data Solution | Powered by 2T Data Solution</p>
            </div>
          </footer>
    </div>
  )
}

export default Footer
