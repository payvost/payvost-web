"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.escrowRoutes = void 0;
// Escrow Service
// Handles secure escrow transactions, milestones, and dispute resolution
var routes_1 = require("./routes");
Object.defineProperty(exports, "escrowRoutes", { enumerable: true, get: function () { return __importDefault(routes_1).default; } });
