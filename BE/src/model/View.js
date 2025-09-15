import mongoose from 'mongoose';

const viewSchema = new mongoose.Schema({
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
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['grid', 'form', 'gallery', 'kanban', 'calendar']
  },
  description: {
    type: String,
    trim: true
  },
  config: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for better query performance
viewSchema.index({ tableId: 1, userId: 1 });
viewSchema.index({ tableId: 1, isPublic: 1 });

export default mongoose.model('View', viewSchema);
