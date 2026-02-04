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
    trim: true,
    default: "A"
  },
  rollNo: {
    type: String,
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

export default mongoose.model("Student", studentSchema);
