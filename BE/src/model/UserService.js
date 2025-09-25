import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const userServiceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },
    site_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Site",
      required: true,
      index: true,
      description: "Site where the user registered this service"
    },
    status: {
      type: String,
      enum: ["waiting", "approved", "rejected"],
      default: "waiting",
      description:
        "Trạng thái xác nhận: waiting (chờ xác nhận), approved (đã xác nhận), rejected (bị từ chối)",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      description: "Admin đã xác nhận",
    },
    approvedAt: {
      type: Date,
      description: "Thời gian xác nhận",
    },
    reason: {
      type: String,
      description: "Lý do từ chối (nếu bị rejected)",
    },
    customSlug: {
      type: String,
      unique: true,
      // required: true
    },
    link_update: [
      {
        url: {
          type: String,
          description: "URL cập nhật của service",
        },
        title: {
          type: String,
          description: "Tiêu đề hoặc mô tả của link cập nhật",
        },
        description: {
          type: String,
          description: "Mô tả chi tiết về link cập nhật",
        },
      },
    ],
    link: [
      {
        url: {
          type: String,
          required: true,
          description: "URL của service",
        },
        title: {
          type: String,
          required: true,
          description: "Tiêu đề hoặc mô tả của link",
        },
        description: {
          type: String,
          description: "Mô tả chi tiết về link",
        },
      },
    ],
    autoUpdate: {
      enabled: {
        type: Boolean,
        default: false,
        description: "Bật/tắt chế độ cập nhật tự động"
      },
      interval: {
        type: Number,
        default: 30,
        description: "Khoảng thời gian cập nhật (phút)"
      },
      lastUpdateAt: {
        type: Date,
        description: "Thời gian cập nhật cuối cùng"
      },
      nextUpdateAt: {
        type: Date,
        description: "Thời gian cập nhật tiếp theo"
      },
      scheduleType: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'once'],
        description: "Loại lịch trình: daily, weekly, monthly, once"
      },
      scheduleTime: {
        type: String,
        description: "Thời gian cập nhật (HH:mm)"
      },
      scheduleDate: {
        type: String,
        description: "Ngày cập nhật (YYYY-MM-DD) - chỉ dùng cho 'once'"
      },
      scheduleDays: [{
        type: Number,
        min: 0,
        max: 6,
        description: "Các ngày trong tuần (0=CN, 1=T2, ..., 6=T7) - chỉ dùng cho 'weekly'"
      }],
      isUpdating: {
        type: Boolean,
        default: false,
        description: "Trạng thái đang cập nhật (true khi auto-update đang chạy)"
      }
    },
    // Dữ liệu webhook
    webhookData: {
      type: mongoose.Schema.Types.Mixed,
      description: "Dữ liệu từ webhook realtime"
    },
    lastWebhookAt: {
      type: Date,
      description: "Thời gian webhook cuối cùng"
    }
  },
  { timestamps: true, versionKey: false }
);

// Tự động tạo customSlug trước khi lưu
userServiceSchema.pre("save", function (next) {
  if (!this.customSlug) {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    this.customSlug = `service-${timestamp}-${randomStr}`;
  }
  next();
});

userServiceSchema.plugin(mongoosePaginate);

export default mongoose.model("UserService", userServiceSchema);
