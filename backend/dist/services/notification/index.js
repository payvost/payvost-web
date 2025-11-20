"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationRoutes = void 0;
// Notification Service
// Handles email, push, and SMS notifications
const twilio_1 = require("./twilio");
// Initialize Twilio when module loads
(0, twilio_1.initTwilio)();
var routes_1 = require("./routes");
Object.defineProperty(exports, "notificationRoutes", { enumerable: true, get: function () { return __importDefault(routes_1).default; } });
