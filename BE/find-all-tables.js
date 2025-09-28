import { sequelize } from './src/config/postgres.js';
import dotenv from 'dotenv';

dotenv.config({ path: './.env.local' });
dotenv.config();

async function findAllTables() {
  console.log('🔍 Tìm tất cả bảng trong PostgreSQL...');
  console.log('=====================================');

  try {
    await sequelize.authenticate();
    console.log('✅ Connected to PostgreSQL');

    // Find all tables
    const [tables] = await sequelize.query(`
      SELECT * FROM tables
      ORDER BY created_at DESC
    `);

    if (tables.length === 0) {
      console.log('❌ Không có bảng nào trong PostgreSQL');
      return;
    }

    console.log(`📊 Tìm thấy ${tables.length} bảng:`);
    tables.forEach((table, index) => {
      console.log(`\n🗂️  Bảng ${index + 1}: ${table.name}`);
      console.log(`   ID: ${table.id}`);
      console.log(`   Database ID: ${table.database_id}`);
      console.log(`   User ID: ${table.user_id}`);
      console.log(`   Site ID: ${table.site_id}`);
      console.log(`   Created: ${table.created_at}`);
    });

  } catch (error) {
    console.error('❌ Lỗi khi tìm bảng:', error);
  } finally {
    await sequelize.close();
  }
}

findAllTables().catch(console.error);

