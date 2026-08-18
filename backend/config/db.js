import mongoose from 'mongoose';
import { getDatabaseUri } from './runtime.js';

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || getDatabaseUri();
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    console.warn('Continuing without a live MongoDB instance for local demo mode.');
  }
};

export default connectDB;
