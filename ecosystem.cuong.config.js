module.exports = {
  apps: [
    {
      name: 'cuong-be',
      script: './src/app.js',
      cwd: '/opt/remo-homepage/2TDATA-WEB-TEST/BE',
      instances: 1,
      autorestart: true,
      watch: true,
      ignore_watch: ['node_modules', 'uploads', 'logs', '.git', '*.log'],
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 3004,
        DATABASE_URL: 'mongodb://localhost:27017/2TDATA-P',
        DB_URI: 'mongodb://localhost:27017/2TDATA-P',
        SECRET_KEY: 'your-super-secret-jwt-key-change-this-in-production',
        JWT_SECRET: 'your-super-secret-jwt-key-change-this-in-production',
        SITE_ID: 'test'
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: './logs/cuong-be-error.log',
      out_file: './logs/cuong-be-out.log'
    },
    {
      name: 'cuong-fe',
      script: 'npm',
      args: 'run dev',
      cwd: '/opt/remo-homepage/2TDATA-WEB-TEST/FE',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 3006,
        VITE_API_URL: 'http://localhost:3004/api'
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: './logs/cuong-fe-error.log',
      out_file: './logs/cuong-fe-out.log'
    }
  ]
};
