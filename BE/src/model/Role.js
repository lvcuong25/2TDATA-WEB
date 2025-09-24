import mongoose from "mongoose";

const RoleSchema = new mongoose.Schema({
  org: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
  name: { type: String, required: true, enum: ["Owner", "Admin", "Editor", "Viewer", "Custom"] },
  permissions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Permission" }]
}, { timestamps: true });

export default mongoose.model("Role", RoleSchema);