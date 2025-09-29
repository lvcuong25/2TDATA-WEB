import mongoose from 'mongoose';
import { sequelize, Table, Column, Record, Row } from '../models/postgres/index.js';
import dotenv from 'dotenv';

dotenv.config();

// MongoDB Models
const TableSchema = new mongoose.Schema({}, { strict: false });
const ColumnSchema = new mongoose.Schema({}, { strict: false });
const RecordSchema = new mongoose.Schema({}, { strict: false });
const RowSchema = new mongoose.Schema({}, { strict: false });

const TableModel = mongoose.model('Table', TableSchema);
const ColumnModel = mongoose.model('Column', ColumnSchema);
const RecordModel = mongoose.model('Record', RecordSchema);
const RowModel = mongoose.model('Row', RowSchema);

class MigrationTester {
  constructor() {
    this.results = {
      connection: { mongo: false, postgres: false },
      dataIntegrity: {
        tables: { count: 0, matches: 0, errors: [] },
        columns: { count: 0, matches: 0, errors: [] },
        records: { count: 0, matches: 0, errors: [] },
        rows: { count: 0, matches: 0, errors: [] }
      },
      performance: {
        mongo: { queries: [], avgTime: 0 },
        postgres: { queries: [], avgTime: 0 }
      }
    };
  }

  async connect() {
    try {
      // Connect to MongoDB
      await mongoose.connect(process.env.MONGODB_URI);
      this.results.connection.mongo = true;
      console.log('✅ Connected to MongoDB');

      // Connect to PostgreSQL
      await sequelize.authenticate();
      this.results.connection.postgres = true;
      console.log('✅ Connected to PostgreSQL');
    } catch (error) {
      console.error('❌ Connection error:', error);
      throw error;
    }
  }

  async testDataIntegrity() {
    console.log('🔍 Testing data integrity...');

    // Test Tables
    await this.testTablesIntegrity();
    
    // Test Columns
    await this.testColumnsIntegrity();
    
    // Test Records
    await this.testRecordsIntegrity();
    
    // Test Rows
    await this.testRowsIntegrity();
  }

  async testTablesIntegrity() {
    console.log('📊 Testing tables integrity...');
    
    try {
      const mongoTables = await TableModel.find({}).lean();
      const postgresTables = await Table.findAll();

      this.results.dataIntegrity.tables.count = mongoTables.length;
      
      for (const mongoTable of mongoTables) {
        try {
          const postgresTable = postgresTables.find(p => p.id === mongoTable._id.toString());
          
          if (!postgresTable) {
            this.results.dataIntegrity.tables.errors.push({
              id: mongoTable._id,
              error: 'Table not found in PostgreSQL'
            });
            continue;
          }

          // Compare key fields
          const fieldsMatch = this.compareTableFields(mongoTable, postgresTable);
          if (fieldsMatch) {
            this.results.dataIntegrity.tables.matches++;
          } else {
            this.results.dataIntegrity.tables.errors.push({
              id: mongoTable._id,
              error: 'Field mismatch between MongoDB and PostgreSQL'
            });
          }
        } catch (error) {
          this.results.dataIntegrity.tables.errors.push({
            id: mongoTable._id,
            error: error.message
          });
        }
      }
    } catch (error) {
      console.error('❌ Error testing tables integrity:', error);
    }
  }

  async testColumnsIntegrity() {
    console.log('📊 Testing columns integrity...');
    
    try {
      const mongoColumns = await ColumnModel.find({}).lean();
      const postgresColumns = await Column.findAll();

      this.results.dataIntegrity.columns.count = mongoColumns.length;
      
      for (const mongoColumn of mongoColumns) {
        try {
          const postgresColumn = postgresColumns.find(p => p.id === mongoColumn._id.toString());
          
          if (!postgresColumn) {
            this.results.dataIntegrity.columns.errors.push({
              id: mongoColumn._id,
              error: 'Column not found in PostgreSQL'
            });
            continue;
          }

          // Compare key fields
          const fieldsMatch = this.compareColumnFields(mongoColumn, postgresColumn);
          if (fieldsMatch) {
            this.results.dataIntegrity.columns.matches++;
          } else {
            this.results.dataIntegrity.columns.errors.push({
              id: mongoColumn._id,
              error: 'Field mismatch between MongoDB and PostgreSQL'
            });
          }
        } catch (error) {
          this.results.dataIntegrity.columns.errors.push({
            id: mongoColumn._id,
            error: error.message
          });
        }
      }
    } catch (error) {
      console.error('❌ Error testing columns integrity:', error);
    }
  }

