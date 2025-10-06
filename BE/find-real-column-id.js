import mongoose from 'mongoose';
import { Column as PostgresColumn, sequelize } from './src/models/postgres/index.js';

console.log('=== FINDING REAL COLUMN ID ===');

async function findRealColumnId() {
  try {
    // Connect to PostgreSQL
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connected');
    
    // Find a real column
    const columns = await PostgresColumn.findAll({
      limit: 5,
      order: [['created_at', 'DESC']]
    });
    
    console.log(`\n📋 Found ${columns.length} columns:`);
    columns.forEach((column, index) => {
      console.log(`   ${index + 1}. ID: ${column.id}`);
      console.log(`      Name: ${column.name}`);
      console.log(`      Table ID: ${column.table_id}`);
      console.log(`      Type: ${column.data_type}`);
      console.log('');
    });
    
    if (columns.length > 0) {
      console.log(`✅ Use this column ID for testing: ${columns[0].id}`);
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

findRealColumnId();
