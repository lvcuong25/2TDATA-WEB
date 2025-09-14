// ─────────────────────────────────────────────────────────────────────────────
// src/models/table.model.js — Định nghĩa Bảng trong Base
// ─────────────────────────────────────────────────────────────────────────────
import mongoose from "mongoose";
const TableSchema = new mongoose.Schema(
  {
    baseId: { type: mongoose.Schema.Types.ObjectId, ref: "Base", required: true },
    name: { type: String, required: true }
  },
  { timestamps: true, versionKey: false }
);
// Đảm bảo mỗi base không có 2 table trùng tên
TableSchema.index({ baseId: 1, name: 1 }, { unique: true });
export default mongoose.model("Table", TableSchema);
