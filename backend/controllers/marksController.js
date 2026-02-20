import mongoose from "mongoose";
import Mark from "../models/Mark.js";
import Student from "../models/Student.js";

const checkMongoConnection = () => {
  if (mongoose.connection.readyState !== 1) {
    throw new Error("MongoDB not connected. Connection state: " + mongoose.connection.readyState);
  }
};

/**
 * Fetch all marks with student details (for admin approval)
 * GET /api/marks/admin/all
 */
export const getAllMarksForApproval = async (req, res) => {
  try {
    checkMongoConnection();

    // Fetch all marks with student details populated
    const marks = await Mark.find()
      .populate("teacherId", "name email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: Array.isArray(marks) ? marks : [],
      total: marks.length
    });
  } catch (error) {
    console.error("Error fetching marks for approval:", error);
    if (error.message.includes("MongoDB not connected")) {
      res.status(503).json({
        success: false,
        message: "Database connection unavailable",
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Error fetching marks",
        error: error.message
      });
    }
  }
};

/**
 * Update mark status (Approve or Reject)
 * PUT /api/marks/:id/status
 * Body: { status: "Approved" | "Rejected" }
 */
export const updateMarkStatus = async (req, res) => {
  try {
    checkMongoConnection();

    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    if (!["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be 'Approved' or 'Rejected'"
      });
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid mark ID"
      });
    }

    // Find and update the mark
    const updatedMark = await Mark.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate("teacherId", "name email");

    // Check if mark exists
    if (!updatedMark) {
      return res.status(404).json({
        success: false,
        message: "Mark not found"
      });
    }

    res.json({
      success: true,
      message: `Mark ${status === "Approved" ? "approved" : "rejected"} successfully`,
      data: updatedMark
    });
  } catch (error) {
    console.error("Error updating mark status:", error);
    if (error.message.includes("MongoDB not connected")) {
      res.status(503).json({
        success: false,
        message: "Database connection unavailable",
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Error updating mark status",
        error: error.message
      });
    }
  }
};

/**
 * Get marks by status (for filtering)
 * GET /api/marks/filter-by-status?status=Pending
 */
export const getMarksByStatus = async (req, res) => {
  try {
    checkMongoConnection();

    const { status } = req.query;

    if (status && !["Pending", "Approved", "Rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be 'Pending', 'Approved', or 'Rejected'"
      });
    }

    const filter = status ? { status } : {};
    const marks = await Mark.find(filter)
      .populate("teacherId", "name email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: Array.isArray(marks) ? marks : [],
      total: marks.length
    });
  } catch (error) {
    console.error("Error fetching marks by status:", error);
    if (error.message.includes("MongoDB not connected")) {
      res.status(503).json({
        success: false,
        message: "Database connection unavailable",
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Error fetching marks",
        error: error.message
      });
    }
  }
};
