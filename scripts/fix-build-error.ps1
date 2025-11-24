# PowerShell script to fix build errors
# This clears Next.js cache and rebuilds the application

Write-Host "🧹 Cleaning Next.js cache and build artifacts..." -ForegroundColor Cyan

# Remove Next.js cache
if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next"
    Write-Host "✅ Removed .next directory" -ForegroundColor Green
}

# Remove node_modules/.cache if it exists
if (Test-Path "node_modules\.cache") {
    Remove-Item -Recurse -Force "node_modules\.cache"
    Write-Host "✅ Removed node_modules/.cache" -ForegroundColor Green
}

# Remove TypeScript build info
if (Test-Path "tsconfig.tsbuildinfo") {
    Remove-Item -Force "tsconfig.tsbuildinfo"
    Write-Host "✅ Removed tsconfig.tsbuildinfo" -ForegroundColor Green
}

# Install dependencies to ensure @next/swc is available
Write-Host "📦 Installing dependencies..." -ForegroundColor Cyan
npm install

Write-Host "✅ Cache cleared. Now rebuilding..." -ForegroundColor Cyan

# Rebuild the application
npm run build

Write-Host "✅ Build complete!" -ForegroundColor Green

