import mongoose from "mongoose";
const BaseSchema = new mongoose.Schema(
  {
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
    name: { type: String, required: true, trim: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true, versionKey: false }
);
// Mỗi org không được có 2 base trùng tên
BaseSchema.index({ orgId: 1, name: 1 }, { unique: true });
export default mongoose.model("Base", BaseSchema);