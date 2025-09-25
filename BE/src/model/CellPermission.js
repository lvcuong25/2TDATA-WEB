import mongoose from "mongoose";

const cellPermissionSchema = new mongoose.Schema({
  // Cell được áp dụng permission (recordId + columnId)
  recordId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Record',
    required: true
  },
  
  columnId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Column',
    required: true
  },
  
  // Table chứa cell
  tableId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Table',
    required: true
  },
  
  // Database chứa table
  databaseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Database',
    required: true
  },
  
  // Loại target (all_members, specific_user, specific_role)
  targetType: {
    type: String,
    enum: ['all_members', 'specific_user', 'specific_role'],
    required: true
  },
  
  // User cụ thể (nếu targetType là specific_user)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Role cụ thể (nếu targetType là specific_role)
  role: {
    type: String,
    enum: ['owner', 'manager', 'member']
  },
  
  // Quyền hiển thị cell
  canView: {
    type: Boolean,
    default: true
  },
  
  // Quyền chỉnh sửa cell
  canEdit: {
    type: Boolean,
    default: true
  },
  
  // Tên permission
  name: {
    type: String,
    required: true
  },
  
  // Ghi chú
  note: {
    type: String,
    default: ''
  },
  
  // Người tạo permission
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Đánh dấu permission mặc định (không được xóa)
  isDefault: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index để tối ưu query
cellPermissionSchema.index({ recordId: 1, columnId: 1, targetType: 1 });
cellPermissionSchema.index({ tableId: 1, targetType: 1 });
cellPermissionSchema.index({ databaseId: 1, targetType: 1 });
cellPermissionSchema.index({ userId: 1 });
cellPermissionSchema.index({ role: 1 });

// Compound index để đảm bảo unique permission
cellPermissionSchema.index(
  { recordId: 1, columnId: 1, targetType: 1, userId: 1 }, 
  { unique: true, sparse: true }
);
cellPermissionSchema.index(
  { recordId: 1, columnId: 1, targetType: 1, role: 1 }, 
  { unique: true, sparse: true }
);

export default mongoose.model('CellPermission', cellPermissionSchema);
