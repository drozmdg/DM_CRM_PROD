# Production Deployment Cleanup Task List

**Based on**: [`Ok_TO_DELETE_BEFORE_LAUNCH.MD`](Ok_TO_DELETE_BEFORE_LAUNCH.MD)  
**Created**: June 10, 2025  
**Status**: Ready for Execution  
**Estimated Time**: 15-30 minutes  

## 📋 Overview

This task list provides step-by-step instructions to clean up the Sales Dashboard project for production deployment by removing 250+ development files and archiving non-essential documentation.

## ⚠️ Prerequisites

1. **Backup Current State**: Ensure you have a complete backup of the project
2. **Test Production Build**: Verify the application works correctly before cleanup
3. **Database Backup**: Ensure database is backed up if needed
4. **Team Notification**: Notify team members before cleanup

## 🎯 Task Execution Order

### Phase 1: Documentation Archive (5 minutes)

#### Task 1.1: Create Archive Directory
```powershell
# Create development archive directory
New-Item -ItemType Directory -Path "development-archive" -Force
```

#### Task 1.2: Archive Development Documentation
```powershell
# Archive project management & planning docs
Move-Item IMPLEMENTATION_PLAN_2025.md development-archive/ -ErrorAction SilentlyContinue
Move-Item IMPLEMENTATION_PLAN.md development-archive/ -ErrorAction SilentlyContinue
Move-Item LESSONS_LEARNED.md development-archive/ -ErrorAction SilentlyContinue
Move-Item PROJECT_COMPLETION_SUMMARY.md development-archive/ -ErrorAction SilentlyContinue
Move-Item SALES_DASHBOARD_IMPROVEMENT_SUMMARY.md development-archive/ -ErrorAction SilentlyContinue
Move-Item TASK_PRIORITIZATION_SCHEDULE.md development-archive/ -ErrorAction SilentlyContinue
Move-Item TECHNICAL_IMPLEMENTATION_DETAILS.md development-archive/ -ErrorAction SilentlyContinue

# Archive phase completion reports
Move-Item PHASE_*.md development-archive/ -ErrorAction SilentlyContinue

# Archive task completion reports
Move-Item TASK_*.md development-archive/ -ErrorAction SilentlyContinue

# Archive bug fix & issue tracking docs
Move-Item BUG_TRACKER.md development-archive/ -ErrorAction SilentlyContinue
Move-Item Major_Issue_Tracker.md development-archive/ -ErrorAction SilentlyContinue
Move-Item TIMELINE_EVENTS_ISSUE_TRACKER.md development-archive/ -ErrorAction SilentlyContinue
Move-Item PROCESS_*_FIX_*.md development-archive/ -ErrorAction SilentlyContinue
Move-Item PROCESSMODAL_*.md development-archive/ -ErrorAction SilentlyContinue
Move-Item CREATE_PROCESS_MODAL_*.md development-archive/ -ErrorAction SilentlyContinue

# Archive status reports directory
Move-Item status-reports/ development-archive/ -ErrorAction SilentlyContinue

# Archive legacy code
Move-Item Origin/ development-archive/ -ErrorAction SilentlyContinue

# Archive secondary documentation
Move-Item ai-chat-examples.md development-archive/ -ErrorAction SilentlyContinue
Move-Item test-ai-chat.md development-archive/ -ErrorAction SilentlyContinue
Move-Item DATABASE_SERVER_GUIDE.md development-archive/ -ErrorAction SilentlyContinue
Move-Item Database_Details.md development-archive/ -ErrorAction SilentlyContinue
```

#### Task 1.3: Verify Essential Documentation Remains
```powershell
# Verify these 8 essential files are still in root:
Get-ChildItem -Name "README.md", "FINAL_PROJECT_STATUS_SUMMARY.md", "DATABASE_CONNECTION_GUIDE.md", "GITHUB_SETUP.md", "PROCESS_TIMELINE_FIX_COMPLETION_REPORT.md", "MIGRATION_GUIDE.md", "DOCUMENT_UPLOAD_FUNCTIONALITY_GUIDE.md", "FINAL_COMPLETION_REPORT_MAY28.md" | ForEach-Object { if (Test-Path $_) { Write-Host "✅ $_" -ForegroundColor Green } else { Write-Host "❌ $_ MISSING!" -ForegroundColor Red } }
```

### Phase 2: Development Files Cleanup (10 minutes)

