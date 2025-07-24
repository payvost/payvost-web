// Example: bootstrapping the main service
import './services/user'; // Replace with your actual main entry file

console.log("Backend root started.");

// backend/index.ts
import express from 'express';

const app = express();
const port = process.env.PORT || 3000;

app.get("/", (_req, res) => {
  res.send("Payvost backend is running 🚀");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
