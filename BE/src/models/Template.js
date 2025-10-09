import { DataTypes } from 'sequelize';
import { sequelize } from '../config/postgres.js';
import mongoose from 'mongoose';

/**
 * HYBRID TEMPLATE SYSTEM
 * 
 * MongoDB: Template metadata (như User, Organization trong database chính)
 * PostgreSQL: Template structure data (như Table, Column, Record trong database chính)
 * 
 * Template = Bản copy database structure (không có organization & permissions)
 */

// ===========================================
// MONGODB MODELS (Metadata)
// ===========================================

// Template Metadata Schema (MongoDB)
const templateMetadataSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    comment: 'Tên template'
  },
  description: {
    type: String,
    default: '',
    comment: 'Mô tả template'
  },
  category: {
    type: String,
    required: false,
    comment: 'Danh mục template'
  },
  icon: {
    type: String,
    default: '📋',
    comment: 'Icon template'
  },
  thumbnail: {
    type: String,
    default: '',
    comment: 'Ảnh thumbnail'
  },
  tags: [{
    type: String
  }],
  // Template creator (chỉ lưu ID, không có organization)
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
    comment: 'User tạo template (không có organization)'
  },
  // Public/Private (đơn giản)
  is_public: {
    type: Boolean,
    default: true,
    comment: 'Template công khai hay riêng tư'
  },
  // Usage stats
  usage_count: {
    type: Number,
    default: 0,
    comment: 'Số lần sử dụng template'
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
    comment: 'Đánh giá template (0-5)'
  },
  version: {
    type: String,
    default: '1.0.0',
    comment: 'Phiên bản template'
  },
  // Template structure reference (PostgreSQL)
  structure_id: {
    type: String,
    required: true,
    comment: 'ID của template structure trong PostgreSQL'
  }
}, {
  timestamps: true
});

// Template Metadata Model (MongoDB)
export const TemplateMetadata = mongoose.model('TemplateMetadata', templateMetadataSchema);

// ===========================================
// POSTGRESQL MODELS (Structure Data)
// ===========================================

// Template Structure Model (PostgreSQL) - Chứa cấu trúc database
const TemplateStructure = sequelize.define('TemplateStructure', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  // Cấu trúc database - JSON chứa toàn bộ structure
  database_structure: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
    comment: 'Cấu trúc database: {tables: [...], columns: [...], relationships: [...]}'
  },
  // Template tables (PostgreSQL)
  tables: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [],
    comment: 'Danh sách tables trong template'
  },
  // Template columns (PostgreSQL) 
  columns: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [],
    comment: 'Danh sách columns trong template'
  },
  // Template relationships
  relationships: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [],
    comment: 'Relationships giữa tables'
  },
  // Template settings
  settings: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
    comment: 'Cài đặt template (permissions, formatting, etc.)'
  }
}, {
  tableName: 'template_structures',
  timestamps: true,
  indexes: [
    {
      fields: ['id']
    }
  ]
});

// Template Table Model (PostgreSQL) - Chi tiết từng table
const TemplateTable = sequelize.define('TemplateTable', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  template_structure_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'template_structures',
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Tên table'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Mô tả table'
  },
  // Table structure
  structure: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
    comment: 'Cấu trúc table (columns, indexes, constraints)'
  },
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Thứ tự table'
  }
}, {
  tableName: 'template_tables',
  timestamps: true,
  indexes: [
    {
      fields: ['template_structure_id']
    },
    {
      fields: ['order']
    }
  ]
});

// Template Column Model (PostgreSQL) - Chi tiết từng column
const TemplateColumn = sequelize.define('TemplateColumn', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4
  },
  template_table_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'template_tables',
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Tên column'
  },
  key: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Key column'
  },
  data_type: {
    type: DataTypes.ENUM(
      'text', 'number', 'date', 'datetime', 'year', 'checkbox', 
      'single_select', 'multi_select', 'formula', 'currency', 
      'percent', 'phone', 'time', 'rating', 'email', 'url', 
      'linked_table', 'json', 'lookup'
    ),
    allowNull: false,
    comment: 'Kiểu dữ liệu column'
  },
  is_required: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Column bắt buộc'
  },
  is_unique: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Column unique'
  },
  default_value: {
    type: DataTypes.JSONB,
    defaultValue: null,
    comment: 'Giá trị mặc định'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Mô tả column'
  },
  config: {
    type: DataTypes.JSONB,
    defaultValue: {},
    comment: 'Cấu hình column (validation, formatting, etc.)'
  },
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Thứ tự column'
  }
}, {
  tableName: 'template_columns',
  timestamps: true,
  indexes: [
    {
      fields: ['template_table_id']
    },
    {
      fields: ['order']
    }
  ]
});

// ===========================================
// ASSOCIATIONS
// ===========================================

// PostgreSQL Associations
TemplateStructure.hasMany(TemplateTable, { 
  foreignKey: 'template_structure_id', 
  as: 'template_tables',  // Changed from 'tables' to avoid collision
  onDelete: 'CASCADE'
});
TemplateTable.belongsTo(TemplateStructure, { 
  foreignKey: 'template_structure_id', 
  as: 'template_structure'  // Changed from 'structure' to avoid collision
});

TemplateTable.hasMany(TemplateColumn, { 
  foreignKey: 'template_table_id', 
  as: 'template_columns',  // Changed from 'columns' to avoid collision
  onDelete: 'CASCADE'
});
TemplateColumn.belongsTo(TemplateTable, { 
  foreignKey: 'template_table_id', 
  as: 'template_table'  // Changed from 'table' to avoid collision
});

// ===========================================
// EXPORTS
// ===========================================

export {
  TemplateStructure,
  TemplateTable,
  TemplateColumn
};

export default {
  // MongoDB Models
  TemplateMetadata,
  // PostgreSQL Models  
  TemplateStructure,
  TemplateTable,
  TemplateColumn
};