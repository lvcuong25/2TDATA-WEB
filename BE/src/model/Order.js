import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema({
  name: String,
  amount: Number,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  status: String,
   cellStates: {
    type: Map,
    of: new mongoose.Schema({
      locked: { type: Boolean, default: false },
      hidden: { type: Boolean, default: false }
    }),
    default: {}
  }
});

export default mongoose.model("Order", OrderSchema);