# Simple Database Fix Script
# This script adds the missing 'reason' column to the site_checks table

Write-Host "🔧 Fixing Missing 'reason' Column in Database..." -ForegroundColor Yellow
Write-Host ""

# Try to find MySQL executable
$mysqlPaths = @(
    "mysql",
    "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe",
    "C:\Program Files\MySQL\MySQL Server 5.7\bin\mysql.exe",
    "C:\xampp\mysql\bin\mysql.exe",
    "C:\wamp64\bin\mysql\mysql8.0.31\bin\mysql.exe",
    "C:\wamp\bin\mysql\mysql8.0.31\bin\mysql.exe"
)

$mysqlExe = $null
foreach ($path in $mysqlPaths) {
    try {
        if (Get-Command $path -ErrorAction SilentlyContinue) {
            $mysqlExe = $path
            break
        }
    } catch {
        # Continue to next path
    }
}

if (-not $mysqlExe) {
    Write-Host "❌ MySQL executable not found in PATH or common locations" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Please install MySQL or add it to your PATH" -ForegroundColor Yellow
    Write-Host "   Or manually run the SQL commands in MySQL Workbench:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   ALTER TABLE site_checks ADD COLUMN reason TEXT AFTER changes_detected;" -ForegroundColor Cyan
    Write-Host "   ALTER TABLE site_checks ADD COLUMN IF NOT EXISTS text_content LONGTEXT AFTER content_hash;" -ForegroundColor Cyan
    Write-Host ""
    exit 1
}

Write-Host "✅ Found MySQL executable: $mysqlExe" -ForegroundColor Green
Write-Host ""

Write-Host "🔐 Please enter your MySQL password when prompted:" -ForegroundColor Yellow
Write-Host ""

# Execute SQL commands directly
try {
    Write-Host "📝 Adding 'reason' column..." -ForegroundColor Green
    & $mysqlExe -u root -p -e "USE website_monitor; ALTER TABLE site_checks ADD COLUMN reason TEXT AFTER changes_detected;"
    
    Write-Host "📝 Adding 'text_content' column..." -ForegroundColor Green
    & $mysqlExe -u root -p -e "USE website_monitor; ALTER TABLE site_checks ADD COLUMN IF NOT EXISTS text_content LONGTEXT AFTER content_hash;"
    
    Write-Host "📝 Updating existing records..." -ForegroundColor Green
    & $mysqlExe -u root -p -e "USE website_monitor; UPDATE site_checks SET reason = 'Content modified' WHERE reason IS NULL AND changes_detected = true;"
    
    Write-Host "📝 Verifying changes..." -ForegroundColor Green
    & $mysqlExe -u root -p -e "USE website_monitor; DESCRIBE site_checks;"
    
    Write-Host ""
    Write-Host "✅ Database fix completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎯 The missing 'reason' column has been added to the site_checks table" -ForegroundColor Green
    Write-Host "   Your enhanced notification system should now work properly!" -ForegroundColor Green
    
} catch {
    Write-Host ""
    Write-Host "❌ Error applying database fix:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 You can manually run the SQL commands in MySQL Workbench:" -ForegroundColor Yellow
    Write-Host "   ALTER TABLE site_checks ADD COLUMN reason TEXT AFTER changes_detected;" -ForegroundColor Cyan
    Write-Host "   ALTER TABLE site_checks ADD COLUMN IF NOT EXISTS text_content LONGTEXT AFTER content_hash;" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "🚀 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Restart your server (npm run dev)" -ForegroundColor Cyan
Write-Host "   2. Test the enhanced notification system" -ForegroundColor Cyan
Write-Host "   3. Click 'メールテスト' button to verify it works" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to continue..."
Read-Host
