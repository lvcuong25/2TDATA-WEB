import mongoose from "mongoose";

const recordSchema = new mongoose.Schema({
  tableId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Table',
    required: true
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
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    default: {}
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

// Index for efficient querying
recordSchema.index({ tableId: 1, createdAt: -1 });

// Pre-save middleware to update the updatedAt field
recordSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Record = mongoose.model('Record', recordSchema);

export default Record;
