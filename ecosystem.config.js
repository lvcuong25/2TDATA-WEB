module.exports = {
  apps: [
    {
      name: '2tdata-phuc-be',
      script: './src/app.js',
      cwd: '/home/dbuser/2TDATA-WEB-dev/BE',
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
      error_file: './logs/2tdata-phuc-be-error.log',
      out_file: './logs/2tdata-phuc-be-out.log'
    },
    {
      name: '2tdata-phuc-fe',
      script: 'npm',
      args: 'run dev',
      cwd: '/home/dbuser/2TDATA-WEB-dev/FE',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 3006,
        VITE_API_URL: 'https://dev.2tdata.com/api'
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: './logs/2tdata-phuc-fe-error.log',
      out_file: './logs/2tdata-phuc-fe-out.log'
    }
  ]
};
