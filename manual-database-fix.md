# 🔧 Manual Database Fix for Enhanced Monitoring System

## **🚨 Problem Identified:**
```
Error: Unknown column 'text_content' in 'field list'
```

Your enhanced monitoring system is trying to save `text_content` data, but the database doesn't have this column yet.

## **💡 Solution: Add Missing Column**

### **Option 1: PowerShell Script (Recommended)**
```powershell
.\fix-database.ps1
```

### **Option 2: Manual MySQL Commands**

#### **Step 1: Connect to MySQL**
```bash
mysql -u root -p
```

#### **Step 2: Run These Commands**
```sql
USE website_monitor;

-- Add the missing column
ALTER TABLE site_checks ADD COLUMN text_content LONGTEXT AFTER content_hash;

-- Update existing records
UPDATE site_checks SET text_content = '' WHERE text_content IS NULL;

-- Add performance index
CREATE INDEX idx_site_checks_text_content ON site_checks(text_content(100));

-- Verify the change
DESCRIBE site_checks;

-- Check sample data
SELECT id, site_id, content_hash, LEFT(text_content, 50) as text_preview, created_at 
FROM site_checks 
LIMIT 5;
```

#### **Step 3: Exit MySQL**
```sql
EXIT;
```

### **Option 3: Using MySQL Workbench**
1. Open MySQL Workbench
2. Connect to your database
3. Run the SQL commands from Option 2

## **✅ After Fixing:**

### **1. Start Your Server**
```bash
npm start
```

### **2. Test Enhanced System**
- Add a website to monitor
- Click "メールテスト" button
- Watch real-time monitoring in action! 🎉

## **🎯 What This Fix Enables:**

- ✅ **Element-specific monitoring** for your target paragraph
- ✅ **Real website scraping** during mail tests
- ✅ **Live change detection** and notifications
- ✅ **Comprehensive test reports** with all details
- ✅ **Database logging** of all monitoring activities

## **🚀 Your Enhanced "メールテスト" Button Will Now:**

1. 🔍 **Scrape ALL monitored websites**
2. 🔄 **Detect real changes** in your target elements
3. 📧 **Send immediate notifications** if changes found
4. 📬 **Generate comprehensive reports** via email
5. 🔔 **Show detailed results** in Chrome extension

**This transforms your simple email test into a powerful real-time monitoring system!** 🎉
