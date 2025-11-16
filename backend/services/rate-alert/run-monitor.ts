import { runRateAlertMonitor } from './monitor';

runRateAlertMonitor()
  .then(() => {
    console.log('Rate alert monitor completed');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Rate alert monitor error:', err);
    process.exit(1);
  });
