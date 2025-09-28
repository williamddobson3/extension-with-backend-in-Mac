#!/bin/bash

# Website Monitor Backend Deployment Script
# Usage: ./deploy.sh [server_ip] [deployment_method]

set -e  # Exit on any error

SERVER_IP=${1:-"YOUR_SERVER_IP"}
DEPLOY_METHOD=${2:-"pm2"}  # pm2, docker, or heroku

echo "🚀 Starting deployment process..."
echo "Server: $SERVER_IP"
echo "Method: $DEPLOY_METHOD"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if .env file exists
if [ ! -f .env ]; then
    print_error ".env file not found!"
    print_warning "Please create a .env file with your production configuration."
    print_warning "You can use the template from the DEPLOYMENT_GUIDE.md"
    exit 1
fi

# Check if database password is set
if ! grep -q "DB_PASSWORD=" .env || grep -q "DB_PASSWORD=$" .env; then
    print_error "Database password not set in .env file!"
    print_warning "Please set DB_PASSWORD in your .env file"
    exit 1
fi

print_status "Environment configuration verified"

case $DEPLOY_METHOD in
    "pm2")
        echo "📦 Deploying with PM2..."
        
        # Check if server IP is provided
        if [ "$SERVER_IP" = "YOUR_SERVER_IP" ]; then
            print_error "Please provide your server IP address"
            echo "Usage: ./deploy.sh YOUR_SERVER_IP pm2"
            exit 1
        fi
        
        # Create deployment package
        print_status "Creating deployment package..."
        tar -czf website-monitor.tar.gz \
            --exclude=node_modules \
            --exclude=.git \
            --exclude=logs \
            --exclude=*.log \
            .
        
        print_status "Uploading to server..."
        scp website-monitor.tar.gz root@$SERVER_IP:/tmp/
        
        print_status "Setting up on server..."
        ssh root@$SERVER_IP << 'EOF'
            cd /var/www
            
            # Stop existing application
            pm2 stop website-monitor || true
            
            # Backup existing deployment
            if [ -d "website-monitor" ]; then
                mv website-monitor website-monitor-backup-$(date +%Y%m%d-%H%M%S)
            fi
            
            # Extract new deployment
            mkdir -p website-monitor
            cd website-monitor
            tar -xzf /tmp/website-monitor.tar.gz
            
            # Install dependencies
            npm install --production
            
            # Start with PM2
            pm2 start ecosystem.config.js
            pm2 save
            
            # Clean up
            rm /tmp/website-monitor.tar.gz
            
            echo "✅ Deployment completed successfully!"
            pm2 status
EOF
        
        # Clean up local files
        rm website-monitor.tar.gz
        print_status "PM2 deployment completed!"
        ;;
        
    "docker")
        echo "🐳 Deploying with Docker..."
        
        # Build and push to server
        print_status "Building Docker image..."
        docker build -t website-monitor .
        
        if [ "$SERVER_IP" != "YOUR_SERVER_IP" ]; then
            print_status "Deploying to remote server..."
            docker save website-monitor | ssh root@$SERVER_IP 'docker load'
            
            # Copy docker-compose.yml and .env
            scp docker-compose.yml .env root@$SERVER_IP:/opt/website-monitor/
            
            ssh root@$SERVER_IP << 'EOF'
                cd /opt/website-monitor
                docker-compose down || true
                docker-compose up -d
                echo "✅ Docker deployment completed!"
                docker-compose ps
EOF
        else
            print_status "Starting locally with Docker..."
            docker-compose up -d
            print_status "Local Docker deployment completed!"
        fi
        ;;
        
    "heroku")
        echo "☁️ Deploying to Heroku..."
        
        # Check if Heroku CLI is installed
        if ! command -v heroku &> /dev/null; then
            print_error "Heroku CLI not found!"
            print_warning "Please install Heroku CLI: https://devcenter.heroku.com/articles/heroku-cli"
            exit 1
        fi
        
        # Deploy to Heroku
        print_status "Deploying to Heroku..."
        git add .
        git commit -m "Deploy to Heroku - $(date)" || true
        git push heroku main
        
        print_status "Heroku deployment completed!"
        heroku logs --tail
        ;;
        
    *)
        print_error "Unknown deployment method: $DEPLOY_METHOD"
        echo "Available methods: pm2, docker, heroku"
        exit 1
        ;;
esac

print_status "Deployment completed successfully! 🎉"
echo ""
echo "Next steps:"
echo "1. Test your deployment: curl http://$SERVER_IP:3000/health"
echo "2. Update your Chrome extension with the new server URL"
echo "3. Monitor logs and performance"
echo ""
echo "For troubleshooting, see DEPLOYMENT_GUIDE.md"
