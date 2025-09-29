#!/bin/bash

# Bash script to start PostgreSQL for local development
echo "🐘 Starting PostgreSQL for 2TDATA Migration Testing..."

# Check if Docker is running
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed or not running"
    echo "Please install Docker or use Option 1 (direct PostgreSQL installation)"
    exit 1
fi

echo "✅ Docker is available"

# Start PostgreSQL container
echo "🚀 Starting PostgreSQL container..."
docker-compose -f docker-compose.postgres.yml up -d

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    attempt=$((attempt + 1))
    
    if docker exec 2tdata-postgres pg_isready -U postgres | grep -q "accepting connections"; then
        echo "✅ PostgreSQL is ready!"
        break
    fi
    
    if [ $attempt -ge $max_attempts ]; then
        echo "❌ PostgreSQL failed to start within timeout"
        exit 1
    fi
    
    echo "⏳ Attempt $attempt/$max_attempts..."
    sleep 2
done

# Show connection info
echo ""
echo "📊 PostgreSQL Connection Info:"
echo "Host: localhost"
echo "Port: 5432"
echo "Database: 2tdata_postgres"
echo "Username: postgres"
echo "Password: password"

echo ""
echo "🌐 PgAdmin (Web Interface):"
echo "URL: http://localhost:8080"
echo "Email: admin@2tdata.com"
echo "Password: admin"

echo ""
echo "🔧 Useful Commands:"
echo "Stop PostgreSQL: docker-compose -f docker-compose.postgres.yml down"
echo "View logs: docker-compose -f docker-compose.postgres.yml logs -f"
echo "Connect via psql: docker exec -it 2tdata-postgres psql -U postgres -d 2tdata_postgres"

echo ""
echo "✅ PostgreSQL is ready for migration testing!"
