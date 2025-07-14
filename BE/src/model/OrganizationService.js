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
    site_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Site",
      required: true,
      description: "ID của site liên kết với service",
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
      sparse: true,
      description: "Slug tùy chỉnh cho dịch vụ của tổ chức",
    },
    config: {
      apiKey: String,
      webhookUrl: String,
      settings: mongoose.Schema.Types.Mixed,
    },
    requestInfo: {
      requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      requestedAt: { type: Date, default: Date.now },
      requestNote: String,
    },
    expires_at: {
      type: Date,
      required: false,
      description: "Thời gian hết hạn dịch vụ",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

organizationServiceSchema.plugin(mongoosePaginate);

organizationServiceSchema.index({ organization: 1, service: 1 });
organizationServiceSchema.index({ customSlug: 1 });
organizationServiceSchema.index({ status: 1 });
organizationServiceSchema.index({ expires_at: 1 });

export default mongoose.model("OrganizationService", organizationServiceSchema);
