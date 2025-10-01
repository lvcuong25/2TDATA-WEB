import { sequelize } from './src/config/postgres.js';
import dotenv from 'dotenv';

dotenv.config({ path: './.env.local' });
dotenv.config();

async function checkNewData() {
  console.log('🔍 Kiểm tra dữ liệu mới trong PostgreSQL...');
  console.log('==========================================');

  try {
    await sequelize.authenticate();
    console.log('✅ Connected to PostgreSQL');

    // Check columns for Postgres table
    console.log('\n📋 Columns trong bảng Postgres:');
    const [columns] = await sequelize.query(`
      SELECT * FROM columns 
      WHERE table_id = '68d792fbd5ea0d015b6b053f'
      ORDER BY created_at DESC
    `);
    
    console.log(`   Tìm thấy ${columns.length} columns:`);
    columns.forEach((col, index) => {
      console.log(`   ${index + 1}. ${col.name} (${col.data_type}) - Key: ${col.key} - Created: ${col.created_at}`);
    });

    // Check records for Postgres table
    console.log('\n📝 Records trong bảng Postgres:');
    const [records] = await sequelize.query(`
      SELECT * FROM records 
      WHERE table_id = '68d792fbd5ea0d015b6b053f'
      ORDER BY created_at DESC
    `);
    
    console.log(`   Tìm thấy ${records.length} records:`);
    records.forEach((record, index) => {
      console.log(`   ${index + 1}. ID: ${record.id} - Data: ${JSON.stringify(record.data)} - Created: ${record.created_at}`);
    });

  } catch (error) {
    console.error('❌ Lỗi khi kiểm tra dữ liệu:', error);
  } finally {
    await sequelize.close();
  }
}

checkNewData().catch(console.error);