#### Task 2.1: Remove Debug Scripts
```powershell
# Remove debug scripts
Remove-Item debug-*.js -Force -ErrorAction SilentlyContinue
Remove-Item debug-*.mjs -Force -ErrorAction SilentlyContinue
Remove-Item *debug*.js -Force -ErrorAction SilentlyContinue
Write-Host "✅ Debug scripts removed" -ForegroundColor Green
```

#### Task 2.2: Remove Test Files
```powershell
# Remove test scripts
Remove-Item test-*.js -Force -ErrorAction SilentlyContinue
Remove-Item test-*.mjs -Force -ErrorAction SilentlyContinue
Remove-Item test-*.ts -Force -ErrorAction SilentlyContinue
Remove-Item test-*.py -Force -ErrorAction SilentlyContinue
Remove-Item test-*.cjs -Force -ErrorAction SilentlyContinue
Remove-Item *test*.js -Force -ErrorAction SilentlyContinue
Write-Host "✅ Test scripts removed" -ForegroundColor Green
```

#### Task 2.3: Remove Check/Validation Scripts
```powershell
# Remove database check scripts
Remove-Item check-*.js -Force -ErrorAction SilentlyContinue
Remove-Item check-*.mjs -Force -ErrorAction SilentlyContinue
Remove-Item check_*.js -Force -ErrorAction SilentlyContinue
Remove-Item verify-*.js -Force -ErrorAction SilentlyContinue
Remove-Item verify-*.mjs -Force -ErrorAction SilentlyContinue
Remove-Item verbose-*.mjs -Force -ErrorAction SilentlyContinue
Write-Host "✅ Check/validation scripts removed" -ForegroundColor Green
```

#### Task 2.4: Remove Migration Scripts
```powershell
# Remove database migration scripts
Remove-Item add-soft-delete-*.* -Force -ErrorAction SilentlyContinue
Remove-Item create-*.sql -Force -ErrorAction SilentlyContinue
Remove-Item create-*.js -Force -ErrorAction SilentlyContinue
Remove-Item migrate-*.* -Force -ErrorAction SilentlyContinue
Remove-Item MIGRATE_*.sql -Force -ErrorAction SilentlyContinue
Remove-Item run-migration.js -Force -ErrorAction SilentlyContinue
Write-Host "✅ Migration scripts removed" -ForegroundColor Green
```

#### Task 2.5: Remove Fix & Service Scripts
```powershell
# Remove fix and service scripts
Remove-Item *fix*.js -Force -ErrorAction SilentlyContinue
Remove-Item *fix*.mjs -Force -ErrorAction SilentlyContinue
Remove-Item final-*.js -Force -ErrorAction SilentlyContinue
Remove-Item comprehensive-*.js -Force -ErrorAction SilentlyContinue
Remove-Item comprehensive-*.mjs -Force -ErrorAction SilentlyContinue
Remove-Item install-*.js -Force -ErrorAction SilentlyContinue
Remove-Item timeline-event-fix.js -Force -ErrorAction SilentlyContinue
Write-Host "✅ Fix/service scripts removed" -ForegroundColor Green
```

#### Task 2.6: Remove Development Tools
```powershell
# Remove development tools
Remove-Item create-test-*.js -Force -ErrorAction SilentlyContinue
Remove-Item multiple-*.js -Force -ErrorAction SilentlyContinue
Remove-Item process-*.js -Force -ErrorAction SilentlyContinue
Remove-Item server-manager.js -Force -ErrorAction SilentlyContinue
Remove-Item setup-*.js -Force -ErrorAction SilentlyContinue
Remove-Item task-*.js -Force -ErrorAction SilentlyContinue
Remove-Item task3a-*.js -Force -ErrorAction SilentlyContinue
Remove-Item validate-*.js -Force -ErrorAction SilentlyContinue
Remove-Item direct-*.js -Force -ErrorAction SilentlyContinue
Remove-Item direct-*.mjs -Force -ErrorAction SilentlyContinue
Remove-Item get-*.mjs -Force -ErrorAction SilentlyContinue
Remove-Item quick-*.js -Force -ErrorAction SilentlyContinue
Remove-Item quick-*.mjs -Force -ErrorAction SilentlyContinue
Remove-Item simple-*.js -Force -ErrorAction SilentlyContinue
Remove-Item simple-*.mjs -Force -ErrorAction SilentlyContinue
Write-Host "✅ Development tools removed" -ForegroundColor Green
```

