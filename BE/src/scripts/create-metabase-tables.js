import mongoose from 'mongoose';
import { sequelize } from '../models/postgres/index.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: './.env.local' });
dotenv.config();

console.log('🎯 Creating Metabase-Optimized Tables...');
console.log('========================================');

// Map column types to PostgreSQL types for Metabase
function mapMetabaseColumnType(dataType) {
  const typeMap = {
    'text': 'TEXT',
    'number': 'NUMERIC',
    'date': 'DATE',
    'datetime': 'TIMESTAMP WITH TIME ZONE',
    'year': 'INTEGER',
    'checkbox': 'BOOLEAN',
    'single_select': 'TEXT',
    'multi_select': 'TEXT[]', // Array of text
    'formula': 'TEXT',
    'currency': 'NUMERIC(15,2)',
    'percent': 'NUMERIC(5,2)',
    'phone': 'TEXT',
    'time': 'TIME',
    'rating': 'INTEGER',
    'email': 'TEXT',
    'url': 'TEXT',
    'linked_table': 'TEXT',
    'json': 'JSONB',
    'lookup': 'TEXT'
  };
  return typeMap[dataType] || 'TEXT';
}

// Format values for Metabase based on data type
function formatValueForMetabase(value, dataType) {
  if (value === null || value === undefined) {
    return 'NULL';
  }

  switch (dataType) {
    case 'number':
    case 'currency':
    case 'percent':
    case 'rating':
    case 'year':
      const numValue = parseFloat(value);
      return isNaN(numValue) ? 'NULL' : numValue.toString();
    
    case 'checkbox':
      return value ? 'true' : 'false';
    
    case 'date':
      try {
        const date = new Date(value);
        return isNaN(date.getTime()) ? 'NULL' : `'${date.toISOString().split('T')[0]}'`;
      } catch {
        return 'NULL';
      }
    
    case 'datetime':
      try {
        const date = new Date(value);
        return isNaN(date.getTime()) ? 'NULL' : `'${date.toISOString()}'`;
      } catch {
        return 'NULL';
      }
    
    case 'time':
      try {
        const date = new Date(value);
        return isNaN(date.getTime()) ? 'NULL' : `'${date.toTimeString().split(' ')[0]}'`;
      } catch {
        return 'NULL';
      }
    
    case 'multi_select':
      if (Array.isArray(value)) {
        return `'{${value.map(v => `"${v.toString().replace(/"/g, '\\"')}"`).join(',')}}'`;
      }
      return 'NULL';
    
    case 'json':
      try {
        return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
      } catch {
        return 'NULL';
      }
    
    default: // text, email, url, phone, single_select, formula, linked_table, lookup
      return `'${value.toString().replace(/'/g, "''")}'`;
  }
}

