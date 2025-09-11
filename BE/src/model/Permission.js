import mongoose from "mongoose";
const PermissionSchema = new mongoose.Schema({
    scope: { type: String, enum: ["table", "column", "row", "cell"], required: true },

  resource: { type: String, required: true }, // ví dụ: "orders", "users", "orders.amount"
  actions: [{ 
    type: String, 
    enum: ["create", "read", "update", "delete", "lock", "hide"]
  }],

   // ---- Table-level ----
  tableAccess: {
    type: String,
    enum: ["full", "read_write", "read_only", "no_access"],
    default: "read_only"
  },


   // ---- Column-level ----
  column: { type: String }, // tên cột
  columnAccess: {
    type: String,
    enum: ["visible", "hidden", "readonly"],
    default: "visible"
  },

   // ---- Row-level ----
  condition: { type: mongoose.Schema.Types.Mixed }, // { CreatedBy: "$currentUser" }
  rowAccess: {
    type: String,
    enum: ["full", "add_only", "read_only", "hidden"],
    default: "read_only"
  },

 // ---- Cell-level ----
  cellRule: { type: mongoose.Schema.Types.Mixed }, 
  // Ví dụ: { column: "amount", condition: { status: "Approved" }, mode: "readonly" }

  cellMode: {
    type: String,
    enum: ["readonly", "hidden", "editable"],
    default: "readonly"
  },
  
  lockedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  lockedAt: Date,
  enabled: { type: Boolean, default: true }

}, { timestamps: true });


export default mongoose.model("Permission", PermissionSchema);