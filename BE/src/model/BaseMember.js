// ─────────────────────────────────────────────────────────────────────────────
// src/models/baseMember.model.js — Thành viên Base + roleId
// ─────────────────────────────────────────────────────────────────────────────
import mongoose from "mongoose";
const BaseMemberSchema = new mongoose.Schema(
  {
    databaseId: { type: mongoose.Schema.Types.ObjectId, ref: "Base", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["owner", "manager", "member"] }, // Legacy field
    roleId: { type: mongoose.Schema.Types.ObjectId, ref: "BaseRole" }, // New field for BaseRole reference
    baseRoleId: { type: mongoose.Schema.Types.ObjectId, ref: "BaseRole" } // Alias for backward compatibility
  },
  { timestamps: true, versionKey: false }
);
BaseMemberSchema.index({ databaseId: 1, userId: 1 }, { unique: true });
export default mongoose.model("BaseMember", BaseMemberSchema);
