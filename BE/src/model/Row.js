// ─────────────────────────────────────────────────────────────────────────────
// src/models/row.model.js — Bản ghi dữ liệu
// ─────────────────────────────────────────────────────────────────────────────
import mongoose from "mongoose";
const RowSchema = new mongoose.Schema(
  {
    baseId: { type: mongoose.Schema.Types.ObjectId, ref: "Base", required: true },
    tableId: { type: mongoose.Schema.Types.ObjectId, ref: "Table", required: true },
    data: { type: Object, default: {} },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true, versionKey: false }
);
RowSchema.index({ baseId: 1, tableId: 1 });
RowSchema.index({ createdBy: 1 });
export default mongoose.model("Row", RowSchema);