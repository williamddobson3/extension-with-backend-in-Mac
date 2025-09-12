const nodemailer = require('nodemailer');

// SMTP Configuration
const smtpConfig = {
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: 'yuriilukianets9@gmail.com',
    pass: 'zjlouxtsktxdlxfo'
  }
};

async function testSMTPConnection() {
  console.log('Testing SMTP connection...');
  console.log('Host:', smtpConfig.host);
  console.log('Port:', smtpConfig.port);
  console.log('User:', smtpConfig.auth.user);
  console.log('Password:', smtpConfig.auth.pass ? '***' + smtpConfig.auth.pass.slice(-4) : 'Not set');
  console.log('');

  try {
    // Create transporter
    const transporter = nodemailer.createTransport(smtpConfig);
    
    console.log('✓ Transporter created successfully');
    
    // Verify connection
    console.log('Verifying connection...');
    await transporter.verify();
    console.log('✓ SMTP connection verified successfully!');
    
    // Test sending a simple email
    console.log('Testing email sending...');
    const testEmail = {
      from: smtpConfig.auth.user,
      to: smtpConfig.auth.user, // Send to self for testing
      subject: 'SMTP Test Email',
      text: 'This is a test email to verify SMTP configuration is working correctly.',
      html: '<h1>SMTP Test</h1><p>This is a test email to verify SMTP configuration is working correctly.</p>'
    };
    
    const info = await transporter.sendMail(testEmail);
    console.log('✓ Test email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);
    
    console.log('\n🎉 All tests passed! Your SMTP configuration is working correctly.');
    
  } catch (error) {
    console.error('❌ SMTP test failed:');
    console.error('Error:', error.message);
    
    if (error.code === 'EAUTH') {
      console.error('\nAuthentication failed. Possible issues:');
      console.error('- Check if the email and password are correct');
      console.error('- Verify that 2-factor authentication is enabled on your Gmail account');
      console.error('- Check if "Less secure app access" is enabled (though this is deprecated)');
      console.error('- Use an App Password if 2FA is enabled');
    } else if (error.code === 'ECONNECTION') {
      console.error('\nConnection failed. Possible issues:');
      console.error('- Check if the host and port are correct');
      console.error('- Verify your firewall/antivirus isn\'t blocking the connection');
      console.error('- Check if your network allows SMTP connections');
    }
  }
}

// Run the test
testSMTPConnection();
