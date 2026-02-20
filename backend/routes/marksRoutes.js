import express from "express";
import {
  getAllMarksForApproval,
  updateMarkStatus,
  getMarksByStatus
} from "../controllers/marksController.js";

const router = express.Router();

// GET all marks for admin approval
router.get("/admin/all", getAllMarksForApproval);

// GET marks filtered by status
router.get("/filter-by-status", getMarksByStatus);

// PUT update mark status (approve or reject)
router.put("/:id/status", updateMarkStatus);

export default router;
