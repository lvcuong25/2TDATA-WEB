import mongoose from 'mongoose';

const userSessionSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  site_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Site',
    required: false, // Super admin may not have site_id
    index: true
  },
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  refresh_token: {
    type: String,
    unique: true,
    sparse: true
  },
  ip_address: {
    type: String
  },
  user_agent: {
    type: String
  },
  device_info: {
    browser: String,
    os: String,
    device: String
  },
  last_activity: {
    type: Date,
    default: Date.now
  },
  expires_at: {
    type: Date,
    required: true,
    index: true
  },
  is_active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  versionKey: false
});

// Indexes for performance
userSessionSchema.index({ user_id: 1, site_id: 1 });
userSessionSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

// Methods
userSessionSchema.methods.isExpired = function() {
  return new Date() > this.expires_at;
};

userSessionSchema.methods.updateActivity = function() {
  this.last_activity = new Date();
  return this.save();
};

// Statics
userSessionSchema.statics.createSession = async function(userId, siteId, token, expiresIn = 86400) {
  const expiresAt = new Date();
  expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);
  
  return this.create({
    user_id: userId,
    site_id: siteId,
    token: token,
    expires_at: expiresAt
  });
};

userSessionSchema.statics.validateSession = async function(token, siteId = null) {
  const query = { 
    token, 
    is_active: true,
    expires_at: { $gt: new Date() }
  };
  
  if (siteId) {
    query.$or = [
      { site_id: siteId },
      { site_id: null } // Super admin sessions
    ];
  }
  
  return this.findOne(query).populate('user_id');
};

export default mongoose.model('UserSession', userSessionSchema);
