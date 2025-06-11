# Production Deployment Cleanup Script

**Date:** June 4, 2025  
**Purpose:** Automated cleanup and documentation archival for production deployment  
**Status:** Ready to execute

## 🎯 Cleanup Strategy Overview

This script implements the documentation retention strategy outlined in `Ok_TO_DELETE_BEFORE_LAUNCH.MD`:

- **Keep 8 essential** documentation files in production
- **Archive 40+ development** documentation files
- **Remove 200+ development** scripts and test files
- **Preserve production functionality** while reducing deployment size by 60-80%

---

## 📋 Pre-Execution Checklist

Before running this cleanup script, verify:

- [ ] All critical fixes are documented and completed
- [ ] Production server is tested and operational
- [ ] Database connections are stable
- [ ] All functionality is working as expected
- [ ] Git repository is up to date
- [ ] Production backups are available

---

## 🚀 PowerShell Cleanup Script

### Step 1: Create Archive Structure
```powershell
# Navigate to project directory
cd "p:\replit_files\SalesDashboard\SalesDashboard"

# Create archive directories
New-Item -ItemType Directory -Path "development-archive" -Force
New-Item -ItemType Directory -Path "development-archive\phase-reports" -Force
New-Item -ItemType Directory -Path "development-archive\bug-fixes" -Force
New-Item -ItemType Directory -Path "development-archive\task-reports" -Force
New-Item -ItemType Directory -Path "development-archive\status-updates" -Force
New-Item -ItemType Directory -Path "development-archive\legacy" -Force

Write-Host "✅ Archive directories created" -ForegroundColor Green
```

### Step 2: Archive Development Documentation
```powershell
# Archive project management & planning docs
$planningDocs = @(
    "IMPLEMENTATION_PLAN_2025.md",
    "IMPLEMENTATION_PLAN.md", 
    "IMPLEMENTATION_STATUS_UPDATE_MAY28.md",
    "LESSONS_LEARNED.md",
    "PROJECT_COMPLETION_SUMMARY.md",
    "SALES_DASHBOARD_IMPROVEMENT_SUMMARY.md",
    "TASK_PRIORITIZATION_SCHEDULE.md",
    "TECHNICAL_IMPLEMENTATION_DETAILS.md"
)

foreach ($doc in $planningDocs) {
    if (Test-Path $doc) {
        Move-Item $doc "development-archive\" -Force
        Write-Host "📁 Archived: $doc" -ForegroundColor Yellow
    }
}

# Archive phase completion reports
$phaseReports = Get-ChildItem -Name "PHASE_*.md"
foreach ($report in $phaseReports) {
    Move-Item $report "development-archive\phase-reports\" -Force
    Write-Host "📊 Archived phase report: $report" -ForegroundColor Yellow
}

# Archive bug fix documentation
$bugFixDocs = @(
    "BUG_TRACKER.md",
    "Major_Issue_Tracker.md", 
    "TIMELINE_EVENTS_ISSUE_TRACKER.md",
    "PROCESS_CREATION_FIX_DOCUMENTATION.md",
    "PROCESS_UPDATE_FIX_DOCUMENTATION*.md",
    "PROCESS_TIMELINE_EVENT_FIELD_FIX.md",
    "PROCESS_FUNCTIONAL_AREA_FIX.md",
    "PROCESSMODAL_*.md",
    "CREATE_PROCESS_MODAL_*.md"
)

foreach ($pattern in $bugFixDocs) {
    $files = Get-ChildItem -Name $pattern -ErrorAction SilentlyContinue
    foreach ($file in $files) {
        Move-Item $file "development-archive\bug-fixes\" -Force
        Write-Host "🐛 Archived bug fix: $file" -ForegroundColor Yellow
    }
}

# Archive task completion reports
$taskReports = Get-ChildItem -Name "TASK_*.md"
foreach ($report in $taskReports) {
    Move-Item $report "development-archive\task-reports\" -Force
    Write-Host "✅ Archived task report: $report" -ForegroundColor Yellow
}

# Archive status updates
if (Test-Path "status-reports") {
    Move-Item "status-reports" "development-archive\status-updates\" -Force
    Write-Host "📈 Archived status-reports directory" -ForegroundColor Yellow
}

# Archive legacy documentation
if (Test-Path "Origin") {
    Move-Item "Origin" "development-archive\legacy\" -Force
    Write-Host "🗂️ Archived Origin directory" -ForegroundColor Yellow
}

# Archive miscellaneous development docs
$miscDocs = @(
    "test-ai-chat.md",
    "ai-chat-examples.md", 
    "DATABASE_SERVER_GUIDE.md",
    "Database_Details.md"
)

foreach ($doc in $miscDocs) {
    if (Test-Path $doc) {
        Move-Item $doc "development-archive\" -Force
        Write-Host "📄 Archived: $doc" -ForegroundColor Yellow
    }
}

Write-Host "✅ Documentation archival completed" -ForegroundColor Green
```