#### Task 2.7: Remove PowerShell Scripts & HTML Files
```powershell
# Remove PowerShell test scripts
Remove-Item *.ps1 -Force -ErrorAction SilentlyContinue

# Remove HTML test files
Remove-Item test-*.html -Force -ErrorAction SilentlyContinue
Remove-Item team-creation-debug.html -Force -ErrorAction SilentlyContinue
Remove-Item react-query-test.html -Force -ErrorAction SilentlyContinue
Write-Host "✅ PowerShell scripts and HTML test files removed" -ForegroundColor Green
```

#### Task 2.8: Remove Test Data Files
```powershell
# Remove test data files
Remove-Item test-*.json -Force -ErrorAction SilentlyContinue
Remove-Item *test*.json -Force -ErrorAction SilentlyContinue
Remove-Item simple-process.json -Force -ErrorAction SilentlyContinue
Remove-Item process-data.json -Force -ErrorAction SilentlyContinue
Write-Host "✅ Test data files removed" -ForegroundColor Green
```

#### Task 2.9: Remove Backup & Log Files
```powershell
# Remove backup files
Remove-Item *.bak -Force -ErrorAction SilentlyContinue
Remove-Item *.backup -Force -ErrorAction SilentlyContinue
Remove-Item *.new -Force -ErrorAction SilentlyContinue
Remove-Item server/storage_new_backup.ts -Force -ErrorAction SilentlyContinue
Remove-Item server/storage_new_backup.ts.bak -Force -ErrorAction SilentlyContinue
Remove-Item client/src/pages/AIChat.tsx.bak -Force -ErrorAction SilentlyContinue
Remove-Item client/src/pages/AIChat.tsx.backup -Force -ErrorAction SilentlyContinue

# Remove log files
Remove-Item server-logs.txt -Force -ErrorAction SilentlyContinue
Remove-Item cookies.txt -Force -ErrorAction SilentlyContinue
Remove-Item debug-output.txt -Force -ErrorAction SilentlyContinue
Write-Host "✅ Backup and log files removed" -ForegroundColor Green
```

#### Task 2.10: Remove Development Directory
```powershell
# Remove opencodetmp directory if it exists
Remove-Item opencodetmp/ -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "✅ Development directories removed" -ForegroundColor Green
```

### Phase 3: Verification & Testing (10 minutes)

#### Task 3.1: Verify Essential Files Remain
```powershell
Write-Host "`n📋 Verifying Essential Production Files..." -ForegroundColor Yellow

# Check essential directories
$essentialDirs = @("client/", "server/", "shared/", "drizzle/", "node_modules/", "dist/")
foreach ($dir in $essentialDirs) {
    if (Test-Path $dir) {
        Write-Host "✅ $dir" -ForegroundColor Green
    } else {
        Write-Host "❌ $dir MISSING!" -ForegroundColor Red
    }
}

# Check essential configuration files
$essentialFiles = @(
    "package.json", "package-lock.json", ".env", "vite.config.ts", 
    "tailwind.config.ts", "postcss.config.js", "tsconfig.json", 
    "components.json", "drizzle.config.ts", ".gitignore"
)
foreach ($file in $essentialFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file" -ForegroundColor Green
    } else {
        Write-Host "❌ $file MISSING!" -ForegroundColor Red
    }
}

# Check essential documentation
$essentialDocs = @(
    "README.md", "FINAL_PROJECT_STATUS_SUMMARY.md", "DATABASE_CONNECTION_GUIDE.md",
    "GITHUB_SETUP.md", "PROCESS_TIMELINE_FIX_COMPLETION_REPORT.md", "MIGRATION_GUIDE.md",
    "DOCUMENT_UPLOAD_FUNCTIONALITY_GUIDE.md", "FINAL_COMPLETION_REPORT_MAY28.md"
)
foreach ($doc in $essentialDocs) {
    if (Test-Path $doc) {
        Write-Host "✅ $doc" -ForegroundColor Green
    } else {
        Write-Host "❌ $doc MISSING!" -ForegroundColor Red
    }
}
```

#### Task 3.2: Count Remaining Files
```powershell
Write-Host "`n📊 File Count Summary:" -ForegroundColor Yellow
$totalFiles = (Get-ChildItem -Recurse -File | Measure-Object).Count
$devArchiveFiles = (Get-ChildItem development-archive/ -Recurse -File | Measure-Object).Count
Write-Host "Total files remaining: $totalFiles" -ForegroundColor Cyan
Write-Host "Files archived: $devArchiveFiles" -ForegroundColor Cyan
Write-Host "Estimated space reduction: 70-85%" -ForegroundColor Green
```

#### Task 3.3: Test Application Start
```powershell
Write-Host "`n🚀 Testing Application..." -ForegroundColor Yellow
Write-Host "Starting Sales Dashboard to verify functionality..." -ForegroundColor Cyan
# Note: This will start the application - stop it after verifying it loads correctly
```

#### Task 3.4: Final Security Check
```powershell
Write-Host "`n🔒 Security Check..." -ForegroundColor Yellow

