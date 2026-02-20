import mongoose from "mongoose";

const markSchema = new mongoose.Schema({
  rollNo: {
    type: String,
    required: true,
    trim: true
  },
  studentName: {
    type: String,
    required: true,
    trim: true
  },
  className: {
    type: String,
    required: true,
    trim: true
  },
  section: {
    type: String,
    required: true,
    trim: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  marks: {
    type: Number,
    required: true
  },
  teacherEmail: {
    type: String,
    trim: true
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Teacher"
  },
  status: {
    type: String,
    enum: ["Pending", "Approved", "Rejected"],
    default: "Pending"
  }
}, { timestamps: true });


// ✅ UNIQUE COMBINATION INDEX
markSchema.index(
  { rollNo: 1, className: 1, section: 1, subject: 1 },
  { unique: true }
);

export default mongoose.model("Mark", markSchema);