  async testRecordsIntegrity() {
    console.log('📊 Testing records integrity...');
    
    try {
      const mongoRecords = await RecordModel.find({}).lean();
      const postgresRecords = await Record.findAll();

      this.results.dataIntegrity.records.count = mongoRecords.length;
      
      for (const mongoRecord of mongoRecords) {
        try {
          const postgresRecord = postgresRecords.find(p => p.id === mongoRecord._id.toString());
          
          if (!postgresRecord) {
            this.results.dataIntegrity.records.errors.push({
              id: mongoRecord._id,
              error: 'Record not found in PostgreSQL'
            });
            continue;
          }

          // Compare key fields
          const fieldsMatch = this.compareRecordFields(mongoRecord, postgresRecord);
          if (fieldsMatch) {
            this.results.dataIntegrity.records.matches++;
          } else {
            this.results.dataIntegrity.records.errors.push({
              id: mongoRecord._id,
              error: 'Field mismatch between MongoDB and PostgreSQL'
            });
          }
        } catch (error) {
          this.results.dataIntegrity.records.errors.push({
            id: mongoRecord._id,
            error: error.message
          });
        }
      }
    } catch (error) {
      console.error('❌ Error testing records integrity:', error);
    }
  }

  async testRowsIntegrity() {
    console.log('📊 Testing rows integrity...');
    
    try {
      const mongoRows = await RowModel.find({}).lean();
      const postgresRows = await Row.findAll();

      this.results.dataIntegrity.rows.count = mongoRows.length;
      
      for (const mongoRow of mongoRows) {
        try {
          const postgresRow = postgresRows.find(p => p.id === mongoRow._id.toString());
          
          if (!postgresRow) {
            this.results.dataIntegrity.rows.errors.push({
              id: mongoRow._id,
              error: 'Row not found in PostgreSQL'
            });
            continue;
          }

          // Compare key fields
          const fieldsMatch = this.compareRowFields(mongoRow, postgresRow);
          if (fieldsMatch) {
            this.results.dataIntegrity.rows.matches++;
          } else {
            this.results.dataIntegrity.rows.errors.push({
              id: mongoRow._id,
              error: 'Field mismatch between MongoDB and PostgreSQL'
            });
          }
        } catch (error) {
          this.results.dataIntegrity.rows.errors.push({
            id: mongoRow._id,
            error: error.message
          });
        }
      }
    } catch (error) {
      console.error('❌ Error testing rows integrity:', error);
    }
  }

  compareTableFields(mongo, postgres) {
    return (
      mongo.name === postgres.name &&
      mongo.baseId === postgres.database_id &&
      mongo.userId === postgres.user_id &&
      mongo.siteId === postgres.site_id
    );
  }

  compareColumnFields(mongo, postgres) {
    return (
      mongo.name === postgres.name &&
      mongo.key === postgres.key &&
      mongo.tableId === postgres.table_id &&
      mongo.dataType === postgres.data_type
    );
  }

  compareRecordFields(mongo, postgres) {
    return (
      mongo.tableId === postgres.table_id &&
      mongo.userId === postgres.user_id &&
      mongo.siteId === postgres.site_id &&
      JSON.stringify(mongo.data) === JSON.stringify(postgres.data)
    );
  }

  compareRowFields(mongo, postgres) {
    return (
      mongo.tableId === postgres.table_id &&
      mongo.createdBy === postgres.created_by &&
      JSON.stringify(mongo.data) === JSON.stringify(postgres.data)
    );
  }

  async testPerformance() {
    console.log('⚡ Testing performance...');

    // Test MongoDB performance
    await this.testMongoPerformance();
    
    // Test PostgreSQL performance
    await this.testPostgresPerformance();
  }

