const mongoose = require('mongoose');

const siteAdminSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  site_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Site',
    required: true
  },
  role: {
    type: String,
    enum: ['site_admin', 'site_manager', 'site_editor'],
    default: 'site_admin'
  },
  permissions: {
    type: [String],
    default: ['read', 'write', 'manage_users', 'manage_content']
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  assigned_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assigned_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to ensure one user can only have one role per site
siteAdminSchema.index({ user_id: 1, site_id: 1 }, { unique: true });

// Index for efficient queries
siteAdminSchema.index({ site_id: 1, status: 1 });
siteAdminSchema.index({ user_id: 1, status: 1 });

// Virtual populate user details
siteAdminSchema.virtual('user', {
  ref: 'User',
  localField: 'user_id',
  foreignField: '_id',
  justOne: true
});

// Virtual populate site details
siteAdminSchema.virtual('site', {
  ref: 'Site',
  localField: 'site_id',
  foreignField: '_id',
  justOne: true
});

siteAdminSchema.set('toJSON', { virtuals: true });
siteAdminSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('SiteAdmin', siteAdminSchema);
