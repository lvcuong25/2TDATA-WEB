import mongoose from "mongoose";

const columnSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  tableId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Table',
    required: true
  },
  databaseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Database',
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
  dataType: {
    type: String,
    required: true,
    enum: ['string', 'number', 'date', 'text', 'email', 'url', 'json', 'checkbox']
  },
  isRequired: {
    type: Boolean,
    default: false
  },
  isUnique: {
    type: Boolean,
    default: false
  },
  defaultValue: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  checkboxConfig: {
    type: {
      icon: {
        type: String,
        enum: ['check-circle', 'border'],
        default: 'check-circle'
      },
      color: {
        type: String,
        default: '#52c41a'
      },
      defaultValue: {
        type: Boolean,
        default: false
      }
    },
    default: undefined
  },
  order: {
    type: Number,
    default: 0
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

// Compound index to ensure unique column names per table
columnSchema.index({ name: 1, tableId: 1 }, { unique: true });

// Pre-save middleware to update the updatedAt field
columnSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Column = mongoose.model('Column', columnSchema);

export default Column;
