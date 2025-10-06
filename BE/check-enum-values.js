import { sequelize } from './src/models/postgres/index.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkEnumValues() {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connected');
    
    // Check enum values for columns type
    const [enumValues] = await sequelize.query(`
      SELECT unnest(enum_range(NULL::enum_columns_type)) as enum_value;
    `);
    
    console.log('\n📋 Available enum values for columns.type:');
    enumValues.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.enum_value}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkEnumValues();



