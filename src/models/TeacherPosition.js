// src/models/TeacherPosition.js  (Positions đang chạy ok)
import mongoose from 'mongoose';
const TeacherPositionSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    status: { type: String, default: 'active' },
    description: String
  },
  { timestamps: true, collection: 'teacherpositions' }
);
export default mongoose.model('TeacherPosition', TeacherPositionSchema);
