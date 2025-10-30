"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Ensure Firebase Admin SDK is initialized before anything else
// Use require() so ts-node-dev can load the local .ts initializer reliably at runtime
// Dynamically import the firebase initializer and routes so we work in both CJS and ESM runtimes
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const module_1 = require("module");
// Initialize Firebase and load routes using createRequire so resolution works when started from root or backend dir.
// Avoid using `import.meta` or `__filename` to keep TypeScript and different runtimes happy.
const localRequire = (0, module_1.createRequire)(path_1.default.join(process.cwd(), 'backend', 'index.js'));
let userRoutes;
try {
    const fb = localRequire('./firebase');
    // allow default export interoperability
    const fbDefault = fb && fb.default ? fb.default : fb;
    // load routes
    const routesMod = localRequire('./services/user/routes/userRoutes');
    userRoutes = routesMod && routesMod.default ? routesMod.default : routesMod;
}
catch (err) {
    console.error('Failed to load backend modules:', err);
    process.exit(1);
}
const app = (0, express_1.default)();
const port = process.env.PORT || 3001;
// Enable CORS for all routes with custom settings
app.use((0, cors_1.default)({
    origin: '*', // Change to your frontend URL in production for better security
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
app.use(express_1.default.json());
app.get("/", (_req, res) => {
    res.send("Payvost backend is running 🚀");
});
// Mount the user routes
// Mount user routes once they are loaded. If routes aren't ready yet, the request will be handled after they load.
app.use((req, res, next) => {
    if (!userRoutes)
        return res.status(503).send('Server initializing');
    next();
});
app.use('/user', (req, res, next) => userRoutes(req, res, next));
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
