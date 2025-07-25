import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

await mongoose.connect(process.env.DB_URI || 'mongodb://localhost:27017/2TDATA-P');

const IframeSchema = new mongoose.Schema({}, { strict: false });
const Iframe = mongoose.model('Iframe', IframeSchema);

async function checkIframes() {
  try {
    const iframes = await Iframe.find({}).populate('viewers', 'email').populate('site_id', 'name');
    
    console.log('\n=== ALL IFRAMES ===');
    console.log('Total iframes:', iframes.length);
    
    iframes.forEach((iframe, index) => {
      console.log(`\n--- Iframe ${index + 1} ---`);
      console.log('ID:', iframe._id);
      console.log('Title:', iframe.title);
      console.log('Domain:', iframe.domain);
      console.log('URL:', iframe.url);
      console.log('Site:', iframe.site_id?.name || 'No site');
      console.log('Viewers:', iframe.viewers.map(v => v.email).join(', ') || 'No viewers');
    });
    
    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    mongoose.disconnect();
  }
}

checkIframes();
