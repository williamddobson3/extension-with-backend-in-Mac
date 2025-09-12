#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

clear

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    🚀 WEBSITE MONITOR                        ║"
echo "║                      Easy Installer                          ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo "This installer will help you set up Website Monitor on your computer."
echo
echo -e "${YELLOW}📋 Prerequisites Check:${NC}"
echo

# Check if Node.js is installed
if command -v node &> /dev/null; then
    echo -e "${GREEN}✅ Node.js is installed${NC}"
    echo "   Version: $(node --version)"
else
    echo -e "${RED}❌ Node.js is NOT installed${NC}"
    echo
    echo "Please install Node.js first:"
    echo "1. Go to https://nodejs.org/"
    echo "2. Download the LTS version"
    echo "3. Run the installer"
    echo "4. Restart this installer"
    echo
    read -p "Press Enter to exit..."
    exit 1
fi

# Check if MySQL is accessible
echo "Checking MySQL connection..."
if command -v mysql &> /dev/null; then
    echo -e "${GREEN}✅ MySQL is accessible${NC}"
    echo "   Version: $(mysql --version | cut -d' ' -f6)"
else
    echo -e "${RED}❌ MySQL is NOT accessible${NC}"
    echo
    echo "Please make sure MySQL is installed and running:"
    echo "1. Install MySQL from https://dev.mysql.com/downloads/"
    echo "2. Start MySQL service"
    echo "3. Restart this installer"
    echo
    read -p "Press Enter to exit..."
    exit 1
fi

echo
echo -e "${GREEN}🎉 All prerequisites are met!${NC}"
echo
echo -e "${YELLOW}🔧 Starting installation...${NC}"
echo

# Install dependencies
echo -e "${BLUE}📦 Installing project dependencies...${NC}"
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    read -p "Press Enter to exit..."
    exit 1
fi
echo -e "${GREEN}✅ Dependencies installed successfully${NC}"
echo

# Setup database
echo -e "${BLUE}🗄️ Setting up database...${NC}"
npm run setup
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to setup database${NC}"
    echo
    echo "This might be due to:"
    echo "- MySQL not running"
    echo "- Wrong password in .env file"
    echo "- Database already exists"
    echo
    read -p "Press Enter to exit..."
    exit 1
fi
echo -e "${GREEN}✅ Database setup completed${NC}"
echo

echo
echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    🎉 INSTALLATION COMPLETE!                 ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo
echo -e "${GREEN}✅ Website Monitor has been installed successfully!${NC}"
echo
echo -e "${YELLOW}📝 Next steps:${NC}"
echo "1. Edit the .env file with your MySQL password"
echo "2. Run ./start.sh to start the server"
echo "3. Install the Chrome extension"
echo
echo -e "${BLUE}📖 For detailed instructions, see QUICK-START-GUIDE.md${NC}"
echo
echo -e "${GREEN}🚀 Ready to start monitoring websites!${NC}"
echo
read -p "Press Enter to continue..."
