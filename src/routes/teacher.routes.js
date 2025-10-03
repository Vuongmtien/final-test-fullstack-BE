import { Router } from 'express';
import {
  listTeachers,
  getTeacher,
  createTeacher,
  updateTeacher,
  removeTeacher,
} from '../controllers/teacher.controller.js';

const router = Router();

router.get('/', listTeachers);          // GET   /api/teachers?page=1&limit=20
router.get('/:id', getTeacher);         // GET   /api/teachers/:id
router.post('/', createTeacher);        // POST  /api/teachers
router.put('/:id', updateTeacher);      // PUT   /api/teachers/:id
router.delete('/:id', removeTeacher);   // DELETE /api/teachers/:id

export default router;
