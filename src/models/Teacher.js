// src/models/Teacher.js
import mongoose from "mongoose";

const teacherSchema = new mongoose.Schema(
  {
    code:   { type: String, required: true, unique: true }, // mã GV
    name:   { type: String, required: true },
    email:  { type: String, required: true, unique: true },
    phone:  { type: String },
    degree: { type: String },  // trình độ cao nhất (chuỗi mô tả)
    major:  { type: String },  // chuyên ngành
    address:{ type: String },
    status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" },
    positions: [{ type: mongoose.Schema.Types.ObjectId, ref: "TeacherPosition" }],
  },
  { timestamps: true, collection: "teachers" } // <- QUAN TRỌNG
);

export default mongoose.model("Teacher", teacherSchema);
