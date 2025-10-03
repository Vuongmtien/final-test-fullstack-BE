// src/controllers/teacher.controller.js
import mongoose from "mongoose";
import Teacher from "../models/Teacher.js";
import User from "../models/User.js";

/* Helper sinh code */
const genCode = (prefix = "GV") =>
  `${prefix}${Date.now().toString().slice(-6)}${Math.floor(1000 + Math.random() * 9000)}`;

/* Helper lấy field user liên kết trong schema: userId | user */
function getUserLinkField() {
  if (Teacher?.schema?.path("userId")) return "userId";
  if (Teacher?.schema?.path("user")) return "user";
  return null; // fallback hiếm khi xảy ra
}

/* GET /api/teachers */
export const listTeachers = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const rawLimit = parseInt(req.query.limit || "20", 10);
    const limit = Number.isFinite(rawLimit) ? rawLimit : 20;
    const linkField = getUserLinkField();

    const q = Teacher.find()
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * (limit || 0));

    if (limit > 0) q.limit(limit);
    if (linkField) q.populate({ path: linkField, select: "fullName username email phone" });
    if (Teacher?.schema?.path("positions")) {
      q.populate({ path: "positions", select: "code name status" });
    }

    const [docs, total] = await Promise.all([q.lean().exec(), Teacher.countDocuments()]);

    const data = docs.map((t) => {
      const userObj = linkField ? t[linkField] : null;
      const name = userObj?.fullName || userObj?.username || "-";
      const positionNames = Array.isArray(t.positions)
        ? t.positions.map((p) => p?.name).filter(Boolean).join(", ")
        : "";

      return {
        _id: t._id,
        code: t.code,
        status: t.status,
        address: t.address,
        qualification: t.qualification,
        major: t.major,
        createdAt: t.createdAt,

        name,
        email: userObj?.email || "",
        phone: userObj?.phone || "",

        positions: t.positions || [],
        positionNames,
      };
    });

    res.json({ data, total, page, limit });
  } catch (err) {
    console.error("listTeachers error:", err);
    next(err);
  }
};

/* GET /api/teachers/:id */
export const getTeacher = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid id" });
    }
    const linkField = getUserLinkField();

    const q = Teacher.findById(id);
    if (linkField) q.populate({ path: linkField, select: "fullName username email phone" });
    if (Teacher?.schema?.path("positions"))
      q.populate({ path: "positions", select: "code name status description" });

    const t = await q.lean();
    if (!t) return res.status(404).json({ error: "Not found" });

    const userObj = linkField ? t[linkField] : null;
    const name = userObj?.fullName || userObj?.username || "-";
    const positionNames = Array.isArray(t.positions)
      ? t.positions.map((p) => p?.name).filter(Boolean).join(", ")
      : "";

    return res.json({
      _id: t._id,
      code: t.code,
      status: t.status,
      address: t.address,
      qualification: t.qualification,
      major: t.major,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      name,
      email: userObj?.email || "",
      phone: userObj?.phone || "",
      positions: t.positions || [],
      positionNames,
    });
  } catch (err) {
    console.error("getTeacher error:", err);
    next(err);
  }
};

/* POST /api/teachers */
export const createTeacher = async (req, res, next) => {
  try {
    // Cho phép nhận ở root hoặc trong user{}
    const rb = req.body || {};
    const userFromPayload = rb.user || {};
    let email = (rb.email || userFromPayload.email || "").toLowerCase().trim();
    let name =
      (rb.name || userFromPayload.username || userFromPayload.fullName || "").trim();
    const phone = (rb.phone || userFromPayload.phone || "").trim() || undefined;

    if (!email) return res.status(400).json({ error: "Email là bắt buộc" });
    if (!name) name = email.split("@")[0];

    // education (FE) → qualification/major (BE) — vẫn nhận trực tiếp nếu FE gửi qualification/major
    const qualification =
      rb.qualification || (rb.education && rb.education.degree) || "";
    const major = rb.major || (rb.education && rb.education.major) || "";

    // chuẩn hoá positions
    const rawPositions = rb.positionIds || rb.positions || [];
    const positionIds = Array.isArray(rawPositions)
      ? rawPositions
          .map((p) => (typeof p === "string" ? p : p?._id))
          .filter((id) => mongoose.isValidObjectId(id))
          .map((id) => new mongoose.Types.ObjectId(id))
      : [];

    // tạo / cập nhật user
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        username: name,
        fullName: name,
        email,
        phone,
        role: "TEACHER",
      });
    } else {
      user.fullName = name;
      if (phone) user.phone = phone;
      await user.save();
    }

    // không tạo trùng teacher cho cùng user
    const linkField = getUserLinkField();
    if (!linkField) return res.status(500).json({ error: "Schema Teacher thiếu field user" });

    const existed = await Teacher.findOne({ [linkField]: user._id });
    if (existed) {
      return res.status(400).json({ error: "Giáo viên với email này đã tồn tại" });
    }

    // code
    const code = rb.code || genCode("GV");
    const status = (rb.status || "ACTIVE").toUpperCase();
    const address = rb.address || userFromPayload.address || "";

    const payload = {
      [linkField]: user._id,
      code,
      status,
      address,
      qualification,
      major,
      positions: positionIds,
    };

    const teacher = await Teacher.create(payload);
    return res.status(201).json(teacher);
  } catch (err) {
    console.error("createTeacher error:", err);
    return res.status(500).json({ error: err.message });
  }
};

/* PUT /api/teachers/:id */
export const updateTeacher = async (req, res, next) => {
  try {
    const { id } = req.params;
    const patch = { ...req.body };

    // normalize positions
    if (Array.isArray(patch.positions)) {
      patch.positions = patch.positions
        .map((p) => (typeof p === "string" ? p : p?._id))
        .filter((id) => mongoose.isValidObjectId(id))
        .map((id) => new mongoose.Types.ObjectId(id));
    }

    const doc = await Teacher.findByIdAndUpdate(id, patch, {
      new: true,
      runValidators: true,
    });

    if (!doc) return res.status(404).json({ error: "Not found" });
    return res.json(doc);
  } catch (err) {
    console.error("updateTeacher error:", err);
    next(err);
  }
};

/* DELETE /api/teachers/:id */
export const removeTeacher = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Teacher.findByIdAndDelete(id);
    return res.json({ ok: true });
  } catch (err) {
    console.error("removeTeacher error:", err);
    next(err);
  }
};
