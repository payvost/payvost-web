# How to Wake Up Your Neon Database

## Quick Steps

1. **Go to Neon Dashboard:**
   - Visit: https://console.neon.tech
   - Sign in to your account

2. **Find Your Project:**
   - Look for project with endpoint: `ep-lingering-art-adc5d3rq`
   - Or search for database name: `neondb`

3. **Wake the Database:**
   - Click on your project
   - If you see a "Resume" or "Wake" button, click it
   - Wait 10-30 seconds for the database to start

4. **Verify It's Active:**
   - The status should show "Active" or "Running"
   - You should see green indicators

5. **Test Connection:**
   ```bash
   node scripts/test-neon-connection.js
   ```

## Alternative: Use Neon SQL Editor

If the database is paused, you can wake it by:

1. Open Neon Dashboard
2. Click "SQL Editor" 
3. Run any query (e.g., `SELECT 1;`)
4. This will automatically wake the database
5. Then try your connection again

## Prevent Auto-Pause (Paid Plans Only)

- Free tier: Databases auto-pause after 5 min inactivity
- Paid plans: Can configure auto-pause settings
- Consider upgrading if you need always-on database

