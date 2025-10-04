/**
 * Test script to debug permission authentication
 */

import mongoose from 'mongoose';
import User from './src/model/User.js';
import jwt from 'jsonwebtoken';

console.log('🔍 Testing Permission Authentication...');

async function connectDatabase() {
  try {
    await mongoose.connect('mongodb://localhost:27017/2tdata');
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
}

async function testAuthentication() {
  try {
    await connectDatabase();
    
    console.log('\n📝 TEST 1: Check if there are any users...');
    const users = await User.find({}).limit(5);
    console.log('📊 Users found:', users.length);
    
    users.forEach((user, index) => {
      console.log(`  User ${index + 1}:`);
      console.log('    ID:', user._id);
      console.log('    Email:', user.email);
      console.log('    Role:', user.role);
      console.log('    Active:', user.active);
      console.log('');
    });
    
    if (users.length === 0) {
      console.log('❌ No users found - need to create a user first');
      return;
    }
    
    console.log('\n📝 TEST 2: Generate JWT token for first user...');
    const testUser = users[0];
    const secretKey = process.env.JWT_SECRET || process.env.SECRET_KEY || 'your-secret-key';
    
    const token = jwt.sign(
      { _id: testUser._id, email: testUser.email },
      secretKey,
      { expiresIn: '24h' }
    );
    
    console.log('✅ JWT token generated:');
    console.log('  User ID:', testUser._id);
    console.log('  User Email:', testUser.email);
    console.log('  Token (first 50 chars):', token.substring(0, 50) + '...');
    
    console.log('\n📝 TEST 3: Test API call with JWT token...');
    
    const axios = await import('axios');
    const tableId = '601e2a34-6a7e-4ef1-99eb-65648739b0d9';
    
    // Test with Authorization header
    const response = await axios.default.get(
      `http://localhost:3004/api/permissions/tables/${tableId}/permissions`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        validateStatus: () => true
      }
    );
    
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    if (response.status === 200) {
      const permissions = response.data.data || [];
      console.log('\n📊 Permissions found:', permissions.length);
      permissions.forEach((perm, index) => {
        console.log(`  Permission ${index + 1}:`);
        console.log('    ID:', perm._id);
        console.log('    Name:', perm.name);
        console.log('    Target Type:', perm.targetType);
        console.log('    Table ID:', perm.tableId);
        console.log('');
      });
    } else if (response.status === 401) {
      console.log('❌ Still getting 401 - JWT secret might be wrong');
    } else if (response.status === 403) {
      console.log('✅ Authentication successful but user lacks permission');
    } else if (response.status === 404) {
      console.log('✅ Authentication successful but table not found');
    }
    
    await mongoose.connection.close();
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testAuthentication();


