import { sequelize } from './src/config/postgres.js';
import dotenv from 'dotenv';

dotenv.config({ path: './.env.local' });
dotenv.config();

console.log('🔍 Tìm bảng Postgres...');
console.log('======================');

async function findPostgresTable() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to PostgreSQL');

    // Tìm bảng có tên chứa "Postgres"
    const [results] = await sequelize.query(`
      SELECT * FROM tables 
      WHERE name ILIKE '%postgres%' 
      ORDER BY created_at DESC
    `);

    console.log(`📊 Tìm thấy ${results.length} bảng có tên chứa "Postgres":`);
    console.log('');

    if (results.length > 0) {
      for (let i = 0; i < results.length; i++) {
        const table = results[i];
        console.log(`🗂️  Bảng ${i + 1}: ${table.name}`);
        console.log(`   ID: ${table.id}`);
        console.log(`   Database ID: ${table.database_id}`);
        console.log(`   User ID: ${table.user_id}`);
        console.log(`   Site ID: ${table.site_id}`);
        console.log(`   Created: ${table.created_at}`);
        console.log('');

        // Tìm records của bảng này
        const [records] = await sequelize.query(`
          SELECT * FROM records 
          WHERE table_id = '${table.id}' 
          ORDER BY created_at DESC
        `);

        console.log(`   📝 Records (${records.length}):`);
        records.forEach((record, index) => {
          console.log(`      ${index + 1}. ID: ${record.id}`);
          console.log(`         Data: ${JSON.stringify(record.data)}`);
          console.log(`         Created: ${record.created_at}`);
        });
        console.log('');
      }
    } else {
      console.log('❌ Không tìm thấy bảng nào có tên chứa "Postgres"');
      
      // Hiển thị tất cả bảng để kiểm tra
      const [allTables] = await sequelize.query(`
        SELECT name, id, created_at 
        FROM tables 
        ORDER BY created_at DESC 
        LIMIT 10
      `);
      
      console.log('\n📋 Tất cả bảng gần đây:');
      allTables.forEach((table, index) => {
        console.log(`   ${index + 1}. ${table.name} (${table.id}) - ${table.created_at}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

findPostgresTable().catch(console.error);

