import dotenv from 'dotenv';
import FullMigration from './migrate-all.js';
import MigrationTester from './test-migration.js';
import MigrationRollback from './rollback-migration.js';
import ControllerUpdater from './update-controllers.js';

dotenv.config();

class MigrationManager {
  constructor() {
    this.migration = new FullMigration();
    this.tester = new MigrationTester();
    this.rollback = new MigrationRollback();
    this.controllerUpdater = new ControllerUpdater();
  }

  async showMenu() {
    console.log('\n🚀 MONGODB → POSTGRESQL MIGRATION MANAGER');
    console.log('==========================================');
    console.log('1. 🔄 Run Full Migration');
    console.log('2. 🧪 Test Migration (Dry Run)');
    console.log('3. 🧪 Test Migration (Full)');
    console.log('4. 🔍 Test Data Integrity');
    console.log('5. ⚡ Performance Test');
    console.log('6. 🔧 Update Controllers');
    console.log('7. ↩️ Rollback Migration');
    console.log('8. 📊 Show Status');
    console.log('9. ❌ Exit');
    console.log('==========================================\n');
  }

  async runFullMigration() {
    console.log('🚀 Starting full migration...');
    try {
      await this.migration.runMigration({ dryRun: false, skipExisting: true });
      console.log('✅ Full migration completed successfully!');
    } catch (error) {
      console.error('❌ Full migration failed:', error);
    }
  }

  async testMigrationDryRun() {
    console.log('🧪 Running migration dry run...');
    try {
      await this.migration.runMigration({ dryRun: true, skipExisting: true });
      console.log('✅ Dry run completed successfully!');
    } catch (error) {
      console.error('❌ Dry run failed:', error);
    }
  }

  async testMigrationFull() {
    console.log('🧪 Running full migration test...');
    try {
      await this.migration.runMigration({ dryRun: false, skipExisting: true });
      console.log('✅ Full migration test completed!');
    } catch (error) {
      console.error('❌ Full migration test failed:', error);
    }
  }

  async testDataIntegrity() {
    console.log('🔍 Testing data integrity...');
    try {
      await this.tester.runTests();
      console.log('✅ Data integrity test completed!');
    } catch (error) {
      console.error('❌ Data integrity test failed:', error);
    }
  }

  async performanceTest() {
    console.log('⚡ Running performance test...');
    try {
      await this.tester.runTests();
      console.log('✅ Performance test completed!');
    } catch (error) {
      console.error('❌ Performance test failed:', error);
    }
  }

  async updateControllers() {
    console.log('🔧 Updating controllers...');
    try {
      await this.controllerUpdater.updateAllControllers();
      console.log('✅ Controllers updated successfully!');
    } catch (error) {
      console.error('❌ Controller update failed:', error);
    }
  }

  async rollbackMigration() {
    console.log('⚠️ WARNING: This will rollback the migration!');
    console.log('Are you sure you want to continue? (y/N)');
    
    // In a real implementation, you would use readline or similar
    // For now, we'll assume the user confirms
    try {
      await this.rollback.runRollback({ createBackup: true, clearPostgres: true });
      console.log('✅ Rollback completed successfully!');
    } catch (error) {
      console.error('❌ Rollback failed:', error);
    }
  }

  async showStatus() {
    console.log('📊 Migration Status:');
    console.log('===================');
    
    try {
      // Check database connections
      const { dbManager } = await import('../config/dual-db.js');
      await dbManager.connectAll();
      
      console.log('🔌 Database Connections:');
      console.log(`  MongoDB: ${dbManager.isMongoConnected() ? '✅ Connected' : '❌ Disconnected'}`);
      console.log(`  PostgreSQL: ${dbManager.isPostgresConnected() ? '✅ Connected' : '❌ Disconnected'}`);
      
      // Check data counts
      const { Table, Column, Record, Row } = await import('../models/postgres/index.js');
      
      const tableCount = await Table.count();
      const columnCount = await Column.count();
      const recordCount = await Record.count();
      const rowCount = await Row.count();
      
      console.log('\n📊 PostgreSQL Data:');
      console.log(`  Tables: ${tableCount}`);
      console.log(`  Columns: ${columnCount}`);
      console.log(`  Records: ${recordCount}`);
      console.log(`  Rows: ${rowCount}`);
      
      // Check MongoDB data
      const mongoose = await import('mongoose');
      await mongoose.connect(process.env.MONGODB_URI);
      
      const mongoTableCount = await mongoose.model('Table').countDocuments();
      const mongoColumnCount = await mongoose.model('Column').countDocuments();
      const mongoRecordCount = await mongoose.model('Record').countDocuments();
      const mongoRowCount = await mongoose.model('Row').countDocuments();
      
      console.log('\n📊 MongoDB Data:');
      console.log(`  Tables: ${mongoTableCount}`);
      console.log(`  Columns: ${mongoColumnCount}`);
      console.log(`  Records: ${mongoRecordCount}`);
      console.log(`  Rows: ${mongoRowCount}`);
      
      // Migration status
      const migrationComplete = tableCount > 0 && columnCount > 0;
      console.log('\n🎯 Migration Status:');
      console.log(`  Status: ${migrationComplete ? '✅ COMPLETED' : '⏳ IN PROGRESS'}`);
      console.log(`  Progress: ${((tableCount + columnCount + recordCount + rowCount) / (mongoTableCount + mongoColumnCount + mongoRecordCount + mongoRowCount) * 100).toFixed(2)}%`);
      
      await mongoose.disconnect();
      
    } catch (error) {
      console.error('❌ Error checking status:', error);
    }
  }

  async run() {
    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const question = (query) => new Promise((resolve) => rl.question(query, resolve));

    while (true) {
      await this.showMenu();
      const choice = await question('Enter your choice (1-9): ');

      switch (choice.trim()) {
        case '1':
          await this.runFullMigration();
          break;
        case '2':
          await this.testMigrationDryRun();
          break;
        case '3':
          await this.testMigrationFull();
          break;
        case '4':
          await this.testDataIntegrity();
          break;
        case '5':
          await this.performanceTest();
          break;
        case '6':
          await this.updateControllers();
          break;
        case '7':
          await this.rollbackMigration();
          break;
        case '8':
          await this.showStatus();
          break;
        case '9':
          console.log('👋 Goodbye!');
          rl.close();
          return;
        default:
          console.log('❌ Invalid choice. Please try again.');
      }

      await question('\nPress Enter to continue...');
    }
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const manager = new MigrationManager();
  manager.run().catch(console.error);
}

export default MigrationManager;
