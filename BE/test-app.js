import express from "express";
import dotenv from 'dotenv';
import cors from "cors";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Simple test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

const PORT = process.env.PORT || 3000;

console.log('Starting minimal server...');

app.listen(PORT, () => {
  console.log(`🚀 Minimal server started on port ${PORT}`);
  console.log(`🌐 Test URL: http://localhost:${PORT}/api/test`);
}).on('error', (err) => {
  console.error('❌ Server startup error:', err);
});
