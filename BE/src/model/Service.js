import mongoose from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
    },
    status: {
      type: Boolean,
      default: true,
    },
    image: {
      type: String,
    }
  },
  { timestamps: true, versionKey: false }
);

// Tự động tạo slug từ tên service
serviceSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

serviceSchema.plugin(mongoosePaginate);

export default mongoose.model("Service", serviceSchema); 