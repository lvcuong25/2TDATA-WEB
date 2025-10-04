# Schema-Based Metabase System

## 📋 Tổng quan

Hệ thống Schema-Based Metabase cho phép tổ chức dữ liệu theo schema riêng biệt cho từng database/base, giúp:
- **Isolation**: Mỗi base có schema riêng, tránh conflict
- **Security**: Có thể set permission riêng cho từng schema  
- **Organization**: Dữ liệu được tổ chức rõ ràng theo base
- **Scalability**: Dễ dàng backup/restore từng base

## 🏗️ Kiến trúc

```
PostgreSQL Database
├── public (schema mặc định - hệ thống)
├── john_doe_my_database_439011 (schema cho base 1)
│   ├── metabase_users_abc12345
│   ├── metabase_products_def67890
│   └── ...
├── jane_smith_test_db_439012 (schema cho base 2)
│   ├── metabase_orders_xyz11111
│   └── ...
└── user_123_database_name_439013 (schema cho base 3)
    └── ...
```

## 📝 Naming Convention

**Schema Name**: `{creator_name}_{database_name}_{database_id_suffix}`

Ví dụ:
- Creator: "John Doe" → "john_doe"
- Database: "My Database" → "my_database"  
- ID: "507f1f77bcf86cd799439011" → "439011"
- **Schema**: "john_doe_my_database_439011"

## 🚀 Workflow

### 1. Tạo Base/Database mới
```javascript
// Tự động tạo schema khi tạo base
const schemaResult = await createDatabaseSchema(databaseId, creatorId);
```

### 2. Tạo Table trong Base
```javascript
// Tạo metabase table trong schema tương ứng
const tableResult = await createMetabaseTable(tableId, tableName, orgId, databaseId);
```

### 3. Real-time Sync
```javascript
// Sync real-time trong schema cụ thể
await updateMetabaseTable(tableId, record, 'insert', [], databaseId);
```

## 🛠️ Core Components

### 1. Schema Manager (`src/services/schemaManager.js`)

#### `createDatabaseSchema(databaseId, creatorId)`
- Tạo schema PostgreSQL cho database
- Set permissions cho metabase user
- Store schema info trong database metadata

#### `getDatabaseSchema(databaseId)`
- Lấy tên schema cho database
- Fallback method nếu không có trong metadata

#### `deleteDatabaseSchema(databaseId, force)`
- Xóa schema (có thể force delete tables)
- Cleanup metadata

#### `listDatabaseSchemas()`
- List tất cả schemas được tạo bởi hệ thống
- Kèm table count cho mỗi schema

### 2. Updated Metabase Creator (`src/utils/metabaseTableCreator.js`)

#### `createMetabaseTable(tableId, tableName, orgId, databaseId)`
- Tạo table trong schema cụ thể
- Auto-detect schema từ databaseId
- Fallback về public schema nếu không tìm thấy

#### `updateMetabaseTable(tableId, record, operation, columns, databaseId)`
- Real-time sync trong schema
- Support insert/update/delete operations
- Schema-aware queries

### 3. Updated Controllers

#### Database/Base Creation
- Tự động tạo schema khi tạo database/base
- Store schema info trong metadata
- Error handling không fail operation chính

#### Table Creation
- Tạo metabase table trong schema tương ứng
- Pass databaseId để determine schema

#### Record Operations
- Real-time sync với schema context
- Pass databaseId cho schema detection

## 📊 Migration

### Migrate Existing Data
```bash
# Migrate tất cả databases hiện có
node migrate-to-schema-based.js migrate

# Test migration
node migrate-to-schema-based.js test

# List schemas
node migrate-to-schema-based.js list

# Rollback (cẩn thận!)
node migrate-to-schema-based.js rollback
```

### Migration Process
1. **Create Schema**: Tạo schema cho mỗi database
2. **Move Tables**: Di chuyển metabase tables từ public schema sang schema riêng
3. **Update Metadata**: Store schema info trong database
4. **Verify**: Kiểm tra data integrity

## 🧪 Testing

### Run Tests
```bash
# Test tất cả
node test-schema-based-system.js all

# Test specific components
node test-schema-based-system.js schema-name
node test-schema-based-system.js schema-management
node test-schema-based-system.js metabase-creation
node test-schema-based-system.js end-to-end
node test-schema-based-system.js performance
```

