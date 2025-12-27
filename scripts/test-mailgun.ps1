<#
.SYNOPSIS
Mailgun Test Script - Verify email delivery configuration
.DESCRIPTION
Tests if Mailgun is properly configured by sending a test email
.PARAMETER Email
The email address to send the test email to
.PARAMETER Token
Optional Firebase authentication token
.PARAMETER ApiUrl
Backend API URL (default: http://localhost:3001)
.EXAMPLE
.\test-mailgun.ps1 -Email "test@example.com"
.\test-mailgun.ps1 -Email "test@example.com" -Token "your_firebase_token"
.\test-mailgun.ps1 -Email "test@example.com" -ApiUrl "http://localhost:3001"
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$Email,
    
    [Parameter(Mandatory=$false)]
    [string]$Token,
    
    [Parameter(Mandatory=$false)]
    [string]$ApiUrl = "http://localhost:3001"
)

# Color functions
function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Yellow
}

# Validate email format
function Test-EmailFormat {
    param([string]$Email)
    $pattern = "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    return $Email -match $pattern
}

# Main script
Write-Host ""
Write-Info "Testing Mailgun Configuration"
Write-Host "================================" -ForegroundColor Gray
Write-Host ""

# Validate email
if (-not (Test-EmailFormat $Email)) {
    Write-Error-Custom "Invalid email format: $Email"
    exit 1
}

Write-Host "API URL: $ApiUrl" -ForegroundColor Gray
Write-Host "Test Email: $Email" -ForegroundColor Gray
if ($Token) {
    Write-Host "Firebase Token: $($Token.Substring(0, [Math]::Min(20, $Token.Length)))..." -ForegroundColor Gray
}
Write-Host ""

# Check API connectivity
Write-Info "Checking API connectivity..."
try {
    $healthCheck = Invoke-WebRequest -Uri "$ApiUrl/health" -Method Get -ErrorAction Stop
    Write-Success "API is reachable"
}
catch {
    Write-Error-Custom "Cannot reach API at $ApiUrl"
    Write-Host "Make sure the backend is running." -ForegroundColor Gray
    exit 1
}

Write-Host ""

# Prepare headers
$headers = @{
    "Content-Type" = "application/json"
}

if ($Token) {
    $headers["Authorization"] = "Bearer $Token"
}

# URL encode email
$encodedEmail = [System.Web.HttpUtility]::UrlEncode($Email)

# Send test request
Write-Info "Sending test email to $Email..."
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri "$ApiUrl/api/test/mailgun?email=$encodedEmail" `
        -Method Post `
        -Headers $headers `
        -ErrorAction Stop
    
    Write-Success "Test email sent successfully!"
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Gray
    
    $content = $response.Content | ConvertFrom-Json
    Write-Host ($content | ConvertTo-Json -Depth 10) -ForegroundColor Cyan
    
    Write-Host ""
    Write-Info "Check your email inbox (may take a few seconds)"
    Write-Host "Mailgun Dashboard: https://app.mailgun.com/app/sending/domain"
    exit 0
}
catch {
    $statusCode = $_.Exception.Response.StatusCode.Value__
    $responseBody = $_.Exception.Response.Content.ReadAsStream() | ForEach-Object { [System.IO.StreamReader]::new($_).ReadToEnd() }
    
    Write-Error-Custom "Request failed (HTTP $statusCode)"
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Gray
    
    try {
        $parsedResponse = $responseBody | ConvertFrom-Json
        Write-Host ($parsedResponse | ConvertTo-Json -Depth 10) -ForegroundColor Cyan
    }
    catch {
        Write-Host $responseBody -ForegroundColor Cyan
    }
    
    Write-Host ""
    
    if ($statusCode -eq 400) {
        Write-Error-Custom "Bad request - check email format"
    }
    elseif ($statusCode -eq 401) {
        Write-Error-Custom "Unauthorized - Invalid or missing Firebase token"
        Write-Host "Usage: .\test-mailgun.ps1 -Email '$Email' -Token 'YOUR_FIREBASE_TOKEN'" -ForegroundColor Gray
    }
    elseif ($statusCode -eq 500) {
        Write-Error-Custom "Server error - Mailgun may not be configured"
        Write-Info "Check that these environment variables are set:"
        Write-Host "  - MAILGUN_API_KEY" -ForegroundColor Gray
        Write-Host "  - MAILGUN_DOMAIN" -ForegroundColor Gray
        Write-Host "  - MAILGUN_FROM_EMAIL" -ForegroundColor Gray
    }
    
    exit 1
}
