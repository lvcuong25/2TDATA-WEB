import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/user';

async function checkIframe() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const Iframe = mongoose.model('Iframe', new mongoose.Schema({
      title: String,
      domain: String,
      url: String,
      viewers: Array
    }));
    
    const iframe = await Iframe.findOne({ domain: 'marketing-dashboard-sec' });
    
    if (iframe) {
      console.log('\nIframe found:');
      console.log('Title:', iframe.title);
      console.log('Domain:', iframe.domain);
      console.log('URL:', iframe.url);
      
      // Parse JWT from URL
      const urlMatch = iframe.url.match(/eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/);
      if (urlMatch) {
        const token = urlMatch[0];
        const [header, payload] = token.split('.').slice(0, 2).map(part => 
          JSON.parse(Buffer.from(part, 'base64').toString())
        );
        
        console.log('\nJWT Payload:', payload);
        
        if (payload.exp) {
          const expDate = new Date(payload.exp * 1000);
          console.log('Token expires at:', expDate);
          console.log('Is expired:', expDate < new Date());
        }
      }
    } else {
      console.log('Iframe not found');
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkIframe();
