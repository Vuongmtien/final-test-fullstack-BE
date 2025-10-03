import { Router } from "express";
import {
  listPositions,
  createPosition,
  updatePosition,
  removePosition,
} from "../controllers/position.controller.js";

const router = Router();

router.get("/", listPositions);
router.post("/", createPosition);
router.put("/:id", updatePosition);
router.delete("/:id", removePosition);

export default router;
