import express from "express";
import mongoose from "mongoose";
import Parent from "../models/Parent.js";

const router = express.Router();

const checkMongoConnection = () => {
  if (mongoose.connection.readyState !== 1) {
    throw new Error("MongoDB not connected. Connection state: " + mongoose.connection.readyState);
  }
};

// GET /api/parents - List all parents
router.get("/", async (req, res) => {
  try {
    checkMongoConnection();

    const parents = await Parent.find().sort({ createdAt: -1 });
    res.json(Array.isArray(parents) ? parents : []);
  } catch (error) {
    console.error("Error fetching parents:", error);
    if (error.message.includes("MongoDB not connected")) {
      res.status(503).json({ message: "Database connection unavailable", error: error.message });
    } else {
      res.status(500).json({ message: "Error fetching parents", error: error.message });
    }
  }
});

// POST /api/parents - Add a new parent
router.post("/", async (req, res) => {
  try {
    checkMongoConnection();

    const { name, email, studentName, className } = req.body;

    if (!name || !email || !studentName || !className) {
      return res.status(400).json({ message: "Name, email, studentName, and className are required" });
    }

    const parent = new Parent({
      name,
      email,
      studentName,
      className
    });

    const savedParent = await parent.save();
    res.status(201).json(savedParent);
  } catch (error) {
    console.error("Error creating parent:", error);
    if (error.message.includes("MongoDB not connected")) {
      res.status(503).json({ message: "Database connection unavailable", error: error.message });
    }
    res.status(500).json({ message: "Error creating parent", error: error.message });
  }
});

// DELETE /api/parents/:id - Delete a parent
router.delete("/:id", async (req, res) => {
  try {
    checkMongoConnection();

    const { id } = req.params;
    const deleted = await Parent.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "Parent not found" });
    }

    res.json({ message: "Parent deleted", deleted });
  } catch (error) {
    console.error("Error deleting parent:", error);
    if (error.message.includes("MongoDB not connected")) {
      res.status(503).json({ message: "Database connection unavailable", error: error.message });
    } else {
      res.status(500).json({ message: "Error deleting parent", error: error.message });
    }
  }
});

export default router;
