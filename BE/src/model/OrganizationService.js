import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const organizationServiceSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      description: "Tổ chức sử dụng dịch vụ",
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
      description: "Dịch vụ được sử dụng",
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
  },
  { timestamps: true, versionKey: false }
);

// Tự động tạo customSlug trước khi lưu
organizationServiceSchema.pre("save", function (next) {
  if (!this.customSlug) {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    this.customSlug = `orgservice-${timestamp}-${randomStr}`;
  }
  next();
},
{ timestamps: true, versionKey: false });

organizationServiceSchema.plugin(mongoosePaginate);

export default mongoose.model("OrganizationService", organizationServiceSchema); 