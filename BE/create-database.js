import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: './.env.local' });

async function createDatabase() {
  console.log('🐘 Creating PostgreSQL Database...');
  
  // First connect to default 'postgres' database to create our database
  const client = new Client({
    host: process.env.POSTGRES_HOST || 'localhost',
    port: process.env.POSTGRES_PORT || 5432,
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'password',
    database: 'postgres' // Connect to default database first
  });

  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL');

    // Check if database exists
    const dbCheck = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [process.env.POSTGRES_DB || '2tdata_postgres']
    );

    if (dbCheck.rows.length > 0) {
      console.log('✅ Database already exists');
    } else {
      // Create database
      await client.query(
        `CREATE DATABASE "${process.env.POSTGRES_DB || '2tdata_postgres'}"`
      );
      console.log('✅ Database created successfully');
    }

    // Create extensions in the new database
    const dbClient = new Client({
      host: process.env.POSTGRES_HOST || 'localhost',
      port: process.env.POSTGRES_PORT || 5432,
      user: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || 'password',
      database: process.env.POSTGRES_DB || '2tdata_postgres'
    });

    await dbClient.connect();
    console.log('✅ Connected to new database');

    // Create extensions
    await dbClient.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await dbClient.query('CREATE EXTENSION IF NOT EXISTS "pg_trgm"');
    console.log('✅ Extensions created');

    await dbClient.end();
    await client.end();

    console.log('🎉 Database setup completed successfully!');
    console.log('📊 Database Info:');
    console.log(`   Name: ${process.env.POSTGRES_DB || '2tdata_postgres'}`);
    console.log(`   Host: ${process.env.POSTGRES_HOST || 'localhost'}`);
    console.log(`   Port: ${process.env.POSTGRES_PORT || 5432}`);
    console.log(`   User: ${process.env.POSTGRES_USER || 'postgres'}`);

  } catch (error) {
    console.error('❌ Error creating database:', error.message);
    
    if (error.message.includes('password authentication failed')) {
      console.log('\n🔧 Password Issue Detected!');
      console.log('Please update the POSTGRES_PASSWORD in .env.local file');
      console.log('Current password in .env.local:', process.env.POSTGRES_PASSWORD || 'password');
      console.log('\nTo fix this:');
      console.log('1. Open .env.local file');
      console.log('2. Update POSTGRES_PASSWORD with your actual PostgreSQL password');
      console.log('3. Run this script again');
    }
    
    process.exit(1);
  }
}

createDatabase().catch(console.error);
