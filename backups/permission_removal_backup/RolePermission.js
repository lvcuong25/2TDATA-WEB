import mongoose from 'mongoose';

const rolePermissionSchema = new mongoose.Schema({
  role: {
    type: String,
    required: true
  },
  permission_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Permission',
    required: true
  },
  site_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Site',
    required: false // Super admin may not require site_id
  }
}, {
  timestamps: true,
  versionKey: false
});

export default mongoose.model('RolePermission', rolePermissionSchema);
