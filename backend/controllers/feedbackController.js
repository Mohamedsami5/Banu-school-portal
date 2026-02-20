import Feedback from "../models/Feedback.js";
import Teacher from "../models/Teacher.js";
import Student from "../models/Student.js";
import Parent from "../models/Parent.js";
import mongoose from "mongoose";

const isValidObjectId = (v) => mongoose.Types.ObjectId.isValid(v);

const cleanString = (v) => {
  if (v === undefined || v === null) return undefined;
  const s = String(v).trim();
  return s ? s : undefined;
};

export const createOrUpdateFeedback = async (req, res) => {
  try {
    const data = req.body || {};
    const teacherId = cleanString(data.teacherId);
    const studentId = cleanString(data.studentId);
    const className = cleanString(data.class);
    const section = cleanString(data.section); // optional
    const subject = cleanString(data.subject); // optional
    const feedback = cleanString(data.feedback);
    
    // Validate required fields
    if (!teacherId || !studentId || !className || !feedback) {
      return res.status(400).json({
        message: "teacherId, studentId, class, and feedback are required",
      });
    }
    if (!isValidObjectId(teacherId) || !isValidObjectId(studentId)) {
      return res.status(400).json({ message: "Invalid teacherId or studentId" });
    }

    // Verify teacher exists
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) return res.status(403).json({ message: "Invalid teacher" });

    // Ensure student exists
    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: "Student not found" });

    // Attempt to find parentId if not provided
    let parentId = cleanString(data.parentId);
    if (parentId && !isValidObjectId(parentId)) parentId = undefined;
    if (!parentId && student.parentEmail) {
      const parent = await Parent.findOne({ email: student.parentEmail });
      if (parent) parentId = parent._id;
    }

    // Upsert feedback record for this teacher-student-class-section-subject
    const filter = { teacherId, studentId, class: className };
    if (section) filter.section = section;
    if (subject) filter.subject = subject;

    const update = {
      teacherId,
      studentId,
      class: className,
      feedback,
      visibleToParent: data.visibleToParent !== undefined ? !!data.visibleToParent : true,
      visibleToStudent: data.visibleToStudent !== undefined ? !!data.visibleToStudent : true,
    };
    if (section) update.section = section;
    if (subject) update.subject = subject;
    if (parentId) update.parentId = parentId;

    const opts = { upsert: true, new: true, setDefaultsOnInsert: true };
    const saved = await Feedback.findOneAndUpdate(filter, update, opts);
    res.json(saved);
  } catch (error) {
    console.error("Error saving feedback:", error);
    res.status(500).json({ message: "Error saving feedback", error: error.message });
  }
};

export const deleteFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid feedback id" });
    }

    const deleted = await Feedback.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Feedback not found" });
    }

    res.json({ message: "Feedback deleted" });
  } catch (error) {
    console.error("Error deleting feedback:", error);
    res.status(500).json({ message: "Error deleting feedback", error: error.message });
  }
};

export const getFeedbacksByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    if (!studentId) return res.status(400).json({ message: "studentId required" });
    const feedbacks = await Feedback.find({ studentId, visibleToStudent: true }).sort({ createdAt: -1 });
    res.json(Array.isArray(feedbacks) ? feedbacks : []);
  } catch (error) {
    console.error("Error fetching student feedback:", error);
    res.status(500).json({ message: "Error fetching feedback", error: error.message });
  }
};

export const getFeedbacksByParent = async (req, res) => {
  try {
    const { parentId } = req.params;
    if (!parentId) return res.status(400).json({ message: "parentId required" });
    const feedbacks = await Feedback.find({ parentId, visibleToParent: true }).sort({ createdAt: -1 });
    res.json(Array.isArray(feedbacks) ? feedbacks : []);
  } catch (error) {
    console.error("Error fetching parent feedback:", error);
    res.status(500).json({ message: "Error fetching feedback", error: error.message });
  }
};

export const getFeedbacksByTeacher = async (req, res) => {
  try {
    // Support both route param (/teacher/:teacherId) and query (?teacherId=)
    const teacherId = req.params.teacherId || req.query.teacherId;
    if (!teacherId) {
      return res.status(400).json({ message: "teacherId required" });
    }

    // Fetch feedbacks and populate basic student info for UI display
    const feedbacks = await Feedback.find({ teacherId })
      .sort({ createdAt: -1 })
      .populate("studentId", "name rollNo className section");

    const list = Array.isArray(feedbacks) ? feedbacks : [];

    const output = list.map((fb) => {
      const obj = fb.toObject ? fb.toObject() : { ...fb };
      const stu = obj.studentId && typeof obj.studentId === "object" ? obj.studentId : null;

      // Attach convenient fields for frontend table rendering
      if (stu) {
        obj.studentName = stu.name || "";
        obj.rollNo = stu.rollNo || "";
        if (!obj.class && stu.className) obj.class = stu.className;
        if (!obj.section && stu.section) obj.section = stu.section;
      }

      // Do not remove createdAt – it's useful for backend,
      // frontend simply won't render it.
      return obj;
    });

    res.json(output);
  } catch (error) {
    console.error("Error fetching teacher feedback:", error);
    res.status(500).json({ message: "Error fetching feedback", error: error.message });
  }
};

export const getFeedbacksForClass = async (req, res) => {
  try {
    const { className, section, subject } = req.query;
    const filter = {};
    if (className) filter.class = String(className).trim();
    if (section) filter.section = String(section).trim();
    if (subject) filter.subject = String(subject).trim();
    const feedbacks = await Feedback.find(filter).sort({ createdAt: -1 });
    res.json(Array.isArray(feedbacks) ? feedbacks : []);
  } catch (error) {
    console.error("Error fetching class feedback:", error);
    res.status(500).json({ message: "Error fetching feedback", error: error.message });
  }
};
