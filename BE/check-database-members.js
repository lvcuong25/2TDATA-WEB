import mongoose from 'mongoose';
import BaseMember from './src/model/BaseMember.js';
import User from './src/model/User.js';
import { Column as PostgresColumn, Table as PostgresTable, sequelize } from './src/models/postgres/index.js';

console.log('=== CHECKING DATABASE MEMBERS ===');

async function checkDatabaseMembers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/2TDATA-P');
    console.log('✅ MongoDB connected');
    
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connected');
    
    const columnId = '49a7af36-b485-4083-8aea-3f6b7f4acb4c';
    const userId = '685146504543b4acb407d8c5'; // test@hcw.com.vn
    
    // Get column and table info
    console.log(`\n🔍 Getting column info: ${columnId}`);
    const column = await PostgresColumn.findByPk(columnId);
    if (!column) {
      console.log('❌ Column not found');
      return;
    }
    
    const table = await PostgresTable.findByPk(column.table_id);
    if (!table) {
      console.log('❌ Table not found');
      return;
    }
    
    const databaseId = table.database_id;
    console.log('✅ Database ID:', databaseId);
    
    // Check if user is member of database
    console.log(`\n🔍 Checking if user ${userId} is member of database ${databaseId}`);
    const member = await BaseMember.findOne({
      userId: userId,
      databaseId: databaseId
    }).populate('userId', 'name email');
    
    if (!member) {
      console.log('❌ User is not a member of this database');
      
      // List all members of this database
      console.log('\n🔍 All members of this database:');
      const allMembers = await BaseMember.find({
        databaseId: databaseId
      }).populate('userId', 'name email');
      
      console.log(`Total members: ${allMembers.length}`);
      allMembers.forEach((m, index) => {
        console.log(`  ${index + 1}. ${m.userId.email} - ${m.userId.name} - Role: ${m.role}`);
      });
      
    } else {
      console.log('✅ User is a member of this database:');
      console.log('  - User:', member.userId.email, member.userId.name);
      console.log('  - Role:', member.role);
      console.log('  - Database ID:', member.databaseId);
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    await sequelize.close();
    process.exit(0);
  }
}

checkDatabaseMembers();
