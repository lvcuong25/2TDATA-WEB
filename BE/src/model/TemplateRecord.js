import { DataTypes } from 'sequelize';
import { sequelize } from '../models/postgres/index.js';

const TemplateRecord = sequelize.define('TemplateRecord', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  template_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  table_index: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  data: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {}
  },
  created_by: {
    type: DataTypes.STRING,
    allowNull: false
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'template_records',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default TemplateRecord;
