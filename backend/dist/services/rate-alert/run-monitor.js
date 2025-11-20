"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const monitor_1 = require("./monitor");
(0, monitor_1.runRateAlertMonitor)()
    .then(() => {
    console.log('Rate alert monitor completed');
    process.exit(0);
})
    .catch((err) => {
    console.error('Rate alert monitor error:', err);
    process.exit(1);
});
