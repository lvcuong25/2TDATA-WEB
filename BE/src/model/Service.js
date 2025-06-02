import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
    },
    status: {
      type: String,
      enum: ['waiting', 'approved', 'rejected'],
      default: 'waiting',
      description: "Trạng thái của service: waiting (chờ admin xác nhận), approved (đã được xác nhận), rejected (bị từ chối)"
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      description: "Admin đã xác nhận service"
    },
    approvedAt: {
      type: Date,
      description: "Thời gian xác nhận"
    },
    rejectedReason: {
      type: String,
      description: "Lý do từ chối (nếu bị rejected)"
    },
    image: {
      type: String,
    },
    authorizedLinks: [{
      url: {
        type: String,
        required: true,
        description: "URL của service"
      },
      title: {
        type: String,
        required: true,
        description: "Tiêu đề hoặc mô tả của link"
      },
      description:{
        type: String,
        description: "Mô tả chi tiết về link" 
      }
    }]
  },
  { timestamps: true, versionKey: false }
);

// Tự động tạo slug từ tên service
serviceSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

serviceSchema.plugin(mongoosePaginate);

export default mongoose.model("Service", serviceSchema); 