import express from "express";
import mongoose from "mongoose";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import EventAchievement from "../models/EventAchievement.js";
import upload from "../config/multer.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const router = express.Router();

const checkMongoConnection = () => {
  if (mongoose.connection.readyState !== 1) {
    throw new Error("MongoDB not connected. Connection state: " + mongoose.connection.readyState);
  }
};

// GET /api/events - List all events and achievements (latest first)
router.get("/", async (req, res) => {
  try {
    checkMongoConnection();
    const items = await EventAchievement.find().sort({ date: -1 });
    res.json(Array.isArray(items) ? items : []);
  } catch (error) {
    console.error("Error fetching events/achievements:", error);
    if (error.message.includes("MongoDB not connected")) {
      res.status(503).json({ message: "Database connection unavailable", error: error.message });
    } else {
      res.status(500).json({ message: "Error fetching events", error: error.message });
    }
  }
});

// POST /api/events - Add event or achievement (multipart: image optional)
router.post("/", upload.single("image"), async (req, res) => {
  try {
    checkMongoConnection();

    const { type, title, description, date } = req.body;

    if (!type || !title || !description || !date) {
      return res.status(400).json({
        message: "Type, title, description and date are required",
      });
    }

    const validType = type.trim() === "Achievement" ? "Achievement" : "Event";
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: "Invalid date" });
    }

    let imagePath = null;
    if (req.file && req.file.filename) {
      imagePath = `/uploads/events/${req.file.filename}`;
    }

    const item = new EventAchievement({
      type: validType,
      title: title.trim(),
      description: description.trim(),
      date: parsedDate,
      imagePath,
    });

    const saved = await item.save();
    res.status(201).json(saved);
  } catch (error) {
    console.error("Error creating event/achievement:", error);
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        console.error("Failed to remove uploaded file on error:", e);
      }
    }
    if (error.message.includes("MongoDB not connected")) {
      res.status(503).json({ message: "Database connection unavailable", error: error.message });
    } else {
      res.status(500).json({ message: "Error creating event/achievement", error: error.message });
    }
  }
});

// DELETE /api/events/:id - Delete event/achievement and its image file if any
router.delete("/:id", async (req, res) => {
  try {
    checkMongoConnection();

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const item = await EventAchievement.findById(id);
    if (!item) {
      return res.status(404).json({ message: "Event/Achievement not found" });
    }

    if (item.imagePath) {
      const filePath = path.join(__dirname, "..", item.imagePath.replace(/^\//, ""));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await EventAchievement.findByIdAndDelete(id);
    res.json({ message: "Deleted", id });
  } catch (error) {
    console.error("Error deleting event/achievement:", error);
    if (error.message.includes("MongoDB not connected")) {
      res.status(503).json({ message: "Database connection unavailable", error: error.message });
    } else {
      res.status(500).json({ message: "Error deleting event/achievement", error: error.message });
    }
  }
});

export default router;
