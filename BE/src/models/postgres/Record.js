import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/postgres.js';

const Record = sequelize.define('Record', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
    comment: 'UUID for PostgreSQL'
  },
  table_id: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'tables',
      key: 'id'
    }
  },
  user_id: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'References User collection in MongoDB'
  },
  site_id: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'References Site collection in MongoDB'
  },
  data: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {}
  }
}, {
  tableName: 'records',
  indexes: [
    {
      fields: ['table_id', 'created_at']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['site_id']
    },
    {
      fields: ['table_id']
    }
  ]
});

export default Record;
