import TeacherPosition from "../models/TeacherPosition.js";

export const listPositions = async (req, res, next) => {
  try {
    const items = await TeacherPosition.find().sort({ createdAt: -1 });
    res.json({ data: items });
  } catch (e) {
    next(e);
  }
};

export const createPosition = async (req, res, next) => {
  try {
    const doc = await TeacherPosition.create(req.body);
    res.status(201).json(doc);
  } catch (e) {
    next(e);
  }
};

export const updatePosition = async (req, res, next) => {
  try {
    const { id } = req.params;
    const doc = await TeacherPosition.findByIdAndUpdate(id, req.body, { new: true });
    if (!doc) return res.status(404).json({ message: "Not found" });
    res.json(doc);
  } catch (e) {
    next(e);
  }
};

export const removePosition = async (req, res, next) => {
  try {
    const { id } = req.params;
    const doc = await TeacherPosition.findByIdAndDelete(id);
    if (!doc) return res.status(404).json({ message: "Not found" });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
};
