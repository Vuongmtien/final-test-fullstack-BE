// src/routes/teacher.routes.js
import { Router } from 'express';
import {
  listTeachers,
  getTeacher,
  createTeacher,
  updateTeacher,
  removeTeacher,
} from '../controllers/teacher.controller.js';

const router = Router();

router.get('/', listTeachers);
router.get('/all', (req, res, next) => {
  req.query.limit = '0';
  return listTeachers(req, res, next);
});
router.get('/:id', getTeacher);
router.post('/', createTeacher);
router.put('/:id', updateTeacher);
router.delete('/:id', removeTeacher);

export default router;
