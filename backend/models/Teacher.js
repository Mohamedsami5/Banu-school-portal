import mongoose from "mongoose";

const teacherSchema = new mongoose.Schema({
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
  teaching: [
    {
      className: { type: String, required: true, trim: true },
      section: { type: String, required: true, trim: true, enum: ["A", "B", "C"], default: "A" },
      subject: { type: String, required: true, trim: true }
    }
  ],
  status: {
    type: String,
    enum: ["Active", "On Leave", "Inactive"],
    default: "Active"
  },
  password: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    default: "teacher"
  },
  photo: {
    type: String,
    default: ""
  },
  phone: {
    type: String,
    trim: true,
    default: ""
  },
  qualification: {
    type: String,
    trim: true,
    default: ""
  },
  experience: {
    type: String,
    trim: true,
    default: ""
  },
  address: {
    type: String,
    trim: true,
    default: ""
  },
  bio: {
    type: String,
    trim: true,
    default: ""
  },
  // Admin-controlled fields
  dateOfJoining: {
    type: Date,
    default: null
  },
  // Teacher-editable additional information
  fatherName: {
    type: String,
    trim: true,
    default: ""
  },
  motherName: {
    type: String,
    trim: true,
    default: ""
  },
  dateOfBirth: {
    type: Date,
    default: null
  },
  languagesKnown: {
    type: [String],
    default: []
  },
  // Profile completion status
  profileCompleted: {
    type: Boolean,
    default: false
  },
  // Profile photo URL (stored after upload)
  profilePhoto: {
    type: String,
    default: ""
  }
}, {
  timestamps: true
});

export default mongoose.model("Teacher", teacherSchema);
