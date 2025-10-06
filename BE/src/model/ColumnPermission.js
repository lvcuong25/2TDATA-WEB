import mongoose from "mongoose";

const columnPermissionSchema = new mongoose.Schema({
  // Column được áp dụng permission (String để support cả MongoDB ObjectId và PostgreSQL UUID)
  columnId: {
    type: String,
    required: true
  },
  
  // Table chứa column (String để support cả MongoDB ObjectId và PostgreSQL UUID)
  tableId: {
    type: String,
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
  
  // Quyền hiển thị column
  canView: {
    type: Boolean,
    default: true
  },
  
  // Quyền chỉnh sửa column
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
columnPermissionSchema.index({ columnId: 1, targetType: 1 });
columnPermissionSchema.index({ tableId: 1, targetType: 1 });
columnPermissionSchema.index({ databaseId: 1, targetType: 1 });
columnPermissionSchema.index({ userId: 1 });
columnPermissionSchema.index({ role: 1 });

// Compound index để đảm bảo unique permission
columnPermissionSchema.index(
  { columnId: 1, targetType: 1, userId: 1 }, 
  { unique: true, sparse: true }
);
columnPermissionSchema.index(
  { columnId: 1, targetType: 1, role: 1 }, 
  { unique: true, sparse: true }
);

export default mongoose.model('ColumnPermission', columnPermissionSchema);
