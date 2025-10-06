// PostgreSQL Models Index
import { sequelize } from '../../config/postgres.js';
import Table from './Table.js';
import Column from './Column.js';
import Record from './Record.js';
import Row from './Row.js';
import ConditionalFormattingRule from './ConditionalFormattingRule.js';

// Define associations
Table.hasMany(Column, { foreignKey: 'table_id', as: 'columns' });
Column.belongsTo(Table, { foreignKey: 'table_id', as: 'table' });

Table.hasMany(Record, { foreignKey: 'table_id', as: 'records' });
Record.belongsTo(Table, { foreignKey: 'table_id', as: 'table' });

Table.hasMany(Row, { foreignKey: 'table_id', as: 'rows' });
Row.belongsTo(Table, { foreignKey: 'table_id', as: 'table' });

Table.hasMany(ConditionalFormattingRule, { foreignKey: 'table_id', as: 'formattingRules' });
ConditionalFormattingRule.belongsTo(Table, { foreignKey: 'table_id', as: 'table' });

Column.hasMany(ConditionalFormattingRule, { foreignKey: 'column_id', as: 'formattingRules' });
ConditionalFormattingRule.belongsTo(Column, { foreignKey: 'column_id', as: 'column' });

// Sync models with database
const syncModels = async (force = false) => {
  try {
    await sequelize.sync({ force });
    console.log('✅ PostgreSQL models synchronized successfully');
  } catch (error) {
    console.error('❌ Error synchronizing PostgreSQL models:', error);
    throw error;
  }
};

export {
  sequelize,
  Table,
  Column,
  Record,
  Row,
  ConditionalFormattingRule,
  syncModels
};

export default {
  sequelize,
  Table,
  Column,
  Record,
  Row,
  ConditionalFormattingRule,
  syncModels
};
