/**
 * Test formula calculation on specific table
 */

import { Table, Column, Record } from './BE/src/models/postgres/index.js';
import { evaluateFormula } from './BE/src/utils/formulaEngine.js';

const TABLE_ID = '63414c3b-1d8c-4f68-bac4-3618e380b1a8';

async function testTableFormula() {
  try {
    console.log('🔍 Testing formula on table:', TABLE_ID);
    
    // Get table info
    const table = await Table.findByPk(TABLE_ID);
    if (!table) {
      console.log('❌ Table not found');
      return;
    }
    console.log('✅ Table found:', table.name);
    
    // Get all columns
    const columns = await Column.findAll({
      where: { table_id: TABLE_ID },
      order: [['order', 'ASC']]
    });
    
    console.log(`📋 Found ${columns.length} columns:`);
    columns.forEach(col => {
      console.log(`  - ${col.name} (${col.data_type})`);
    });
    
    // Find formula columns
    const formulaColumns = columns.filter(col => col.data_type === 'formula' && col.formula_config);
    console.log(`\n🧮 Found ${formulaColumns.length} formula columns:`);
    formulaColumns.forEach(col => {
      console.log(`  - ${col.name}: ${col.formula_config.formula}`);
    });
    
    if (formulaColumns.length === 0) {
      console.log('⚠️ No formula columns found in this table');
      return;
    }
    
    // Get sample records
    const records = await Record.findAll({
      where: { table_id: TABLE_ID },
      limit: 3
    });
    
    console.log(`\n📝 Found ${records.length} sample records:`);
    
    // Transform columns for formula engine
    const transformedColumns = columns.map(column => ({
      id: column.id,
      name: column.name,
      key: column.key,
      dataType: column.data_type,
      order: column.order,
      formulaConfig: column.formula_config
    }));
    
    // Test formula calculation on each record
    records.forEach((record, index) => {
      console.log(`\n🔍 Record ${index + 1} (ID: ${record.id}):`);
      console.log('  Data:', record.data);
      
      formulaColumns.forEach(formulaColumn => {
        try {
          const formulaValue = evaluateFormula(
            formulaColumn.formula_config.formula,
            record.data || {},
            transformedColumns
          );
          
          console.log(`  ✅ ${formulaColumn.name}: ${formulaValue} (type: ${typeof formulaValue})`);
        } catch (error) {
          console.log(`  ❌ ${formulaColumn.name}: Error - ${error.message}`);
        }
      });
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testTableFormula();
