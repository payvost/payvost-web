# Payvost Module for Perfex CRM

This folder contains the official Payvost module scaffold for Perfex CRM. Upload the `modules/Payvost` folder into your Perfex `modules` directory.

Structure:
- modules/Payvost/Payvost.php — Module bootstrap and hooks
- modules/Payvost/config/config.php — Defaults (API base)
- modules/Payvost/config/routes.php — Admin settings + webhook routes
- modules/Payvost/controllers/Payvost.php — Admin controller + webhook handler
- modules/Payvost/models/Payvost_model.php — API and payment helpers
- modules/Payvost/views/settings.php — Settings page (API key, environment)
- modules/Payvost/libraries/Payvost_gateway.php — Basic gateway wrapper
- modules/Payvost/install.php — Create options and logs table
- modules/Payvost/uninstall.php — Cleanup (optional)

Setup:
1) Copy `modules/Payvost` into your Perfex CRM `modules/` directory.
2) Login as admin -> Setup -> Modules -> Activate "Payvost".
3) Go to Setup -> Settings -> Payvost and enter your API key and environment.
4) Use the gateway to initialize payments for invoices; webhook URL: `{your-domain}/payvost/callback`.

Notes:
- This is a working scaffold. Integrations may require adjustments based on your Perfex version.