"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Example: bootstrapping the main service
require("./services/user"); // Replace with your actual main entry file
console.log("Backend root started.");
// backend/index.ts
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
app.get("/", (_req, res) => {
    res.send("Payvost backend is running 🚀");
});
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
