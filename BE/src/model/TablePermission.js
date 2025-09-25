import mongoose from "mongoose";

const tablePermissionSchema = new mongoose.Schema({
  tableId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Table",
    required: true
  },
  databaseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Base",
    required: true
  },
  // Phân quyền cho tất cả thành viên hoặc thành viên cụ thể
  targetType: {
    type: String,
    enum: ["all_members", "specific_user", "specific_role"],
    required: true
  },
  // Nếu targetType là specific_user
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  // Nếu targetType là specific_role
  role: {
    type: String,
    enum: ["owner", "manager", "member"]
  },
  // Quyền cho table
  permissions: {
    canView: {
      type: Boolean,
      default: false
    },
    canEditStructure: {
      type: Boolean,
      default: false
    },
    canEditData: {
      type: Boolean,
      default: false
    },
    canAddData: {
      type: Boolean,
      default: false
    },
    isHidden: {
      type: Boolean,
      default: false
    }
  },
  // Quyền cho views
  viewPermissions: {
    canView: {
      type: Boolean,
      default: false
    },
    canAddView: {
      type: Boolean,
      default: false
    },
    canEditView: {
      type: Boolean,
      default: false
    },
    isHidden: {
      type: Boolean,
      default: false
    }
  },
  // Người tạo quyền (chỉ manager/owner)
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  // Ghi chú
  note: {
    type: String,
    trim: true
  },
  // Đánh dấu permission mặc định (không được xóa)
  isDefault: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index để tối ưu truy vấn
tablePermissionSchema.index({ tableId: 1, targetType: 1 });
tablePermissionSchema.index({ databaseId: 1, targetType: 1 });
tablePermissionSchema.index({ userId: 1 });
tablePermissionSchema.index({ createdBy: 1 });

// Compound index để đảm bảo unique permission
tablePermissionSchema.index({ 
  tableId: 1, 
  targetType: 1, 
  userId: 1, 
  role: 1 
}, { 
  unique: true,
  partialFilterExpression: {
    $or: [
      { targetType: "specific_user", userId: { $exists: true } },
      { targetType: "specific_role", role: { $exists: true } },
      { targetType: "all_members" }
    ]
  }
});

const TablePermission = mongoose.model("TablePermission", tablePermissionSchema);

export default TablePermission;
