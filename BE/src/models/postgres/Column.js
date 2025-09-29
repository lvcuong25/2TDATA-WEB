import { DataTypes } from 'sequelize';
import { sequelize } from '../../config/postgres.js';

const Column = sequelize.define('Column', {
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
  key: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('string', 'number', 'date', 'boolean', 'json'),
    defaultValue: 'string'
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
    allowNull: true,
    comment: 'References User collection in MongoDB'
  },
  site_id: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'References Site collection in MongoDB'
  },
  data_type: {
    type: DataTypes.ENUM(
      'text', 'number', 'date', 'datetime', 'year', 'checkbox', 'single_select', 
      'multi_select', 'formula', 'currency', 'percent', 'phone', 'time', 'rating', 
      'email', 'url', 'linked_table', 'json', 'lookup'
    ),
    allowNull: false
  },
  is_required: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  is_unique: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  default_value: {
    type: DataTypes.JSONB,
    defaultValue: null
  },
  // Configuration objects stored as JSONB
  checkbox_config: {
    type: DataTypes.JSONB,
    defaultValue: null
  },
  single_select_config: {
    type: DataTypes.JSONB,
    defaultValue: null
  },
  multi_select_config: {
    type: DataTypes.JSONB,
    defaultValue: null
  },
  formula_config: {
    type: DataTypes.JSONB,
    defaultValue: null
  },
  date_config: {
    type: DataTypes.JSONB,
    defaultValue: null
  },
  currency_config: {
    type: DataTypes.JSONB,
    defaultValue: null
  },
  percent_config: {
    type: DataTypes.JSONB,
    defaultValue: null
  },
  url_config: {
    type: DataTypes.JSONB,
    defaultValue: null
  },
  phone_config: {
    type: DataTypes.JSONB,
    defaultValue: null
  },
  time_config: {
    type: DataTypes.JSONB,
    defaultValue: null
  },
  rating_config: {
    type: DataTypes.JSONB,
    defaultValue: null
  },
  linked_table_config: {
    type: DataTypes.JSONB,
    defaultValue: null
  },
  lookup_config: {
    type: DataTypes.JSONB,
    defaultValue: null
  },
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'columns',
  indexes: [
    {
      unique: true,
      fields: ['name', 'table_id']
    },
    {
      fields: ['table_id']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['site_id']
    },
    {
      fields: ['order']
    }
  ]
});

export default Column;
