import Teacher from "../models/Teacher.js";

const generateCode = async () => {
  let code, exists = true;
  while (exists) {
    code = Math.random().toString().slice(2, 11); 
    exists = await Teacher.exists({ code });
  }
  return code;
};

export default generateCode;  
