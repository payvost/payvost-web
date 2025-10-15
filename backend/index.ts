
import './firebase'; // Ensure Firebase Admin SDK is initialized before anything else
import express from 'express';
import cors from 'cors'; 
import userRoutes from './services/user/routes/userRoutes'; // Import user routes

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
app.use('/user', userRoutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
