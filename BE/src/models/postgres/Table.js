import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/postgres.js';

const Table = sequelize.define('Table', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
    comment: 'UUID for PostgreSQL'
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  database_id: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'References Base collection in MongoDB'
  },
  user_id: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'References User collection in MongoDB'
  },
  site_id: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'References Site collection in MongoDB'
  },
  // Access Control - stored as JSON
  table_access_rule: {
    type: DataTypes.JSONB,
    defaultValue: {
      userIds: [],
      allUsers: false,
      access: []
    }
  },
  column_access_rules: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  record_access_rules: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  cell_access_rules: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  description: {
    type: DataTypes.TEXT,
    defaultValue: ''
  }
}, {
  tableName: 'tables',
  indexes: [
    {
      unique: true,
      fields: ['name', 'database_id']
    },
    {
      fields: ['database_id']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['site_id']
    }
  ]
});

export default Table;
