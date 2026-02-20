import mongoose from "mongoose";
import Teacher from "../models/Teacher.js";
import Student from "../models/Student.js";
import Parent from "../models/Parent.js";
import Announcement from "../models/Announcement.js";

const checkMongoConnection = () => {
  if (mongoose.connection.readyState !== 1) {
    throw new Error("MongoDB not connected. Connection state: " + mongoose.connection.readyState);
  }
};

/**
 * Fetch dashboard statistics (counts of all entities)
 * GET /api/dashboard/stats
 */
export const getDashboardStats = async (req, res) => {
  try {
    checkMongoConnection();

    // Fetch counts from all collections using countDocuments()
    const [teacherCount, studentCount, parentCount, announcementCount] = await Promise.all([
      Teacher.countDocuments(),
      Student.countDocuments(),
      Parent.countDocuments(),
      Announcement.countDocuments()
    ]);

    res.json({
      success: true,
      data: {
        teachers: teacherCount,
        students: studentCount,
        parents: parentCount,
        announcements: announcementCount
      }
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    if (error.message.includes("MongoDB not connected")) {
      res.status(503).json({
        success: false,
        message: "Database connection unavailable",
        error: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Error fetching dashboard statistics",
        error: error.message
      });
    }
  }
};
