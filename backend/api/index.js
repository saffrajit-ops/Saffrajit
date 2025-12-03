// Vercel serverless function handler
require('dotenv').config();
const connectDB = require('../src/config/db');

// Initialize database connection
let dbConnected = false;

const initDB = async () => {
  if (!dbConnected) {
    try {
      await connectDB();
      dbConnected = true;
    } catch (error) {
      console.error('Failed to connect to database:', error);
    }
  }
};

// Initialize DB connection
initDB();

// Import and export the Express app
const app = require('../src/app');
module.exports = app;
