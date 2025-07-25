module.exports = {
  apps: [
    {
      name: '2TDATA-WEB-PROD-FE',
      script: 'npm',
      args: 'run dev',
      cwd: './FE',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3006,
        VITE_API_URL: 'http://localhost:3005/api'
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: '../logs/prod-fe-error.log',
      out_file: '../logs/prod-fe-out.log'
    }
  ]
};
