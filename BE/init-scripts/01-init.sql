-- Initialize PostgreSQL database for 2TDATA migration
-- This script runs when the PostgreSQL container starts for the first time

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create database if not exists (handled by environment variable)
-- CREATE DATABASE IF NOT EXISTS "2tdata_postgres";

-- Set timezone
SET timezone = 'UTC';

-- Create a test user for development
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '2tdata_dev') THEN
        CREATE ROLE 2tdata_dev WITH LOGIN PASSWORD 'dev_password';
        GRANT ALL PRIVILEGES ON DATABASE "2tdata_postgres" TO 2tdata_dev;
    END IF;
END
$$;

-- Grant permissions
GRANT ALL PRIVILEGES ON SCHEMA public TO 2tdata_dev;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO 2tdata_dev;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO 2tdata_dev;

-- Create indexes for better performance
-- These will be created by Sequelize, but we can add some custom ones here if needed

COMMENT ON DATABASE "2tdata_postgres" IS '2TDATA PostgreSQL database for migration from MongoDB';
