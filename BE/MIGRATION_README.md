# 🚀 MongoDB → PostgreSQL Migration Guide

## 📋 Overview

This guide provides step-by-step instructions for migrating your 2TDATA application from MongoDB to PostgreSQL while maintaining data integrity and system functionality.

## 🎯 Migration Goals

- ✅ **Data Integrity**: Ensure all data is accurately migrated
- ✅ **Performance**: Improve query performance for complex operations
- ✅ **ACID Compliance**: Gain transactional consistency
- ✅ **Scalability**: Better support for complex relationships and analytics
- ✅ **Zero Downtime**: Maintain system availability during migration

## 📊 Current Status

### ✅ Completed
- [x] PostgreSQL dependencies setup (Sequelize, pg, pg-hstore)
- [x] PostgreSQL connection configuration
- [x] Sequelize models (Table, Column, Record, Row)
- [x] Model associations and indexes
- [x] Dual database connection setup
- [x] Migration scripts
- [x] Controller update scripts
- [x] Testing and validation scripts
- [x] Rollback plan

### 🔄 In Progress
- [ ] Environment configuration
- [ ] Production deployment

### ⏳ Pending
- [ ] Performance optimization
- [ ] Monitoring setup

## 🛠️ Prerequisites

### Required Software
- Node.js 18+
- PostgreSQL 13+
- MongoDB 4.4+
- npm/yarn

### Environment Variables
```bash
# Database Configuration
USE_POSTGRES=true
USE_MONGO=true

# PostgreSQL Configuration
POSTGRES_DB=2tdata_postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

# MongoDB Configuration (legacy)
MONGODB_URI=mongodb://localhost:27017/2tdata
```

## 🚀 Migration Process

### Phase 1: Preparation

1. **Backup your data**
   ```bash
   # Create MongoDB backup
   mongodump --db 2tdata --out ./backups/mongodb-backup-$(date +%Y%m%d)
   ```

2. **Setup PostgreSQL**
   ```bash
   # Install PostgreSQL (if not already installed)
   # Create database
   createdb 2tdata_postgres
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

### Phase 2: Migration Execution

#### Option 1: Interactive Migration Manager
```bash
npm run migration:manager
```

#### Option 2: Step-by-step Migration

1. **Sync PostgreSQL models**
   ```bash
   npm run postgres:sync
   ```

2. **Run dry-run migration**
   ```bash
   npm run migration:run:dry
   ```

3. **Execute full migration**
   ```bash
   npm run migration:run
   ```

4. **Test migration**
   ```bash
   npm run migration:test
   ```

5. **Update controllers**
   ```bash
   npm run migration:update-controllers
   ```

### Phase 3: Validation

1. **Data integrity check**
   ```bash
   npm run migration:test
   ```

2. **Performance testing**
   - Run application tests
   - Monitor query performance
   - Check response times

3. **User acceptance testing**
   - Test all major features
   - Verify data accuracy
   - Check system stability

## 📁 File Structure

```
BE/src/
├── config/
│   ├── dual-db.js          # Dual database connection manager
│   ├── postgres.js         # PostgreSQL configuration
│   └── db.js              # MongoDB configuration (legacy)
├── models/
│   └── postgres/
│       ├── index.js       # Model exports and associations
│       ├── Table.js       # Table model
│       ├── Column.js      # Column model
│       ├── Record.js      # Record model
│       └── Row.js         # Row model
└── scripts/
    ├── migration-manager.js    # Interactive migration manager
    ├── migrate-all.js          # Full migration script
    ├── test-migration.js       # Migration testing
    ├── rollback-migration.js   # Rollback script
    └── update-controllers.js   # Controller update script
```

## 🔧 Available Commands

### Migration Commands
```bash
# Interactive migration manager
npm run migration:manager

# Run full migration
npm run migration:run

# Run dry-run migration
npm run migration:run:dry

# Test migration
npm run migration:test

# Rollback migration
npm run migration:rollback

# Update controllers
npm run migration:update-controllers
```

### PostgreSQL Commands
```bash
# Sync models (create tables)
npm run postgres:sync

# Force sync models (drop and recreate)
npm run postgres:sync:force
```

## 🧪 Testing

### Data Integrity Tests
- Compare record counts between MongoDB and PostgreSQL
- Verify field mappings and data types
- Check foreign key relationships
- Validate JSON data structures

### Performance Tests
- Query execution time comparison
- Concurrent user simulation
- Large dataset handling
- Memory usage monitoring

### Functional Tests
- CRUD operations
- Complex queries
- Data validation
- Error handling

## 🔄 Rollback Plan

If issues arise during migration:

1. **Stop the application**
2. **Run rollback script**
   ```bash
   npm run migration:rollback
   ```
3. **Restore from backup**
4. **Verify system functionality**

## 📊 Monitoring

### Key Metrics to Monitor
- Database connection status
- Query performance
- Error rates
- Memory usage
- Disk space

### Logging
- Migration progress
- Error details
- Performance metrics
- User activity

## 🚨 Troubleshooting

### Common Issues

1. **Connection Errors**
   - Check database credentials
   - Verify network connectivity
   - Ensure databases are running

2. **Data Type Mismatches**
   - Review field mappings
   - Check data validation rules
   - Update migration scripts

3. **Performance Issues**
   - Optimize database indexes
   - Review query patterns
   - Consider connection pooling

### Support
- Check logs in `./logs/`
- Review error messages
- Consult migration statistics

## 📈 Performance Expectations

### Before Migration (MongoDB)
- Simple queries: 10-50ms
- Complex queries: 100-500ms
- Large datasets: 1-5s

### After Migration (PostgreSQL)
- Simple queries: 5-25ms
- Complex queries: 50-200ms
- Large datasets: 500ms-2s

## 🔐 Security Considerations

- Database credentials protection
- Connection encryption
- Access control maintenance
- Audit logging

## 📝 Post-Migration Checklist

- [ ] All data migrated successfully
- [ ] Application functionality verified
- [ ] Performance benchmarks met
- [ ] Monitoring systems active
- [ ] Backup procedures updated
- [ ] Documentation updated
- [ ] Team training completed

## 🎉 Success Criteria

- ✅ 100% data integrity
- ✅ Improved query performance
- ✅ Zero data loss
- ✅ System stability maintained
- ✅ User experience unchanged

## 📞 Support

For issues or questions:
1. Check this documentation
2. Review error logs
3. Run diagnostic scripts
4. Contact development team

---

**Last Updated**: $(date)
**Version**: 1.0.0
**Status**: Ready for Production
