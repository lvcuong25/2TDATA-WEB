import mongoose from 'mongoose';
import mongoosePaginate from "mongoose-paginate-v2";

const siteSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  domains: [{
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        // Validate domain format (subdomain.domain.com or custom-domain.com)
        return /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(v);
      },
      message: 'Invalid domain format'
    }
  }],
  theme_config: {
    primaryColor: {
      type: String,
      default: '#3B82F6'
    },
    secondaryColor: {
      type: String,
      default: '#1F2937'
    },
    logoUrl: String,
    faviconUrl: String,
    customCss: String,
    layout: {
      type: String,
      enum: ['default', 'modern', 'classic'],
      default: 'default'
    }
  },
  logo_url: {
    type: String
  },
  is_main_site: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  settings: {
    allowRegistration: {
      type: Boolean,
      default: true
    },
    requireEmailVerification: {
      type: Boolean,
      default: false
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    language: {
      type: String,
      default: 'en'
    },
    maxUsers: {
      type: Number,
      default: 1000
    },
    iframeUrl: {
      type: String,
      trim: true,
      validate: {
        validator: function(v) {
          if (!v) return true; // Allow empty
          return /^https?:\/\/.+/.test(v);
        },
        message: 'Iframe URL must be a valid HTTP/HTTPS URL'
      }
    }
  },
  // Site admins who can manage this specific site
  site_admins: [{
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['site_admin', 'site_moderator'],
      default: 'site_admin'
    },
    permissions: [{
      type: String,
      enum: ['manage_users', 'manage_content', 'manage_settings', 'view_analytics']
    }],
    created_at: {
      type: Date,
      default: Date.now
    }
  }],
  // Statistics
  stats: {
    totalUsers: {
      type: Number,
      default: 0
    },
    totalContent: {
      type: Number,
      default: 0
    },
    lastActivity: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true,
  versionKey: false
});

// Indexes for fast lookups
// Note: domains field already has unique index from schema definition
siteSchema.index({ status: 1 });
siteSchema.index({ 'site_admins.user_id': 1 });

// Virtual for primary domain
siteSchema.virtual('primaryDomain').get(function() {
  return this.domains && this.domains.length > 0 ? this.domains[0] : null;
});

// Static method to find site by domain
siteSchema.statics.findByDomain = function(domain) {
  return this.findOne({ 
    domains: { $in: [domain] },
    status: 'active'
  });
};

// Method to check if user is site admin
siteSchema.methods.isSiteAdmin = function(userId) {
  return this.site_admins.some(admin => 
    admin.user_id.toString() === userId.toString()
  );
};

// Method to get site admin role
siteSchema.methods.getSiteAdminRole = function(userId) {
  const admin = this.site_admins.find(admin => 
    admin.user_id.toString() === userId.toString()
  );
  return admin ? admin.role : null;
};

siteSchema.plugin(mongoosePaginate);

export default mongoose.model('Site', siteSchema);
