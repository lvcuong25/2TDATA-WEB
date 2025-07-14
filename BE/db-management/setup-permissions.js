import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { setupDefaultPermissions, setupDefaultRolePermissions } from '../src/services/permissionSetup.js';

dotenv.config();

async function setupPermissions() {
  try {
    // Connect to database
    const dbUri = process.env.DB_URI || process.env.MONGODB_URI;
    await mongoose.connect(dbUri);
    // Setup permissions
    await setupDefaultPermissions();
    
    // Setup role permissions
    await setupDefaultRolePermissions();
    
    } catch (error) {
    console.error('❌ Setup failed:', error);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

// Run setup
setupPermissions();
