import mongoose from "mongoose";
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// MongoDB Connection
export const connectMongoDB = async (uri) => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ MongoDB connected successfully');
    
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

// PostgreSQL Connection
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
    console.log('✅ PostgreSQL connection has been established successfully.');
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to PostgreSQL database:', error);
    throw error;
  }
};

// Dual Database Connection Manager
export class DualDatabaseManager {
  constructor() {
    this.mongoConnected = false;
    this.postgresConnected = false;
  }

  async connectAll() {
    try {
      // Connect to MongoDB
      if (process.env.MONGODB_URI) {
        await connectMongoDB(process.env.MONGODB_URI);
        this.mongoConnected = true;
      }

      // Connect to PostgreSQL
      await connectPostgreSQL();
      this.postgresConnected = true;

      console.log('🎉 All databases connected successfully!');
      return {
        mongo: this.mongoConnected,
        postgres: this.postgresConnected
      };
    } catch (error) {
      console.error('❌ Failed to connect to databases:', error);
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
}

// Export singleton instance
export const dbManager = new DualDatabaseManager();
export { sequelize };
export default dbManager;