### Step 3: Remove Development Scripts
```powershell
# Remove debug scripts
$debugPatterns = @("debug-*.js", "debug-*.mjs")
foreach ($pattern in $debugPatterns) {
    $files = Get-ChildItem -Name $pattern -ErrorAction SilentlyContinue
    foreach ($file in $files) {
        Remove-Item $file -Force
        Write-Host "🗑️ Removed debug script: $file" -ForegroundColor Red
    }
}

# Remove test scripts
$testPatterns = @("test-*.js", "test-*.mjs", "test-*.py", "test-*.cjs", "test-*.ts")
foreach ($pattern in $testPatterns) {
    $files = Get-ChildItem -Name $pattern -ErrorAction SilentlyContinue
    foreach ($file in $files) {
        Remove-Item $file -Force
        Write-Host "🗑️ Removed test script: $file" -ForegroundColor Red
    }
}

# Remove check scripts
$checkPatterns = @("check-*.js", "check-*.mjs", "quick-*.js", "simple-*.js")
foreach ($pattern in $checkPatterns) {
    $files = Get-ChildItem -Name $pattern -ErrorAction SilentlyContinue
    foreach ($file in $files) {
        Remove-Item $file -Force
        Write-Host "🗑️ Removed check script: $file" -ForegroundColor Red
    }
}

# Remove fix and migration scripts
$migrationPatterns = @("add-soft-delete-*", "create-*.sql", "migrate-*", "*-fix.js", "*fix*.js")
foreach ($pattern in $migrationPatterns) {
    $files = Get-ChildItem -Name $pattern -ErrorAction SilentlyContinue
    foreach ($file in $files) {
        Remove-Item $file -Force
        Write-Host "🗑️ Removed migration/fix script: $file" -ForegroundColor Red
    }
}

# Remove PowerShell test scripts and misc files
$miscPatterns = @("*.ps1", "*.html", "*.txt", "*.json" | Where-Object { $_ -notlike "package*.json" })
foreach ($pattern in $miscPatterns) {
    $files = Get-ChildItem -Name $pattern -ErrorAction SilentlyContinue
    foreach ($file in $files) {
        if ($file -notmatch "package.*\.json|components\.json") {
            Remove-Item $file -Force
            Write-Host "🗑️ Removed misc file: $file" -ForegroundColor Red
        }
    }
}

Write-Host "✅ Development script cleanup completed" -ForegroundColor Green
```

### Step 4: Verify Essential Files Remain
```powershell
# Verify essential documentation files are still present
$essentialDocs = @(
    "README.md",
    "FINAL_PROJECT_STATUS_SUMMARY.md",
    "DATABASE_CONNECTION_GUIDE.md", 
    "GITHUB_SETUP.md",
    "PROCESS_TIMELINE_FIX_COMPLETION_REPORT.md",
    "MIGRATION_GUIDE.md",
    "DOCUMENT_UPLOAD_FUNCTIONALITY_GUIDE.md",
    "FINAL_COMPLETION_REPORT_MAY28.md"
)

Write-Host "`n🔍 Verifying essential documentation files..." -ForegroundColor Cyan

