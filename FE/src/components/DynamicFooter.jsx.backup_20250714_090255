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
    quickLinks = [
      { title: 'Trang chủ', url: '#' },
      { title: 'Dịch vụ', url: '#' },
      { title: 'Chính sách bán hàng', url: '#' },
      { title: 'Liên hệ', url: '#' }
    ],
    copyright = 'Copyright © 2025 2T Data Solution | Powered by 2T Data Solution',
    styles = {
      backgroundColor: '#ffffff',
      textColor: '#000000',
      copyrightBgColor: '#003399',
      copyrightTextColor: '#ffffff',
      linkHoverColor: '#2563eb'
    }
  } = config || {};

  // Default partner logos if not provided
  const defaultPartners = [
    { image: hcw, alt: 'HCW', link: 'https://hcw.com.vn/', height: '60px' },
    { image: image, alt: '2T DATA', link: '#', height: '90px' },
    { image: remobpo, alt: 'REMOBPO', link: 'https://remobpo.com/', height: '60px' }
  ];

  const partnerLogos = logos.partners && logos.partners.length > 0 ? logos.partners : defaultPartners;

  return (
    <div>
      <footer 
        className="pt-12 border-t" 
        style={{ backgroundColor: styles.backgroundColor, color: styles.textColor }}
      >
        <div className="container mx-auto">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-start">
              {/* Logo and Company Info */}
              <div className="w-1/3">
                <div className="flex flex-col items-start">
                  <h1 className="text-xl font-bold mb-6">{companyInfo.name}</h1>
                  <div className="space-y-4">
                    {companyInfo.address && (
                      <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>Địa chỉ: {companyInfo.address}</span>
                      </div>
                    )}
                    
                    {companyInfo.hotline && (
                      <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span>Hotline: {companyInfo.hotline}</span>
                      </div>
                    )}
                    
                    {companyInfo.email && (
                      <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span>Email: {companyInfo.email}</span>
                      </div>
                    )}
                    
                    {companyInfo.website && (
                      <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                        <span>Website: {companyInfo.website}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Links */}
              <div className="w-1/3">
                <h3 className="text-lg font-bold mb-6">Liên kết</h3>
                <ul className="space-y-3">
                  {quickLinks.map((link, index) => (
                    <li key={index}>
                      <a 
                        href={link.url} 
                        className="transition-colors duration-200"
                        style={{ ':hover': { color: styles.linkHoverColor } }}
                        onMouseEnter={(e) => e.target.style.color = styles.linkHoverColor}
                        onMouseLeave={(e) => e.target.style.color = styles.textColor}
                      >
                        {link.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Partner Logos Section */}
            <div className="font-semibold text-2xl mt-6">THÀNH VIÊN CỦA 2T GROUP</div>
            <div className="mt-6 flex flex-col items-center text-center">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-12 items-center mt-4">
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
                      className="w-auto object-contain mx-auto" 
                      style={{ height: partner.height || '60px' }}
                    />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Copyright Section */}
        <div 
          className="text-center py-2 mt-8"
          style={{ 
            backgroundColor: styles.copyrightBgColor, 
            color: styles.copyrightTextColor 
          }}
        >
          <p>{copyright}</p>
        </div>
      </footer>
    </div>
  );
};

export default DynamicFooter;
