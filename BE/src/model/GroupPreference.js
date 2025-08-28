import mongoose from "mongoose";

const groupPreferenceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  siteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Site',
    required: true
  },
  tableId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Table',
    required: true
  },
  groupRules: [{
    field: {
      type: String,
      required: true
    }
  }],
  expandedGroups: [{
    type: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to ensure unique group preference per user, site, and table
groupPreferenceSchema.index({ userId: 1, siteId: 1, tableId: 1 }, { unique: true });

// Pre-save middleware to update the updatedAt field
groupPreferenceSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const GroupPreference = mongoose.model('GroupPreference', groupPreferenceSchema);

export default GroupPreference;
