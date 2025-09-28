# 🚀 Backend Deployment Guide

This guide will help you deploy your website monitoring backend to various hosting platforms with your remote database server at `103.179.45.102`.

## 📋 Prerequisites

1. **Database Setup**: Your MySQL database server at `103.179.45.102` should be accessible from the internet
2. **Database Password**: Make sure you have the database password for the `root` user
3. **Node.js**: Version 16 or higher
4. **Git**: For code deployment

## 🔧 Pre-deployment Setup

### 1. Create Production Environment File

Create a `.env` file in your project root with the following configuration:

```env
# Production Database Configuration
DB_HOST=103.179.45.102
DB_USER=root
DB_PASSWORD=YOUR_DATABASE_PASSWORD_HERE
DB_NAME=website_monitor
DB_PORT=3306

# Server Configuration
PORT=3000
NODE_ENV=production

# JWT Secret (CHANGE THIS!)
JWT_SECRET=your_super_secure_jwt_secret_minimum_32_characters_long

# Email Configuration (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_USER=KM@sabosuku.com
EMAIL_PASS=hzpw wojd xszu ladn

# Gmail API Configuration (Alternative to SMTP)
GMAIL_CLIENT_ID=your_gmail_client_id
GMAIL_CLIENT_SECRET=your_gmail_client_secret
GMAIL_REFRESH_TOKEN=your_gmail_refresh_token

# LINE Messaging API
LINE_CHANNEL_ID=2007999524
LINE_CHANNEL_ACCESS_TOKEN=wC2ad1cBncKnmQ+oQwAZEwkQA/mktCaAccMdFYK1HeYhpKwVohZrfGvEOeS4l1By3sSlo2dpw8EpI4GyXoQpunqB35GfV2Uc86PEXm7/tqnV4woeC29Rl/iMuzaKQHusZ9pPhY/6Xi/zOs+8fFnNjQdB04t89/1O/w1cDnyilFU=
LINE_CHANNEL_SECRET=21c0e68ea4b687bcd6f13f60485d69ce

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Production Security Settings
TRUST_PROXY=true
```

### 2. Setup Database Schema

Run the database setup on your remote server:

```bash
# Install dependencies
npm install

# Setup the database schema
node setup.js
```

## 🌐 Deployment Options

### Option 1: DigitalOcean Droplet (Recommended)

#### Step 1: Create Droplet
1. Go to [DigitalOcean](https://www.digitalocean.com/)
2. Create a new Droplet with Ubuntu 22.04
3. Choose at least 1GB RAM ($6/month plan)
4. Add your SSH key

#### Step 2: Server Setup
```bash
# Connect to your server
ssh root@your_server_ip

# Update system
apt update && apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Install PM2 globally
npm install -g pm2

# Install Git
apt install git -y

# Create app directory
mkdir -p /var/www/website-monitor
cd /var/www/website-monitor

# Clone your repository
git clone https://github.com/yourusername/your-repo.git .
# OR upload your files via SCP/SFTP

# Install dependencies
npm install --production

# Create .env file with your configuration
nano .env
# Copy the production environment variables from above

# Test the application
node server.js
```

#### Step 3: Setup PM2 Process Manager
```bash
# Start the application with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions provided by the command
```

#### Step 4: Setup Nginx (Optional but recommended)
```bash
# Install Nginx
apt install nginx -y

# Create Nginx configuration
nano /etc/nginx/sites-available/website-monitor

# Add the following configuration:
```

```nginx
server {
    listen 80;
    server_name your_domain.com;  # Replace with your domain or server IP

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable the site
ln -s /etc/nginx/sites-available/website-monitor /etc/nginx/sites-enabled/

# Test Nginx configuration
nginx -t

# Restart Nginx
systemctl restart nginx

# Enable Nginx to start on boot
systemctl enable nginx
```

### Option 2: Heroku Deployment

#### Step 1: Prepare for Heroku
```bash
# Install Heroku CLI
# https://devcenter.heroku.com/articles/heroku-cli

# Login to Heroku
heroku login

# Create a new Heroku app
heroku create your-app-name

# Set environment variables
heroku config:set DB_HOST=103.179.45.102
heroku config:set DB_USER=root
heroku config:set DB_PASSWORD=your_database_password
heroku config:set DB_NAME=website_monitor
heroku config:set DB_PORT=3306
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your_super_secure_jwt_secret
# Add all other environment variables...
```

#### Step 2: Deploy
```bash
# Deploy to Heroku
git add .
git commit -m "Deploy to Heroku"
git push heroku main
```

### Option 3: Railway Deployment

1. Go to [Railway](https://railway.app/)
2. Connect your GitHub repository
3. Add environment variables in the Railway dashboard
4. Deploy automatically

### Option 4: Render Deployment

1. Go to [Render](https://render.com/)
2. Connect your GitHub repository
3. Choose "Web Service"
4. Add environment variables
5. Deploy

### Option 5: VPS with Docker

See the Docker configuration files created in this project for containerized deployment.

## 🔒 Security Checklist

- [ ] Change the default JWT secret
- [ ] Set strong database password
- [ ] Configure firewall rules
- [ ] Enable HTTPS (use Certbot for free SSL)
- [ ] Regular security updates
- [ ] Monitor logs and set up alerts

## 🔍 Testing Your Deployment

1. **Health Check**: Visit `http://your-server-ip:3000/health`
2. **API Test**: Test the API endpoints with Postman or curl
3. **Database Connection**: Check logs for successful database connection
4. **Chrome Extension**: Update your extension to point to the new server

## 📊 Monitoring

### PM2 Monitoring Commands
```bash
# View running processes
pm2 list

# View logs
pm2 logs

# Monitor resource usage
pm2 monit

# Restart application
pm2 restart website-monitor

# View detailed info
pm2 show website-monitor
```

### Log Files
- Application logs: Check PM2 logs
- Nginx logs: `/var/log/nginx/access.log` and `/var/log/nginx/error.log`
- System logs: `/var/log/syslog`

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check if database server allows remote connections
   - Verify firewall rules
   - Confirm credentials

2. **Port Already in Use**
   - Change PORT in .env file
   - Kill existing processes: `pkill -f node`

3. **Permission Denied**
   - Check file permissions: `chmod +x server.js`
   - Run with proper user permissions

4. **Memory Issues**
   - Monitor with `pm2 monit`
   - Increase server RAM if needed

### Support Commands
```bash
# Check if port is in use
netstat -tulpn | grep :3000

# Check server resources
htop

# Check disk space
df -h

# Check service status
systemctl status nginx
```

## 📝 Next Steps

1. Set up SSL certificate with Let's Encrypt
2. Configure domain name
3. Set up monitoring and alerts
4. Regular backups
5. Update Chrome extension with new server URL

## 🔗 Useful Links

- [DigitalOcean Node.js Deployment Guide](https://www.digitalocean.com/community/tutorials/how-to-set-up-a-node-js-application-for-production-on-ubuntu-20-04)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [Nginx Configuration](https://nginx.org/en/docs/)
- [Let's Encrypt SSL](https://letsencrypt.org/)

---

**Need Help?** If you encounter any issues during deployment, check the troubleshooting section or reach out for assistance.
