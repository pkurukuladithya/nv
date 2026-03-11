// =============================================
// db.js - MongoDB Atlas Connection Module
// =============================================
// This file handles connecting to MongoDB Atlas using Mongoose.
// The connection string comes from the .env file for security.

const mongoose = require("mongoose");

/**
 * Connects to MongoDB Atlas.
 * Called once when the server starts.
 */
const connectDB = async () => {
  try {
    // mongoose.connect() returns a promise, so we await it
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    // If connection fails, log the error and exit the process
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1); // Exit with failure code
  }
};

module.exports = connectDB;
