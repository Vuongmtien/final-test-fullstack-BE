// src/seed.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

import User from "./models/User.js";
import Teacher from "./models/Teacher.js";
import TeacherPosition from "./models/TeacherPosition.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
const dataDir = path.join(process.cwd(), "WEB", "mock-data-fullstack");

// ---------- Helpers ----------
const toValidDate = (v) => {
  if (!v) return undefined;
  // dạng { $date: "..." }
  if (typeof v === "object" && v.$date) {
    const d = new Date(v.$date);
    return isNaN(d) ? undefined : d;
  }
  // ISO string hoặc timestamp
  const d = new Date(v);
  return isNaN(d) ? undefined : d;
};

const stripId = (doc) => {
  if (!doc) return doc;
  if (doc._id && typeof doc._id === "object" && doc._id.$oid) {
    delete doc._id;
  } else if (typeof doc._id === "string") {
    delete doc._id;
  }
  return doc;
};

const ensureEnum = (val, allowed, fallback) =>
  allowed.includes(val) ? val : fallback;

const ensureCode = (v) =>
  v && String(v).trim()
    ? String(v).trim()
    : `U${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

// Xoá các field có giá trị undefined (để Mongoose không set)
const compact = (obj) => {
  const out = {};
  Object.keys(obj).forEach((k) => {
    if (obj[k] !== undefined) out[k] = obj[k];
  });
  return out;
};
// ----------------------------

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Mongo connected");

    // Fix lỗi duplicate index { code: null } ở users
    try {
      await mongoose.connection.db.collection("users").dropIndex("code_1");
      console.log("🧹 Dropped index users.code_1");
    } catch (e) {
      if (
        e.codeName !== "IndexNotFound" &&
        !String(e.message).includes("index not found")
      ) {
        console.warn("⚠️ Drop index users.code_1 skipped:", e.message);
      }
    }

    // Làm trống dữ liệu cũ
    await Promise.all([
      User.deleteMany({}),
      Teacher.deleteMany({}),
      TeacherPosition.deleteMany({}),
    ]);

    // Đọc file mock
    const usersRaw = JSON.parse(
      fs.readFileSync(path.join(dataDir, "school.users.json"), "utf-8")
    );
    const teachersRaw = JSON.parse(
      fs.readFileSync(path.join(dataDir, "school.teachers.json"), "utf-8")
    );
    const positionsRaw = JSON.parse(
      fs.readFileSync(
        path.join(dataDir, "school.teacherpositions.json"),
        "utf-8"
      )
    );

    // Chuẩn hoá USERS
    const usersData = usersRaw.map((u) => {
      stripId(u);
      const dob = toValidDate(u.dob);
      const createdAt = toValidDate(u.createdAt) || new Date();
      const updatedAt = toValidDate(u.updatedAt) || new Date();

      // role hợp lệ
      const role = ensureEnum(u.role, ["ADMIN", "TEACHER"], "TEACHER");
      const code = ensureCode(u.code);

      return compact({
        ...u,
        dob,
        createdAt,
        updatedAt,
        role,
        code,
      });
    });

    // Chuẩn hoá TEACHERS
    const teachersData = teachersRaw.map((t) => {
      stripId(t);
      const createdAt = toValidDate(t.createdAt) || new Date();
      const updatedAt = toValidDate(t.updatedAt) || new Date();
      return compact({
        ...t,
        createdAt,
        updatedAt,
      });
    });

    // Chuẩn hoá POSITIONS
    const positionsData = positionsRaw.map((p) => {
      stripId(p);
      const createdAt = toValidDate(p.createdAt) || new Date();
      const updatedAt = toValidDate(p.updatedAt) || new Date();
      return compact({
        ...p,
        createdAt,
        updatedAt,
      });
    });

    // Insert
    await User.insertMany(usersData, { ordered: false });
    await Teacher.insertMany(teachersData, { ordered: false });
    await TeacherPosition.insertMany(positionsData, { ordered: false });

    console.log(
      `✅ Seed OK: users=${usersData.length}, teachers=${teachersData.length}, positions=${positionsData.length}`
    );
    process.exit(0);
  } catch (err) {
    console.error("❌ Seed error:", err);
    process.exit(1);
  }
}

seed();
