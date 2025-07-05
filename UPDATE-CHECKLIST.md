# Update Checklist - 2TDATA Multi-tenant & Affiliate Sites

## Pre-Update Checklist

- [ ] **Backup database**
  ```bash
  mongodump --host localhost:27017 --db 2TDATA --out /var/backups/2tdata/backup_$(date +%Y%m%d_%H%M%S)
  ```

- [ ] **Backup source code**
  ```bash
  cd /var/www && sudo cp -r 2tdata 2tdata_backup_$(date +%Y%m%d_%H%M%S)
  ```

- [ ] **Backup .env file**
  ```bash
  cp /var/www/2tdata/BE/.env /var/www/2tdata/BE/.env.backup
  ```

- [ ] **Check current system status**
  ```bash
  pm2 status
  sudo systemctl status nginx
  sudo systemctl status mongod
  ```

## Update Process

- [ ] **Upload/Pull new code**
  - Option 1: `git pull origin main`
  - Option 2: Upload via SCP/FTP

- [ ] **Restore .env file**
  ```bash
  cp /var/www/2tdata/BE/.env.backup /var/www/2tdata/BE/.env
  ```

- [ ] **Update Backend dependencies**
  ```bash
  cd /var/www/2tdata/BE && npm install
  ```

- [ ] **Update Frontend dependencies & build**
  ```bash
  cd /var/www/2tdata/FE && npm install && npm run build
  ```

- [ ] **Run database migrations**
  ```bash
  cd /var/www/2tdata/BE
  node db-management/setup-affiliate-sites.js
  node db-management/seed-data.js
  ```

- [ ] **Restart services**
  ```bash
  pm2 restart 2tdata-backend
  sudo nginx -t && sudo systemctl reload nginx
  ```

## Verification Checklist

### Backend Verification
- [ ] **PM2 status check**
  ```bash
  pm2 status
  pm2 logs 2tdata-backend --lines 20
  ```

- [ ] **API endpoints test**
  ```bash
  curl http://localhost:3000/api/health
  curl http://localhost:3000/api/sites
  curl http://localhost:3000/api/organizations
  ```

- [ ] **Database collections check**
  ```bash
  mongo 2TDATA --eval "db.sites.find().count()"
  mongo 2TDATA --eval "db.organizations.find().count()"
  ```

### Frontend Verification
- [ ] **Access admin panel**
- [ ] **Check Organizations menu**
- [ ] **Check Site Management**
- [ ] **Test user creation with site assignment**
- [ ] **Test affiliate site creation**

### Multi-tenant Features Test
- [ ] **Site detection middleware**
  ```bash
  curl -H "Host: subdomain.yourdomain.com" http://localhost:3000/api/sites/current
  ```

- [ ] **User isolation by site**
- [ ] **Organization management**
- [ ] **Site-specific permissions**

## New Features to Test

### Organizations
- [ ] Create new organization
- [ ] Edit organization details
- [ ] Assign users to organization
- [ ] Delete organization

### Affiliate Sites
- [ ] Create affiliate site
- [ ] Configure site settings
- [ ] Upload site logo
- [ ] Set custom domain
- [ ] Test site isolation

### Site Detection
- [ ] Access via different subdomains
- [ ] User data isolation
- [ ] Site-specific branding
- [ ] API responses filtered by site

## Post-Update Configuration

### Environment Variables (if needed)
```env
# Add to .env if not present
DEFAULT_SITE_ID=main
ENABLE_MULTI_TENANT=true
AFFILIATE_DOMAIN_PATTERN=*.affiliates.yourdomain.com
```

### Nginx Configuration Update
- [ ] **Update server_name for multi-domain support**
  ```nginx
  server_name your-domain.com *.your-domain.com;
  ```

- [ ] **Add subdomain handling (if needed)**

### Database Initialization
- [ ] **Create default organization**
- [ ] **Create main site**
- [ ] **Migrate existing users to default site**

## Performance & Security Check

- [ ] **Memory usage check**
  ```bash
  pm2 monit
  free -h
  ```

- [ ] **Log file sizes**
  ```bash
  ls -lh /var/www/2tdata/logs/
  ```

- [ ] **Database performance**
  ```bash
  mongo 2TDATA --eval "db.stats()"
  ```

- [ ] **Security headers in Nginx**
- [ ] **File permissions**
  ```bash
  ls -la /var/www/2tdata/BE/uploads/
  ```

## Rollback Plan (If Issues Occur)

- [ ] **Stop current application**
  ```bash
  pm2 stop 2tdata-backend
  ```

- [ ] **Restore source code**
  ```bash
  cd /var/www
  sudo rm -rf 2tdata
  sudo mv 2tdata_backup_YYYYMMDD_HHMMSS 2tdata
  ```

- [ ] **Restore database**
  ```bash
  mongorestore --drop --host localhost:27017 --db 2TDATA /var/backups/2tdata/backup_YYYYMMDD_HHMMSS/2TDATA
  ```

- [ ] **Restart services**
  ```bash
  pm2 start 2tdata-backend
  sudo systemctl reload nginx
  ```

## Monitoring (24-48 hours post-update)

- [ ] **Check error logs daily**
  ```bash
  pm2 logs 2tdata-backend --lines 50
  sudo tail -f /var/log/nginx/error.log
  ```

- [ ] **Monitor database performance**
- [ ] **Check user feedback**
- [ ] **Monitor server resources**

## Sign-off

- [ ] **Update completed successfully**
- [ ] **All features tested and working**
- [ ] **No critical errors in logs**
- [ ] **Performance within acceptable range**
- [ ] **Users notified of new features**

**Updated by:** ____________________  
**Date:** ____________________  
**Version:** ____________________  

## Notes

_Add any specific notes, issues encountered, or custom configurations:_

---

**Quick commands reference:**
```bash
# Quick status check
pm2 status && sudo systemctl status nginx && sudo systemctl status mongod

# Quick restart all
pm2 restart 2tdata-backend && sudo systemctl reload nginx

# Quick logs check
pm2 logs 2tdata-backend --lines 20

# Database quick check
mongo 2TDATA --eval "db.runCommand({serverStatus: 1}).connections"
```
