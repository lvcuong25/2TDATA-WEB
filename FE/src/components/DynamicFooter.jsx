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
    partnersTitle = 'Thành viên 2T Group',
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 px-4">
            {/* Company Info - 4 columns */}
            <div className="lg:col-span-4">
              <h3 className="text-lg font-bold mb-4 uppercase" style={{ color: '#003399' }}>
                {companyInfo.name || '2T DATA SOLUTION'}
              </h3>
              <div className="space-y-2 text-sm">
                <p className="flex items-start">
                  <span className="mr-2">📍</span>
                  <span>{companyInfo.address}</span>
                </p>
                <p className="flex items-center">
                  <span className="mr-2">📞</span>
                  <span>Hotline: {companyInfo.hotline}</span>
                </p>
                <p className="flex items-center">
                  <span className="mr-2">✉️</span>
                  <span>Email: {companyInfo.email}</span>
                </p>
                <p className="flex items-center">
                  <span className="mr-2">🌐</span>
                  <span>Website: <a href={companyInfo.website} className="hover:underline" style={{ color: styles.linkHoverColor }}>{companyInfo.website}</a></span>
                </p>
              </div>
            </div>

            {/* Partners Logos - 5 columns */}
            <div className="lg:col-span-5">
              <h3 className="text-lg font-bold mb-4 uppercase" style={{ color: '#003399' }}>
                {partnersTitle}
              </h3>
              <div className="flex items-center gap-6 flex-wrap">
                {partnerLogos.map((partner, index) => (
                  <a 
                    key={index} 
                    href={partner.link || '#'} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <img 
                      src={partner.image} 
                      alt={partner.alt} 
                      style={{ height: partner.height || '60px' }}
                      className="object-contain"
                    />
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Links - 3 columns */}
            <div className="lg:col-span-3">
              <h3 className="text-lg font-bold mb-4 uppercase" style={{ color: '#003399' }}>
                LIÊN KẾT NHANH
              </h3>
              <ul className="space-y-2 text-sm">
                {quickLinks.map((link, index) => (
                  <li key={index}>
                    <a 
                      href={link.url} 
                      className="hover:underline transition-colors"
                      style={{ color: styles.textColor }}
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
        </div>
      </footer>

      {/* Copyright Section */}
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
