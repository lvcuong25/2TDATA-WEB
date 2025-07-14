import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Site from './src/model/Site.js';

dotenv.config();

const DB_URI = process.env.DB_URI || 'mongodb://127.0.0.1:27017/2TDATA-P';

async function updateFooterPartners() {
  try {
    await mongoose.connect(DB_URI);
    console.log('Connected to MongoDB');
    
    const site = await Site.findById('686d45a89a0a0c37366567c8');
    
    if (site) {
      // Update footer config with partner logos
      site.footer_config.logos.partners = [
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
      ];
      
      await site.save();
      console.log('Updated footer partners successfully');
      console.log('Partners:', site.footer_config.logos.partners);
    } else {
      console.log('Site not found');
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updateFooterPartners();
