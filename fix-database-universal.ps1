# Universal Database Fix Script
# Finds MySQL and fixes the missing text_content column

Write-Host "🔧 Universal Database Schema Fix" -ForegroundColor Yellow
Write-Host "=================================" -ForegroundColor Yellow

# Function to find MySQL executable
function Find-MySQL {
    $possiblePaths = @(
        "mysql",  # If in PATH
        "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe",
        "C:\Program Files\MySQL\MySQL Server 5.7\bin\mysql.exe",
        "C:\xampp\mysql\bin\mysql.exe",
        "C:\wamp\bin\mysql\mysql8.0.31\bin\mysql.exe",
        "C:\wamp64\bin\mysql\mysql8.0.31\bin\mysql.exe",
        "C:\laragon\bin\mysql\mysql-8.0.30-winx64\bin\mysql.exe"
    )
    
    foreach ($path in $possiblePaths) {
        try {
            if ($path -eq "mysql") {
                $result = Get-Command mysql -ErrorAction SilentlyContinue
                if ($result) {
                    Write-Host "✅ Found MySQL in PATH: $($result.Source)" -ForegroundColor Green
                    return $result.Source
                }
            } else {
                if (Test-Path $path) {
                    Write-Host "✅ Found MySQL at: $path" -ForegroundColor Green
                    return $path
                }
            }
        } catch {
            # Continue to next path
        }
    }
    
    return $null
}

# Find MySQL
Write-Host "🔍 Searching for MySQL installation..." -ForegroundColor Cyan
$mysqlPath = Find-MySQL

if (-not $mysqlPath) {
    Write-Host "❌ MySQL not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Please install MySQL or add it to your PATH:" -ForegroundColor Yellow
    Write-Host "1. Download MySQL from: https://dev.mysql.com/downloads/mysql/" -ForegroundColor White
    Write-Host "2. Or install XAMPP: https://www.apachefriends.org/" -ForegroundColor White
    Write-Host "3. Or use the manual fix below:" -ForegroundColor White
    Write-Host ""
    Write-Host "📋 Manual SQL Commands:" -ForegroundColor Cyan
    Write-Host "USE website_monitor;" -ForegroundColor White
    Write-Host "ALTER TABLE site_checks ADD COLUMN text_content LONGTEXT AFTER content_hash;" -ForegroundColor White
    Write-Host "UPDATE site_checks SET text_content = '' WHERE text_content IS NULL;" -ForegroundColor White
    Write-Host "CREATE INDEX idx_site_checks_text_content ON site_checks(text_content(100));" -ForegroundColor White
    exit 1
}

# Create SQL commands
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
    # Use the found MySQL path
    $mysqlCommand = "& `"$mysqlPath`" -u root -p < $tempSqlFile"
    Write-Host "Executing: $mysqlCommand" -ForegroundColor Gray
    
    # Use cmd to run the MySQL command
    $result = cmd /c "`"$mysqlPath`" -u root -p < $tempSqlFile" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database migration completed successfully!" -ForegroundColor Green
        Write-Host "🎉 Your enhanced monitoring system is now ready!" -ForegroundColor Green
    } else {
        Write-Host "❌ Database migration failed with exit code: $LASTEXITCODE" -ForegroundColor Red
        Write-Host "Output: $result" -ForegroundColor Gray
    }
    
} catch {
    Write-Host "❌ Error running MySQL migration: $_" -ForegroundColor Red
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

Write-Host ""
Write-Host "💡 If the automatic fix failed, use the manual SQL commands above" -ForegroundColor Yellow
Write-Host "   in MySQL Workbench or any MySQL client." -ForegroundColor Yellow
