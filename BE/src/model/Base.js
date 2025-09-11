import mongoose from "mongoose";
const BaseSchema = new mongoose.Schema({
  org: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
  site: { type: mongoose.Schema.Types.ObjectId, ref: "Site", required: false }, // base có thể gắn site
  name: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  maxUsers: { type: Number },
  description: String,
  active: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model("Base", BaseSchema);