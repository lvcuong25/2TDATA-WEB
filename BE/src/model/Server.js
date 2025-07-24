import mongoose from 'mongoose';

const ServerSchema = new mongoose.Schema({
  users: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  }],
  link: {
    type: String,
    required: true
  },
  apiCode: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance'],
    default: 'active'
  }
}, {
  timestamps: true
});

export default mongoose.model('Server', ServerSchema); 