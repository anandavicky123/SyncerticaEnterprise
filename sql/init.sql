-- Initialize Syncertica Enterprise Database
-- This script will be executed when the PostgreSQL container starts
-- Note: Prisma will handle schema creation, this only sets up the database

-- Enable UUID extension (required for Prisma)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the application user if it doesn't exist
DO
$do$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE  rolname = 'app_user') THEN

      CREATE ROLE app_user LOGIN PASSWORD 'app_password';
   END IF;
END
$do$;

-- Grant necessary permissions to the app_user
GRANT CREATE ON DATABASE postgres TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;
GRANT CREATE ON SCHEMA public TO app_user;
