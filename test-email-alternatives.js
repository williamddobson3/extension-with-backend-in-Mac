const nodemailer = require('nodemailer');
const axios = require('axios');

// Test different email configurations and methods
const testConfigs = [
  {
    name: 'Gmail SMTP Port 465 (SSL) - Primary',
    config: {
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: 'yuriilukianets9@gmail.com',
        pass: 'zjlouxtsmtxdlxfo'
      }
    }
  },
  {
    name: 'Gmail SMTP Port 587 (TLS) - Fallback',
    config: {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: 'yuriilukianets9@gmail.com',
        pass: 'zjlouxtsmtxdlxfo'
      },
      tls: {
        servername: 'smtp.gmail.com',
        rejectUnauthorized: false
      }
    }
  },
  {
    name: 'Gmail SMTP Port 25 (Standard)',
    config: {
      host: 'smtp.gmail.com',
      port: 25,
      secure: false,
      auth: {
        user: 'yuriilukianets9@gmail.com',
        pass: 'zjlouxtsmtxdlxfo'
      }
    }
  }
];

async function testNetworkConnectivity() {
  console.log('🔍 Testing Network Connectivity...\n');
  
  const testUrls = [
    'https://www.google.com',
    'https://smtp.gmail.com',
    'https://mail.google.com'
  ];
  
  for (const url of testUrls) {
    try {
      const response = await axios.get(url, { timeout: 10000 });
      console.log(`✅ ${url} - Status: ${response.status}`);
    } catch (error) {
      console.log(`❌ ${url} - ${error.message}`);
    }
  }
}

async function testSMTPConfig(config, name) {
  console.log(`\n📧 Testing: ${name}`);
  console.log(`   Host: ${config.host}:${config.port}`);
  console.log(`   Secure: ${config.secure ? 'Yes (SSL)' : 'No (TLS)'}`);
  
  try {
    // Test basic connection
    const transporter = nodemailer.createTransport(config);
    
    // Set shorter timeouts for faster testing
    const testTransporter = nodemailer.createTransport({
      ...config,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000
    });
    
    console.log('   🔌 Testing connection...');
    await testTransporter.verify();
    console.log('   ✅ SMTP connection successful!');
    
    // Test sending email
    console.log('   📤 Testing email sending...');
    const testEmail = {
      from: config.auth.user,
      to: config.auth.user,
      subject: `SMTP Test - ${name}`,
      text: `This is a test email using ${name} configuration.`
    };
    
    const info = await testTransporter.sendMail(testEmail);
    console.log('   ✅ Test email sent successfully!');
    console.log(`   Message ID: ${info.messageId}`);
    
    return true;
    
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}`);
    
    if (error.code === 'EAUTH') {
      console.log('   💡 Authentication issue - check credentials and 2FA settings');
    } else if (error.code === 'ECONNECTION') {
      console.log('   💡 Connection issue - check firewall/network settings');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('   💡 Timeout issue - network may be blocking SMTP');
    } else if (error.code === 'ENOTFOUND') {
      console.log('   💡 DNS resolution issue');
    }
    
    return false;
  }
}

async function testAlternativeMethods() {
  console.log('\n🚀 Testing Alternative Email Methods...\n');
  
  // Test 1: Gmail API approach (if available)
  console.log('🔧 Alternative Method 1: Gmail API');
  console.log('   Note: This requires setting up Gmail API credentials');
  console.log('   Would need to implement OAuth2 flow');
  
  // Test 2: Webhook services
  console.log('\n🔧 Alternative Method 2: Webhook Services');
  console.log('   - SendGrid, Mailgun, etc.');
  console.log('   - These often use different ports/protocols');
  
  // Test 3: HTTP-based email services
  console.log('\n🔧 Alternative Method 3: HTTP Email Services');
  console.log('   - Services that use HTTP/HTTPS instead of SMTP');
  console.log('   - May bypass corporate firewall restrictions');
}

async function runComprehensiveTest() {
  console.log('🚀 Starting Comprehensive Email Configuration Test\n');
  
  // Test network connectivity first
  await testNetworkConnectivity();
  
  // Test SMTP configurations
  let successCount = 0;
  for (const testConfig of testConfigs) {
    const success = await testSMTPConfig(testConfig.config, testConfig.name);
    if (success) successCount++;
  }
  
  // Test alternative methods
  await testAlternativeMethods();
  
  // Summary
  console.log('\n📊 Test Summary');
  console.log('================');
  console.log(`Total SMTP configurations tested: ${testConfigs.length}`);
  console.log(`Successful: ${successCount}`);
  console.log(`Failed: ${testConfigs.length - successCount}`);
  
  if (successCount === 0) {
    console.log('\n🔧 Recommendations for Corporate Network:');
    console.log('1. Contact IT department about SMTP access');
            console.log('2. Request whitelist for smtp.gmail.com:465');
    console.log('3. Consider using Gmail API instead of SMTP');
    console.log('4. Use webhook-based email services');
    console.log('5. Test from different network (mobile hotspot)');
  } else {
    console.log('\n🎉 At least one configuration is working!');
  }
}

// Run the comprehensive test
runComprehensiveTest().catch(console.error);
