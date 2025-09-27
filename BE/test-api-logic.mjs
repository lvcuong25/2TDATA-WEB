import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

// Decode the token to see what's inside
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2ODZkNDhjN2I0MGZhYTMwZWQyYjVjZDQiLCJpYXQiOjE3NTg5OTIwNTQsImV4cCI6MTc5MDUyODA1NH0.A0zF4c0dLB34AzLax6kMppdTl5A6OXxdn8o0UPhplc8";

try {
  const decoded = jwt.decode(token);
  console.log('📦 Token content:', decoded);
  
  // Verify token with secret
  const verified = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production');
  console.log('\n✅ Token verified:', verified);
  
  console.log('\n⚠️ ISSUE FOUND:');
  console.log('The token only contains _id, not the full user object with role!');
  console.log('The middleware needs to fetch the full user object from DB after decoding token.');
  
} catch (error) {
  console.error('❌ Token verification failed:', error.message);
}
