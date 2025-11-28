# PowerShell script to generate Android Keystore for EAS Build
# Run with: .\scripts\generate-keystore.ps1

$packageName = "com.payvost.payvost"
$keystorePath = "payvost-release.jks"
$keyAlias = "upload"

Write-Host "🔐 Android Keystore Generator for EAS Build" -ForegroundColor Cyan
Write-Host ""

# Check if keystore already exists
if (Test-Path $keystorePath) {
    $overwrite = Read-Host "⚠️  Keystore already exists. Overwrite? (y/N)"
    if ($overwrite -ne "y") {
        Write-Host "Cancelled." -ForegroundColor Yellow
        exit
    }
}

# Get passwords
$keystorePassword = Read-Host "Enter keystore password (min 6 chars)" -AsSecureString
$keystorePasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($keystorePassword))

if ($keystorePasswordPlain.Length -lt 6) {
    Write-Host "❌ Password must be at least 6 characters" -ForegroundColor Red
    exit 1
}

$keyPasswordInput = Read-Host "Enter key password (press Enter to use same as keystore)" -AsSecureString
$keyPassword = if ($keyPasswordInput.Length -eq 0) { $keystorePasswordPlain } else { 
    [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($keyPasswordInput))
}

Write-Host ""
Write-Host "📦 Generating keystore..." -ForegroundColor Cyan
Write-Host "   Package: $packageName"
Write-Host "   Alias: $keyAlias"
Write-Host "   File: $keystorePath"
Write-Host ""

# Generate keystore
$dname = "CN=$packageName, OU=Mobile, O=Payvost, L=Unknown, ST=Unknown, C=US"

# Use & to properly invoke keytool with quoted arguments
& keytool -genkeypair `
    -v `
    -storetype PKCS12 `
    -keystore $keystorePath `
    -alias $keyAlias `
    -keyalg RSA `
    -keysize 2048 `
    -validity 10000 `
    -storepass $keystorePasswordPlain `
    -keypass $keyPassword `
    -dname "$dname"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Keystore generated successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 IMPORTANT - Save these credentials securely:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   Keystore File: $keystorePath"
    Write-Host "   Keystore Password: $keystorePasswordPlain"
    Write-Host "   Key Alias: $keyAlias"
    Write-Host "   Key Password: $keyPassword"
    Write-Host ""
    Write-Host "⚠️  This file is already in .gitignore and will NOT be committed to git." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📤 Next steps:"
    Write-Host "   1. Upload the keystore file to EAS dashboard"
    Write-Host "   2. Enter the passwords when prompted"
    Write-Host ""
} else {
    Write-Host "❌ Error generating keystore" -ForegroundColor Red
    exit 1
}

