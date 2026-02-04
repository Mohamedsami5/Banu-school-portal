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
  subject: {
    type: String,
    trim: true
  },
  teaching: [
    {
      class: { type: String, trim: true },
      section: { type: String, trim: true },
      subject: { type: String, trim: true }
    }
  ],
  status: {
    type: String,
    enum: ['Active', 'On Leave', 'Inactive'],
    default: 'Active'
  },
  password: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    default: 'teacher'
  }
}, {
  timestamps: true
});

export default mongoose.model("Teacher", teacherSchema);
