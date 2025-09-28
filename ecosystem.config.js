module.exports = {
  apps: [{
    name: 'website-monitor',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    // Logging
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Advanced PM2 features
    min_uptime: '10s',
    max_restarts: 10,
    
    // Monitoring
    monitoring: false,
    
    // Graceful shutdown
    kill_timeout: 5000,
    
    // Environment variables (will be overridden by .env file)
    env_file: '.env'
  }],

  deploy: {
    production: {
      user: 'root',
      host: 'YOUR_SERVER_IP',
      ref: 'origin/main',
      repo: 'git@github.com:yourusername/your-repo.git',
      path: '/var/www/website-monitor',
      'pre-deploy-local': '',
      'post-deploy': 'npm install --production && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
