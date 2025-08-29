import mongoose from 'mongoose';

const fieldPreferenceSchema = new mongoose.Schema({
  tableId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Table',
    required: true,
    index: true
  },
  fieldVisibility: {
    type: Map,
    of: Boolean,
    default: new Map()
  },
  showSystemFields: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
fieldPreferenceSchema.index({ tableId: 1, createdAt: -1 });

// Ensure only one preference per table
fieldPreferenceSchema.index({ tableId: 1 }, { unique: true });

export default mongoose.model('FieldPreference', fieldPreferenceSchema);
