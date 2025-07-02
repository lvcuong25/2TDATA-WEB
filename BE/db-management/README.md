# Database Management Scripts

This directory contains comprehensive database management scripts for the 2TDATA multi-site platform.

## 🚀 Quick Start

### Prerequisites
- Node.js and npm installed
- MongoDB running (local or remote)
- Environment variables configured in `.env` file

### Environment Setup
Make sure your `.env` file contains:
```env
DB_URI=mongodb://admin:password@localhost:27017/2TDATA?authSource=admin
MONGODB_URI=mongodb://admin:password@localhost:27017/2TDATA?authSource=admin
```

## 📁 Available Scripts

### 1. 🏢 Affiliate Sites Setup (`setup-affiliate-sites.js`)
**Purpose**: Sets up a complete multi-site affiliate architecture with master site and multiple affiliate sites.

**What it creates**:
- 1 Master site (2TDATA platform)
- 5 Affiliate sites with different themes and categories
- Super admin (global access)
- Site admins for each affiliate site
- Sample users for each site
- Category-specific services
- Proper site relationships and permissions

**Usage**:
```bash
# Setup from scratch
node db-management/setup-affiliate-sites.js

# Force setup (overwrite existing data)
node db-management/setup-affiliate-sites.js --force
```

**Created Sites**:
- **Master**: 2tdata.com, localhost
- **TechHub**: techhub.2tdata.com (Technology)
- **FinanceFlow**: finance.2tdata.com (Finance)
- **HealthCore**: health.2tdata.com (Healthcare)
- **EduPlatform**: edu.2tdata.com (Education)
- **GameZone**: games.2tdata.com (Gaming)

### 2. 🔄 Complete Reset (`complete-reset.js`)
**Purpose**: Completely resets the database and creates basic initial data.

**Usage**:
```bash
node db-management/complete-reset.js
```

**What it does**:
- Drops all collections
- Creates default site
- Creates super admin and site admin users
- Creates demo user and sample service

### 3. 🌱 Seed Data (`seed-data.js`)
**Purpose**: Adds development data to existing database.

**Usage**:
```bash
# Add seed data (checks for existing data)
node db-management/seed-data.js

# Force add data (ignore existing data check)
node db-management/seed-data.js --force
```

### 4. 👑 Reset Superadmin (`reset-superadmin.js`)
**Purpose**: Resets or creates the superadmin account.

**Usage**:
```bash
# Reset with default password
node db-management/reset-superadmin.js

# Reset with custom password
node db-management/reset-superadmin.js "your-custom-password"
```

### 5. 🧹 Cleanup (`cleanup.js`)
**Purpose**: Cleans up specific types of data from the database.

**Usage**:
```bash
# See available options
node db-management/cleanup.js

# Clean specific data types
node db-management/cleanup.js --test-data --old-otps

# Clean everything
node db-management/cleanup.js --all
```

**Cleanup Options**:
- `--test-data`: Remove test/demo data
- `--inactive-users`: Remove inactive users (older than 30 days)
- `--rejected-services`: Remove rejected services
- `--old-otps`: Clear expired OTP codes
- `--demo-sites`: Remove demo sites and their data
- `--all`: Perform all cleanup operations

## 🔑 Default Login Credentials

### Super Admin (Global Access)
- **Email**: `superadmin@2tdata.com`
- **Password**: `admin123`
- **Access**: All sites and global management

### Site Admins (After running setup-affiliate-sites.js)
- **TechHub**: `admin@techhub.2tdata.com` / `siteadmin123`
- **FinanceFlow**: `admin@finance.2tdata.com` / `siteadmin123`
- **HealthCore**: `admin@health.2tdata.com` / `siteadmin123`
- **EduPlatform**: `admin@edu.2tdata.com` / `siteadmin123`
- **GameZone**: `admin@games.2tdata.com` / `siteadmin123`

### Sample Users
- **Password**: `user123`
- **Pattern**: `user1@{domain}`, `user2@{domain}`, `user3@{domain}`

## 🏗️ Affiliate Site Architecture

### Master Site Structure
```
2TDATA Master Platform
├── Global Super Admin Management
├── Site Management Dashboard
├── Global User Analytics
└── Cross-site Service Management
```

### Affiliate Site Structure
```
Each Affiliate Site
├── Site-specific Admin Panel
├── Site-specific Users
├── Category-specific Services
├── Custom Theming
└── Independent Management
```

### User Hierarchy
```
Super Admin (Global)
├── Can access all sites
├── Manage global settings
├── Create/delete sites
└── Manage all users

Site Admin (Per Site)
├── Manage specific site only
├── Manage site users
├── Approve/reject site services
└── Configure site settings

Regular Users (Per Site)
├── Access specific site only
├── Use site services
└── Site-specific data
```

## 🚨 Safety Features

### Data Protection
- Scripts check for existing data before proceeding
- Use `--force` flag to override safety checks
- Always backup database before running destructive operations

### Validation
- Email format validation
- Domain format validation
- Role-based access control
- Site-user relationship integrity

## 🔧 Troubleshooting

### Common Issues

1. **Connection Failed**
   ```bash
   # Test database connection
   node test-db.js
   ```

2. **Permission Denied**
   - Check MongoDB authentication credentials
   - Verify database user permissions

3. **Duplicate Key Errors**
   - Clean existing data first
   - Use `--force` flag if intentional

4. **Missing Models**
   - Ensure all model files exist
   - Check import paths in scripts

### Script Logs
All scripts provide detailed logging:
- ✅ Success operations
- ❌ Error messages
- ⚠️ Warning messages
- 📊 Summary statistics

## 📊 Database Monitoring

After running any script, you can check the database state:

```bash
# View all sites
mongo 2TDATA --eval "db.sites.find().pretty()"

# View all users
mongo 2TDATA --eval "db.users.find({}, {email:1, role:1, site_id:1}).pretty()"

# View services by site
mongo 2TDATA --eval "db.services.aggregate([{$lookup:{from:'sites',localField:'site_id',foreignField:'_id',as:'site'}},{$project:{name:1,status:1,'site.name':1}}])"
```

## 🎯 Recommended Workflow

### For Development
1. Run `setup-affiliate-sites.js` for complete multi-site setup
2. Use `seed-data.js --force` to add more test data if needed
3. Use `cleanup.js --test-data` to remove test data when needed

### For Production Setup
1. Run `complete-reset.js` for clean start
2. Manually create production sites through admin interface
3. Use `reset-superadmin.js` to set secure admin password

### For Maintenance
1. Regular `cleanup.js --old-otps` to clear expired OTPs
2. Periodic `cleanup.js --inactive-users` to clean inactive accounts
3. Use monitoring queries to check database health

## 🔒 Security Notes

- Change default passwords in production
- Use strong passwords for admin accounts
- Regularly rotate administrative credentials
- Monitor database access logs
- Implement proper backup procedures

## 📝 Contributing

When adding new scripts:
1. Follow existing naming conventions
2. Include comprehensive error handling
3. Add detailed logging
4. Update this README
5. Test with both empty and populated databases
