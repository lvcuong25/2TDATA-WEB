import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/postgres.js';

const Row = sequelize.define('Row', {
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
  data: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  created_by: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'References User collection in MongoDB'
  }
}, {
  tableName: 'rows',
  indexes: [
    {
      fields: ['table_id']
    },
    {
      fields: ['created_by']
    }
  ]
});

export default Row;
