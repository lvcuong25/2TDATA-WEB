import mongoose from 'mongoose';
import mongoosePaginate from "mongoose-paginate-v2";

const iframeSchema = new mongoose.Schema({
  site_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Site',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
  },
  domain: {
    type: String,
    unique: true,
    sparse: true,
    validate: {
      validator: function(v) {
        return !v || /^[a-zA-Z0-9-]+$/.test(v);
      },
      message: 'Tên miền chỉ chứa chữ cái, số và dấu gạch ngang!'
    }
  },
  url: {
    type: String,
    required: true,
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  description: {
    type: String,
  },
  viewers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field on save
iframeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Compound index for site_id and domain for faster queries
iframeSchema.index({ site_id: 1, domain: 1 });

iframeSchema.plugin(mongoosePaginate);

export default mongoose.model('Iframe', iframeSchema);
