import mongoose from "mongoose";

const CellStateSchema = new mongoose.Schema({
  resource: { type: String, required: true }, // "orders"
  rowId: { type: mongoose.Schema.Types.ObjectId, required: true },
  column: { type: String, required: true },

  mode: { type: String, enum: ["editable", "readonly", "hidden"], default: "editable" },
  lockedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  lockedAt: Date,
  hiddenBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  hiddenAt: Date
}, { timestamps: true });

CellStateSchema.index({ resource: 1, rowId: 1, column: 1 }, { unique: true });

export default mongoose.model("CellState", CellStateSchema);
