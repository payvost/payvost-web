"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.walletRoutes = exports.default = void 0;
// Wallet Service
// Handles account management and balance operations
var routes_1 = require("./routes");
Object.defineProperty(exports, "default", { enumerable: true, get: function () { return __importDefault(routes_1).default; } });
var routes_2 = require("./routes");
Object.defineProperty(exports, "walletRoutes", { enumerable: true, get: function () { return __importDefault(routes_2).default; } });
