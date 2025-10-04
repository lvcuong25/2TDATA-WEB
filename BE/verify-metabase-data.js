import { sequelize } from './src/models/postgres/index.js';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔍 Verifying Metabase Data in PostgreSQL...');

async function verifyMetabaseData() {
  try {
    console.log('📡 Connecting to PostgreSQL...');
    
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connected');
    
    // List all custom schemas
    console.log('\n📋 Listing all custom schemas:');
    const [schemas] = await sequelize.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast', 'public')
      AND schema_name LIKE 'quang_trung%'
      ORDER BY schema_name
    `);
    
    console.log(`Found ${schemas.length} custom schemas:`);
    schemas.forEach((schema, index) => {
      console.log(`   ${index + 1}. ${schema.schema_name}`);
    });
    
    if (schemas.length === 0) {
      console.log('❌ No custom schemas found. Please run the test first to create data.');
      return;
    }
    
    // For each schema, list tables and data
    for (const schema of schemas) {
      const schemaName = schema.schema_name;
      console.log(`\n📊 Schema: ${schemaName}`);
      console.log('=' .repeat(60));
      
      // List tables in this schema
      const [tables] = await sequelize.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = '${schemaName}'
        ORDER BY table_name
      `);
      
      console.log(`Tables in schema: ${tables.length}`);
      tables.forEach((table, index) => {
        console.log(`   ${index + 1}. ${table.table_name}`);
      });
      
      // For each table, show data
      for (const table of tables) {
        const tableName = table.table_name;
        console.log(`\n📋 Table: ${schemaName}.${tableName}`);
        console.log('-' .repeat(40));
        
        // Get table structure
        const [columns] = await sequelize.query(`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns 
          WHERE table_schema = '${schemaName}' 
          AND table_name = '${tableName}'
          ORDER BY ordinal_position
        `);
        
        console.log('Columns:');
        columns.forEach((col, index) => {
          console.log(`   ${index + 1}. ${col.column_name} (${col.data_type})`);
        });
        
        // Get record count
        const [countResult] = await sequelize.query(`
          SELECT COUNT(*) as count 
          FROM "${schemaName}"."${tableName}"
        `);
        
        const recordCount = countResult[0].count;
        console.log(`\nRecords: ${recordCount}`);
        
        if (recordCount > 0) {
          // Get sample records
          const [records] = await sequelize.query(`
            SELECT * FROM "${schemaName}"."${tableName}"
            ORDER BY created_at
            LIMIT 5
          `);
          
          console.log('\nSample records:');
          records.forEach((record, index) => {
            console.log(`   ${index + 1}. ID: ${record.id}`);
            
            // Show data fields (exclude system fields)
            const dataFields = Object.keys(record).filter(key => 
              !['id', 'table_id', 'user_id', 'site_id', 'created_at', 'updated_at'].includes(key)
            );
            
            dataFields.forEach(field => {
              console.log(`      ${field}: ${record[field]}`);
            });
            console.log(`      Created: ${record.created_at}`);
            console.log('');
          });
          
          if (recordCount > 5) {
            console.log(`   ... and ${recordCount - 5} more records`);
          }
        }
      }
    }
    
    // Show connection info for Metabase
    console.log('\n🔗 METABASE CONNECTION GUIDE:');
    console.log('=' .repeat(60));
    console.log('To connect Metabase to this PostgreSQL database:');
    console.log('');
    console.log('1. Open Metabase UI (usually http://localhost:3000)');
    console.log('2. Go to Admin > Databases');
    console.log('3. Click "Add database"');
    console.log('4. Select "PostgreSQL"');
    console.log('5. Fill in connection details:');
    console.log(`   - Host: ${process.env.POSTGRES_HOST || 'localhost'}`);
    console.log(`   - Port: ${process.env.POSTGRES_PORT || '5432'}`);
    console.log(`   - Database: ${process.env.POSTGRES_DB || '2tdata'}`);
    console.log(`   - Username: ${process.env.POSTGRES_USER || 'postgres'}`);
    console.log(`   - Password: [your password]`);
    console.log('');
    console.log('6. Test connection and save');
    console.log('');
    console.log('7. After connecting, you should see:');
    schemas.forEach(schema => {
      console.log(`   - Schema: ${schema.schema_name}`);
    });
    console.log('');
    console.log('8. Browse to any schema and table to see the data');
    console.log('');
    console.log('9. You can also create custom SQL queries like:');
    schemas.forEach(schema => {
      console.log(`   SELECT * FROM "${schema.schema_name}".table_name;`);
    });
    
    console.log('\n🎉 Data verification completed!');
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    try {
      await sequelize.close();
      console.log('\n📡 Database connection closed');
    } catch (e) {
      console.log('⚠️ Error closing connection:', e.message);
    }
  }
}

// Run the verification
verifyMetabaseData();