  async testMongoPerformance() {
    console.log('📊 Testing MongoDB performance...');
    
    const queries = [
      { name: 'Find all tables', query: () => TableModel.find({}) },
      { name: 'Find all columns', query: () => ColumnModel.find({}) },
      { name: 'Find all records', query: () => RecordModel.find({}) },
      { name: 'Find all rows', query: () => RowModel.find({}) }
    ];

    for (const test of queries) {
      const start = Date.now();
      try {
        await test.query();
        const duration = Date.now() - start;
        this.results.performance.mongo.queries.push({
          name: test.name,
          duration
        });
        console.log(`  ✅ ${test.name}: ${duration}ms`);
      } catch (error) {
        console.error(`  ❌ ${test.name}: ${error.message}`);
      }
    }

    // Calculate average
    const totalTime = this.results.performance.mongo.queries.reduce((sum, q) => sum + q.duration, 0);
    this.results.performance.mongo.avgTime = totalTime / this.results.performance.mongo.queries.length;
  }

  async testPostgresPerformance() {
    console.log('📊 Testing PostgreSQL performance...');
    
    const queries = [
      { name: 'Find all tables', query: () => Table.findAll() },
      { name: 'Find all columns', query: () => Column.findAll() },
      { name: 'Find all records', query: () => Record.findAll() },
      { name: 'Find all rows', query: () => Row.findAll() }
    ];

    for (const test of queries) {
      const start = Date.now();
      try {
        await test.query();
        const duration = Date.now() - start;
        this.results.performance.postgres.queries.push({
          name: test.name,
          duration
        });
        console.log(`  ✅ ${test.name}: ${duration}ms`);
      } catch (error) {
        console.error(`  ❌ ${test.name}: ${error.message}`);
      }
    }

    // Calculate average
    const totalTime = this.results.performance.postgres.queries.reduce((sum, q) => sum + q.duration, 0);
    this.results.performance.postgres.avgTime = totalTime / this.results.performance.postgres.queries.length;
  }

  async runTests() {
    try {
      await this.connect();
      await this.testDataIntegrity();
      await this.testPerformance();
      
      console.log('🎉 All tests completed!');
      this.printResults();
      
    } catch (error) {
      console.error('❌ Test failed:', error);
      throw error;
    } finally {
      await this.disconnect();
    }
  }

  printResults() {
    console.log('\n📊 Test Results:');
    console.log('================');
    
    // Connection status
    console.log('🔌 Connection Status:');
    console.log(`  MongoDB: ${this.results.connection.mongo ? '✅' : '❌'}`);
    console.log(`  PostgreSQL: ${this.results.connection.postgres ? '✅' : '❌'}`);
    
    // Data integrity
    console.log('\n🔍 Data Integrity:');
    const integrity = this.results.dataIntegrity;
    console.log(`  Tables: ${integrity.tables.matches}/${integrity.tables.count} matches, ${integrity.tables.errors.length} errors`);
    console.log(`  Columns: ${integrity.columns.matches}/${integrity.columns.count} matches, ${integrity.columns.errors.length} errors`);
    console.log(`  Records: ${integrity.records.matches}/${integrity.records.count} matches, ${integrity.records.errors.length} errors`);
    console.log(`  Rows: ${integrity.rows.matches}/${integrity.rows.count} matches, ${integrity.rows.errors.length} errors`);
    
    // Performance
    console.log('\n⚡ Performance:');
    console.log(`  MongoDB Average: ${this.results.performance.mongo.avgTime.toFixed(2)}ms`);
    console.log(`  PostgreSQL Average: ${this.results.performance.postgres.avgTime.toFixed(2)}ms`);
    
    // Overall assessment
    const totalErrors = Object.values(integrity).reduce((sum, item) => sum + item.errors.length, 0);
    const totalItems = Object.values(integrity).reduce((sum, item) => sum + item.count, 0);
    const totalMatches = Object.values(integrity).reduce((sum, item) => sum + item.matches, 0);
    
    console.log('\n🎯 Overall Assessment:');
    console.log(`  Total Items: ${totalItems}`);
    console.log(`  Successful Matches: ${totalMatches}`);
    console.log(`  Errors: ${totalErrors}`);
    console.log(`  Success Rate: ${((totalMatches / totalItems) * 100).toFixed(2)}%`);
    
    if (totalErrors === 0) {
      console.log('  Status: ✅ MIGRATION SUCCESSFUL');
    } else {
      console.log('  Status: ⚠️ MIGRATION NEEDS ATTENTION');
    }
    
    console.log('================\n');
  }

  async disconnect() {
    try {
      await mongoose.disconnect();
      await sequelize.close();
      console.log('✅ Disconnected from databases');
    } catch (error) {
      console.error('❌ Error disconnecting:', error);
    }
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new MigrationTester();
  tester.runTests().catch(console.error);
}

export default MigrationTester;
