import React from 'react';
import image from "../image/image.jpg";
import hcw from "../image/hcw.png";
import remobpo from "../image/remobpo.png";

const DynamicFooter = ({ config }) => {
  const {
    companyInfo = {
      name: '2T DATA SOLUTION',
      address: 'Tầng 6, 26 Phố Dương Đình Nghệ, Yên Hòa, Cầu Giấy, Hà Nội',
      hotline: '0968 335 486',
      email: 'sales@2tdata.com',
      website: 'https://2tdata.com/'
    },
    logos = {
      main: { image: '', alt: '2T DATA' },
      partners: []
    },
    partnersTitle = 'THÀNH VIÊN CỦA 2T GROUP',
    quickLinks = [
      { title: 'Trang chủ', url: '#' },
      { title: 'Dịch vụ', url: '#' },
      { title: 'Chính sách bán hàng', url: '#' },
      { title: 'Liên hệ', url: '#' }
    ],
    copyright = 'Copyright © 2025 2T Data Solution | Powered by 2T Data Solution',
    styles = {
      backgroundColor: '#ffffff',
      textColor: '#374151',
      copyrightBgColor: '#003399',
      copyrightTextColor: '#ffffff',
      linkHoverColor: '#2563eb'
    }
  } = config || {};

  // Default partner logos if not provided
  const defaultPartners = [
    { image: hcw, alt: 'HCW', link: 'https://hcw.com.vn/', height: '60px' },
    { image: image, alt: '2T DATA', link: 'https://2tdata.com/', height: '80px' },
    { image: remobpo, alt: 'REMOBPO', link: 'https://remobpo.com/', height: '60px' }
  ];

  const partnerLogos = logos.partners && logos.partners.length > 0 ? logos.partners : defaultPartners;

  return (
    <div>
      <footer 
        className="pt-12 pb-8" 
        style={{ backgroundColor: styles.backgroundColor, color: styles.textColor }}
      >
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            {/* Main footer content */}
            <div className="flex flex-col lg:flex-row justify-between items-start gap-12 mb-12">
              {/* Company Info section */}
              <div className="lg:w-1/2">
                <h1 className="text-2xl font-bold text-black mb-6">{companyInfo.name}</h1>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <svg className="w-5 h-5 text-gray-600 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700 leading-relaxed">Địa chỉ: {companyInfo.address}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <svg className="w-5 h-5 text-gray-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                    <span className="text-gray-700">Hotline: {companyInfo.hotline}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <svg className="w-5 h-5 text-gray-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    <span className="text-gray-700">Email: {companyInfo.email}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <svg className="w-5 h-5 text-gray-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16 8 8 0 000-16zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.56-.5-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.56.5.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.498-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.147.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.03 11H4.083a6.004 6.004 0 002.783 4.118z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700">
                      Website: <a href={companyInfo.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 hover:underline transition-colors">{companyInfo.website}</a>
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Links section */}
              <div className="lg:w-1/4">
                <h3 className="text-2xl font-bold text-black mb-6">Liên kết</h3>
                <ul className="space-y-3">
                  {quickLinks.map((link, index) => (
                    <li key={index}>
                      <a 
                        href={link.url} 
                        className="text-gray-700 hover:text-blue-600 transition-colors text-lg"
                      >
                        {link.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Partners section */}
            <div className="pt-6">
              <h2 className="text-2xl font-bold text-black mb-6">{partnersTitle}</h2>
              <div className="flex flex-wrap justify-center items-center gap-10">
                {partnerLogos.map((partner, index) => (
                  <a 
                    key={index} 
                    href={partner.link || '#'} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <img 
                      src={partner.image} 
                      alt={partner.alt} 
                      style={{ height: partner.height || '80px' }}
                      className="object-contain"
                    />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Copyright Section - Keep unchanged */}
      <div 
        className="py-4 text-center text-sm"
        style={{ 
          backgroundColor: styles.copyrightBgColor, 
          color: styles.copyrightTextColor 
        }}
      >
        <div className="container mx-auto px-4">
          {copyright}
        </div>
      </div>
    </div>
  );
};

export default DynamicFooter;