async function createMetabaseTables() {
  try {
    // Connect to databases
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/2TDATA-P');
    console.log('✅ Connected to MongoDB');

    await sequelize.authenticate();
    console.log('✅ Connected to PostgreSQL');

    // Get all tables and their columns
    const TableModel = mongoose.model('Table', new mongoose.Schema({}, { strict: false }));
    const ColumnModel = mongoose.model('Column', new mongoose.Schema({}, { strict: false }));
    const RecordModel = mongoose.model('Record', new mongoose.Schema({}, { strict: false }));

    const tables = await TableModel.find({}).lean();
    console.log(`📊 Found ${tables.length} tables to process`);

    for (const table of tables) {
      console.log(`\n🔄 Processing table: ${table.name} (${table._id})`);
      
      // Get columns for this table
      const columns = await ColumnModel.find({ tableId: table._id }).lean();
      console.log(`   📋 Found ${columns.length} columns`);

      // Get sample records to understand data structure
      const sampleRecords = await RecordModel.find({ tableId: table._id }).limit(5).lean();
      
      if (sampleRecords.length === 0) {
        console.log(`   ⚠️ No records found for table ${table.name}`);
        continue;
      }

      // Analyze data structure
      const dataFields = new Set();
      sampleRecords.forEach(record => {
        if (record.data && typeof record.data === 'object') {
          Object.keys(record.data).forEach(key => dataFields.add(key));
        }
      });

      console.log(`   📊 Data fields found: ${Array.from(dataFields).join(', ')}`);

      // Create dynamic table for Metabase
      const tableName = `metabase_${table.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${table._id.toString().slice(-8)}`;
      
      try {
        // Drop table if exists
        await sequelize.query(`DROP TABLE IF EXISTS "${tableName}" CASCADE`);
        
        // Create table with dynamic columns
        let createTableSQL = `CREATE TABLE "${tableName}" (
          id VARCHAR(255) PRIMARY KEY,
          table_id VARCHAR(255),
          user_id VARCHAR(255),
          site_id VARCHAR(255),
          created_at TIMESTAMP WITH TIME ZONE,
          updated_at TIMESTAMP WITH TIME ZONE`;

        // Add dynamic columns based on data fields with proper types
        for (const field of dataFields) {
          const columnName = field.toLowerCase().replace(/[^a-z0-9]/g, '_');
          // Get column type from columns table
          const columnInfo = columns.find(col => col.key === field || col.name === field);
          let columnType = 'TEXT'; // Default type
          
          if (columnInfo) {
            columnType = mapMetabaseColumnType(columnInfo.dataType);
          }
          
          createTableSQL += `,\n          "${columnName}" ${columnType}`;
        }

        createTableSQL += '\n        )';

        await sequelize.query(createTableSQL);
        console.log(`   ✅ Created Metabase table: ${tableName}`);

        // Migrate data to new structure
        const allRecords = await RecordModel.find({ tableId: table._id }).lean();
        console.log(`   📦 Migrating ${allRecords.length} records...`);

        for (const record of allRecords) {
          let insertSQL = `INSERT INTO "${tableName}" (id, table_id, user_id, site_id, created_at, updated_at`;
          let valuesSQL = `VALUES ('${record._id}', '${record.tableId}', '${record.userId}', '${record.siteId}', '${new Date(record.createdAt).toISOString()}', '${new Date(record.updatedAt).toISOString()}'`;

          // Add dynamic column values with proper formatting
          for (const field of dataFields) {
            const columnName = field.toLowerCase().replace(/[^a-z0-9]/g, '_');
            insertSQL += `, "${columnName}"`;
            
            let value = 'NULL';
            if (record.data && record.data[field] !== null && record.data[field] !== undefined && record.data[field] !== '') {
              const columnInfo = columns.find(col => col.key === field || col.name === field);
              const dataType = columnInfo ? columnInfo.dataType : 'text';
              value = formatValueForMetabase(record.data[field], dataType);
            }
            valuesSQL += `, ${value}`;
          }

          insertSQL += ') ';
          valuesSQL += ')';

          await sequelize.query(insertSQL + valuesSQL);
        }

        console.log(`   ✅ Migrated ${allRecords.length} records to ${tableName}`);

        // Create indexes for better performance
        await sequelize.query(`CREATE INDEX idx_${tableName}_table_id ON "${tableName}" (table_id)`);
        await sequelize.query(`CREATE INDEX idx_${tableName}_user_id ON "${tableName}" (user_id)`);
        await sequelize.query(`CREATE INDEX idx_${tableName}_site_id ON "${tableName}" (site_id)`);
        console.log(`   ✅ Created indexes for ${tableName}`);

      } catch (error) {
        console.error(`   ❌ Error processing table ${table.name}:`, error.message);
      }
    }

    console.log('\n🎉 Metabase table creation completed!');
    console.log('\n📊 Summary:');
    console.log('===========');
    
    // List all created tables
    const result = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'metabase_%'
      ORDER BY table_name
    `);
    
    console.log(`Created ${result[0].length} Metabase-optimized tables:`);
    result[0].forEach(table => {
      console.log(`  - ${table.table_name}`);
    });

    console.log('\n💡 Next Steps:');
    console.log('1. Connect Metabase to PostgreSQL database');
    console.log('2. Import these tables into Metabase');
    console.log('3. Create visualizations and dashboards');
    console.log('4. Set up automated data sync if needed');

  } catch (error) {
    console.error('❌ Error creating Metabase tables:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    await sequelize.close();
  }
}

createMetabaseTables().catch(console.error);
