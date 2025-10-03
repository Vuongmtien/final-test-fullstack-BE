// src/controllers/teacher.controller.js
import mongoose from "mongoose";
import Teacher from "../models/Teacher.js";


export const listTeachers = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const rawLimit = parseInt(req.query.limit || "10", 10);
    const limit = Number.isFinite(rawLimit) ? rawLimit : 10;

    const pipelineBase = [
      // join sang users để lấy tên/email/phone
      {
        $lookup: {
          from: "users",
          localField: "userId",          // nếu schema là `user` thì đổi thành localField: "user"
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },

      // join sang teacherpositions để lấy danh sách vị trí
      {
        $lookup: {
          from: "teacherpositions",
          localField: "positions",
          foreignField: "_id",
          as: "positions",
        },
      },

      // project các field cần cho FE
      {
        $project: {
          code: 1,
          status: 1,
          address: 1,
          // nếu anh có trường học vấn, có thể giữ lại
          qualification: 1,
          // tên hiển thị: ưu tiên fullName, sau đó username
          name: {
            $ifNull: ["$user.fullName", "$user.username"],
          },
          email: "$user.email",
          phone: "$user.phone",
          // trả mảng vị trí đầy đủ
          positions: {
            $map: {
              input: "$positions",
              as: "p",
              in: {
                _id: "$$p._id",
                code: "$$p.code",
                name: "$$p.name",
                status: "$$p.status",
                description: "$$p.description",
              },
            },
          },
          // chuỗi tên vị trí – tiện hiển thị nhanh
          positionNames: {
            $cond: [
              { $gt: [{ $size: "$positions" }, 0] },
              {
                $reduce: {
                  input: "$positions",
                  initialValue: "",
                  in: {
                    $concat: [
                      { $cond: [{ $eq: ["$$value", ""] }, "", { $concat: ["$$value", ", "] }] },
                      "$$this.name",
                    ],
                  },
                },
              },
              "",
            ],
          },
          createdAt: 1,
        },
      },
    ];

    const countPromise = Teacher.countDocuments();
    const dataPipeline = [...pipelineBase];

    // phân trang nếu limit > 0
    if (limit > 0) {
      dataPipeline.push({ $sort: { createdAt: -1, _id: -1 } });
      dataPipeline.push({ $skip: (page - 1) * limit });
      dataPipeline.push({ $limit: limit });
    } else {
      dataPipeline.push({ $sort: { createdAt: -1, _id: -1 } });
    }

    const [total, data] = await Promise.all([
      countPromise,
      Teacher.aggregate(dataPipeline),
    ]);

    return res.json({
      data,
      total,
      page,
      limit,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/teachers/:id
 * Trả chi tiết 1 giáo viên (kèm user + positions)
 */
export const getTeacher = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid id" });
    }

    const [teacher] = await Teacher.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "teacherpositions",
          localField: "positions",
          foreignField: "_id",
          as: "positions",
        },
      },
      {
        $project: {
          code: 1,
          status: 1,
          address: 1,
          qualification: 1,
          name: { $ifNull: ["$user.fullName", "$user.username"] },
          email: "$user.email",
          phone: "$user.phone",
          positions: {
            $map: {
              input: "$positions",
              as: "p",
              in: {
                _id: "$$p._id",
                code: "$$p.code",
                name: "$$p.name",
                status: "$$p.status",
                description: "$$p.description",
              },
            },
          },
          positionNames: {
            $cond: [
              { $gt: [{ $size: "$positions" }, 0] },
              {
                $reduce: {
                  input: "$positions",
                  initialValue: "",
                  in: {
                    $concat: [
                      { $cond: [{ $eq: ["$$value", "" ] }, "", { $concat: ["$$value", ", "] }] },
                      "$$this.name",
                    ],
                  },
                },
              },
              "",
            ],
          },
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ]);

    if (!teacher) return res.status(404).json({ error: "Not found" });
    return res.json(teacher);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/teachers
 * (giữ nguyên – nếu anh đã có logic create hiện tại)
 */
export const createTeacher = async (req, res, next) => {
  try {
    const doc = await Teacher.create(req.body);
    return res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/teachers/:id
 */
export const updateTeacher = async (req, res, next) => {
  try {
    const { id } = req.params;
    const doc = await Teacher.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!doc) return res.status(404).json({ error: "Not found" });
    return res.json(doc);
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/teachers/:id
 */
export const removeTeacher = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Teacher.findByIdAndDelete(id);
    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
};
