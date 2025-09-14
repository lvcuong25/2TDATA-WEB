import mongoose from "mongoose";

const tableSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  baseId: { type: mongoose.Schema.Types.ObjectId, ref: "Base", required: true },
  databaseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Database',
    //required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    //required: true
  },
  siteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Site',
    //required: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to ensure unique table names per database
tableSchema.index({ name: 1, databaseId: 1 }, { unique: true });

// Pre-save middleware to update the updatedAt field
tableSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

const Table = mongoose.model('Table', tableSchema);

export default Table;
