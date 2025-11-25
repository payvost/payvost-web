# Mailgun Templates Setup Guide

This guide explains how to set up Mailgun templates for the rate alert system.

## Templates Required

You need to create **2 templates** in your Mailgun dashboard:

1. **rate-alert** - For FX rate alert notifications
2. **daily-rate-summary** - For daily FX rate summary emails

## Setup Instructions

### 1. Access Mailgun Templates

1. Log in to [Mailgun Dashboard](https://app.mailgun.com)
2. Navigate to **Sending** → **Templates**
3. Click **"Create Template"**

### 2. Create "rate-alert" Template

**Template Name:** `rate-alert`

**Variables Required:**
- `sourceCurrency` - Source currency code (e.g., USD)
- `targetCurrency` - Target currency code (e.g., EUR)
- `currentRate` - Current exchange rate
- `targetRate` - Target rate that was set
- `userName` - User's name (optional, can be empty)

**HTML Template:**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FX Rate Alert - Payvost</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 30px 30px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">🎯 Rate Alert Triggered!</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 30px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                %recipient.name%,
              </p>
              
              <p style="margin: 0 0 30px; color: #333333; font-size: 16px; line-height: 1.6;">
                Great news! Your FX rate alert has been triggered. The exchange rate you were waiting for has been reached.
              </p>
              
              <!-- Rate Card -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 0 0 30px;">
                <tr>
                  <td style="padding: 15px; text-align: center;">
                    <div style="font-size: 14px; color: #666666; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Currency Pair</div>
                    <div style="font-size: 28px; font-weight: 700; color: #667eea; margin-bottom: 20px;">
                      %v:sourceCurrency% / %v:targetCurrency%
                    </div>
                    
                    <table role="presentation" style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                      <tr>
                        <td style="padding: 10px; text-align: left; width: 50%;">
                          <div style="font-size: 12px; color: #666666; margin-bottom: 5px;">Current Rate</div>
                          <div style="font-size: 20px; font-weight: 600; color: #10b981;">%v:currentRate%</div>
                        </td>
                        <td style="padding: 10px; text-align: right; width: 50%;">
                          <div style="font-size: 12px; color: #666666; margin-bottom: 5px;">Target Rate</div>
                          <div style="font-size: 20px; font-weight: 600; color: #667eea;">%v:targetRate%</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                The rate for <strong>%v:sourceCurrency% to %v:targetCurrency%</strong> is now <strong>%v:currentRate%</strong>, which meets your target of <strong>%v:targetRate%</strong>.
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                <tr>
                  <td align="center" style="padding: 0;">
                    <a href="https://payvost.com/fx-rates" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">View Exchange Rates</a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 0; color: #666666; font-size: 14px; line-height: 1.6;">
                This alert has been automatically deactivated. You can set up a new alert anytime from your FX Rates page.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0 0 10px; color: #666666; font-size: 12px;">
                This is an automated notification from Payvost.
              </p>
              <p style="margin: 0; color: #999999; font-size: 11px;">
                © 2024 Payvost. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

### 3. Create "daily-rate-summary" Template

**Template Name:** `daily-rate-summary`

**Variables Required:**
- `userName` - User's name (optional, can be empty)
- `date` - Formatted date (e.g., "Monday, January 15, 2024")
- `rates` - Pre-generated HTML table rows with rates

**HTML Template:**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Daily FX Rate Summary - Payvost</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5; padding: 20px;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 30px 30px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">📊 Daily FX Rate Summary</h1>
              <p style="margin: 10px 0 0; color: #ffffff; font-size: 14px; opacity: 0.9;">%v:date%</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 30px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                %recipient.name%,
              </p>
              
              <p style="margin: 0 0 30px; color: #333333; font-size: 16px; line-height: 1.6;">
                Here's your daily summary of foreign exchange rates. Stay informed about the latest market movements.
              </p>
              
              <!-- Rates Table -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin: 0 0 30px;">
                <thead>
                  <tr style="background-color: #f8f9fa;">
                    <th style="padding: 12px; text-align: left; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Currency Pair</th>
                    <th style="padding: 12px; text-align: right; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Rate</th>
                    <th style="padding: 12px; text-align: right; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">24h Change</th>
                  </tr>
                </thead>
                <tbody>
                  %v:rates%
                </tbody>
              </table>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                <tr>
                  <td align="center" style="padding: 0;">
                    <a href="https://payvost.com/fx-rates" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">View All Rates</a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 0; color: #666666; font-size: 14px; line-height: 1.6;">
                You're receiving this daily summary because you have active rate alerts. To manage your alerts, visit your FX Rates page.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0 0 10px; color: #666666; font-size: 12px;">
                This is an automated daily summary from Payvost.
              </p>
              <p style="margin: 0; color: #999999; font-size: 11px;">
                © 2024 Payvost. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

## Mailgun Variable Syntax

Mailgun uses the following syntax for variables:

- **Recipient variables:** `%recipient.name%` - Automatically available from recipient data
- **Template variables:** `%v:variableName%` - Passed via `v:variableName` in API call

## Testing Templates

After creating the templates:

1. **Test Rate Alert Template:**
   - Create a test rate alert
   - Check that email is sent with correct variables

2. **Test Daily Summary Template:**
   - Call the `/daily-email` endpoint
   - Verify email format and content

## Fallback Behavior

If templates are not found in Mailgun, the system will:
- For rate alerts: Send plain text email (backward compatible)
- For daily emails: Will fail (template required)

## Troubleshooting

### Template Not Found Error

- Verify template name matches exactly: `rate-alert` or `daily-rate-summary`
- Check template is published in Mailgun dashboard
- Ensure you're using the correct Mailgun domain

### Variables Not Replacing

- Check variable names match exactly (case-sensitive)
- Verify variables are passed in `variables` object
- Check Mailgun template uses `%v:variableName%` syntax

### HTML Not Rendering

- Verify HTML is valid
- Check Mailgun template editor for syntax errors
- Test template in Mailgun's preview feature

