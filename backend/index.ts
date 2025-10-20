
// Ensure Firebase Admin SDK is initialized before anything else
// Use require() so ts-node-dev can load the local .ts initializer reliably at runtime
// Dynamically import the firebase initializer and routes so we work in both CJS and ESM runtimes
import express from 'express';
import cors from 'cors';
import path from 'path';
import { createRequire } from 'module';

// Initialize Firebase and load routes using createRequire so resolution works when started from root or backend dir.
// Avoid using `import.meta` or `__filename` to keep TypeScript and different runtimes happy.
const localRequire = createRequire(path.join(process.cwd(), 'backend', 'index.js'));
let userRoutes: any;
try {
  const fb = localRequire('./firebase');
  // allow default export interoperability
  const fbDefault = fb && fb.default ? fb.default : fb;
  // load routes
  const routesMod = localRequire('./services/user/routes/userRoutes');
  userRoutes = routesMod && routesMod.default ? routesMod.default : routesMod;
} catch (err) {
  console.error('Failed to load backend modules:', err);
  process.exit(1);
}

const app = express();
const port = process.env.PORT || 3001;

// Enable CORS for all routes with custom settings
app.use(cors({
  origin: '*', // Change to your frontend URL in production for better security
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

app.get("/", (_req, res) => {
  res.send("Payvost backend is running 🚀");
});

// Mount the user routes
// Mount user routes once they are loaded. If routes aren't ready yet, the request will be handled after they load.
app.use((req, res, next) => {
  if (!userRoutes) return res.status(503).send('Server initializing');
  next();
});
app.use('/user', (req, res, next) => userRoutes(req, res, next));

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
