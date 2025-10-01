// Test script for Excel import functionality with PostgreSQL
import XLSX from 'xlsx';
import { sequelize } from './src/config/postgres.js';
import Table from './src/models/postgres/Table.js';
import Column from './src/models/postgres/Column.js';
import Record from './src/models/postgres/Record.js';

async function testExcelImport() {
  try {
    console.log('🔄 Testing Excel import with PostgreSQL...');
    
    // Connect to PostgreSQL
    await sequelize.authenticate();
    console.log('✅ Connected to PostgreSQL');
    
    // Create a simple test Excel file
    const testData = [
      ['Name', 'Age', 'City'],
      ['John Doe', 30, 'New York'],
      ['Jane Smith', 25, 'Los Angeles'],
      ['Bob Johnson', 35, 'Chicago']
    ];
    
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(testData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'TestSheet');
    
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    console.log('✅ Created test Excel file');
    
    // Simulate import process
    const workbook_read = XLSX.read(excelBuffer, { type: 'buffer' });
    const sheetNames = workbook_read.SheetNames;
    const worksheet_read = workbook_read.Sheets[sheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet_read, { header: 1 });
    
    console.log('📊 Excel data:', jsonData);
    
    // Test database operations
    const testDatabaseId = 'test-db-123';
    const testUserId = 'test-user-123';
    const testSiteId = 'test-site-123';
    
    // Create test table
    const newTable = await Table.create({
      name: 'TestImportTable',
      description: 'Test table for Excel import',
      database_id: testDatabaseId,
      user_id: testUserId,
      site_id: testSiteId
    });
    
    console.log('✅ Created test table:', newTable.id);
    
    // Create test columns
    const headers = jsonData[0];
    const columns = [];
    
    for (let i = 0; i < headers.length; i++) {
      const column = await Column.create({
        name: headers[i],
        key: headers[i].toLowerCase().replace(/[^a-zA-Z0-9]/g, '_'),
        data_type: 'text',
        is_required: false,
        order: i,
        table_id: newTable.id,
        user_id: testUserId,
        site_id: testSiteId
      });
      columns.push(column);
    }
    
    console.log('✅ Created test columns:', columns.length);
    
    // Create test records
    const dataRows = jsonData.slice(1);
    const records = [];
    
    for (let rowIndex = 0; rowIndex < dataRows.length; rowIndex++) {
      const row = dataRows[rowIndex];
      const recordData = {};
      
      for (let i = 0; i < Math.min(row.length, columns.length); i++) {
        recordData[columns[i].name] = String(row[i]);
      }
      
      const record = await Record.create({
        table_id: newTable.id,
        data: recordData,
        user_id: testUserId,
        site_id: testSiteId
      });
      
      records.push(record);
    }
    
    console.log('✅ Created test records:', records.length);
    
    // Verify data
    const savedTable = await Table.findByPk(newTable.id);
    const savedColumns = await Column.findAll({ where: { table_id: newTable.id } });
    const savedRecords = await Record.findAll({ where: { table_id: newTable.id } });
    
    console.log('\n📋 Verification Results:');
    console.log('Table:', savedTable.name);
    console.log('Columns:', savedColumns.map(c => c.name));
    console.log('Records:', savedRecords.length);
    
    // Clean up test data
    await Record.destroy({ where: { table_id: newTable.id } });
    await Column.destroy({ where: { table_id: newTable.id } });
    await Table.destroy({ where: { id: newTable.id } });
    
    console.log('✅ Cleaned up test data');
    console.log('🎉 Excel import test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

testExcelImport();
