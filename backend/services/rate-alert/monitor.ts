import { prisma } from '../common/prisma';
import { sendRateAlertEmail } from '../../common/mailgun';
import { sendRateAlertPush } from '../../common/webpush';
import axios from 'axios';

// Example: fetch FX rates from your API or a public provider
async function fetchRates(base = 'USD') {
  // Replace with your actual FX rate provider
  const res = await axios.get(`https://openexchangerates.org/api/latest.json?app_id=YOUR_APP_ID&base=${base}`);
  return res.data.rates;
}

export async function runRateAlertMonitor() {
  // 1. Fetch all active alerts
  const alerts = await prisma.rateAlert.findMany({ where: { isActive: true } });
  if (!alerts.length) return;

  // 2. Fetch FX rates (base: USD)
  const rates = await fetchRates('USD');

  for (const alert of alerts) {
    const { sourceCurrency, targetCurrency, targetRate, email, id } = alert;
    // Only support USD as base for demo
    if (sourceCurrency !== 'USD') continue;
    const currentRate = rates[targetCurrency];
    if (!currentRate) continue;
    if (Number(currentRate) >= Number(alert.targetRate)) {
      // Send email if present
      if (email) {
        await sendRateAlertEmail(
          email,
          `Your FX rate alert: ${sourceCurrency}/${targetCurrency}`,
          `Good news! The rate for ${sourceCurrency} to ${targetCurrency} is now ${currentRate}, meeting your target of ${alert.targetRate}.`
        );
      }
      // Send push notification if present
      if (alert.pushSubscription) {
        try {
          await sendRateAlertPush(
            alert.pushSubscription,
            `FX Alert: ${sourceCurrency}/${targetCurrency} is now ${currentRate} (target: ${alert.targetRate})`
          );
        } catch (err) {
          console.error('Push notification error:', err);
        }
      }
      // Mark alert as notified
      await prisma.rateAlert.update({
        where: { id },
        data: { isActive: false, notifiedAt: new Date(), notifiedCount: { increment: 1 } },
      });
    }
  }
}
