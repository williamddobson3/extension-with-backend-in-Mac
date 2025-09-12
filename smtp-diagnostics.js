const nodemailer = require('nodemailer');
const dns = require('dns').promises;

// Test configurations
const testConfigs = [
  {
    name: 'Gmail Port 465 (SSL)',
    config: {
      host: 'smtp.gmail.com',
              port: 465,
        secure: true,
      auth: {
        user: 'yuriilukianets9@gmail.com',
        pass: 'zjlouxtsktxdlxfo'
      }
    }
  },
  {
    name: 'Gmail Port 465 (SSL)',
    config: {
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: 'yuriilukianets9@gmail.com',
        pass: 'zjlouxtsktxdlxfo'
      }
    }
  },
  {
    name: 'Gmail Port 25 (Fallback)',
    config: {
      host: 'smtp.gmail.com',
      port: 25,
      secure: false,
      auth: {
        user: 'yuriilukianets9@gmail.com',
        pass: 'zjlouxtsktxdlxfo'
      }
    }
  }
];

async function testDNSResolution() {
  console.log('🔍 Testing DNS Resolution...');
  try {
    const addresses = await dns.resolve4('smtp.gmail.com');
    console.log('✓ DNS Resolution successful');
    console.log('  IP Addresses:', addresses.join(', '));
    return true;
  } catch (error) {
    console.error('❌ DNS Resolution failed:', error.message);
    return false;
  }
}

async function testNetworkConnectivity(host, port) {
  console.log(`🔌 Testing network connectivity to ${host}:${port}...`);
  
  return new Promise((resolve) => {
    const net = require('net');
    const socket = new net.Socket();
    
    const timeout = setTimeout(() => {
      socket.destroy();
      resolve(false);
    }, 10000); // 10 second timeout
    
    socket.connect(port, host, () => {
      clearTimeout(timeout);
      socket.destroy();
      resolve(true);
    });
    
    socket.on('error', (error) => {
      clearTimeout(timeout);
      socket.destroy();
      resolve(false);
    });
  });
}

async function testSMTPConfig(config, name) {
  console.log(`\n📧 Testing: ${name}`);
  console.log(`   Host: ${config.host}:${config.port}`);
  console.log(`   Secure: ${config.secure ? 'Yes (SSL)' : 'No (TLS)'}`);
  
  try {
    // Test basic network connectivity first
    const canConnect = await testNetworkConnectivity(config.host, config.port);
    if (!canConnect) {
      console.log('   ❌ Network connectivity failed');
      return false;
    }
    console.log('   ✓ Network connectivity successful');
    
    // Test SMTP connection
    const transporter = nodemailer.createTransport(config);
    await transporter.verify();
    console.log('   ✓ SMTP connection verified');
    
    // Test sending email
    const testEmail = {
      from: config.auth.user,
      to: config.auth.user,
      subject: `SMTP Test - ${name}`,
      text: `This is a test email using ${name} configuration.`
    };
    
    const info = await transporter.sendMail(testEmail);
    console.log('   ✓ Test email sent successfully');
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
    }
    
    return false;
  }
}

async function runDiagnostics() {
  console.log('🚀 Starting SMTP Configuration Diagnostics\n');
  
  // Test DNS resolution
  const dnsWorks = await testDNSResolution();
  console.log('');
  
  if (!dnsWorks) {
    console.log('❌ DNS resolution failed. Check your internet connection.');
    return;
  }
  
  // Test each configuration
  let successCount = 0;
  for (const testConfig of testConfigs) {
    const success = await testSMTPConfig(testConfig.config, testConfig.name);
    if (success) successCount++;
  }
  
  // Summary
  console.log('\n📊 Diagnostic Summary');
  console.log('=====================');
  console.log(`Total configurations tested: ${testConfigs.length}`);
  console.log(`Successful: ${successCount}`);
  console.log(`Failed: ${testConfigs.length - successCount}`);
  
  if (successCount === 0) {
    console.log('\n🔧 Troubleshooting Recommendations:');
    console.log('1. Check if your firewall/antivirus is blocking SMTP connections');
    console.log('2. Verify your network allows outbound connections on ports 25, 465, and 587');
    console.log('3. Try testing from a different network (mobile hotspot)');
    console.log('4. Check if your ISP blocks SMTP ports');
    console.log('5. Verify Gmail App Password is correct and 2FA is enabled');
  } else {
    console.log('\n🎉 At least one configuration is working!');
  }
}

// Run diagnostics
runDiagnostics().catch(console.error);
