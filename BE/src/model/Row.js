// ─────────────────────────────────────────────────────────────────────────────
// src/models/row.model.js — Bản ghi dữ liệu
// ─────────────────────────────────────────────────────────────────────────────
import mongoose from "mongoose";
const RowSchema = new mongoose.Schema(
  {
    tableId: { type: mongoose.Schema.Types.ObjectId, ref: "Table", required: true },
    data: { type: Object, default: {} },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true, versionKey: false }
);
RowSchema.index({ tableId: 1 });
RowSchema.index({ createdBy: 1 });
export default mongoose.model("Row", RowSchema);