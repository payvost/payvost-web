#!/usr/bin/env pwsh

<#
.SYNOPSIS
Test all Mailgun email templates for Payvost

.DESCRIPTION
Sends test emails for each Mailgun template to verify they are working correctly.

.PARAMETER Email
The recipient email address for all test emails

.PARAMETER Delay
Delay in seconds between each email (to avoid rate limiting)

.EXAMPLE
.\test-all-templates.ps1 -Email "kehinde504@gmail.com"
.\test-all-templates.ps1 -Email "kehinde504@gmail.com" -Delay 2
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$Email,
    
    [Parameter(Mandatory=$false)]
    [int]$Delay = 1
)

# Configuration
$ApiUrl = "http://localhost:3001"
$NotificationUrl = "http://localhost:3006"

# Colors
$Green = "`e[32m"
$Red = "`e[31m"
$Yellow = "`e[33m"
$Blue = "`e[34m"
$Cyan = "`e[36m"
$Reset = "`e[0m"

# Test templates
$Templates = @(
    @{
        Name = "invoice-reminder"
        Endpoint = "$NotificationUrl/send"
        Body = @{
            email = $Email
            subject = "Invoice Reminder: INV-2025-001"
            template = "invoice-reminder"
            variables = @{
                invoiceNumber = "INV-2025-001"
                amount = "1000.00"
                currency = "USD"
                dueDate = "2025-12-31"
                customerName = "Test Customer"
            }
        }
        Description = "Invoice reminder email"
    },
    @{
        Name = "login-notification"
        Endpoint = "$ApiUrl/notification/send"
        Body = @{
            email = $Email
            subject = "Login Notification - New Device"
            template = "login_notification"
            variables = @{
                name = "Test User"
                device = "Windows - PowerShell"
                timestamp = (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
                ipAddress = "192.168.1.1"
            }
        }
        Description = "Login notification for new device"
    },
    @{
        Name = "transaction-success"
        Endpoint = "$ApiUrl/notification/send"
        Body = @{
            email = $Email
            subject = "Transaction Successful - Transfer Completed"
            template = "transaction_success"
            variables = @{
                name = "Test User"
                currency = "USD"
                amount = "500.00"
                recipient = "recipient@example.com"
                date = (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
                transactionId = "TXN-2025-001"
            }
        }
        Description = "Transaction success confirmation"
    },
    @{
        Name = "kyc-approved"
        Endpoint = "$ApiUrl/notification/send"
        Body = @{
            email = $Email
            subject = "Account Verified - KYC Approved"
            template = "kyc_verified"
            variables = @{
                name = "Test User"
            }
        }
        Description = "KYC verification approval"
    },
    @{
        Name = "rate-alert"
        Endpoint = "$ApiUrl/notification/send"
        Body = @{
            email = $Email
            subject = "Currency Rate Alert - USD/NGN"
            template = "rate_alert"
            variables = @{
                currency1 = "USD"
                currency2 = "NGN"
                rate = "1524.50"
                change = "+2.5%"
                timestamp = (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
            }
        }
        Description = "Currency rate alert notification"
    }
)

Write-Host ""
Write-Host "${Cyan}================================${Reset}"
Write-Host "${Cyan}Email Template Test Suite${Reset}"
Write-Host "${Cyan}================================${Reset}"
Write-Host ""
Write-Host "Testing recipient: ${Yellow}$Email${Reset}"
Write-Host "Delay between emails: ${Blue}${Delay}s${Reset}"
Write-Host ""

$SuccessCount = 0
$FailureCount = 0

for ($i = 0; $i -lt $Templates.Count; $i++) {
    $Template = $Templates[$i]
    $Number = $i + 1
    
    Write-Host "${Blue}[$Number/$($Templates.Count)]${Reset} Testing: ${Cyan}$($Template.Name)${Reset}"
    Write-Host "  Description: $($Template.Description)"
    Write-Host "  Endpoint: $($Template.Endpoint)"
    
    try {
        $Response = Invoke-WebRequest -Uri $Template.Endpoint `
            -Method Post `
            -ContentType "application/json" `
            -Body ($Template.Body | ConvertTo-Json -Depth 10) `
            -ErrorAction Stop
        
        if ($Response.StatusCode -eq 200) {
            Write-Host "  ${Green}✅ SUCCESS${Reset} - Email queued for delivery"
            $SuccessCount++
        } else {
            Write-Host "  ${Red}❌ FAILED${Reset} - HTTP $($Response.StatusCode)"
            $FailureCount++
        }
    } catch {
        Write-Host "  ${Red}❌ ERROR${Reset} - $($_.Exception.Message)"
        $FailureCount++
    }
    
    # Add delay between requests
    if ($i -lt $Templates.Count - 1) {
        Write-Host "  Waiting ${Blue}${Delay}s${Reset} before next test..."
        Start-Sleep -Seconds $Delay
    }
    
    Write-Host ""
}

# Summary
Write-Host "${Cyan}================================${Reset}"
Write-Host "${Cyan}Test Summary${Reset}"
Write-Host "${Cyan}================================${Reset}"
Write-Host ""
Write-Host "Total Tests: $($Templates.Count)"
Write-Host "${Green}Successful: $SuccessCount${Reset}"
Write-Host "${Red}Failed: $FailureCount${Reset}"
Write-Host ""

if ($FailureCount -eq 0) {
    Write-Host "${Green}✅ All templates tested successfully!${Reset}"
    Write-Host ""
    Write-Host "${Yellow}Next Steps:${Reset}"
    Write-Host "1. Check $Email inbox for $($Templates.Count) emails"
    Write-Host "2. Verify each email looks correct"
    Write-Host "3. Check Mailgun dashboard for delivery status: https://app.mailgun.com"
    Write-Host ""
} else {
    Write-Host "${Red}❌ Some templates failed. Check the errors above.${Reset}"
    Write-Host ""
    Write-Host "${Yellow}Troubleshooting:${Reset}"
    Write-Host "1. Verify backend is running on $ApiUrl"
    Write-Host "2. Verify notification-processor is running on $NotificationUrl"
    Write-Host "3. Check environment variables (MAILGUN_API_KEY, MAILGUN_DOMAIN)"
    Write-Host "4. Review error messages above"
    Write-Host ""
}

Write-Host ""
