import mongoose from 'mongoose';

const filterRuleSchema = new mongoose.Schema({
  field: {
    type: String,
    required: true
  },
  operator: {
    type: String,
    required: true,
    enum: [
      'equals',
      'not_equals', 
      'contains',
      'not_contains',
      'starts_with',
      'ends_with',
      'greater_than',
      'less_than',
      'greater_than_or_equal',
      'less_than_or_equal',
      'is_empty',
      'is_not_empty',
      'is_null',
      'is_not_null'
    ]
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  }
}, { _id: false });

const filterPreferenceSchema = new mongoose.Schema({
  tableId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Table',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  siteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Site',
    required: true
  },
  filterRules: {
    type: [filterRuleSchema],
    default: []
  },
  isActive: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Compound index to ensure unique filter preference per table per user per site
filterPreferenceSchema.index({ tableId: 1, userId: 1, siteId: 1 }, { unique: true });

const FilterPreference = mongoose.model('FilterPreference', filterPreferenceSchema);

export default FilterPreference;
