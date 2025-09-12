# PowerShell script to fix database schema
# Add missing text_content column to site_checks table

Write-Host "🔧 Fixing Database Schema..." -ForegroundColor Yellow
Write-Host "=================================" -ForegroundColor Yellow

# Database connection details
$mysqlUser = "root"
$mysqlPassword = ""

# SQL commands to fix the schema
$sqlCommands = @"
USE website_monitor;

-- Add text_content column to store the actual text content for element detection
ALTER TABLE site_checks ADD COLUMN text_content LONGTEXT AFTER content_hash;

-- Update existing records to have empty text_content (they will be populated on next check)
UPDATE site_checks SET text_content = '' WHERE text_content IS NULL;

-- Add index for better performance when searching text content
CREATE INDEX idx_site_checks_text_content ON site_checks(text_content(100));

-- Verify the change
DESCRIBE site_checks;

-- Show sample data
SELECT id, site_id, content_hash, LEFT(text_content, 50) as text_preview, created_at 
FROM site_checks 
LIMIT 5;
"@

# Create temporary SQL file
$tempSqlFile = "temp_fix_schema.sql"
$sqlCommands | Out-File -FilePath $tempSqlFile -Encoding UTF8

Write-Host "📝 Created temporary SQL file: $tempSqlFile" -ForegroundColor Green

# Run MySQL command
Write-Host "🚀 Running MySQL migration..." -ForegroundColor Yellow
Write-Host "Enter your MySQL root password when prompted:" -ForegroundColor Cyan

try {
    # Run MySQL with the SQL file
    $mysqlCommand = "mysql -u $mysqlUser -p < $tempSqlFile"
    Write-Host "Executing: $mysqlCommand" -ForegroundColor Gray
    
    # Use cmd to run the MySQL command
    cmd /c "mysql -u $mysqlUser -p < $tempSqlFile"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database migration completed successfully!" -ForegroundColor Green
        Write-Host "🎉 Your enhanced monitoring system is now ready!" -ForegroundColor Green
    } else {
        Write-Host "❌ Database migration failed with exit code: $LASTEXITCODE" -ForegroundColor Red
    }
    
} catch {
    Write-Host "❌ Error running MySQL migration: $_" -ForegroundColor Red
    Write-Host "💡 Make sure MySQL is installed and accessible" -ForegroundColor Yellow
}

# Clean up temporary file
if (Test-Path $tempSqlFile) {
    Remove-Item $tempSqlFile
    Write-Host "🧹 Cleaned up temporary SQL file" -ForegroundColor Gray
}

Write-Host ""
Write-Host "🚀 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Start your server: npm start" -ForegroundColor White
Write-Host "2. Test your enhanced 'メールテスト' button!" -ForegroundColor White
Write-Host "3. Watch real-time website monitoring in action! 🎉" -ForegroundColor White
