import mongoose from "mongoose";

const parentSchema = new mongoose.Schema({
  // Preferred field (new)
  parentName: {
    type: String,
    required: true,
    trim: true
  },
  // Legacy field (kept for backward compatibility with older UI/data)
  name: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    trim: true
  },
  // New: support multiple children per parent
  studentIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student"
  }],
  // Legacy primary child (kept for older UI/data)
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: false
  },
  // Legacy snapshot fields (kept for older UI/data)
  studentName: {
    type: String,
    required: false,
    trim: true
  },
  className: {
    type: String,
    required: false,
    trim: true
  },
  section: {
    type: String,
    required: false,
    trim: true,
    enum: ["A", "B", "C"],
    default: "A"
  }
}, {
  timestamps: true
});

// Ensure the parent is linked to at least one student.
parentSchema.path("studentIds").validate(function (value) {
  const hasArray = Array.isArray(value) && value.length > 0;
  const hasSingle = !!this.studentId;
  return hasArray || hasSingle;
}, "studentIds or studentId is required");

// Keep `name` and `parentName` in sync for older consumers.
parentSchema.pre("validate", function (next) {
  if (!this.parentName && this.name) this.parentName = this.name;
  if (!this.name && this.parentName) this.name = this.parentName;

  // Backward compatibility: keep studentId in sync with studentIds[0]
  if (!this.studentId && Array.isArray(this.studentIds) && this.studentIds.length > 0) {
    this.studentId = this.studentIds[0];
  }
  if ((!this.studentIds || this.studentIds.length === 0) && this.studentId) {
    this.studentIds = [this.studentId];
  }

  next();
});

export default mongoose.model("Parent", parentSchema);
