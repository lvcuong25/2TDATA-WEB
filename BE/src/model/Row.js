// ─────────────────────────────────────────────────────────────────────────────
// src/models/row.model.js — Bản ghi dữ liệu
// ─────────────────────────────────────────────────────────────────────────────
import mongoose from "mongoose";
const RowSchema = new mongoose.Schema(
  {
    tableId: { type: String, required: true, index: true }, // Changed to String to support both MongoDB ObjectId and PostgreSQL UUID
    data: { type: Object, default: {} },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true, versionKey: false }
);
RowSchema.index({ tableId: 1 });
RowSchema.index({ createdBy: 1 });
export default mongoose.model("Row", RowSchema);