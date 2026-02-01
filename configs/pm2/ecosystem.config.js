// PM2 Ecosystem Configuration for Tallow
// Usage: pm2 start ecosystem.config.js
// Save: pm2 save
// Startup: pm2 startup

module.exports = {
  apps: [
    {
      name: 'tallow-app',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/tallow',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '0.0.0.0',
      },
      error_file: '/var/log/pm2/tallow-app-error.log',
      out_file: '/var/log/pm2/tallow-app-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '1G',
      listen_timeout: 5000,
      kill_timeout: 5000,
      wait_ready: true,
      watch: false,
      ignore_watch: ['node_modules', '.next/cache', 'logs'],
    },
    {
      name: 'tallow-signaling',
      script: 'signaling-server.js',
      cwd: '/var/www/tallow',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        SIGNALING_PORT: 3001,
      },
      error_file: '/var/log/pm2/tallow-signaling-error.log',
      out_file: '/var/log/pm2/tallow-signaling-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '512M',
      listen_timeout: 3000,
      kill_timeout: 5000,
      wait_ready: true,
      watch: false,
    },
  ],

  deploy: {
    production: {
      user: 'tallow',
      host: ['your-server-ip'],
      ref: 'origin/main',
      repo: 'https://github.com/yourusername/tallow.git',
      path: '/var/www/tallow',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'mkdir -p /var/www/tallow /var/log/pm2',
    },
  },
};
