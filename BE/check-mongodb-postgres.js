import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: './.env.local' });
dotenv.config();

console.log('🔍 Kiểm tra MongoDB cho bảng Postgres...');
console.log('========================================');

async function checkMongoDBPostgres() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/2TDATA-P';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Tìm bảng có tên chứa "Postgres"
    const TableModel = mongoose.model('Table', new mongoose.Schema({}, { strict: false }));
    const tables = await TableModel.find({ name: { $regex: /postgres/i } });
    
    console.log(`📊 Tìm thấy ${tables.length} bảng có tên chứa "Postgres" trong MongoDB:`);
    console.log('');

    if (tables.length > 0) {
      for (let i = 0; i < tables.length; i++) {
        const table = tables[i];
        console.log(`🗂️  Bảng ${i + 1}: ${table.name}`);
        console.log(`   ID: ${table._id}`);
        console.log(`   Base ID: ${table.baseId || table.databaseId}`);
        console.log(`   User ID: ${table.userId}`);
        console.log(`   Site ID: ${table.siteId}`);
        console.log(`   Created: ${table.createdAt}`);
        console.log('');

        // Tìm records của bảng này
        const RecordModel = mongoose.model('Record', new mongoose.Schema({}, { strict: false }));
        const records = await RecordModel.find({ tableId: table._id });
        
        console.log(`   📝 Records (${records.length}):`);
        records.forEach((record, index) => {
          console.log(`      ${index + 1}. ID: ${record._id}`);
          console.log(`         Data: ${JSON.stringify(record.data)}`);
          console.log(`         Created: ${record.createdAt}`);
        });
        console.log('');
      }
    } else {
      console.log('❌ Không tìm thấy bảng nào có tên chứa "Postgres" trong MongoDB');
      
      // Hiển thị tất cả bảng để kiểm tra
      const allTables = await TableModel.find({}).sort({ createdAt: -1 }).limit(10);
      
      console.log('\n📋 Tất cả bảng gần đây trong MongoDB:');
      allTables.forEach((table, index) => {
        console.log(`   ${index + 1}. ${table.name} (${table._id}) - ${table.createdAt}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkMongoDBPostgres().catch(console.error);

