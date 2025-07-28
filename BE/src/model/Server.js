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
  },
  userLimits: {
    min: {
      type: Number,
      min: 0,
      description: 'Số lượng người dùng tối thiểu cho server'
    },
    max: {
      type: Number,
      min: 1,
      description: 'Số lượng người dùng tối đa cho server'
    }
  }
}, {
  timestamps: true
});

// Pre-save middleware to validate user limits
ServerSchema.pre('save', function(next) {
  if (this.userLimits.min > this.userLimits.max) {
    return next(new Error('Số lượng người dùng tối thiểu không thể lớn hơn số lượng tối đa'));
  }
  next();
});

// Virtual field to get current user count
ServerSchema.virtual('currentUserCount').get(function() {
  return this.users ? this.users.length : 0;
});

// Method to check if server can accept more users
ServerSchema.methods.canAcceptUser = function() {
  const currentCount = this.currentUserCount;
  return currentCount < this.userLimits.max;
};

// Method to check if server meets minimum user requirement
ServerSchema.methods.meetsMinimumUsers = function() {
  const currentCount = this.currentUserCount;
  return currentCount >= this.userLimits.min;
};

// Method to get available slots
ServerSchema.methods.getAvailableSlots = function() {
  return Math.max(0, this.userLimits.max - this.currentUserCount);
};

export default mongoose.model('Server', ServerSchema); 