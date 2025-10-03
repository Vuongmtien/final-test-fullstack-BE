import { Teacher } from '../models/Teacher.js';

export async function generateUniqueTeacherCode() {
  for (let i = 0; i < 10; i++) {
    const code = Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)).join('');
    const exists = await Teacher.findOne({ code });
    if (!exists) return code;
  }
  throw { status: 500, message: 'Cannot generate teacher code' };
}
