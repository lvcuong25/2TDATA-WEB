import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Site from './src/model/Site.js';

dotenv.config();

const DB_URI = process.env.DB_URI || 'mongodb://127.0.0.1:27017/2TDATA-P';

async function updateDevFooterStyle() {
  try {
    await mongoose.connect(DB_URI);
    console.log('Connected to MongoDB');
    
    // Find site with dev.2tdata.com domain
    const site = await Site.findOne({ domains: 'dev.2tdata.com' });
    
    if (site) {
      // Update footer config with original footer style
      site.footer_config = {
        companyInfo: {
          name: '2T DATA SOLUTION',
          address: 'Tầng 6, 26 Phố Dương Đình Nghệ, Yên Hòa, Cầu Giấy, Hà Nội',
          hotline: '0968 335 486',
          email: 'sales@2tdata.com',
          website: 'https://2tdata.com/'
        },
        logos: {
          main: {
            image: '',
            alt: '2T DATA'
          },
          partners: site.footer_config?.logos?.partners || [
            { 
              image: '/assets/hcw-n7l1QYq0.png', 
              alt: 'HCW', 
              link: 'https://hcw.com.vn/', 
              height: '60px' 
            },
            { 
              image: '/assets/image-yPN_ao-B.jpg', 
              alt: '2T DATA', 
              link: '#', 
              height: '90px' 
            },
            { 
              image: '/assets/remobpo-4GwMo5ew.png', 
              alt: 'REMOBPO', 
              link: 'https://remobpo.com/', 
              height: '60px' 
            }
          ]
        },
        quickLinks: [
          { title: 'Trang chủ', url: '#' },
          { title: 'Dịch vụ', url: '#' },
          { title: 'Chính sách bán hàng', url: '#' },
          { title: 'Liên hệ', url: '#' }
        ],
        copyright: 'Copyright © 2025 2T Data Solution | Powered by 2T Data Solution',
        styles: {
          backgroundColor: '#ffffff',      // White background like original
          textColor: '#000000',           // Black text
          copyrightBgColor: '#003399',    // Dark blue like original
          copyrightTextColor: '#ffffff',   // White text on copyright
          linkHoverColor: '#2563eb'       // Blue hover color
        },
        socialLinks: []
      };
      
      await site.save();
      console.log('Updated dev.2tdata.com footer style successfully!');
      console.log('New styles:', site.footer_config.styles);
    } else {
      console.log('Site with dev.2tdata.com not found');
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updateDevFooterStyle();
