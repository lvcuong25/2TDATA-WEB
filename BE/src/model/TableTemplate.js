import { DataTypes } from 'sequelize';
import { sequelize } from '../config/postgres.js';

// Template Column Model
const TemplateColumn = sequelize.define('TemplateColumn', {
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
    allowNull: false,
    validate: {
      notEmpty: true
    }
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
  description: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  config: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  template_table_id: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'template_tables',
      key: 'id'
    }
  }
}, {
  tableName: 'template_columns',
  indexes: [
    {
      fields: ['template_table_id']
    },
    {
      fields: ['order']
    }
  ]
});

// Template Table Model
const TemplateTable = sequelize.define('TemplateTable', {
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
  description: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  template_id: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'templates',
      key: 'id'
    }
  },
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'template_tables',
  indexes: [
    {
      fields: ['template_id']
    },
    {
      fields: ['order']
    }
  ]
});

// Template Model
const TableTemplate = sequelize.define('TableTemplate', {
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
  description: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  icon: {
    type: DataTypes.STRING,
    defaultValue: '📋'
  },
  thumbnail: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  tags: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  created_by: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'References User collection in MongoDB'
  },
  is_public: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  usage_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  rating: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 0,
    validate: {
      min: 0,
      max: 5
    }
  },
  version: {
    type: DataTypes.STRING,
    defaultValue: '1.0.0'
  },
  features: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  complexity: {
    type: DataTypes.ENUM('beginner', 'intermediate', 'advanced'),
    defaultValue: 'beginner'
  },
  estimated_setup_time: {
    type: DataTypes.STRING,
    defaultValue: '5 minutes'
  }
}, {
  tableName: 'templates',
  indexes: [
    {
      unique: true,
      fields: ['name']
    },
    {
      fields: ['created_by']
    },
    {
      fields: ['is_public']
    },
    {
      fields: ['usage_count']
    },
    {
      fields: ['rating']
    }
  ]
});

// Define associations
TableTemplate.hasMany(TemplateTable, { 
  foreignKey: 'template_id', 
  as: 'tables',
  onDelete: 'CASCADE'
});
TemplateTable.belongsTo(TableTemplate, { 
  foreignKey: 'template_id', 
  as: 'template'
});

TemplateTable.hasMany(TemplateColumn, { 
  foreignKey: 'template_table_id', 
  as: 'columns',
  onDelete: 'CASCADE'
});
TemplateColumn.belongsTo(TemplateTable, { 
  foreignKey: 'template_table_id', 
  as: 'template_table'
});

export { TableTemplate, TemplateTable, TemplateColumn };
export default TableTemplate;
