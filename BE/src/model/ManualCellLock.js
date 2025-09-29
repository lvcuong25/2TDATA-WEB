// ─────────────────────────────────────────────────────────────────────────────
// src/models/manualCellLock.model.js — Lock thủ công
// ─────────────────────────────────────────────────────────────────────────────
import mongoose from "mongoose";
const ManualCellLockSchema = new mongoose.Schema(
  {
    baseId: { type: mongoose.Schema.Types.ObjectId, ref: "Base", required: true }, tableId: { type: String, required: true }, // Changed to String to support both MongoDB ObjectId and PostgreSQL UUID
    // Lock trực tiếp theo cell (rowId + columnId) hoặc theo A1 range (khuyên FE gửi resolvedTargets)
    cells: [{ rowId: { type: mongoose.Schema.Types.ObjectId, ref: "Row" }, columnId: { type: mongoose.Schema.Types.ObjectId, ref: "Column" }, columnKey: String }],
    a1Ranges: [String],
    resolvedTargets: [{ rowId: { type: mongoose.Schema.Types.ObjectId, ref: "Row" }, columnId: { type: mongoose.Schema.Types.ObjectId, ref: "Column" }, columnKey: String }],
    // Chế độ lock: hidden (ẩn hẳn giá trị), readOnly (chỉ đọc), editableByRole/User (mở quyền viết tùy chọn)
    mode: { type: String, enum: ["readOnly", "hidden", "editableByRole", "editableByUser"], required: true },
    roles: [{ type: mongoose.Schema.Types.ObjectId, ref: "BaseRole" }],
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    lockedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, lockedAt: { type: Date, default: () => new Date() }, note: String
  },
  { timestamps: true, versionKey: false }
);
ManualCellLockSchema.index({ baseId: 1, tableId: 1 });
export default mongoose.model("ManualCellLock", ManualCellLockSchema);