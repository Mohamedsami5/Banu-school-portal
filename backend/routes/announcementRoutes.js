import express from "express";
import mongoose from "mongoose";
import Announcement from "../models/Announcement.js";

const router = express.Router();

const checkMongoConnection = () => {
  if (mongoose.connection.readyState !== 1) {
    throw new Error("MongoDB not connected. Connection state: " + mongoose.connection.readyState);
  }
};

// GET /api/announcements - List all announcements (latest first)
router.get("/", async (req, res) => {
  try {
    checkMongoConnection();

    const announcements = await Announcement.find().sort({ createdAt: -1 });
    res.json(Array.isArray(announcements) ? announcements : []);
  } catch (error) {
    console.error("Error fetching announcements:", error);
    if (error.message.includes("MongoDB not connected")) {
      res.status(503).json({ message: "Database connection unavailable", error: error.message });
    } else {
      res.status(500).json({ message: "Error fetching announcements", error: error.message });
    }
  }
});

// POST /api/announcements - Add a new announcement
router.post("/", async (req, res) => {
  try {
    checkMongoConnection();

    const { title, description, priority, createdBy } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: "Title and description are required" });
    }

    const priorityVal = (priority && String(priority).toUpperCase()) || "MEDIUM";
    const validPriority = ["HIGH", "MEDIUM", "LOW"].includes(priorityVal) ? priorityVal : "MEDIUM";

    const announcement = new Announcement({
      title: title.trim(),
      description: description.trim(),
      priority: validPriority,
      createdBy: (createdBy && createdBy.trim()) || "Admin"
    });

    const saved = await announcement.save();
    res.status(201).json(saved);
  } catch (error) {
    console.error("Error creating announcement:", error);
    if (error.message.includes("MongoDB not connected")) {
      res.status(503).json({ message: "Database connection unavailable", error: error.message });
    }
    res.status(500).json({ message: "Error creating announcement", error: error.message });
  }
});

// DELETE /api/announcements/:id - Delete an announcement
router.delete("/:id", async (req, res) => {
  try {
    checkMongoConnection();

    const { id } = req.params;
    const deleted = await Announcement.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    res.json({ message: "Announcement deleted", deleted });
  } catch (error) {
    console.error("Error deleting announcement:", error);
    if (error.message.includes("MongoDB not connected")) {
      res.status(503).json({ message: "Database connection unavailable", error: error.message });
    } else {
      res.status(500).json({ message: "Error deleting announcement", error: error.message });
    }
  }
});

export default router;
