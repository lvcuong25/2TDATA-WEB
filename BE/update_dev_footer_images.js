import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Site from './src/model/Site.js';

dotenv.config();

const DB_URI = process.env.DB_URI || 'mongodb://127.0.0.1:27017/2TDATA-P';

async function updateDevFooterImages() {
  try {
    await mongoose.connect(DB_URI);
    console.log('Connected to MongoDB');
    
    // Find site with dev.2tdata.com domain
    const site = await Site.findOne({ domains: 'dev.2tdata.com' });
    
    if (site) {
      // Update partner logos with uploaded images
      site.footer_config.logos.partners = [
        { 
          image: '/uploads/footer/2t_data_partner_hcw.png', 
          alt: 'HCW', 
          link: 'https://hcw.com.vn/', 
          height: '60px' 
        },
        { 
          image: '/uploads/footer/2t_data_partner_logo.jpg', 
          alt: '2T DATA', 
          link: '#', 
          height: '90px' 
        },
        { 
          image: '/uploads/footer/2t_data_partner_remobpo.png', 
          alt: 'REMOBPO', 
          link: 'https://remobpo.com/', 
          height: '60px' 
        }
      ];
      
      // Mark as modified to ensure save
      site.markModified('footer_config.logos.partners');
      
      await site.save();
      console.log('Updated dev.2tdata.com footer images successfully!');
      console.log('Partners:', JSON.stringify(site.footer_config.logos.partners, null, 2));
    } else {
      console.log('Site with dev.2tdata.com not found');
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updateDevFooterImages();
