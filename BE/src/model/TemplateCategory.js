import mongoose from "mongoose";

const templateCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ""
  },
  color: {
    type: String,
    default: "#1890ff"
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  templateCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  versionKey: false
});

// Indexes
templateCategorySchema.index({ name: 1 });
templateCategorySchema.index({ isActive: 1 });
templateCategorySchema.index({ createdBy: 1 });

export default mongoose.model("TemplateCategory", templateCategorySchema);
