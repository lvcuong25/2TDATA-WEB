module.exports = {
  apps: [
    {
      name: '2tdata-be-prod',
      script: './src/app.js',
      cwd: '/opt/remo-homepage/2TDATA-WEB-TEST/BE',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3004,
        DATABASE_URL: 'mongodb://localhost:27017/2TDATA-P',
        DB_URI: 'mongodb://localhost:27017/2TDATA-P',
        SECRET_KEY: 'your-super-secret-jwt-key-change-this-in-production',
        JWT_SECRET: 'your-super-secret-jwt-key-change-this-in-production',
        SITE_ID: 'prod'
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: './logs/2tdata-be-prod-error.log',
      out_file: './logs/2tdata-be-prod-out.log'
    }
  ]
};
