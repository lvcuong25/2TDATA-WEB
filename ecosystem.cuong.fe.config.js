module.exports = {
  apps: [
    {
      name: 'cuong fe',
      script: 'npm',
      args: 'run dev',
      cwd: '/home/dbuser/2TDATA-WEB-dev/FE',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 3005,
        VITE_API_URL: 'https://dev.2tdata.com/api'
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: './logs/cuong-fe-error.log',
      out_file: './logs/cuong-fe-out.log'
    }
  ]
};
