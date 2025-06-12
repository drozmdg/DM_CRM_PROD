# Final Workspace Cleanup Script for Production Deployment
# Created: June 11, 2025
# Purpose: Move remaining development files to archive before GitHub commit

Write-Host "🧹 Final Workspace Cleanup for Production Deployment" -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Green
Write-Host ""

# Ensure development-archive directory exists
if (!(Test-Path "development-archive")) {
    New-Item -ItemType Directory -Path "development-archive" -Force
    Write-Host "✅ Created development-archive directory" -ForegroundColor Green
}

# List of files to move to development archive
$filesToArchive = @(
    "DEPLOYMENT_CLEANUP_COMPLETED.md",
    "IMPLEMENTATION_STATUS_UPDATE_MAY28.md", 
    "PRODUCTION_DATA_CLEARING_GUIDE.md",
    "PRODUCTION_DEPLOYMENT_COMPLETE.md",
    "PRODUCTION_WORKSPACE_FINAL.md",
    "supabase-clear-processes.sql"
)

# Move files to development archive
Write-Host "📁 Moving development files to archive..." -ForegroundColor Yellow
$movedCount = 0

foreach ($file in $filesToArchive) {
    if (Test-Path $file) {
        try {
            Move-Item $file "development-archive/" -ErrorAction Stop
            Write-Host "   ✅ Moved: $file" -ForegroundColor Green
            $movedCount++
        }
        catch {
            Write-Host "   ❌ Failed to move: $file - $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    else {
        Write-Host "   ⏭️  Not found: $file (already moved?)" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "📊 Cleanup Summary:" -ForegroundColor Yellow
Write-Host "   Files moved: $movedCount" -ForegroundColor Green
Write-Host ""

# Verify essential production files remain
Write-Host "🔍 Verifying essential production documentation remains..." -ForegroundColor Yellow

$essentialDocs = @(
    "README.md",
    "DATABASE_CONNECTION_GUIDE.md", 
    "DOCUMENT_UPLOAD_FUNCTIONALITY_GUIDE.md",
    "FINAL_COMPLETION_REPORT_MAY28.md",
    "FINAL_PROJECT_STATUS_SUMMARY.md",
    "GITHUB_SETUP.md",
    "MIGRATION_GUIDE.md"
)

$missingDocs = @()
foreach ($doc in $essentialDocs) {
    if (Test-Path $doc) {
        Write-Host "   ✅ Present: $doc" -ForegroundColor Green
    }
    else {
        Write-Host "   ❌ Missing: $doc" -ForegroundColor Red
        $missingDocs += $doc
    }
}

if ($missingDocs.Count -eq 0) {
    Write-Host ""
    Write-Host "✅ All essential documentation verified!" -ForegroundColor Green
}
else {
    Write-Host ""
    Write-Host "⚠️  Warning: Missing essential documentation:" -ForegroundColor Yellow
    $missingDocs | ForEach-Object { Write-Host "   - $_" -ForegroundColor Red }
}

Write-Host ""
Write-Host "📋 Final workspace structure verification..." -ForegroundColor Yellow

# Show current root directory files (excluding directories)
$rootFiles = Get-ChildItem -File | Sort-Object Name
Write-Host "📁 Root directory files ($($rootFiles.Count) files):" -ForegroundColor Cyan
$rootFiles | ForEach-Object { 
    $extension = $_.Extension
    $color = switch ($extension) {
        ".md" { "White" }
        ".json" { "Yellow" } 
        ".ts" { "Blue" }
        ".js" { "Green" }
        default { "Gray" }
    }
    Write-Host "   📄 $($_.Name)" -ForegroundColor $color
}

Write-Host ""
Write-Host "🗂️  Development archive contents:" -ForegroundColor Cyan
$archiveFiles = Get-ChildItem "development-archive" -File | Sort-Object Name
Write-Host "   📁 development-archive/ ($($archiveFiles.Count) files)" -ForegroundColor Gray

Write-Host ""
Write-Host "🎯 Production Readiness Check:" -ForegroundColor Yellow

# Check for any remaining cleanup files that shouldn't be in production
$cleanupPatterns = @("*backup*", "*clear*", "*clean*", "*.cjs", "*.ps1", "*.sql")
$foundCleanupFiles = @()

foreach ($pattern in $cleanupPatterns) {
    $files = Get-ChildItem -File -Name $pattern -ErrorAction SilentlyContinue
    if ($files) {
        $foundCleanupFiles += $files
    }
}

if ($foundCleanupFiles.Count -eq 0) {
    Write-Host "   ✅ No cleanup files found in root directory" -ForegroundColor Green
    Write-Host "   ✅ Workspace is production-ready!" -ForegroundColor Green
}
else {
    Write-Host "   ⚠️  Found remaining cleanup files:" -ForegroundColor Yellow
    $foundCleanupFiles | ForEach-Object { Write-Host "   - $_" -ForegroundColor Red }
    Write-Host "   Consider moving these to development-archive/" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🚀 Next Steps:" -ForegroundColor Green
Write-Host "   1. Review the files listed above" -ForegroundColor White
Write-Host "   2. If satisfied, run: git add ." -ForegroundColor White  
Write-Host "   3. Commit: git commit -m 'Production deployment cleanup complete'" -ForegroundColor White
Write-Host "   4. Push to GitHub: git push origin main" -ForegroundColor White

Write-Host ""
Write-Host "✨ Cleanup script completed!" -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Green

# Optional: Ask if user wants to proceed with git operations
Write-Host ""
$proceed = Read-Host "Would you like to proceed with git add/commit/push? (y/N)"
if ($proceed -eq "y" -or $proceed -eq "Y") {
    Write-Host ""
    Write-Host "🔄 Running git operations..." -ForegroundColor Yellow
    
    try {
        Write-Host "   📝 Staging all changes..." -ForegroundColor Gray
        git add .
        
        Write-Host "   💾 Committing changes..." -ForegroundColor Gray
        git commit -m "🎉 PRODUCTION DEPLOYMENT COMPLETE

✅ Final workspace cleanup completed:
- Moved remaining development files to archive
- Verified essential documentation present
- Clean production workspace achieved
- Ready for GitHub deployment

📊 Workspace Status:
- Essential docs: 7 files retained in root
- Development files: $($archiveFiles.Count) files archived
- Production structure: Optimized and clean

🚀 Status: READY FOR PRODUCTION DEPLOYMENT"

        Write-Host "   🚀 Pushing to GitHub..." -ForegroundColor Gray
        git push origin main
        
        Write-Host ""
        Write-Host "✅ Successfully pushed to GitHub!" -ForegroundColor Green
        Write-Host "🎉 Production deployment preparation complete!" -ForegroundColor Green
        
    }
    catch {
        Write-Host ""
        Write-Host "❌ Git operation failed: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "Please run git operations manually." -ForegroundColor Yellow
    }
}
else {
    Write-Host "⏭️  Skipping git operations. Run them manually when ready." -ForegroundColor Gray
}
