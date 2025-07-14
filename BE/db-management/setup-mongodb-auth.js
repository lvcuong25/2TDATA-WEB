#!/usr/bin/env node

/**
 * MongoDB Authentication Setup Script
 * Run this script to create proper MongoDB users for the application
 */

import { MongoClient } from 'mongodb';

const MONGO_HOST = 'localhost';
const MONGO_PORT = 27017;
const DATABASE_NAME = '2TDATA';

// MongoDB credentials (change these for production)
const ADMIN_USER = 'admin';
const ADMIN_PASSWORD = 'secure_admin_password';
const APP_USER = 'app_user';
const APP_PASSWORD = 'secure_app_password';

async function setupMongoAuth() {
  let client;
  
  try {
    console.log('🔄 Connecting to MongoDB...');
    
    // Connect without authentication first
    client = new MongoClient(`mongodb://${MONGO_HOST}:${MONGO_PORT}`);
    await client.connect();
    
    console.log('✅ Connected to MongoDB');
    
    // Create admin user
    console.log('🔄 Creating admin user...');
    const adminDb = client.db('admin');
    
    try {
      await adminDb.command({
        createUser: ADMIN_USER,
        pwd: ADMIN_PASSWORD,
        roles: [
          'userAdminAnyDatabase',
          'dbAdminAnyDatabase', 
          'readWriteAnyDatabase'
        ]
      });
      console.log('✅ Admin user created successfully');
    } catch (error) {
      if (error.code === 51003) {
        console.log('ℹ️ Admin user already exists');
      } else {
        throw error;
      }
    }
    
    // Create application user for 2TDATA database
    console.log('🔄 Creating application user...');
    const appDb = client.db(DATABASE_NAME);
    
    try {
      await appDb.command({
        createUser: APP_USER,
        pwd: APP_PASSWORD,
        roles: [
          { role: 'readWrite', db: DATABASE_NAME }
        ]
      });
      console.log('✅ Application user created successfully');
    } catch (error) {
      if (error.code === 51003) {
        console.log('ℹ️ Application user already exists');
      } else {
        throw error;
      }
    }
    
    console.log('\n📋 MongoDB Authentication Setup Complete!');
    console.log('ℹ️ Update your .env.production file with these credentials:');
    console.log(`DB_URI=mongodb://${APP_USER}:${APP_PASSWORD}@localhost:27017/${DATABASE_NAME}?authSource=${DATABASE_NAME}`);
    console.log('\n⚠️ Important: Enable authentication in /etc/mongod.conf:');
    console.log('security:');
    console.log('  authorization: enabled');
    console.log('\nThen restart MongoDB: sudo systemctl restart mongod');
    
  } catch (error) {
    console.error('❌ Failed to setup MongoDB authentication:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

setupMongoAuth();
