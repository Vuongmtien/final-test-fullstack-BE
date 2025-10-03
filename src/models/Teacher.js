import mongoose from "mongoose";
const { Schema } = mongoose;

const TeacherSchema = new Schema(
  {
    user: {                       // <-- liên kết User ở đây
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    code: { type: String, required: true, unique: true },
    status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" },
    address: { type: String, default: "" },

    qualification: { type: String, default: "" }, // bậc học
    major: { type: String, default: "" },         // chuyên ngành

    positions: [{ type: Schema.Types.ObjectId, ref: "TeacherPosition" }],
  },
  { timestamps: true, collection: "teachers" }
);

export default mongoose.model("Teacher", TeacherSchema);
