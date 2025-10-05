import { DataTypes } from 'sequelize';
import { sequelize } from './index.js';

const ConditionalFormattingRule = sequelize.define('ConditionalFormattingRule', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  tableId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'table_id',
    references: {
      model: 'tables',
      key: 'id'
    }
  },
  columnId: {
    type: DataTypes.UUID,
    allowNull: true, // NULL = apply to all columns
    field: 'column_id',
    references: {
      model: 'columns',
      key: 'id'
    }
  },
  databaseId: {
    type: DataTypes.STRING(24),
    allowNull: false,
    field: 'database_id',
    comment: 'MongoDB ObjectId reference'
  },
  ruleName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'rule_name'
  },
  ruleType: {
    type: DataTypes.ENUM('cell_value', 'date', 'text_contains', 'formula', 'cross_column'),
    allowNull: false,
    field: 'rule_type'
  },
  conditions: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [],
    comment: 'Array of condition objects'
  },
  formatting: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
    comment: 'Formatting object with styles'
  },
  priority: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'is_active'
  },
  targetType: {
    type: DataTypes.ENUM('all_members', 'specific_user', 'specific_role'),
    allowNull: false,
    field: 'target_type'
  },
  targetUserId: {
    type: DataTypes.STRING(24),
    allowNull: true,
    field: 'target_user_id',
    comment: 'MongoDB ObjectId'
  },
  targetRole: {
    type: DataTypes.ENUM('owner', 'manager', 'member'),
    allowNull: true,
    field: 'target_role'
  },
  createdBy: {
    type: DataTypes.STRING(24),
    allowNull: false,
    field: 'created_by',
    comment: 'MongoDB ObjectId'
  }
}, {
  tableName: 'conditional_formatting_rules',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['table_id'],
      name: 'idx_conditional_formatting_table_id'
    },
    {
      fields: ['column_id'],
      name: 'idx_conditional_formatting_column_id'
    },
    {
      fields: ['database_id'],
      name: 'idx_conditional_formatting_database_id'
    },
    {
      fields: ['is_active'],
      name: 'idx_conditional_formatting_active'
    },
    {
      fields: ['priority'],
      name: 'idx_conditional_formatting_priority'
    },
    {
      fields: ['target_type', 'target_user_id', 'target_role'],
      name: 'idx_conditional_formatting_target'
    }
  ]
});

// Associations
ConditionalFormattingRule.associate = (models) => {
  // Belongs to Table
  ConditionalFormattingRule.belongsTo(models.Table, {
    foreignKey: 'tableId',
    as: 'table'
  });
  
  // Belongs to Column (optional)
  ConditionalFormattingRule.belongsTo(models.Column, {
    foreignKey: 'columnId',
    as: 'column'
  });
};

export default ConditionalFormattingRule;
