import mongoose from "mongoose";

const databaseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
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
  description: {
    type: String,
    trim: true,
    default: ''
  },
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

// Compound index to ensure unique database names per user and site
databaseSchema.index({ name: 1, userId: 1, siteId: 1 }, { unique: true });

// Pre-save middleware to update the updatedAt field
databaseSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Database = mongoose.model('Database', databaseSchema);

export default Database;
