import mongoose from 'mongoose';

const permissionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['site', 'user', 'content', 'analytics', 'system'],
    required: true
  },
  is_system: {
    type: Boolean,
    default: false // System permissions can't be modified
  }
}, {
  timestamps: true,
  versionKey: false
});

// Common permissions
permissionSchema.statics.DEFAULT_PERMISSIONS = {
  // Site management
  SITE_CREATE: 'site.create',
  SITE_READ: 'site.read',
  SITE_UPDATE: 'site.update',
  SITE_DELETE: 'site.delete',
  
  // User management
  USER_CREATE: 'user.create',
  USER_READ: 'user.read',
  USER_UPDATE: 'user.update',
  USER_DELETE: 'user.delete',
  
  // Content management
  CONTENT_CREATE: 'content.create',
  CONTENT_READ: 'content.read',
  CONTENT_UPDATE: 'content.update',
  CONTENT_DELETE: 'content.delete',
  
  // Analytics
  ANALYTICS_READ: 'analytics.read',
  ANALYTICS_EXPORT: 'analytics.export',
  
  // System
  SYSTEM_SETTINGS: 'system.settings',
  SYSTEM_LOGS: 'system.logs'
};

export default mongoose.model('Permission', permissionSchema);
