"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceService = void 0;
const app_1 = __importDefault(require("./app"));
const PORT = process.env.PORT || 3002;
app_1.default.listen(PORT, () => {
    console.log(`Invoice service running on port ${PORT}`);
});
// Keep the exports for library usage
var invoice_service_1 = require("./invoice-service");
Object.defineProperty(exports, "InvoiceService", { enumerable: true, get: function () { return invoice_service_1.InvoiceService; } });
//# sourceMappingURL=index.js.map