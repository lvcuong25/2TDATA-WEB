import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ControllerUpdater {
  constructor() {
    this.controllersPath = path.join(__dirname, '../controllers');
    this.backupPath = path.join(__dirname, '../controllers/backups');
    this.updatedControllers = [];
    this.errors = [];
  }

  async createBackup() {
    if (!fs.existsSync(this.backupPath)) {
      fs.mkdirSync(this.backupPath, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(this.backupPath, `backup-${timestamp}`);
    fs.mkdirSync(backupDir, { recursive: true });

    const files = fs.readdirSync(this.controllersPath);
    for (const file of files) {
      if (file.endsWith('.js') && !file.includes('backup')) {
        const sourcePath = path.join(this.controllersPath, file);
        const backupPath = path.join(backupDir, file);
        fs.copyFileSync(sourcePath, backupPath);
      }
    }

    console.log(`✅ Created backup at: ${backupDir}`);
    return backupDir;
  }

  generatePostgresImports() {
    return `// PostgreSQL imports
import { sequelize, Table, Column, Record, Row } from '../models/postgres/index.js';
import { Op } from 'sequelize';`;
  }

  generateMongoImports() {
    return `// MongoDB imports (legacy)
import TableModel from '../model/Table.js';
import ColumnModel from '../model/Column.js';
import RecordModel from '../model/Record.js';
import RowModel from '../model/Row.js';`;
  }

  generateDualDatabaseHelper() {
    return `
// Dual Database Helper Functions
const usePostgres = process.env.USE_POSTGRES === 'true';
const useMongo = process.env.USE_MONGO !== 'false';

const getTableModel = () => usePostgres ? Table : TableModel;
const getColumnModel = () => usePostgres ? Column : ColumnModel;
const getRecordModel = () => usePostgres ? Record : RecordModel;
const getRowModel = () => usePostgres ? Row : RowModel;

const handleDatabaseError = (error, operation) => {
  console.error(\`❌ Database error in \${operation}:\`, error);
  if (usePostgres && error.name === 'SequelizeError') {
    // Handle PostgreSQL specific errors
    return { success: false, error: error.message, type: 'postgres' };
  } else if (useMongo && error.name === 'MongoError') {
    // Handle MongoDB specific errors
    return { success: false, error: error.message, type: 'mongo' };
  }
  return { success: false, error: error.message, type: 'unknown' };
};`;
  }

  updateTableController() {
    const filePath = path.join(this.controllersPath, 'tableController.js');
    if (!fs.existsSync(filePath)) {
      this.errors.push(`Table controller not found: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');

    // Add imports
    const imports = this.generatePostgresImports() + '\n' + this.generateMongoImports() + '\n' + this.generateDualDatabaseHelper();
    content = imports + '\n\n' + content;

    // Update common patterns
    content = content.replace(/TableModel\.find/g, 'getTableModel().find');
    content = content.replace(/TableModel\.findOne/g, 'getTableModel().findOne');
    content = content.replace(/TableModel\.create/g, 'getTableModel().create');
    content = content.replace(/TableModel\.update/g, 'getTableModel().update');
    content = content.replace(/TableModel\.delete/g, 'getTableModel().delete');

    // Add error handling
    content = content.replace(/catch\s*\(\s*error\s*\)\s*{/g, 'catch (error) {\n  return handleDatabaseError(error, \'table operation\');');

    fs.writeFileSync(filePath, content);
    this.updatedControllers.push('tableController.js');
    console.log('✅ Updated tableController.js');
  }

  updateColumnController() {
    const filePath = path.join(this.controllersPath, 'columnController.js');
    if (!fs.existsSync(filePath)) {
      this.errors.push(`Column controller not found: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');

    // Add imports
    const imports = this.generatePostgresImports() + '\n' + this.generateMongoImports() + '\n' + this.generateDualDatabaseHelper();
    content = imports + '\n\n' + content;

    // Update common patterns
    content = content.replace(/ColumnModel\.find/g, 'getColumnModel().find');
    content = content.replace(/ColumnModel\.findOne/g, 'getColumnModel().findOne');
    content = content.replace(/ColumnModel\.create/g, 'getColumnModel().create');
    content = content.replace(/ColumnModel\.update/g, 'getColumnModel().update');
    content = content.replace(/ColumnModel\.delete/g, 'getColumnModel().delete');

    // Add error handling
    content = content.replace(/catch\s*\(\s*error\s*\)\s*{/g, 'catch (error) {\n  return handleDatabaseError(error, \'column operation\');');

    fs.writeFileSync(filePath, content);
    this.updatedControllers.push('columnController.js');
    console.log('✅ Updated columnController.js');
  }

  updateRecordController() {
    const filePath = path.join(this.controllersPath, 'recordController.js');
    if (!fs.existsSync(filePath)) {
      this.errors.push(`Record controller not found: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');

    // Add imports
    const imports = this.generatePostgresImports() + '\n' + this.generateMongoImports() + '\n' + this.generateDualDatabaseHelper();
    content = imports + '\n\n' + content;

    // Update common patterns
    content = content.replace(/RecordModel\.find/g, 'getRecordModel().find');
    content = content.replace(/RecordModel\.findOne/g, 'getRecordModel().findOne');
    content = content.replace(/RecordModel\.create/g, 'getRecordModel().create');
    content = content.replace(/RecordModel\.update/g, 'getRecordModel().update');
    content = content.replace(/RecordModel\.delete/g, 'getRecordModel().delete');

    // Add error handling
    content = content.replace(/catch\s*\(\s*error\s*\)\s*{/g, 'catch (error) {\n  return handleDatabaseError(error, \'record operation\');');

    fs.writeFileSync(filePath, content);
    this.updatedControllers.push('recordController.js');
    console.log('✅ Updated recordController.js');
  }

  generateEnvironmentConfig() {
    const envConfig = `
# Database Configuration
USE_POSTGRES=true
USE_MONGO=true

# PostgreSQL Configuration
POSTGRES_DB=2tdata_postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

# MongoDB Configuration (legacy)
MONGODB_URI=mongodb://localhost:27017/2tdata
`;

    const envPath = path.join(__dirname, '../../.env.example');
    fs.writeFileSync(envPath, envConfig);
    console.log('✅ Created .env.example with database configuration');
  }

  async updateAllControllers() {
    try {
      console.log('🔄 Starting controller updates...');
      
      // Create backup
      await this.createBackup();
      
      // Update controllers
      this.updateTableController();
      this.updateColumnController();
      this.updateRecordController();
      
      // Generate environment config
      this.generateEnvironmentConfig();
      
      console.log('🎉 Controller updates completed!');
      this.printStats();
      
    } catch (error) {
      console.error('❌ Error updating controllers:', error);
      throw error;
    }
  }

  printStats() {
    console.log('\n📊 Controller Update Statistics:');
    console.log('================================');
    console.log(`Updated Controllers: ${this.updatedControllers.length}`);
    this.updatedControllers.forEach(controller => {
      console.log(`  ✅ ${controller}`);
    });
    
    if (this.errors.length > 0) {
      console.log(`\nErrors: ${this.errors.length}`);
      this.errors.forEach(error => {
        console.log(`  ❌ ${error}`);
      });
    }
    console.log('================================\n');
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const updater = new ControllerUpdater();
  updater.updateAllControllers().catch(console.error);
}

export default ControllerUpdater;
