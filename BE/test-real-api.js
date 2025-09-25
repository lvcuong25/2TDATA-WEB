import axios from 'axios';

// Test the actual API endpoint
const API_BASE = 'http://localhost:3004/api';
const databaseId = '68d400abc36df12bdeccc1ba'; // Test Database ID

async function testAPI() {
  try {
    console.log('🔍 Testing real API endpoint...');
    console.log(`URL: ${API_BASE}/database/databases/${databaseId}/members/me`);
    
    // Test without authentication first
    const response = await axios.get(`${API_BASE}/database/databases/${databaseId}/members/me`, {
      timeout: 5000
    });
    
    console.log('✅ API Response:', response.data);
    
  } catch (error) {
    if (error.response) {
      console.log('❌ API Error Response:');
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
    } else if (error.request) {
      console.log('❌ Network Error - Backend server might not be running');
      console.log('Error:', error.message);
    } else {
      console.log('❌ Error:', error.message);
    }
  }
}

testAPI();
