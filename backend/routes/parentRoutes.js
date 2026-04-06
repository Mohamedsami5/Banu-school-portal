import express from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import Parent from "../models/Parent.js";
import Student from "../models/Student.js";

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

    const parents = await Parent.find().select("-password").sort({ createdAt: -1 });
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

    const {
      parentName,
      name,
      email,
      password,
      studentId,
      studentIds,
      studentName,
      className,
      section,
    } = req.body || {};

    const finalParentName = (parentName || name || "").trim();
    const normalizedEmail = (email || "").trim().toLowerCase();
    const normalizedPassword = (password || "").trim();

    const idsFromBody = Array.isArray(studentIds) ? studentIds : (studentIds ? [studentIds] : []);
    const rawIds = [
      ...(studentId ? [studentId] : []),
      ...idsFromBody,
    ];

    const normalizedStudentIds = rawIds
      .map((v) => String(v || "").trim())
      .filter((v) => mongoose.Types.ObjectId.isValid(v));

    // De-dupe while preserving order
    const seen = new Set();
    const finalStudentIds = normalizedStudentIds.filter((id) => {
      const key = String(id);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    if (!finalParentName || !normalizedEmail || !normalizedPassword || finalStudentIds.length === 0) {
      return res.status(400).json({
        message: "parentName, email, password and studentIds are required",
      });
    }

    const hashedPassword = normalizedPassword.startsWith("$2")
      ? normalizedPassword
      : bcrypt.hashSync(normalizedPassword, 10);

    const primaryStudentId = finalStudentIds[0];
    const primaryStudent = await Student.findById(primaryStudentId)
      .select("_id name className section")
      .lean();

    if (!primaryStudent) {
      return res.status(400).json({ message: "Invalid studentIds: student not found" });
    }

    const parent = new Parent({
      parentName: finalParentName,
      name: finalParentName,
      email: normalizedEmail,
      password: hashedPassword,
      studentIds: finalStudentIds,
      // Legacy fields (keep for older UI)
      studentId: primaryStudent._id,
      studentName: String(primaryStudent.name || studentName || "").trim(),
      className: String(primaryStudent.className || className || "").trim(),
      section: String(primaryStudent.section || section || "").trim(),
    });

    const savedParent = await parent.save();
    const out = savedParent.toObject ? savedParent.toObject() : { ...savedParent };
    delete out.password;
    res.status(201).json(out);
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