# Check for remaining sensitive files
$sensitivePatterns = @("*.log", "*debug*", "*test*", "*.bak", "*.tmp")
$foundSensitive = $false
foreach ($pattern in $sensitivePatterns) {
    $files = Get-ChildItem $pattern -Recurse -ErrorAction SilentlyContinue
    if ($files) {
        Write-Host "⚠️ Found sensitive files: $($files.Name -join ', ')" -ForegroundColor Yellow
        $foundSensitive = $true
    }
}

if (-not $foundSensitive) {
    Write-Host "✅ No sensitive development files found" -ForegroundColor Green
}
```

## 📋 Post-Cleanup Tasks

### Task 4.1: Update .gitignore (if needed)
```powershell
# Add development-archive to .gitignore if not already present
$gitignoreContent = Get-Content .gitignore -Raw -ErrorAction SilentlyContinue
if ($gitignoreContent -notlike "*development-archive*") {
    Add-Content .gitignore "`n# Development archive`ndevelopment-archive/"
    Write-Host "✅ Updated .gitignore" -ForegroundColor Green
}
```

### Task 4.2: Update README.md (Optional)
```text
Consider updating README.md to:
1. Remove references to development files
2. Add note about development-archive folder
3. Update setup instructions for production
```

### Task 4.3: Create Deployment Notes
```powershell
# Create deployment completion note
@"
# Production Deployment Cleanup Completed

**Date**: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
**Files Removed**: ~250+ development files
**Files Archived**: Development documentation moved to development-archive/
**Space Reduction**: Approximately 70-85%

## What Was Removed:
- Debug scripts (debug-*.js, debug-*.mjs)
- Test files (test-*.js, test-*.mjs, test-*.py, etc.)
- Database check/validation scripts (check-*.js, verify-*.mjs)
- Migration scripts (create-*.sql, migrate-*.*)
- Development tools and utilities
- PowerShell test scripts (*.ps1)
- HTML test files (*.html)
- Test data files (test-*.json)
- Backup files (*.bak, *.backup)
- Log files (server-logs.txt, debug-output.txt)

## What Was Archived:
- Development documentation moved to development-archive/
- Legacy code (Origin/ directory)
- Project management documents
- Bug fix and issue tracking documents

## Essential Files Retained:
- All production application files
- 8 critical documentation files
- Configuration files
- Database schema files

**Status**: ✅ Ready for Production Deployment
"@ | Out-File "DEPLOYMENT_CLEANUP_COMPLETED.md" -Encoding UTF8

Write-Host "✅ Deployment notes created: DEPLOYMENT_CLEANUP_COMPLETED.md" -ForegroundColor Green
```

## 🎯 Success Criteria

- [ ] Development-archive directory created with 40+ documentation files
- [ ] ~250+ development files removed from root directory
- [ ] 8 essential documentation files remain in root
- [ ] All production application files remain intact
- [ ] Application starts and loads correctly
- [ ] No sensitive development data remains
- [ ] Space reduction of 70-85% achieved
- [ ] Security check passes

## ⚠️ Rollback Plan

If issues occur during cleanup:

1. **Stop immediately** if application fails to start
2. **Restore from backup** if needed
3. **Check development-archive/** for any accidentally moved essential files
4. **Verify .env file** and other critical configurations remain

## 📞 Support

- Reference: [`Ok_TO_DELETE_BEFORE_LAUNCH.MD`](Ok_TO_DELETE_BEFORE_LAUNCH.MD)
- Essential documentation remains in root directory
- Development documentation archived in `development-archive/`
- Contact system administrator if issues arise

---

**Next Step**: Execute this task list systematically, testing after each phase.
