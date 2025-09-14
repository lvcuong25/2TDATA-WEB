// ─────────────────────────────────────────────────────────────────────────────
// src/models/baseMember.model.js — Thành viên Base + roleId
// ─────────────────────────────────────────────────────────────────────────────
import mongoose from "mongoose";
const BaseMemberSchema = new mongoose.Schema(
  {
    baseId: { type: mongoose.Schema.Types.ObjectId, ref: "Base", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    roleId: { type: mongoose.Schema.Types.ObjectId, ref: "BaseRole", required: true }
  },
  { timestamps: true, versionKey: false }
);
BaseMemberSchema.index({ baseId: 1, userId: 1 }, { unique: true });
export default mongoose.model("BaseMember", BaseMemberSchema);