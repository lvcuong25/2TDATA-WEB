import { sequelize } from './src/config/postgres.js';
import { Table, Column, Record } from './src/models/postgres/index.js';

/**
 * Final Sync Status Check
 * 
 * This script provides a comprehensive overview of the current
 * Metabase sync status after cleanup.
 */

async function finalSyncStatusCheck() {
  try {
    console.log('🔍 FINAL SYNC STATUS CHECK');
    console.log('==========================');
    
    // Step 1: Get overall statistics
    console.log('\n📊 Step 1: Overall Statistics');
    
    const totalTables = await Table.count();
    const totalColumns = await Column.count();
    const totalRecords = await Record.count();
    
    console.log(`   📋 Total source tables: ${totalTables}`);
    console.log(`   📊 Total columns: ${totalColumns}`);
    console.log(`   📝 Total records: ${totalRecords}`);
    
    // Step 2: Check Metabase tables
    console.log('\n🎯 Step 2: Metabase Tables Status');
    
    const [metabaseTables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'metabase_%'
      ORDER BY table_name;
    `);
    
    console.log(`   📊 Total Metabase tables: ${metabaseTables.length}`);
    
    // Step 3: Check sync status
    console.log('\n🔄 Step 3: Sync Status Analysis');
    
    let syncedTables = 0;
    let missingMetabaseTables = 0;
    let recordMismatches = 0;
    
    const sourceTables = await Table.findAll();
    
    for (const table of sourceTables) {
      const sourceRecordCount = await Record.count({
        where: { table_id: table.id }
      });
      
      const metabaseTableName = `metabase_${table.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${table.id.slice(-8)}`;
      
      const [metabaseExists] = await sequelize.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = '${metabaseTableName}'
        );
      `);
      
      if (!metabaseExists[0].exists) {
        missingMetabaseTables++;
      } else {
        const [metabaseCount] = await sequelize.query(`
          SELECT COUNT(*) as count FROM public."${metabaseTableName}";
        `);
        
        const metabaseRecordCount = parseInt(metabaseCount[0].count);
        
        if (sourceRecordCount === metabaseRecordCount) {
          syncedTables++;
        } else {
          recordMismatches++;
        }
      }
    }
    
    console.log(`   ✅ Fully synced tables: ${syncedTables}`);
    console.log(`   ❌ Missing Metabase tables: ${missingMetabaseTables}`);
    console.log(`   ⚠️ Record count mismatches: ${recordMismatches}`);
    
    // Step 4: Calculate sync percentage
    console.log('\n📈 Step 4: Sync Health Score');
    
    const totalIssues = missingMetabaseTables + recordMismatches;
    const syncPercentage = totalTables > 0 ? ((totalTables - totalIssues) / totalTables * 100).toFixed(1) : 100;
    
    console.log(`   📊 Sync Health: ${syncPercentage}%`);
    
    if (syncPercentage >= 95) {
      console.log(`   🎉 Excellent! System is well synchronized`);
    } else if (syncPercentage >= 80) {
      console.log(`   ✅ Good! Minor sync issues remain`);
    } else if (syncPercentage >= 60) {
      console.log(`   ⚠️ Fair! Some sync issues need attention`);
    } else {
      console.log(`   ❌ Poor! Significant sync issues detected`);
    }
    
    // Step 5: Recent activity summary
    console.log('\n📋 Step 5: Recent Activity Summary');
    
    const recentTables = await Table.findAll({
      order: [['created_at', 'DESC']],
      limit: 5
    });
    
    console.log(`   📅 Recent tables created:`);
    recentTables.forEach((table, index) => {
      console.log(`      ${index + 1}. ${table.name} (${table.created_at?.toISOString().split('T')[0] || 'Unknown'})`);
    });
    
    // Step 6: Recommendations
    console.log('\n💡 Step 6: Recommendations');
    
    if (missingMetabaseTables > 0) {
      console.log(`   🔧 Create missing Metabase tables for ${missingMetabaseTables} source tables`);
    }
    
    if (recordMismatches > 0) {
      console.log(`   🔄 Re-sync records for ${recordMismatches} tables with count mismatches`);
    }
    
    if (totalIssues === 0) {
      console.log(`   ✅ No action needed - system is fully synchronized!`);
    }
    
    console.log(`   📊 Monitor sync status regularly`);
    console.log(`   🔍 Run this check periodically to maintain sync health`);
    
    // Step 7: System readiness
    console.log('\n🚀 Step 7: System Readiness');
    
    if (syncPercentage >= 90) {
      console.log(`   ✅ System is ready for production use`);
      console.log(`   🎯 Metabase integration is functioning well`);
    } else {
      console.log(`   ⚠️ System needs attention before production use`);
      console.log(`   🔧 Address sync issues first`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await sequelize.close();
  }
}

// Run the check
finalSyncStatusCheck().then(() => {
  console.log('\n🎯 Final sync status check completed!');
  process.exit(0);
});
