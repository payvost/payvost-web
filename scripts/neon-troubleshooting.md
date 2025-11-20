# Neon Database Connection Troubleshooting Guide

## Current Issue
Connection failing with: "Can't reach database server"

## Common Causes & Solutions

### 1. Database is Paused (Most Common - Free Tier)
Neon free tier databases auto-pause after 5 minutes of inactivity.

**Solution:**
- Go to [Neon Dashboard](https://console.neon.tech)
- Find your project: `ep-lingering-art-adc5d3rq`
- Click "Resume" or "Wake up" the database
- Wait 10-30 seconds for it to start
- Try connecting again

### 2. Network/Firewall Blocking Connection
Your network or firewall might be blocking port 5432.

**Solution:**
- Check if you're behind a corporate firewall
- Try from a different network (mobile hotspot)
- Check Windows Firewall settings
- Verify port 5432 is not blocked

### 3. Connection String Format
Verify the connection string is correct.

**Current Connection String:**
```
postgresql://neondb_owner:npg_DOkxXyE50Yft@ep-lingering-art-adc5d3rq-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
```

**Test in Neon SQL Editor:**
1. Go to Neon Dashboard
2. Click "SQL Editor"
3. Try running: `SELECT version();`
4. If this works, the database is accessible and the issue is local network

### 4. SSL/TLS Configuration
Neon requires SSL connections.

**Verify:**
- Connection string includes `?sslmode=require`
- Your system has valid SSL certificates

### 5. IP Whitelisting (Unlikely)
Neon allows all IPs by default, but check if you've set restrictions.

**Check:**
- Neon Dashboard → Project Settings → IP Allowlist
- Should be empty or include your IP

## Quick Test Steps

1. **Wake Database:**
   - Open Neon Dashboard
   - Resume/Wake the database
   - Wait 30 seconds

2. **Test Connection:**
   ```bash
   node scripts/test-neon-connection.js
   ```

3. **If Still Failing:**
   - Try from Neon SQL Editor (proves database is accessible)
   - Check network connectivity
   - Try from different network

4. **Alternative: Use Neon Connection Pooler**
   - The connection string uses `-pooler` endpoint
   - Try the direct endpoint (without `-pooler`) for migrations:
   ```
   DIRECT_URL=postgresql://neondb_owner:npg_DOkxXyE50Yft@ep-lingering-art-adc5d3rq.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```

## Next Steps After Connection Works

Once connection is successful:

1. **Run Migrations:**
   ```bash
   npm run db:migrate
   ```

2. **Verify Tables:**
   ```bash
   npm run db:studio
   ```

3. **Test Application:**
   ```bash
   npm run dev
   ```

## Still Having Issues?

1. Check Neon Status: https://status.neon.tech
2. Verify credentials in Neon Dashboard
3. Try creating a new connection string from Neon Dashboard
4. Contact Neon Support if database is confirmed active

