import mongoose from 'mongoose';
import 'dotenv/config';

export const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/finaltest';
  if (!uri) throw new Error('Missing MONGO_URI');
  await mongoose.connect(uri);
  console.log('✅ Mongo connected');
};