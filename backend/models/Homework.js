import mongoose from 'mongoose';

const HomeworkSchema = new mongoose.Schema({
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  teacherEmail: { type: String, default: '' },
  className: { type: String, required: true },
  section: { type: String, required: true },
  subject: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  dueDate: { type: Date, required: true },
}, { timestamps: true });

export default mongoose.model('Homework', HomeworkSchema);
