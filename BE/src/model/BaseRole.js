// ─────────────────────────────────────────────────────────────────────────────
// src/models/baseRole.model.js — Role & Perms các tầng
// ─────────────────────────────────────────────────────────────────────────────
import mongoose from "mongoose";

// Table-level CRUD
const TablePerm = new mongoose.Schema(
  { tableId: { type: String, required: true }, create: Boolean, read: Boolean, update: Boolean, delete: Boolean }, // Changed to String to support both MongoDB ObjectId and PostgreSQL UUID
  { _id: false }
);

// Column-level: visibility/edit/mask/deletable
const ColumnPerm = new mongoose.Schema(
  { tableId: { type: String, required: true }, columnId: { type: String, required: true }, columnKey: { type: String, required: true }, visibility: { type: String, enum: ["visible", "hidden"], default: "visible" }, edit: { type: String, enum: ["rw", "ro", "none"], default: "rw" }, deletable: { type: Boolean, default: false }, maskMode: { type: String, enum: ["plain", "masked"], default: "plain" } }, // Changed to String to support both MongoDB ObjectId and PostgreSQL UUID
  { _id: false }
);

// Row-level: ABAC query template với placeholder $ctx.*
const RowPolicy = new mongoose.Schema(
  { tableId: { type: String, required: true }, queryTemplate: { type: Object, required: true } }, // Changed to String to support both MongoDB ObjectId and PostgreSQL UUID
  { _id: false }
);

// Cell-level rule locks: lock theo điều kiện (giống Protect range rules)
const CellRuleLock = new mongoose.Schema(
  { tableId: { type: String, required: true }, where: { type: Object, required: true }, columns: { type: [String], required: true }, mode: { type: String, enum: ["readOnly", "hidden", "editableByRole", "editableByUser"], required: true }, roles: [{ type: mongoose.Schema.Types.ObjectId, ref: "BaseRole" }], users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }] }, // Changed to String to support both MongoDB ObjectId and PostgreSQL UUID
  { _id: false }
);

const BaseRoleSchema = new mongoose.Schema(
  {
    databaseId: { type: mongoose.Schema.Types.ObjectId, ref: "Base", required: true },
    name: { type: String, required: true },
    builtin: { type: Boolean, default: false },
    permissions: { type: Object }, 
  },
  { timestamps: true, versionKey: false }
);
BaseRoleSchema.index({ databaseId: 1, name: 1 }, { unique: true });
export default mongoose.model("BaseRole", BaseRoleSchema);