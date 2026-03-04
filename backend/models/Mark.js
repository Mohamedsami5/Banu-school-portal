import mongoose from "mongoose";

const EXAM_TYPES = ["Quarterly", "MidTerm", "HalfYearly", "Annual"];

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
  // Exam type - required for all new marks
  examType: {
    type: String,
    enum: EXAM_TYPES,
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

// Unique per student per exam — includes examType so same student can have marks for each exam
markSchema.index(
  { rollNo: 1, className: 1, section: 1, subject: 1, examType: 1 },
  { unique: true }
);

export { EXAM_TYPES };
export default mongoose.model("Mark", markSchema);
