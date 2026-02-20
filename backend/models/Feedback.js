import mongoose from "mongoose";

const FeedbackSchema = new mongoose.Schema({
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher", required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: "Parent" },
  class: { type: String, required: true },
  section: { type: String },
  subject: { type: String },
  feedback: { type: String, required: true },
  visibleToParent: { type: Boolean, default: true },
  visibleToStudent: { type: Boolean, default: true },
}, { timestamps: true });

const Feedback = mongoose.model("Feedback", FeedbackSchema);
export default Feedback;
