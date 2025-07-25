import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

await mongoose.connect(process.env.DB_URI || 'mongodb://localhost:27017/2TDATA-P');

const IframeSchema = new mongoose.Schema({}, { strict: false });
const UserSchema = new mongoose.Schema({}, { strict: false });

const Iframe = mongoose.model('Iframe', IframeSchema);
const User = mongoose.model('User', UserSchema);

async function checkIframes() {
  try {
    const iframes = await Iframe.find({});
    
    console.log('\n=== ALL IFRAMES ===');
    console.log('Total iframes:', iframes.length);
    
    for (const iframe of iframes) {
      console.log(`\n--- Iframe: ${iframe.title} ---`);
      console.log('ID:', iframe._id);
      console.log('Domain:', iframe.domain);
      console.log('URL:', iframe.url);
      console.log('Site ID:', iframe.site_id);
      
      if (iframe.viewers && iframe.viewers.length > 0) {
        console.log('Viewer IDs:', iframe.viewers);
        // Get viewer emails
        const viewers = await User.find({ _id: { $in: iframe.viewers } }, 'email name');
        console.log('Viewers:', viewers.map(v => `${v.name || 'N/A'} (${v.email})`).join(', '));
      } else {
        console.log('Viewers: No viewers');
      }
    }
    
    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    mongoose.disconnect();
  }
}

checkIframes();
