import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true
  },
  recordId: {
    type: String,
    required: true
  },
  tableId: {
    type: String,
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  authorName: {
    type: String,
    required: true
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

// Index for better query performance
commentSchema.index({ recordId: 1, createdAt: -1 });
commentSchema.index({ tableId: 1 });

const Comment = mongoose.model('Comment', commentSchema);

export default Comment;
