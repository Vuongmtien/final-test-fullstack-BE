// src/models/User.js
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    code: String,          // mã GV (nếu có)
    fullName: String,
    email: { type: String, required: true, unique: true },
    phone: String,
    address: String,
    status: { type: String, default: 'active' },
    role: { type: String, enum: ['TEACHER', 'STUDENT', 'ADMIN'], default: 'TEACHER' },
    // … các field khác anh đã có
  },
  { timestamps: true, collection: 'users' }
);

export default mongoose.model('User', UserSchema);
