import mongoose from "mongoose";

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  className: {
    type: String,
    required: true,
    trim: true
  },
  section: {
    type: String,
    required: true,
    trim: true,
    enum: ["A", "B", "C"],
    default: "A"
  },
  rollNo: {
    type: String,
    required: true,
    trim: true
  },
  parentName: {
    type: String,
    trim: true
  },
  parentEmail: {
    type: String,
    trim: true,
    lowercase: true
  }
}, {
  timestamps: true
});

// Ensure rollNo is unique within a class (compound unique index)
studentSchema.index({ className: 1, rollNo: 1 }, { unique: true, partialFilterExpression: { rollNo: { $exists: true, $ne: "" }, className: { $exists: true } } });

export default mongoose.model("Student", studentSchema);