### Test Coverage
- ✅ Schema name generation
- ✅ Schema CRUD operations
- ✅ Metabase table creation in schema
- ✅ Real-time sync functionality
- ✅ End-to-end workflow
- ✅ Performance testing

## 🔧 Configuration

### Environment Variables
```env
# PostgreSQL
POSTGRES_DB=your_database
POSTGRES_USER=your_user
POSTGRES_PASSWORD=your_password
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

# MongoDB
MONGODB_URI=mongodb://localhost:27017/2tdata
```

### Database Permissions
```sql
-- Grant permissions for metabase user
GRANT USAGE ON SCHEMA "schema_name" TO metabase_user;
GRANT CREATE ON SCHEMA "schema_name" TO metabase_user;
GRANT ALL ON ALL TABLES IN SCHEMA "schema_name" TO metabase_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA "schema_name" GRANT ALL ON TABLES TO metabase_user;
```

## ⚠️ Important Notes

### 1. Schema Name Limits
- PostgreSQL schema name limit: 63 characters
- Auto-truncate nếu quá dài
- Ưu tiên giữ database name và ID suffix

### 2. Error Handling
- Schema creation failure không fail database creation
- Metabase sync failure không fail record operations
- Graceful fallback về public schema

### 3. Performance Considerations
- Schema isolation có thể ảnh hưởng cross-schema queries
- Indexes được tạo trong mỗi schema
- Consider connection pooling cho multiple schemas

### 4. Backup & Maintenance
- Backup strategy cần include tất cả schemas
- Maintenance tasks cần chạy per schema
- Monitor schema count và table distribution

## 🚀 Deployment

### 1. Development
```bash
# Test locally
npm run dev
node test-schema-based-system.js all
```

### 2. Staging
```bash
# Migrate staging data
node migrate-to-schema-based.js migrate
node migrate-to-schema-based.js test
```

### 3. Production
```bash
# Backup trước khi migrate
pg_dump your_database > backup_before_migration.sql

# Migrate production data
node migrate-to-schema-based.js migrate

# Verify migration
node migrate-to-schema-based.js test
```

## 📈 Monitoring

### Key Metrics
- Schema count
- Tables per schema
- Real-time sync performance
- Error rates

### Logs to Monitor
```
🏗️ Creating PostgreSQL schema for database: {id}
✅ Schema created successfully: {schema_name}
🔄 Updating Metabase table: {schema}.{table} (insert)
✅ Real-time sync successful: {schema}.{table}
```

## 🔄 Rollback Plan

### Emergency Rollback
```bash
# Rollback to public schema
node migrate-to-schema-based.js rollback

# Verify rollback
node test-schema-based-system.js all
```

### Partial Rollback
- Có thể rollback từng database riêng lẻ
- Use `deleteDatabaseSchema()` với force=true
- Move tables back to public schema manually

## 🎯 Benefits

1. **Data Isolation**: Mỗi base có schema riêng
2. **Security**: Permission control per schema
3. **Organization**: Dữ liệu được tổ chức rõ ràng
4. **Scalability**: Dễ dàng scale và maintain
5. **Backup**: Có thể backup/restore từng base
6. **Performance**: Queries chỉ trong schema cần thiết

## 🐛 Troubleshooting

### Common Issues

#### Schema not found
```javascript
// Check if schema exists
const schemas = await listDatabaseSchemas();
console.log('Available schemas:', schemas);
```

#### Permission denied
```sql
-- Grant permissions
GRANT USAGE ON SCHEMA "schema_name" TO your_user;
```

#### Table not found in schema
```javascript
// Check tables in schema
const [tables] = await sequelize.query(`
  SELECT table_name 
  FROM information_schema.tables 
  WHERE table_schema = 'schema_name'
`);
```

### Debug Commands
```bash
# List all schemas
node migrate-to-schema-based.js list

# Test specific functionality
node test-schema-based-system.js schema-management

# Check database metadata
# Query MongoDB for postgresSchema field
```

---

## 📞 Support

Nếu gặp vấn đề, check:
1. Database connections
2. Schema permissions  
3. Migration logs
4. Test results

**Happy coding! 🚀**
