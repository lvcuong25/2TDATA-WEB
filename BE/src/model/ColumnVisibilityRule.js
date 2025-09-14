
import mongoose from "mongoose";

const ColumnVisibilityRuleSchema = new mongoose.Schema(
  {
    baseId: { type: mongoose.Schema.Types.ObjectId, ref: "Base", required: true },
    tableId: { type: mongoose.Schema.Types.ObjectId, ref: "Table", required: true },
    columnKey: { type: String, required: true },
    visibility: { type: String, enum: ["visible", "hidden"], required: true },
    // Áp dụng cho user. role cụ thể, hoặc tất cả (nếu roles/users trống)
    roles: [{ type: mongoose.Schema.Types.ObjectId, ref: "BaseRole" }],
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    // Ai tạo rule này
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    note: { type: String }
  })

  export default mongoose.model("ColumnVisibilityRule", ColumnVisibilityRuleSchema);