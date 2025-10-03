// src/server.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import mongoose from "mongoose";

import { connectDB } from "./db.js";
import positionRoutes from "./routes/position.routes.js";
import teacherRoutes from "./routes/teacher.routes.js";
import error from "./middlewares/error.js";

// (tuỳ chọn) debug
import Teacher from "./models/Teacher.js";
import TeacherPosition from "./models/TeacherPosition.js";
import User from "./models/User.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (_req, res) => res.json({ ok: true }));

app.use("/api/positions", positionRoutes);
app.use("/api/teachers", teacherRoutes);

// debug xem DB & tổng số bản ghi
app.get("/api/debug/dbinfo", async (_req, res) => {
  try {
    res.json({
      db: mongoose.connection?.name,
      counts: {
        users: await User.countDocuments(),
        teachers: await Teacher.countDocuments(),
        positions: await TeacherPosition.countDocuments(),
      },
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.use(error);

const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  app.listen(PORT, () => console.log(`✅ http://localhost:${PORT}`));
});
