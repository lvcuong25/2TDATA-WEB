import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const userServiceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true
    },
    status: {
      type: String,
      enum: ['waiting', 'approved', 'rejected'],
      default: 'waiting',
      description: "Trạng thái xác nhận: waiting (chờ xác nhận), approved (đã xác nhận), rejected (bị từ chối)"
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      description: "Admin đã xác nhận"
    },
    approvedAt: {
      type: Date,
      description: "Thời gian xác nhận"
    },
    reason: {
      type: String,
      description: "Lý do từ chối (nếu bị rejected)"
    },
    customSlug: {
      type: String,
      unique: true,
      // required: true
    },
    link: [{
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

// Tự động tạo customSlug trước khi lưu
userServiceSchema.pre('save', function(next) {
  if (!this.customSlug) {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    this.customSlug = `service-${timestamp}-${randomStr}`;
  }
  next();
});

userServiceSchema.plugin(mongoosePaginate);

export default mongoose.model("UserService", userServiceSchema); 