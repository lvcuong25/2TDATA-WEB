import mongoose from "mongoose";

const UserPermissionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    base: { type: mongoose.Schema.Types.ObjectId, ref: "Base", required: true },
    site: { type: mongoose.Schema.Types.ObjectId, ref: "Site", required: false },
    scope: { type: String, enum: ["table", "column", "row", "cell"], required: true },
    resource: { type: String, required: true },
    actions: [{ type: String, enum: ["create", "read", "update", "delete", "lock", "hide"] }],

    tableAccess: { type: String, enum: ["full", "read_write", "read_only", "no_access"], default: "read_only" },
    column: String,
    columnAccess: { type: String, enum: ["visible", "hidden", "readonly"], default: "visible" },
    rowId: mongoose.Schema.Types.ObjectId,
    rowAccess: { type: String, enum: ["full", "add_only", "read_only", "hidden"], default: "read_only" },
    cellRule: mongoose.Schema.Types.Mixed,
    cellMode: { type: String, enum: ["readonly", "hidden", "editable"], default: "readonly" },
    lockedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    lockedAt: Date,
    enabled: { type: Boolean, default: true },
    history: [{
      action: { type: String, enum: ["lock", "unlock"] },
      by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      at: { type: Date, default: Date.now }
    }]
  },
  { timestamps: true }
);

export default mongoose.model("UserPermission", UserPermissionSchema);