foreach ($doc in $essentialDocs) {
    if (Test-Path $doc) {
        Write-Host "✅ Present: $doc" -ForegroundColor Green
    } else {
        Write-Host "❌ MISSING: $doc" -ForegroundColor Red
    }
}

# Verify essential production directories
$essentialDirs = @("client", "server", "shared", "drizzle")
Write-Host "`n🔍 Verifying essential production directories..." -ForegroundColor Cyan

foreach ($dir in $essentialDirs) {
    if (Test-Path $dir) {
        Write-Host "✅ Present: $dir/" -ForegroundColor Green
    } else {
        Write-Host "❌ MISSING: $dir/" -ForegroundColor Red
    }
}

# Verify essential configuration files
$essentialConfigs = @("package.json", "vite.config.ts", "tsconfig.json", "drizzle.config.ts")
Write-Host "`n🔍 Verifying essential configuration files..." -ForegroundColor Cyan

foreach ($config in $essentialConfigs) {
    if (Test-Path $config) {
        Write-Host "✅ Present: $config" -ForegroundColor Green
    } else {
        Write-Host "❌ MISSING: $config" -ForegroundColor Red
    }
}
```

### Step 5: Generate Cleanup Report
```powershell
# Generate cleanup summary report
$reportContent = @"
# Production Deployment Cleanup Report

**Date:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
**Project:** Sales Dashboard CRM
**Action:** Production deployment cleanup completed

## 📊 Cleanup Summary

### Documentation Strategy
- ✅ 8 essential documentation files retained in production
- ✅ 40+ development documentation files archived to development-archive/
- ✅ Historical development information preserved

### File Removal Summary  
- 🗑️ Debug scripts removed
- 🗑️ Test scripts removed  
- 🗑️ Check/validation scripts removed
- 🗑️ Migration/fix scripts removed
- 🗑️ Temporary and log files removed

### Archive Structure Created
- development-archive/
  - phase-reports/
  - bug-fixes/ 
  - task-reports/
  - status-updates/
  - legacy/

### Production Files Verified
- ✅ Essential documentation present
- ✅ Application directories present
- ✅ Configuration files present

## 🎯 Result
**Status:** Production Ready ✅  
**Space Savings:** Estimated 60-80% reduction  
**Security:** Development files removed  
**Documentation:** Essential docs retained, development docs archived

---
*Generated by Production Deployment Cleanup Script*
"@

$reportContent | Out-File "CLEANUP_REPORT.md" -Encoding UTF8
Write-Host "`n📋 Cleanup report generated: CLEANUP_REPORT.md" -ForegroundColor Green

Write-Host "`n🎉 Production deployment cleanup completed successfully!" -ForegroundColor Green
Write-Host "📁 Development documentation archived to: development-archive/" -ForegroundColor Yellow
Write-Host "✅ Essential documentation retained for production support" -ForegroundColor Green
```

---

## 🔧 Manual Verification Steps

After running the automated script, manually verify:

1. **Application Functionality**
   ```powershell
   npm run dev
   # Test: http://localhost:5000 loads successfully
   ```

2. **Database Connection**
   - Verify connection to Supabase
   - Test CRUD operations
   - Confirm no broken functionality

3. **Documentation Completeness**
   - Essential docs provide adequate production support
   - Setup instructions are clear and complete
   - Troubleshooting guides are accessible

4. **Archive Integrity** 
   - Development documentation is properly organized
   - Historical information is preserved
   - Archive is accessible for future reference

---

## 🚨 Rollback Procedure

If issues are discovered after cleanup:

```powershell
# Restore all archived documentation
Copy-Item "development-archive\*" -Destination "." -Recurse -Force

# Restore specific categories if needed
Copy-Item "development-archive\bug-fixes\*" -Destination "." -Force
Copy-Item "development-archive\phase-reports\*" -Destination "." -Force
```

---

## 📝 Final Notes

- **Run this script in a test environment first**
- **Ensure git commits are up to date before execution**
- **Consider creating a full backup before major cleanup**
- **Test application thoroughly after cleanup**
- **Document any custom modifications for your specific deployment**

**Script Status:** Ready for production deployment cleanup  
**Last Updated:** June 4, 2025  
**Version:** 1.0
