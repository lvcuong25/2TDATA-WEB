import mongoose from "mongoose";

const accessEnum = ["read", "update", "delete", "no_access"];

// Shared schema for column & record rules
const accessRuleSchema = new mongoose.Schema(
  {
    columnId: { type: mongoose.Schema.Types.ObjectId, ref: "Column" }, // only for column rules
    recordId: { type: mongoose.Schema.Types.ObjectId, ref: "Record" }, // only for record rules
    userIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    allUsers: { type: Boolean, default: false },
    access: [{ type: String, enum: accessEnum }],
    createdAt: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { _id: true } // each rule will have its own _id
);

const tableSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    databaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Base",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      //required: true
    },
    siteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Site",
      //required: true
    },
    // ─────────────── Access Control ───────────────
    tableAccessRule: {
      userIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      allUsers: { type: Boolean, default: false },
      access: [{ type: String, enum: accessEnum }],
    },

    columnAccessRules: [accessRuleSchema],
    recordAccessRules: [accessRuleSchema],
    cellAccessRules: [accessRuleSchema],
    description: {
      type: String,
      trim: true,
      default: "",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure unique table names per database
tableSchema.index({ name: 1, databaseId: 1 }, { unique: true });

// Pre-save middleware to update the updatedAt field
tableSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const Table = mongoose.model("Table", tableSchema);

export default Table;
