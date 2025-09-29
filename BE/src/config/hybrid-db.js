import mongoose from 'mongoose';
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

// Load environment variables from .env only
dotenv.config();

// MongoDB Connection (for metadata: User, Organization, Permission, etc.)
export const connectMongoDB = async (uri) => {
  try {
    console.log('🔄 Connecting to MongoDB (metadata)...');
    await mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ MongoDB connected successfully (metadata)');
    
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
    });
    
    return true;
  } catch (e) {
    console.error('❌ Failed to connect to MongoDB:', e.message);
    throw e;
  }
};

// PostgreSQL Connection (for data models: Table, Column, Record, Row)
const sequelize = new Sequelize({
  database: process.env.POSTGRES_DB || '2tdata_postgres',
  username: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'password',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true
  }
});

export const connectPostgreSQL = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connected successfully (data models)');
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to PostgreSQL database:', error);
    throw error;
  }
};

// Hybrid Database Manager
export class HybridDatabaseManager {
  constructor() {
    this.mongoConnected = false;
    this.postgresConnected = false;
  }

  async connectAll() {
    try {
      // Connect to MongoDB (metadata)
      if (process.env.MONGODB_URI) {
        await connectMongoDB(process.env.MONGODB_URI);
        this.mongoConnected = true;
      }

      // Connect to PostgreSQL (data models)
      await connectPostgreSQL();
      this.postgresConnected = true;

      console.log('🎉 Hybrid database system connected successfully!');
      console.log('📊 MongoDB: Metadata (User, Organization, Permission, etc.)');
      console.log('🗄️ PostgreSQL: Data Models (Table, Column, Record, Row)');
      
      return {
        mongo: this.mongoConnected,
        postgres: this.postgresConnected
      };
    } catch (error) {
      console.error('❌ Failed to connect to hybrid databases:', error);
      throw error;
    }
  }

  async disconnectAll() {
    try {
      if (this.mongoConnected) {
        await mongoose.disconnect();
        this.mongoConnected = false;
        console.log('✅ MongoDB disconnected');
      }

      if (this.postgresConnected) {
        await sequelize.close();
        this.postgresConnected = false;
        console.log('✅ PostgreSQL disconnected');
      }
    } catch (error) {
      console.error('❌ Error disconnecting databases:', error);
      throw error;
    }
  }

  isMongoConnected() {
    return this.mongoConnected && mongoose.connection.readyState === 1;
  }

  isPostgresConnected() {
    return this.postgresConnected;
  }

  getMongoConnection() {
    if (!this.isMongoConnected()) {
      throw new Error('MongoDB is not connected');
    }
    return mongoose.connection;
  }

  getPostgresConnection() {
    if (!this.isPostgresConnected()) {
      throw new Error('PostgreSQL is not connected');
    }
    return sequelize;
  }

  // Helper methods for data operations
  async createTable(tableData) {
    if (!this.isPostgresConnected()) {
      throw new Error('PostgreSQL is not connected');
    }
    // This will be implemented in the Table controller
    return null;
  }

  async createColumn(columnData) {
    if (!this.isPostgresConnected()) {
      throw new Error('PostgreSQL is not connected');
    }
    // This will be implemented in the Column controller
    return null;
  }

  async createRecord(recordData) {
    if (!this.isPostgresConnected()) {
      throw new Error('PostgreSQL is not connected');
    }
    // This will be implemented in the Record controller
    return null;
  }

  async createRow(rowData) {
    if (!this.isPostgresConnected()) {
      throw new Error('PostgreSQL is not connected');
    }
    // This will be implemented in the Row controller
    return null;
  }
}

// Export singleton instance
export const hybridDbManager = new HybridDatabaseManager();

// Export individual connections for direct use
export { sequelize, mongoose };
