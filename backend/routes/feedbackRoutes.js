import express from "express";
import {
  createOrUpdateFeedback,
  deleteFeedback,
  getFeedbacksByStudent,
  getFeedbacksByParent,
  getFeedbacksByTeacher,
  getFeedbacksForClass,
} from "../controllers/feedbackController.js";

const router = express.Router();

// Create or update feedback (teacher only)
router.post("/", createOrUpdateFeedback);

// Delete feedback by id
router.delete("/:id", deleteFeedback);

// Get feedbacks for a teacher using query (?teacherId=...) – primary entry for UI
router.get("/", getFeedbacksByTeacher);

// Get feedbacks for a student (visibleToStudent only)
router.get("/student/:studentId", getFeedbacksByStudent);

// Get feedbacks for a parent (visibleToParent only)
router.get("/parent/:parentId", getFeedbacksByParent);

// Get feedbacks for a teacher via path param (backward compatible)
router.get("/teacher/:teacherId", getFeedbacksByTeacher);

// Query feedbacks by class/section/subject
router.get("/class", getFeedbacksForClass);

export default router;
