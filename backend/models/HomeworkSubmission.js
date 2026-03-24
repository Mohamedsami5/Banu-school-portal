import mongoose from "mongoose";

const HomeworkSubmissionSchema = new mongoose.Schema({
  homeworkId: { type: mongoose.Schema.Types.ObjectId, ref: "Homework", required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  rollNo: { type: String, required: true, trim: true },
  studentName: { type: String, required: true, trim: true },
  answerText: { type: String, default: "" },
  photo: { type: String, default: "" },
  submittedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" }
}, { timestamps: true });

export default mongoose.model("HomeworkSubmission", HomeworkSubmissionSchema);
