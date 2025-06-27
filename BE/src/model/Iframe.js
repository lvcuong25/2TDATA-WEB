import mongoose from 'mongoose';
import mongoosePaginate from "mongoose-paginate-v2";

const iframeSchema = new mongoose.Schema({
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
});

iframeSchema.plugin(mongoosePaginate);

export default mongoose.model('Iframe', iframeSchema); 