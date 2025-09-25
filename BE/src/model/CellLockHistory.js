import mongoose from "mongoose";

const CellLockHistorySchema = new mongoose.Schema({
  resource: String, // orders.amount
  rowId: mongoose.Schema.Types.ObjectId,
  column: String,
  action: { type: String, enum: ["lock", "unlock", "hide", "unhide"], required: true },
  by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  at: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model("CellLockHistory", CellLockHistorySchema);
