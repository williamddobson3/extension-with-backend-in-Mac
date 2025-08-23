#!/usr/bin/env node

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('🚀 Website Monitor Setup Script');
console.log('================================\n');

async function setupDatabase() {
    console.log('📊 Setting up database...');
    
    try {
        // Create connection without database
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            port: process.env.DB_PORT || 3306
        });

        // Read schema file
        const schemaPath = path.join(__dirname, 'database', 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        // Execute schema
        const statements = schema.split(';').filter(stmt => stmt.trim());
        
        for (const statement of statements) {
            if (statement.trim()) {
                await connection.execute(statement);
            }
        }

        console.log('✅ Database setup completed successfully');
        await connection.end();

    } catch (error) {
        console.error('❌ Database setup failed:', error.message);
        process.exit(1);
    }
}

async function checkDependencies() {
    console.log('📦 Checking dependencies...');
    
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const requiredDeps = Object.keys(packageJson.dependencies);
    
    let missingDeps = [];
    
    for (const dep of requiredDeps) {
        try {
            require.resolve(dep);
        } catch (error) {
            missingDeps.push(dep);
        }
    }
    
    if (missingDeps.length > 0) {
        console.log('⚠️  Missing dependencies:', missingDeps.join(', '));
        console.log('Run: npm install');
        return false;
    }
    
    console.log('✅ All dependencies are installed');
    return true;
}

async function checkEnvironment() {
    console.log('🔧 Checking environment configuration...');
    
    const requiredEnvVars = [
        'DB_HOST',
        'DB_USER', 
        'DB_PASSWORD',
        'DB_NAME',
        'JWT_SECRET'
    ];
    
    let missingVars = [];
    
    for (const envVar of requiredEnvVars) {
        if (!process.env[envVar]) {
            missingVars.push(envVar);
        }
    }
    
    if (missingVars.length > 0) {
        console.log('⚠️  Missing environment variables:', missingVars.join(', '));
        console.log('Please configure your .env file');
        return false;
    }
    
    console.log('✅ Environment configuration is complete');
    return true;
}

async function createSampleData() {
    console.log('📝 Creating sample data...');
    
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT
        });

        // Check if sample data already exists
        const [users] = await connection.execute('SELECT COUNT(*) as count FROM users');
        
        if (users[0].count > 0) {
            console.log('ℹ️  Sample data already exists, skipping...');
            await connection.end();
            return;
        }

        // Create sample user
        const bcrypt = require('bcryptjs');
        const passwordHash = await bcrypt.hash('password123', 12);
        
        await connection.execute(
            'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
            ['demo', 'demo@example.com', passwordHash]
        );

        const [result] = await connection.execute('SELECT id FROM users WHERE username = ?', ['demo']);
        const userId = result[0].id;

        // Create sample monitored sites
        const sampleSites = [
            {
                name: '小林製薬 廃盤情報',
                url: 'https://www.kobayashi.co.jp/seihin/end/',
                keywords: '製造終了,廃盤,終了'
            },
            {
                name: '花王 廃盤商品',
                url: 'https://www.kao-kirei.com/ja/expire-item/kbb/',
                keywords: '製造終了,廃盤,終了'
            },
            {
                name: 'ライオン 廃盤商品',
                url: 'https://www.lion.co.jp/ja/products/end.php',
                keywords: '製造終了,廃盤,終了'
            }
        ];

        for (const site of sampleSites) {
            await connection.execute(
                'INSERT INTO monitored_sites (user_id, url, name, keywords, check_interval_hours) VALUES (?, ?, ?, ?, ?)',
                [userId, site.url, site.name, site.keywords, 24]
            );
        }

        // Create notification preferences
        await connection.execute(
            'INSERT INTO user_notifications (user_id, email_enabled, line_enabled) VALUES (?, true, false)',
            [userId]
        );

        console.log('✅ Sample data created successfully');
        console.log('📧 Demo account: demo@example.com / password123');
        
        await connection.end();

    } catch (error) {
        console.error('❌ Sample data creation failed:', error.message);
    }
}

async function main() {
    try {
        // Check if .env exists
        if (!fs.existsSync('.env')) {
            console.log('⚠️  .env file not found. Please copy env.example to .env and configure it.');
            process.exit(1);
        }

        // Check dependencies
        const depsOk = await checkDependencies();
        if (!depsOk) {
            process.exit(1);
        }

        // Check environment
        const envOk = await checkEnvironment();
        if (!envOk) {
            process.exit(1);
        }

        // Setup database
        await setupDatabase();

        // Create sample data
        await createSampleData();

        console.log('\n🎉 Setup completed successfully!');
        console.log('\nNext steps:');
        console.log('1. Start the server: npm run dev');
        console.log('2. Install the Chrome extension');
        console.log('3. Login with demo account: demo@example.com / password123');
        console.log('\nHappy monitoring! 🚀');

    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        process.exit(1);
    }
}

// Run setup
main();
