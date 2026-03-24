import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import Admin from "./models/Admin.js";
import Teacher from "./models/Teacher.js";
import Student from "./models/Student.js";
import Parent from "./models/Parent.js";
import Mark from "./models/Mark.js";
import Homework from "./models/Homework.js";
import HomeworkSubmission from "./models/HomeworkSubmission.js";
import LeaveApplication from "./models/LeaveApplication.js";
import announcementRoutes from "./routes/announcementRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";
import eventsRoutes from "./routes/eventsRoutes.js";
import homeworkUpload from "./config/multerHomework.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Allow CORS for development (adjust for production)
// In development, allow all origins for easier debugging
if (process.env.NODE_ENV === "production") {
  app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
  }));
} else {
  // Development: allow all origins
  app.use(cors({
    origin: true,
    credentials: true
  }));
}

app.use(express.json({ limit: "5mb" }));

app.use("/api/announcements", announcementRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/events", eventsRoutes);

// Serve uploaded event/achievement images
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Server port configuration
const PORT = process.env.PORT || 5000;

// MongoDB connection configuration
const MONGODB_URI = "mongodb://127.0.0.1:27017/BANUSchool";
const mongooseOptions = {
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 10s
  socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
};

// One-time migration: rename legacy teacher.appointmentDate -> teacher.dateOfJoining
async function migrateTeacherJoiningDateField() {
  try {
    const legacyTeachers = await Teacher.collection
      .find({ appointmentDate: { $exists: true } })
      .project({ _id: 1, appointmentDate: 1, dateOfJoining: 1 })
      .toArray();

    if (!Array.isArray(legacyTeachers) || legacyTeachers.length === 0) {
      return;
    }

    let movedCount = 0;
    let cleanedCount = 0;

    for (const t of legacyTeachers) {
      const update = { $unset: { appointmentDate: "" } };

      if (!t.dateOfJoining && t.appointmentDate) {
        update.$set = { dateOfJoining: t.appointmentDate };
        movedCount += 1;
      }

      await Teacher.collection.updateOne({ _id: t._id }, update);
      cleanedCount += 1;
    }

    console.log(
      `Teacher date migration complete: ${movedCount} moved, ${cleanedCount} cleaned`
    );
  } catch (error) {
    console.error("Teacher date migration failed:", error.message);
  }
}

// ─── Marks index migration ────────────────────────────────────────────────────
// The old unique index { rollNo, className, section, subject } (no examType)
// causes duplicate-key (11000) errors when saving marks for a second exam type.
// This function drops that stale index and removes any legacy marks that were
// saved without examType so the new index can be created cleanly.
async function migrateMarksIndex() {
  try {
    const col = Mark.collection;

    // 1. List existing indexes
    const indexes = await col.indexes();
    const oldIndexName = "rollNo_1_className_1_section_1_subject_1";
    const hasOldIndex  = indexes.some((idx) => idx.name === oldIndexName);

    if (hasOldIndex) {
      await col.dropIndex(oldIndexName);
      console.log(`[marks migration] Dropped stale index: ${oldIndexName}`);
    } else {
      console.log("[marks migration] Old index not found — skipping drop.");
    }

    // 2. Remove legacy marks that have no examType (they are invalid under the
    //    new schema and would block the new unique index from being created).
    const deleted = await col.deleteMany({ examType: { $exists: false } });
    if (deleted.deletedCount > 0) {
      console.log(`[marks migration] Removed ${deleted.deletedCount} legacy mark(s) without examType.`);
    }

    // 3. Let Mongoose sync the new index defined in the schema.
    //    createIndexes() is the Mongoose 7+ equivalent of the removed ensureIndexes().
    await Mark.createIndexes();
    console.log("[marks migration] New compound index (rollNo+className+section+subject+examType) ensured.");
  } catch (err) {
    // Log but don't crash — the server can still start; the admin can fix manually.
    console.error("[marks migration] Failed:", err.message);
  }
}

// Connect to MongoDB before starting server
mongoose.connect(MONGODB_URI, mongooseOptions)
  .then(async () => {
    console.log("MongoDB connected successfully");
    console.log(`Database: BANUSchool (marks collection created on first insert)`);
    console.log(`Connection state: ${mongoose.connection.readyState} (1 = connected)`);

    await migrateTeacherJoiningDateField();
    await migrateMarksIndex();

    // Start server only after MongoDB connection is established
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`API endpoints available at http://localhost:${PORT}/api`);
    });

    server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.error(`Port ${PORT} is already in use. Please stop the other process or change PORT.`);
        process.exit(1);
      }
      console.error("Server error:", err);
      process.exit(1);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    console.error("Please ensure MongoDB is running on 127.0.0.1:27017");
    console.error("Error details:", err);
    process.exit(1); // Exit if MongoDB connection fails
  });

// Handle MongoDB connection events
mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB disconnected. Attempting to reconnect...");
});

mongoose.connection.on("reconnected", () => {
  console.log("MongoDB reconnected successfully");
});

app.get("/", (req, res) => {
  res.send("Backend is running");
});

// Simple health route to verify reachability
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Auth login – single endpoint for admin and teacher
app.post("/api/auth/login", async (req, res) => {
  try {
    // Fail fast with a clear message if the DB is not ready
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Server is starting up. Please try again in a moment." });
    }

    const { email, password, role } = req.body;
    const normalizedEmail    = (email    && String(email).trim().toLowerCase()) || "";
    const normalizedPassword = (password && String(password).trim())            || "";

    if (!normalizedEmail || !normalizedPassword) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    if (!role || (role !== "admin" && role !== "teacher" && role !== "student")) {
      return res.status(400).json({ message: "Role must be admin, teacher or student" });
    }

    if (role === "admin") {
      const admin = await Admin.findOne({
        email: normalizedEmail,
        password: normalizedPassword
      });
      if (!admin) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      const user = admin.toObject ? admin.toObject() : { ...admin };
      delete user.password;
      const out = { ...user, role: "admin" };
      return res.json(out);
    }

    if (role === "teacher") {
      const teacher = await Teacher.findOne({ email: normalizedEmail });
      if (!teacher) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      const storedPassword = teacher.password || "";
      const passwordMatch = storedPassword.startsWith("$2")
        ? bcrypt.compareSync(normalizedPassword, storedPassword)
        : storedPassword === normalizedPassword;
      if (!passwordMatch) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      const user = teacher.toObject ? teacher.toObject() : { ...teacher };
      delete user.password;
      const out = { ...user, role: "teacher" };
      return res.json(out);
    }

    if (role === "student") {
      const student = await Student.findOne({ email: normalizedEmail });
      if (!student) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      const storedPassword = student.password || "";
      const passwordMatch = storedPassword.startsWith("$2")
        ? bcrypt.compareSync(normalizedPassword, storedPassword)
        : storedPassword === normalizedPassword;
      if (!passwordMatch) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      const user = student.toObject ? student.toObject() : { ...student };
      delete user.password;
      const out = {
        ...user,
        role: "student",
        userId: user._id,
        email: user.email,
      };
      return res.json(out);
    }
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Login failed" });
  }
});

// Helper function to check MongoDB connection
const checkMongoConnection = () => {
  if (mongoose.connection.readyState !== 1) {
    throw new Error("MongoDB not connected. Connection state: " + mongoose.connection.readyState);
  }
};

// Teacher routes
// GET /api/teachers - List all teachers
app.get("/api/teachers", async (req, res) => {
  try {
    checkMongoConnection();
    const teachers = await Teacher.find().select("-password").sort({ createdAt: -1 });
    res.json(Array.isArray(teachers) ? teachers : []);
  } catch (error) {
    console.error("Error fetching teachers:", error);
    if (error.message.includes("MongoDB not connected")) {
      res.status(503).json({ message: "Database connection unavailable", error: error.message });
    } else {
      res.status(500).json({ message: "Error fetching teachers", error: error.message });
    }
  }
});

async function addTeacherHandler(req, res) {
  try {
    checkMongoConnection();
    const { name, email, password, status, teaching, dateOfJoining, appointmentDate } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: "Name and email are required" });
    }
    if (!password || String(password).trim() === "") {
      return res.status(400).json({ message: "Teacher password is required" });
    }

    const teachingArr = Array.isArray(teaching)
      ? teaching
          .filter((t) => t && (t.className || t.subject || t.class))
          .map((t) => ({
            className: String(t.className || t.class || "").trim(),
            section: String(t.section || "A").trim(),
            subject: String(t.subject || "").trim()
          }))
      : [];

    // Handle dateOfJoining (fallback to legacy appointmentDate payload)
    const joiningDateInput = dateOfJoining !== undefined ? dateOfJoining : appointmentDate;
    let dateOfJoiningValue = null;
    if (joiningDateInput && String(joiningDateInput).trim()) {
      const joinDate = new Date(joiningDateInput);
      if (!isNaN(joinDate.getTime())) {
        dateOfJoiningValue = joinDate;
      }
    }

    const hashedPassword = bcrypt.hashSync(String(password).trim(), 10);
    const teacher = new Teacher({
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      password: hashedPassword,
      teaching: teachingArr,
      status: status || "Active",
      role: "teacher",
      dateOfJoining: dateOfJoiningValue
    });

    const savedTeacher = await teacher.save();
    const out = savedTeacher.toObject ? savedTeacher.toObject() : { ...savedTeacher };
    delete out.password;
    res.status(201).json(out);
  } catch (error) {
    console.error("Error creating teacher:", error);
    if (error.message.includes("MongoDB not connected")) {
      res.status(503).json({ message: "Database connection unavailable", error: error.message });
    } else if (error.code === 11000) {
      return res.status(400).json({ message: "Email already exists" });
    }
    res.status(500).json({ message: "Error creating teacher", error: error.message });
  }
}

app.post("/api/teachers", addTeacherHandler);
app.post("/api/admin/teachers", addTeacherHandler);

// Admin: Update teacher class/subject assignment, status, and date of joining
app.put("/api/admin/teachers/:id/classes", async (req, res) => {
  try {
    checkMongoConnection();
    const { id } = req.params;
    const { teaching, status, dateOfJoining, appointmentDate } = req.body;

    const teachingArr = Array.isArray(teaching)
      ? teaching
          .filter((t) => t && (t.className || t.class || t.subject))
          .map((t) => ({
            className: String(t.className || t.class || "").trim(),
            section: String(t.section || "A").trim(),
            subject: String(t.subject || "").trim()
          }))
      : undefined;

    const update = {};
    if (teachingArr) update.teaching = teachingArr;
    if (status !== undefined) update.status = String(status).trim();
    const joiningDateInput = dateOfJoining !== undefined ? dateOfJoining : appointmentDate;
    if (joiningDateInput !== undefined) {
      if (joiningDateInput === null || joiningDateInput === "") {
        update.dateOfJoining = null;
      } else {
        const joinDate = new Date(joiningDateInput);
        if (isNaN(joinDate.getTime())) {
          return res.status(400).json({ message: "Invalid date of joining format" });
        }
        update.dateOfJoining = joinDate;
      }
    }

    const teacher = await Teacher.findByIdAndUpdate(id, update, { new: true }).select("-password");
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }
    res.json(teacher);
  } catch (error) {
    console.error("Error updating teacher classes:", error);
    if (error.message.includes("MongoDB not connected")) {
      res.status(503).json({ message: "Database connection unavailable", error: error.message });
    } else {
      res.status(500).json({ message: "Error updating teacher", error: error.message });
    }
  }
});

// Admin: Add (append) a single teaching assignment to teacher
app.post("/api/admin/teachers/:id/teaching", async (req, res) => {
  try {
    checkMongoConnection();
    const { id } = req.params;
    const { className, section, subject } = req.body;

    if (!className || !subject) {
      return res.status(400).json({ message: "className and subject are required" });
    }

    const teacher = await Teacher.findById(id);
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    // Add the new teaching assignment
    const newAssignment = {
      className: String(className).trim(),
      section: String(section || "A").trim(),
      subject: String(subject).trim()
    };

    teacher.teaching.push(newAssignment);
    const savedTeacher = await teacher.save();
    const out = savedTeacher.toObject ? savedTeacher.toObject() : { ...savedTeacher };
    delete out.password;

    res.status(201).json(out);
  } catch (error) {
    console.error("Error adding teaching assignment:", error);
    if (error.message.includes("MongoDB not connected")) {
      res.status(503).json({ message: "Database connection unavailable", error: error.message });
    } else {
      res.status(500).json({ message: "Error adding teaching assignment", error: error.message });
    }
  }
});

// Admin: Remove a teaching assignment from teacher
app.delete("/api/admin/teachers/:id/teaching/:index", async (req, res) => {
  try {
    checkMongoConnection();
    const { id, index } = req.params;
    const idx = parseInt(index, 10);

    const teacher = await Teacher.findById(id);
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    if (idx < 0 || idx >= teacher.teaching.length) {
      return res.status(400).json({ message: "Invalid teaching assignment index" });
    }

    teacher.teaching.splice(idx, 1);
    const savedTeacher = await teacher.save();
    const out = savedTeacher.toObject ? savedTeacher.toObject() : { ...savedTeacher };
    delete out.password;

    res.json(out);
  } catch (error) {
    console.error("Error removing teaching assignment:", error);
    if (error.message.includes("MongoDB not connected")) {
      res.status(503).json({ message: "Database connection unavailable", error: error.message });
    } else {
      res.status(500).json({ message: "Error removing teaching assignment", error: error.message });
    }
  }
});

// Admin: Update teacher credentials (email and/or password)
app.put("/api/admin/teachers/:id/credentials", async (req, res) => {
  try {
    checkMongoConnection();
    const { id } = req.params;
    const { email, password } = req.body;

    const teacher = await Teacher.findById(id);
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const update = {};
    if (email !== undefined && String(email).trim()) {
      update.email = String(email).trim().toLowerCase();
    }
    if (password !== undefined && String(password).trim()) {
      update.password = bcrypt.hashSync(String(password).trim(), 10);
    }
    if (Object.keys(update).length === 0) {
      return res.status(400).json({ message: "Provide email or password to update" });
    }

    Object.assign(teacher, update);
    await teacher.save();
    const out = teacher.toObject ? teacher.toObject() : { ...teacher };
    delete out.password;
    res.json(out);
  } catch (error) {
    console.error("Error updating teacher credentials:", error);
    if (error.message.includes("MongoDB not connected")) {
      res.status(503).json({ message: "Database connection unavailable", error: error.message });
    } else if (error.code === 11000) {
      return res.status(400).json({ message: "Email already exists" });
    }
    res.status(500).json({ message: "Error updating credentials", error: error.message });
  }
});

// Admin: Update teacher date of joining (supports legacy appointmentDate key)
app.put("/api/admin/teachers/:id/appointment-date", async (req, res) => {
  try {
    checkMongoConnection();
    const { id } = req.params;
    const { dateOfJoining, appointmentDate } = req.body;

    const teacher = await Teacher.findById(id);
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const joiningDateInput = dateOfJoining !== undefined ? dateOfJoining : appointmentDate;
    if (joiningDateInput !== undefined) {
      if (joiningDateInput === null || joiningDateInput === "") {
        teacher.dateOfJoining = null;
      } else {
        const joinDate = new Date(joiningDateInput);
        if (isNaN(joinDate.getTime())) {
          return res.status(400).json({ message: "Invalid date of joining format" });
        }
        teacher.dateOfJoining = joinDate;
      }
    }

    await teacher.save();
    const out = teacher.toObject ? teacher.toObject() : { ...teacher };
    delete out.password;
    res.json(out);
  } catch (error) {
    console.error("Error updating date of joining:", error);
    if (error.message.includes("MongoDB not connected")) {
      res.status(503).json({ message: "Database connection unavailable", error: error.message });
    } else {
      res.status(500).json({ message: "Error updating date of joining", error: error.message });
    }
  }
});

// DELETE /api/teachers/:id - Delete a teacher by MongoDB _id
app.delete("/api/teachers/:id", async (req, res) => {
  try {
    checkMongoConnection();
    const { id } = req.params;
    console.log("DELETE /api/teachers/ id:", id);
    const teacher = await Teacher.findByIdAndDelete(id);
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }
    res.json({ message: "Teacher deleted" });
  } catch (error) {
    console.error("Error deleting teacher:", error);
    if (error.message.includes("MongoDB not connected")) {
      res.status(503).json({ message: "Database connection unavailable", error: error.message });
    } else {
      res.status(500).json({ message: "Error deleting teacher", error: error.message });
    }
  }
});

// Student routes
// GET /api/students - List all students (optional query: class, section)
app.get("/api/students", async (req, res) => {
  try {
    checkMongoConnection();
    const { class: classQ, section } = req.query;
    const filter = {};
    if (classQ) filter.className = String(classQ).trim();
    if (section) {
      const sec = String(section).trim();
      filter.section = sec;
    }
    const students = await Student.find(filter).sort({ rollNo: 1, createdAt: -1 });
    res.json(Array.isArray(students) ? students : []);
  } catch (error) {
    console.error("Error fetching students:", error);
    if (error.message.includes("MongoDB not connected")) {
      res.status(503).json({ message: "Database connection unavailable", error: error.message });
    } else {
      res.status(500).json({ message: "Error fetching students", error: error.message });
    }
  }
});

// Leave application routes
// POST /api/leave/apply - student applies for leave
app.post("/api/leave/apply", async (req, res) => {
  try {
    checkMongoConnection();

    const {
      studentId,
      studentName,
      rollNo,
      className,
      section,
      leaveType,
      startDate,
      endDate,
      reason,
    } = req.body || {};

    if (
      !studentId ||
      !studentName ||
      !rollNo ||
      !className ||
      !section ||
      !leaveType ||
      !startDate ||
      !endDate
    ) {
      return res.status(400).json({
        message:
          "studentId, studentName, rollNo, className, section, leaveType, startDate and endDate are required",
      });
    }

    const parsedStart = new Date(startDate);
    const parsedEnd = new Date(endDate);
    if (isNaN(parsedStart.getTime()) || isNaN(parsedEnd.getTime())) {
      return res.status(400).json({ message: "Invalid startDate or endDate format" });
    }
    if (parsedEnd < parsedStart) {
      return res.status(400).json({ message: "End Date cannot be before Start Date" });
    }

    const leave = new LeaveApplication({
      studentId,
      studentName: String(studentName).trim(),
      rollNo: String(rollNo).trim(),
      className: String(className).trim(),
      section: String(section).trim(),
      leaveType: String(leaveType).trim(),
      startDate: parsedStart,
      endDate: parsedEnd,
      reason: reason ? String(reason).trim() : "",
      status: "Pending",
    });

    const saved = await leave.save();
    return res.status(201).json(saved);
  } catch (error) {
    console.error("Error applying for leave:", error.stack || error);
    if (error.message && error.message.includes("MongoDB not connected")) {
      return res
        .status(503)
        .json({ message: "Database connection unavailable", error: error.message });
    }
    return res
      .status(500)
      .json({ message: "Error applying for leave", error: error.message });
  }
});

// GET /api/leave - list leave applications
// Optional filters: studentId, status, className, section
app.get("/api/leave", async (req, res) => {
  try {
    checkMongoConnection();
    const { studentId, status, className, section } = req.query;

    const filter = {};
    if (studentId && mongoose.Types.ObjectId.isValid(studentId)) {
      filter.studentId = studentId;
    }
    if (status) {
      filter.status = String(status).trim();
    }
    if (className) {
      filter.className = String(className).trim();
    }
    if (section) {
      filter.section = String(section).trim();
    }

    const leaves = await LeaveApplication.find(filter)
      .sort({ appliedAt: -1 })
      .lean();

    return res.json(Array.isArray(leaves) ? leaves : []);
  } catch (error) {
    console.error("Error fetching leave applications:", error.stack || error);
    if (error.message && error.message.includes("MongoDB not connected")) {
      return res
        .status(503)
        .json({ message: "Database connection unavailable", error: error.message });
    }
    return res
      .status(500)
      .json({ message: "Error fetching leave applications", error: error.message });
  }
});

// PUT /api/leave/:id/status - approve / reject leave (with validation when approving)
app.put("/api/leave/:id/status", async (req, res) => {
  try {
    checkMongoConnection();
    const { id } = req.params;
    const { status } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid leave application ID" });
    }

    if (!["Pending", "Approved", "Rejected"].includes(status)) {
      return res
        .status(400)
        .json({ message: "Status must be Pending, Approved, or Rejected" });
    }

    const leave = await LeaveApplication.findById(id);
    if (!leave) {
      return res.status(404).json({ message: "Leave application not found" });
    }

    // Prevent approving/rejecting already processed requests
    if (leave.status !== "Pending") {
      return res.status(400).json({
        message: "This leave request has already been processed. Only pending requests can be approved or rejected.",
      });
    }

    // When approving, validate leave dates and type
    if (status === "Approved") {
      const start = leave.startDate ? new Date(leave.startDate) : null;
      const end = leave.endDate ? new Date(leave.endDate) : null;
      if (!start || !end) {
        return res.status(400).json({
          message: "Leave application has invalid or missing dates. Cannot approve.",
        });
      }
      if (end < start) {
        return res.status(400).json({
          message: "End date cannot be earlier than start date. Cannot approve.",
        });
      }
      const leaveType = (leave.leaveType || "Leave").toString().trim();
      if (leaveType === "Medical") {
        const oneDayMs = 24 * 60 * 60 * 1000;
        const daysDiff = (end.getTime() - start.getTime()) / oneDayMs;
        if (daysDiff < 1) {
          return res.status(400).json({
            message: "Medical leave must be for at least 2 days. Cannot approve.",
          });
        }
      }
    }

    const updated = await LeaveApplication.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true }
    );

    return res.json({
      message: `Leave ${status === "Approved" ? "approved" : status === "Rejected" ? "rejected" : "updated"} successfully`,
      data: updated,
    });
  } catch (error) {
    console.error("Error updating leave status:", error.stack || error);
    if (error.message && error.message.includes("MongoDB not connected")) {
      return res
        .status(503)
        .json({ message: "Database connection unavailable", error: error.message });
    }
    return res
      .status(500)
      .json({ message: "Error updating leave status", error: error.message });
  }
});

// POST /api/students - Add a new student
app.post("/api/students", async (req, res) => {
  try {
    checkMongoConnection();
    console.log("POST /api/students body:", JSON.stringify(req.body));
    const { name, email, className, section, rollNo, parentName, parentEmail, password } = req.body;

    if (!name || !email || !className || !rollNo || !section) {
      return res.status(400).json({ message: "Name, email, className, section and rollNo are required" });
    }
    if (!password || !String(password).trim()) {
      return res.status(400).json({ message: "Password is required" });
    }

    const rollNoStr = String(rollNo).trim();
    const passwordStr = String(password).trim();

    console.log("Submitted rollNo:", rollNoStr, "for class:", className, "section:", section);

    const student = new Student({
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      className: String(className).trim(),
      section: String(section).trim(),
      rollNo: rollNoStr,
      parentName: parentName || "",
      parentEmail: parentEmail || "",
      password: passwordStr,
    });

    const savedStudent = await student.save();
    res.status(201).json(savedStudent);
  } catch (error) {
    console.error("Error creating student:", error.stack || error);
    if (error.message.includes("MongoDB not connected")) {
      res.status(503).json({ message: "Database connection unavailable", error: error.message });
    } else if (error.code === 11000) {
      // Determine whether rollNo duplicate or email duplicate
      if (error.message && error.message.includes('className_1_rollNo_1')) {
        return res.status(400).json({ message: "Roll number already exists for this class" });
      }
      if (error.message && error.message.includes('email_1')) {
        return res.status(400).json({ message: "Email already exists" });
      }
      return res.status(400).json({ message: "Duplicate key error", error: error.message });
    }
    res.status(500).json({ message: "Error creating student", error: error.message });
  }
});

// PUT /api/students/:id - Update existing student (admin editable fields)
app.put("/api/students/:id", async (req, res) => {
  try {
    checkMongoConnection();
    const { id } = req.params;
    const { name, email, className, section, rollNo, parentName, parentEmail } = req.body;

    if (!name || !email || !className || !rollNo || !section) {
      return res.status(400).json({ message: "Name, email, className, section and rollNo are required" });
    }

    console.log("PUT /api/students/:id", id, "rollNo:", rollNo, "class:", className, "section:", section);

    // Check for existing rollNo in the same class (exclude current student)
    const existing = await Student.findOne({ className: String(className).trim(), rollNo: String(rollNo).trim(), _id: { $ne: id } });
    if (existing) {
      return res.status(400).json({ message: "Roll number already exists for this class" });
    }

    const update = {
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      className: String(className).trim(),
      section: String(section).trim(),
      rollNo: String(rollNo).trim(),
      parentName: parentName || "",
      parentEmail: parentEmail || ""
    };

    const student = await Student.findByIdAndUpdate(id, update, { new: true });
    if (!student) return res.status(404).json({ message: "Student not found" });

    console.log("Updated student:", student._id);
    res.json(student);
  } catch (error) {
    console.error("Error updating student:", error.stack || error);
    if (error.message && error.message.includes('className_1_rollNo_1')) {
      return res.status(400).json({ message: "Roll number already exists for this class" });
    }
    res.status(500).json({ message: "Error updating student", error: error.message });
  }
});

// DELETE /api/students/:id - Delete student by MongoDB _id
app.delete("/api/students/:id", async (req, res) => {
  try {
    checkMongoConnection();
    const { id } = req.params;
    console.log("DELETE /api/students/ id:", id);
    const student = await Student.findByIdAndDelete(id);
    if (!student) return res.status(404).json({ message: "Student not found" });
    res.json({ message: "Student deleted" });
  } catch (error) {
    console.error("Error deleting student:", error);
    if (error.message && error.message.includes('MongoDB not connected')) {
      return res.status(503).json({ message: "Database connection unavailable", error: error.message });
    }
    res.status(500).json({ message: "Error deleting student", error: error.message });
  }
});

// Admin endpoint: backfill missing rollNo (sets rollNo to _id string for students missing it)
app.post("/api/admin/students/backfill-rollno", async (req, res) => {
  try {
    checkMongoConnection();
    const students = await Student.find({ $or: [{ rollNo: { $exists: false } }, { rollNo: "" }, { rollNo: null }] });
    if (!students || students.length === 0) return res.json({ updated: 0, message: "No students to backfill" });
    const ops = students.map((s) => ({ updateOne: { filter: { _id: s._id }, update: { $set: { rollNo: String(s._id) } } } }));
    const result = await Student.bulkWrite(ops);
    res.json({ updated: result.modifiedCount || result.nModified || students.length });
  } catch (err) {
    console.error("Error backfilling rollNo:", err.stack || err);
    res.status(500).json({ message: "Failed to backfill roll numbers", error: err.message });
  }
});

// Parent routes (same MongoDB connection as teachers/students - uses BANUSchool database, parents collection)
// GET /api/parents - List all parents
app.get("/api/parents", async (req, res) => {
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

// POST /api/parents - Add a new parent (creates document in MongoDB parents collection)
app.post("/api/parents", async (req, res) => {
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
app.delete("/api/parents/:id", async (req, res) => {
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

// Teacher: classes assigned to logged-in teacher
app.get("/api/teacher/classes", async (req, res) => {
  try {
    checkMongoConnection();
    const teacherId = req.query.teacherId;
    const teacherEmail = req.query.teacherEmail;
    if (!teacherId && !teacherEmail) {
      return res.status(400).json({ message: "teacherId or teacherEmail is required" });
    }
    const teacher = teacherId
      ? await Teacher.findById(teacherId).select("teaching")
      : await Teacher.findOne({ email: String(teacherEmail).trim().toLowerCase() }).select("teaching");
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }
    const teaching = Array.isArray(teacher.teaching) ? teacher.teaching : [];
    res.json(teaching);
  } catch (error) {
    console.error("Error fetching teacher classes:", error);
    if (error.message.includes("MongoDB not connected")) {
      res.status(503).json({ message: "Database connection unavailable", error: error.message });
    } else {
      res.status(500).json({ message: "Error fetching classes", error: error.message });
    }
  }
});

// Teacher profile - fetch logged-in teacher details
app.get("/api/teacher/profile", async (req, res) => {
  try {
    checkMongoConnection();
    const teacherId = req.query.teacherId;
    const teacherEmail = req.query.teacherEmail;

    if (!teacherId && !teacherEmail) {
      return res.status(400).json({ message: "teacherId or teacherEmail is required" });
    }

    const teacher = teacherId
      ? await Teacher.findById(teacherId).select("-password")
      : await Teacher.findOne({ email: String(teacherEmail).trim().toLowerCase() }).select("-password");

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    return res.json(teacher);
  } catch (error) {
    console.error("Error fetching teacher profile:", error);
    if (error.message.includes("MongoDB not connected")) {
      return res.status(503).json({ message: "Database connection unavailable", error: error.message });
    }
    return res.status(500).json({ message: "Error fetching teacher profile", error: error.message });
  }
});

// Teacher profile - update additional profile info and photo (teacher-editable fields only)
// Admin-controlled fields (name, email, teaching, status, dateOfJoining) are NOT updatable here
app.put("/api/teacher/profile/:id", async (req, res) => {
  try {
    checkMongoConnection();
    const { id } = req.params;
    const { phone, qualification, experience, address, bio, photo, fatherName, motherName, dateOfBirth, languagesKnown, areaOfSpecialization } = req.body || {};

    const teacher = await Teacher.findById(id);
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const normalize = (v) => (v === undefined || v === null ? "" : String(v).trim());

    // Only allow teacher-editable fields (admin-controlled fields are protected)
    if (phone !== undefined) teacher.phone = normalize(phone);
    if (qualification !== undefined) teacher.qualification = normalize(qualification);
    if (experience !== undefined) {
      const exp = normalize(experience);
      // Validate experience is a number or contains "years"
      if (exp && isNaN(parseFloat(exp)) && !exp.toLowerCase().includes("year")) {
        return res.status(400).json({ message: "Experience should be a number or contain 'years'" });
      }
      teacher.experience = exp;
    }
    if (address !== undefined) teacher.address = normalize(address);
    if (bio !== undefined) teacher.bio = normalize(bio);
    if (photo !== undefined) teacher.photo = String(photo || "").trim();
    if (areaOfSpecialization !== undefined) teacher.areaOfSpecialization = normalize(areaOfSpecialization);
    
    // New additional information fields
    if (fatherName !== undefined) teacher.fatherName = normalize(fatherName);
    if (motherName !== undefined) teacher.motherName = normalize(motherName);
    if (dateOfBirth !== undefined) {
      if (dateOfBirth === null || dateOfBirth === "") {
        teacher.dateOfBirth = null;
      } else {
        const dob = new Date(dateOfBirth);
        if (isNaN(dob.getTime())) {
          return res.status(400).json({ message: "Invalid date of birth format" });
        }
        // Validate DOB is not in the future
        if (dob > new Date()) {
          return res.status(400).json({ message: "Date of birth cannot be in the future" });
        }
        teacher.dateOfBirth = dob;
      }
    }
    if (languagesKnown !== undefined) {
      // Accept both array and comma-separated string
      if (Array.isArray(languagesKnown)) {
        teacher.languagesKnown = languagesKnown.filter(l => l && String(l).trim()).map(l => String(l).trim());
      } else if (typeof languagesKnown === "string") {
        teacher.languagesKnown = languagesKnown.split(",").map(l => l.trim()).filter(l => l);
      } else {
        teacher.languagesKnown = [];
      }
    }

    await teacher.save();
    const out = teacher.toObject ? teacher.toObject() : { ...teacher };
    delete out.password;
    if (!out.role) out.role = "teacher";
    return res.json(out);
  } catch (error) {
    console.error("Error updating teacher profile:", error);
    if (error.message.includes("MongoDB not connected")) {
      return res.status(503).json({ message: "Database connection unavailable", error: error.message });
    }
    return res.status(500).json({ message: "Error updating teacher profile", error: error.message });
  }
});

// Alternative endpoint: GET /api/teachers/:id/profile - Get teacher profile by ID
app.get("/api/teachers/:id/profile", async (req, res) => {
  try {
    checkMongoConnection();
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Teacher ID is required" });
    }

    const teacher = await Teacher.findById(id).select("-password");

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    return res.json(teacher);
  } catch (error) {
    console.error("Error fetching teacher profile:", error);
    if (error.message.includes("MongoDB not connected")) {
      return res.status(503).json({ message: "Database connection unavailable", error: error.message });
    }
    return res.status(500).json({ message: "Error fetching teacher profile", error: error.message });
  }
});

// POST /api/teacher/profile - Save or update teacher profile (creates/updates profile and sets profileCompleted = true)
  app.post("/api/teacher/profile", async (req, res) => {
    try {
      checkMongoConnection();
      const { teacherId, fatherName, motherName, dateOfBirth, phoneNumber, languagesKnown, qualification, experience, address, profilePhoto, areaOfSpecialization } = req.body;

    if (!teacherId) {
      return res.status(400).json({ message: "Teacher ID is required" });
    }

    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const normalize = (v) => (v === undefined || v === null ? "" : String(v).trim());

    // Update teacher-editable fields
    if (fatherName !== undefined) teacher.fatherName = normalize(fatherName);
    if (motherName !== undefined) teacher.motherName = normalize(motherName);
    if (phoneNumber !== undefined) {
      const phoneValue = normalize(phoneNumber);
      // Validate phone number format if provided
      if (phoneValue && !/^[\d\s\-\+\(\)]+$/.test(phoneValue)) {
        return res.status(400).json({ message: "Invalid phone number format" });
      }
      teacher.phone = phoneValue;
    }
    if (qualification !== undefined) teacher.qualification = normalize(qualification);
    if (experience !== undefined) {
      const exp = normalize(experience);
      // Validate experience format
      if (exp && isNaN(parseFloat(exp)) && !exp.toLowerCase().includes("year")) {
        return res.status(400).json({ message: "Experience should be a number or contain 'years'" });
      }
      teacher.experience = exp;
    }
      if (address !== undefined) teacher.address = normalize(address);
      if (areaOfSpecialization !== undefined) {
        teacher.areaOfSpecialization = normalize(areaOfSpecialization);
      }
    
    // Handle date of birth
    if (dateOfBirth !== undefined) {
      if (dateOfBirth === null || dateOfBirth === "") {
        teacher.dateOfBirth = null;
      } else {
        const dob = new Date(dateOfBirth);
        if (isNaN(dob.getTime())) {
          return res.status(400).json({ message: "Invalid date of birth format" });
        }
        if (dob > new Date()) {
          return res.status(400).json({ message: "Date of birth cannot be in the future" });
        }
        teacher.dateOfBirth = dob;
      }
    }
    
    // Handle languages known
      if (languagesKnown !== undefined) {
        if (Array.isArray(languagesKnown)) {
          teacher.languagesKnown = languagesKnown.filter(l => l && String(l).trim()).map(l => String(l).trim());
        } else if (typeof languagesKnown === "string") {
          teacher.languagesKnown = languagesKnown.split(",").map(l => l.trim()).filter(l => l);
        } else {
          teacher.languagesKnown = [];
        }
      }
    
    // Handle profile photo URL
    if (profilePhoto !== undefined) {
      teacher.profilePhoto = String(profilePhoto || "").trim();
      // Also update the photo field for backward compatibility
      teacher.photo = String(profilePhoto || "").trim();
    }

    // Set profileCompleted to true when profile is saved
    teacher.profileCompleted = true;

    await teacher.save();
    const out = teacher.toObject ? teacher.toObject() : { ...teacher };
    delete out.password;
    if (!out.role) out.role = "teacher";
    return res.json({ ...out, message: "Profile saved successfully" });
  } catch (error) {
    console.error("Error saving teacher profile:", error);
    if (error.message.includes("MongoDB not connected")) {
      return res.status(503).json({ message: "Database connection unavailable", error: error.message });
    }
    return res.status(500).json({ message: "Error saving teacher profile", error: error.message });
  }
});

// GET /api/teacher/profile/:teacherId - Get teacher profile by teacherId
app.get("/api/teacher/profile/:teacherId", async (req, res) => {
  try {
    checkMongoConnection();
    const { teacherId } = req.params;

    if (!teacherId) {
      return res.status(400).json({ message: "Teacher ID is required" });
    }

    const teacher = await Teacher.findById(teacherId).select("-password");
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    // Get subjects handled from teaching assignments
    const subjectsHandled = Array.isArray(teacher.teaching) 
      ? teacher.teaching.map(t => ({
          className: t.className,
          section: t.section,
          subject: t.subject
        }))
      : [];

    // Calculate age from dateOfBirth
    let age = null;
    if (teacher.dateOfBirth) {
      const dob = new Date(teacher.dateOfBirth);
      if (!isNaN(dob.getTime())) {
        const today = new Date();
        age = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
          age--;
        }
      }
    }

    const profile = {
      _id: teacher._id,
      name: teacher.name,
      email: teacher.email,
      subjectsHandled: subjectsHandled,
      dateOfJoining: teacher.dateOfJoining,
      fatherName: teacher.fatherName || "",
      motherName: teacher.motherName || "",
      dateOfBirth: teacher.dateOfBirth,
      age: age,
      phoneNumber: teacher.phone || "",
      languagesKnown: Array.isArray(teacher.languagesKnown) ? teacher.languagesKnown : [],
      qualification: teacher.qualification || "",
      areaOfSpecialization: teacher.areaOfSpecialization || "",
      experience: teacher.experience || "",
      address: teacher.address || "",
      profilePhoto: teacher.profilePhoto || teacher.photo || "",
      profileCompleted: teacher.profileCompleted || false,
      role: teacher.role || "teacher"
    };

    return res.json(profile);
  } catch (error) {
    console.error("Error fetching teacher profile:", error);
    if (error.message.includes("MongoDB not connected")) {
      return res.status(503).json({ message: "Database connection unavailable", error: error.message });
    }
    return res.status(500).json({ message: "Error fetching teacher profile", error: error.message });
  }
});

// Alternative endpoint: PUT /api/teachers/:id/profile - Update teacher profile (teacher-editable fields only)
app.put("/api/teachers/:id/profile", async (req, res) => {
  try {
    checkMongoConnection();
    const { id } = req.params;
    const { phone, qualification, experience, address, bio, photo, fatherName, motherName, dateOfBirth, languagesKnown } = req.body || {};

    const teacher = await Teacher.findById(id);
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const normalize = (v) => (v === undefined || v === null ? "" : String(v).trim());

    // Only allow teacher-editable fields (admin-controlled fields are protected)
    if (phone !== undefined) {
      const phoneValue = normalize(phone);
      // Validate phone number format if provided
      if (phoneValue && !/^[\d\s\-\+\(\)]+$/.test(phoneValue)) {
        return res.status(400).json({ message: "Invalid phone number format" });
      }
      teacher.phone = phoneValue;
    }
    if (qualification !== undefined) teacher.qualification = normalize(qualification);
    if (experience !== undefined) {
      const exp = normalize(experience);
      // Validate experience is a number or contains "years"
      if (exp && isNaN(parseFloat(exp)) && !exp.toLowerCase().includes("year")) {
        return res.status(400).json({ message: "Experience should be a number or contain 'years'" });
      }
      teacher.experience = exp;
    }
    if (address !== undefined) teacher.address = normalize(address);
    if (bio !== undefined) teacher.bio = normalize(bio);
    if (photo !== undefined) teacher.photo = String(photo || "").trim();
    
    // New additional information fields
    if (fatherName !== undefined) teacher.fatherName = normalize(fatherName);
    if (motherName !== undefined) teacher.motherName = normalize(motherName);
    if (dateOfBirth !== undefined) {
      if (dateOfBirth === null || dateOfBirth === "") {
        teacher.dateOfBirth = null;
      } else {
        const dob = new Date(dateOfBirth);
        if (isNaN(dob.getTime())) {
          return res.status(400).json({ message: "Invalid date of birth format" });
        }
        // Validate DOB is not in the future
        if (dob > new Date()) {
          return res.status(400).json({ message: "Date of birth cannot be in the future" });
        }
        teacher.dateOfBirth = dob;
      }
    }
    if (languagesKnown !== undefined) {
      // Accept both array and comma-separated string
      if (Array.isArray(languagesKnown)) {
        teacher.languagesKnown = languagesKnown.filter(l => l && String(l).trim()).map(l => String(l).trim());
      } else if (typeof languagesKnown === "string") {
        teacher.languagesKnown = languagesKnown.split(",").map(l => l.trim()).filter(l => l);
      } else {
        teacher.languagesKnown = [];
      }
    }

    await teacher.save();
    const out = teacher.toObject ? teacher.toObject() : { ...teacher };
    delete out.password;
    if (!out.role) out.role = "teacher";
    return res.json(out);
  } catch (error) {
    console.error("Error updating teacher profile:", error);
    if (error.message.includes("MongoDB not connected")) {
      return res.status(503).json({ message: "Database connection unavailable", error: error.message });
    }
    return res.status(500).json({ message: "Error updating teacher profile", error: error.message });
  }
});

// Alias for teacher classes (Assign Class & Student Marks flow)
app.get("/api/teacher/assignments", async (req, res) => {
  try {
    checkMongoConnection();
    const teacherId = req.query.teacherId;
    const teacherEmail = req.query.teacherEmail;
    if (!teacherId && !teacherEmail) {
      return res.status(400).json({ message: "teacherId or teacherEmail is required" });
    }
    const teacher = teacherId
      ? await Teacher.findById(teacherId).select("teaching")
      : await Teacher.findOne({ email: String(teacherEmail).trim().toLowerCase() }).select("teaching");
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });
    res.json(Array.isArray(teacher.teaching) ? teacher.teaching : []);
  } catch (err) {
    console.error("Error fetching teacher assignments:", err);
    res.status(500).json({ message: err.message || "Error fetching assignments" });
  }
});

// Mark routes - teacher uploads
// GET /api/marks/analytics/student-progress
// Returns exam-wise approved marks for a single student in a given class/section/subject.
// Query params: rollNo, className, section, subject
// Response: { student, subject, className, section, exams: [{ examType, marks, result }] }
app.get("/api/marks/analytics/student-progress", async (req, res) => {
  try {
    checkMongoConnection();

    const { rollNo, className, section, subject } = req.query;

    if (!rollNo || !className || !section || !subject) {
      return res.status(400).json({
        message: "rollNo, className, section, and subject are required"
      });
    }

    const EXAM_ORDER = ["Quarterly", "MidTerm", "HalfYearly", "Annual"];
    const PASS_MARK  = 35;

    // Only approved marks count for the progress chart
    const records = await Mark.find({
      rollNo:    String(rollNo).trim(),
      className: String(className).trim(),
      section:   String(section).trim(),
      subject:   String(subject).trim(),
      status:    "Approved",
    }).select("examType marks studentName").lean();

    // Build an ordered array — only include exams that have approved data
    const examMap = {};
    records.forEach((r) => { examMap[r.examType] = r; });

    const exams = EXAM_ORDER
      .filter((et) => examMap[et] !== undefined)
      .map((et) => ({
        examType: et,
        marks:    examMap[et].marks,
        result:   examMap[et].marks >= PASS_MARK ? "Pass" : "Fail",
      }));

    const studentName = records.length > 0 ? records[0].studentName : "";

    return res.json({
      rollNo,
      studentName,
      className,
      section,
      subject,
      exams,
    });
  } catch (error) {
    console.error("Error fetching student progress:", error.stack || error);
    if (error.message.includes("MongoDB not connected")) {
      return res.status(503).json({ message: "Database connection unavailable", error: error.message });
    }
    return res.status(500).json({ message: "Error fetching student progress", error: error.message });
  }
});

// GET /api/marks/analytics/class-progress
// Returns per-exam average marks for every student in a class/section/subject.
// Query params: className, section, subject
// Response: { subject, className, section, exams: [{ examType, students: [{ rollNo, studentName, marks, result }], classAvg }] }
app.get("/api/marks/analytics/class-progress", async (req, res) => {
  try {
    checkMongoConnection();

    const { className, section, subject } = req.query;

    if (!className || !section || !subject) {
      return res.status(400).json({ message: "className, section, and subject are required" });
    }

    const EXAM_ORDER = ["Quarterly", "MidTerm", "HalfYearly", "Annual"];
    const PASS_MARK  = 35;

    const records = await Mark.find({
      className: String(className).trim(),
      section:   String(section).trim(),
      subject:   String(subject).trim(),
      status:    "Approved",
    }).select("examType marks rollNo studentName").lean();

    // Group by examType
    const byExam = {};
    records.forEach((r) => {
      if (!byExam[r.examType]) byExam[r.examType] = [];
      byExam[r.examType].push({
        rollNo:      r.rollNo,
        studentName: r.studentName,
        marks:       r.marks,
        result:      r.marks >= PASS_MARK ? "Pass" : "Fail",
      });
    });

    const exams = EXAM_ORDER
      .filter((et) => byExam[et] && byExam[et].length > 0)
      .map((et) => {
        const students = byExam[et];
        const avg = students.reduce((sum, s) => sum + s.marks, 0) / students.length;
        return {
          examType:  et,
          students,
          classAvg:  Math.round(avg * 10) / 10,
        };
      });

    return res.json({ className, section, subject, exams });
  } catch (error) {
    console.error("Error fetching class progress:", error.stack || error);
    if (error.message.includes("MongoDB not connected")) {
      return res.status(503).json({ message: "Database connection unavailable", error: error.message });
    }
    return res.status(500).json({ message: "Error fetching class progress", error: error.message });
  }
});

// GET /api/marks/analytics/pass-fail
// Returns pass / fail counts for a class/section/subject/examType (approved marks only).
// Query params: className, section, subject, examType
app.get("/api/marks/analytics/pass-fail", async (req, res) => {
  try {
    checkMongoConnection();

    const { className, section, subject, examType } = req.query;

    if (!className || !section || !subject || !examType) {
      return res.status(400).json({ message: "className, section, subject, and examType are required" });
    }

    const PASS_MARK = 35;

    const records = await Mark.find({
      className: String(className).trim(),
      section:   String(section).trim(),
      subject:   String(subject).trim(),
      examType:  String(examType).trim(),
      status:    "Approved",
    }).select("marks rollNo studentName").lean();

    let passCount = 0;
    let failCount = 0;
    records.forEach((r) => {
      r.marks >= PASS_MARK ? passCount++ : failCount++;
    });

    return res.json({
      className, section, subject, examType,
      total:     records.length,
      passCount,
      failCount,
      passPercent: records.length > 0 ? Math.round((passCount / records.length) * 100) : 0,
      failPercent: records.length > 0 ? Math.round((failCount / records.length) * 100) : 0,
    });
  } catch (error) {
    console.error("Error fetching pass/fail stats:", error.stack || error);
    if (error.message.includes("MongoDB not connected")) {
      return res.status(503).json({ message: "Database connection unavailable", error: error.message });
    }
    return res.status(500).json({ message: "Error fetching pass/fail stats", error: error.message });
  }
});

// GET /api/marks/analytics/class-average
// Returns exam-wise class averages for a class/section/subject (approved marks only).
// Query params: className, section, subject
app.get("/api/marks/analytics/class-average", async (req, res) => {
  try {
    checkMongoConnection();

    const { className, section, subject } = req.query;

    if (!className || !section || !subject) {
      return res.status(400).json({ message: "className, section, and subject are required" });
    }

    const EXAM_ORDER = ["Quarterly", "MidTerm", "HalfYearly", "Annual"];
    const PASS_MARK  = 35;

    const records = await Mark.find({
      className: String(className).trim(),
      section:   String(section).trim(),
      subject:   String(subject).trim(),
      status:    "Approved",
    }).select("examType marks").lean();

    // Group marks by exam type
    const byExam = {};
    records.forEach((r) => {
      if (!byExam[r.examType]) byExam[r.examType] = [];
      byExam[r.examType].push(r.marks);
    });

    const averages = EXAM_ORDER
      .filter((et) => byExam[et] && byExam[et].length > 0)
      .map((et) => {
        const marksList = byExam[et];
        const avg       = marksList.reduce((s, m) => s + m, 0) / marksList.length;
        return {
          examType: et,
          average:  Math.round(avg * 10) / 10,
          count:    marksList.length,
          result:   avg >= PASS_MARK ? "Pass" : "Fail",
        };
      });

    return res.json({ className, section, subject, averages });
  } catch (error) {
    console.error("Error fetching class averages:", error.stack || error);
    if (error.message.includes("MongoDB not connected")) {
      return res.status(503).json({ message: "Database connection unavailable", error: error.message });
    }
    return res.status(500).json({ message: "Error fetching class averages", error: error.message });
  }
});

// GET /api/marks/analytics/mark-range-count
// Count students with approved marks in a given range.
// Accepts either:
//   minMarks + maxMarks  (e.g. minMarks=0&maxMarks=10)
//   slab                 (legacy: slab=50 → 41–50)
// Optional filters: className, section, subject, examType
app.get("/api/marks/analytics/mark-range-count", async (req, res) => {
  try {
    checkMongoConnection();

    const { slab, minMarks, maxMarks, className, section, subject, examType } = req.query;

    let min, max;

    if (minMarks !== undefined && maxMarks !== undefined) {
      min = parseInt(minMarks, 10);
      max = parseInt(maxMarks, 10);
      if (isNaN(min) || isNaN(max) || min < 0 || max > 100 || min > max) {
        return res.status(400).json({ message: "minMarks and maxMarks must be valid integers between 0 and 100" });
      }
    } else if (slab !== undefined) {
      const slabNum = parseInt(slab, 10);
      if (isNaN(slabNum) || slabNum < 10 || slabNum > 100 || slabNum % 10 !== 0) {
        return res.status(400).json({ message: "slab must be one of 10,20,30,40,50,60,70,80,90,100" });
      }
      max = slabNum;
      min = slabNum - 9;
    } else {
      return res.status(400).json({ message: "Provide minMarks+maxMarks or slab" });
    }

    const filter = {
      status: "Approved",
      marks:  { $gte: min, $lte: max },
    };
    if (className) filter.className = String(className).trim();
    if (section)   filter.section   = String(section).trim();
    if (subject)   filter.subject   = String(subject).trim();
    if (examType)  filter.examType  = String(examType).trim();

    const count = await Mark.countDocuments(filter);

    return res.json({
      range:   `${min}–${max}`,
      min,
      max,
      count,
      filters: {
        className: className || null,
        section:   section   || null,
        subject:   subject   || null,
        examType:  examType  || null,
      },
    });
  } catch (error) {
    console.error("Error fetching mark-range count:", error.stack || error);
    if (error.message.includes("MongoDB not connected")) {
      return res.status(503).json({ message: "Database connection unavailable", error: error.message });
    }
    return res.status(500).json({ message: "Error fetching mark-range count", error: error.message });
  }
});

// GET /api/marks/by-group - Fetch marks by class/section/subject/examType
// Query params: className, section, subject, examType (required), teacherId (optional)
app.get("/api/marks/by-group", async (req, res) => {
  try {
    checkMongoConnection();

    const { teacherId, className, section, subject, examType } = req.query;

    if (!className || !section || !subject || !examType) {
      return res.status(400).json({
        message: "className, section, subject, and examType are required"
      });
    }

    const filter = {
      className: String(className).trim(),
      section:   String(section).trim(),
      subject:   String(subject).trim(),
      examType:  String(examType).trim(),
    };
    if (teacherId) filter.teacherId = teacherId;

    const marks = await Mark.find(filter).sort({ rollNo: 1, studentName: 1 });
    return res.json(Array.isArray(marks) ? marks : []);
  } catch (error) {
    console.error("Error fetching marks by group:", error.stack || error);
    if (error.message.includes("MongoDB not connected")) {
      return res.status(503).json({ message: "Database connection unavailable", error: error.message });
    }
    return res.status(500).json({ message: "Error fetching marks", error: error.message });
  }
});

// GET /api/marks - Fetch submitted marks
// Query params: teacherId (optional), examType (optional), className, section, subject, status
app.get("/api/marks", async (req, res) => {
  try {
    checkMongoConnection();
    const { teacherId, examType, className, section, subject, status } = req.query;

    const filter = {};
    if (teacherId)  filter.teacherId  = teacherId;
    if (examType)   filter.examType   = String(examType).trim();
    if (className)  filter.className  = String(className).trim();
    if (section)    filter.section    = String(section).trim();
    if (subject)    filter.subject    = String(subject).trim();
    if (status)     filter.status     = String(status).trim();

    const marks = await Mark.find(filter).sort({ createdAt: -1 });
    res.json(Array.isArray(marks) ? marks : []);
  } catch (error) {
    console.error("Error fetching marks:", error.stack || error);
    if (error.message.includes("MongoDB not connected")) {
      res.status(503).json({ message: "Database connection unavailable", error: error.message });
    } else {
      res.status(500).json({ message: "Error fetching marks", error: error.message });
    }
  }
});

// PUT /api/marks/:id/status - Admin mark approval/rejection
app.put("/api/marks/:id/status", async (req, res) => {
  try {
    checkMongoConnection();

    const { id } = req.params;
    const { status } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid mark ID" });
    }

    if (!["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({ message: "Status must be 'Approved' or 'Rejected'" });
    }

    const updatedMark = await Mark.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true }
    );

    if (!updatedMark) {
      return res.status(404).json({ message: "Mark not found" });
    }

    return res.status(200).json({
      message: `Mark ${status === "Approved" ? "approved" : "rejected"} successfully`,
      data: updatedMark
    });
  } catch (error) {
    console.error("Error updating mark status:", error.stack || error);
    if (error.message.includes("MongoDB not connected")) {
      return res.status(503).json({ message: "Database connection unavailable", error: error.message });
    }
    return res.status(500).json({ message: "Error updating mark status", error: error.message });
  }
});

// DELETE /api/marks/:id - Admin delete a mark
app.delete("/api/marks/:id", async (req, res) => {
  try {
    checkMongoConnection();

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid mark ID" });
    }

    const deleted = await Mark.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Mark not found" });
    }

    return res.status(200).json({ message: "Mark deleted successfully", data: deleted });
  } catch (error) {
    console.error("Error deleting mark:", error.stack || error);
    if (error.message.includes("MongoDB not connected")) {
      return res.status(503).json({ message: "Database connection unavailable", error: error.message });
    }
    return res.status(500).json({ message: "Error deleting mark", error: error.message });
  }
});




// POST /api/marks - Save single mark (legacy, kept for backward compatibility)
// examType is required; callers that don't send it will get a 400 error.
app.post("/api/marks", async (req, res) => {
  try {
    checkMongoConnection();

    const {
      rollNo, studentName,
      class: className, section, subject,
      examType,
      marks, teacherEmail, teacherId
    } = req.body;

    if (!rollNo || !studentName || !className || !section || !subject || !examType ||
        marks === undefined || marks === null || marks === "") {
      return res.status(400).json({
        message: "rollNo, studentName, className, section, subject, examType, and marks are required"
      });
    }

    if (!EXAM_TYPES.includes(examType)) {
      return res.status(400).json({ message: `examType must be one of: ${EXAM_TYPES.join(", ")}` });
    }

    const num = Number(marks);
    if (isNaN(num) || num < 0 || num > 100) {
      return res.status(400).json({ message: "Marks must be between 0 and 100" });
    }

    // Use upsert so re-submitting the same exam updates instead of duplicating
    const filter = {
      rollNo:    String(rollNo).trim(),
      className: String(className).trim(),
      section:   String(section).trim(),
      subject:   String(subject).trim(),
      examType:  String(examType).trim(),
    };
    const update = {
      $set: {
        ...filter,
        studentName:  String(studentName).trim(),
        marks:        num,
        teacherEmail: (teacherEmail && String(teacherEmail).trim()) || "Teacher",
        teacherId:    teacherId || undefined,
        status:       "Pending",
      }
    };
    const saved = await Mark.findOneAndUpdate(filter, update, {
      upsert: true, new: true, setDefaultsOnInsert: true
    });

    res.status(201).json({ message: "Marks saved", saved });
  } catch (error) {
    console.error("Error saving marks:", error.stack || error);
    if (error.message.includes("MongoDB not connected")) {
      res.status(503).json({ message: "Database connection unavailable", error: error.message });
    } else {
      res.status(500).json({ message: "Error saving marks", error: error.message });
    }
  }
});

// Allowed exam types (mirrors the schema enum)
const EXAM_TYPES = ["Quarterly", "MidTerm", "HalfYearly", "Annual"];

async function submitBulkMarks(req, res) {
  try {
    checkMongoConnection();

    const { teacherId, className, section, subject, examType, entries } = req.body;

    // examType is now required
    if (!teacherId || !className || !section || !subject || !examType || !Array.isArray(entries)) {
      return res.status(400).json({
        message: "teacherId, className, section, subject, examType and entries are required"
      });
    }

    if (!EXAM_TYPES.includes(examType)) {
      return res.status(400).json({
        message: `examType must be one of: ${EXAM_TYPES.join(", ")}`
      });
    }

    const classNameTrimmed = String(className).trim();
    const sectionTrimmed   = String(section).trim();
    const subjectTrimmed   = String(subject).trim();
    const examTypeTrimmed  = String(examType).trim();

    const teacher = await Teacher.findById(teacherId).select("teaching email");
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    // Verify teacher is assigned to this class/section/subject
    const teaching = Array.isArray(teacher.teaching) ? teacher.teaching : [];
    const allowed = teaching.some(
      (t) =>
        String(t.className).trim() === classNameTrimmed &&
        String(t.section).trim()   === sectionTrimmed &&
        String(t.subject).trim()   === subjectTrimmed
    );

    if (!allowed) {
      return res.status(403).json({
        message: "You are not assigned to this class, section, or subject"
      });
    }

    const processed = [];
    const updated   = [];
    const created   = [];
    const errors    = [];

    for (const entry of entries) {
      if (!entry || !entry.rollNo || entry.marks === undefined || entry.marks === "") {
        continue;
      }

      const rollNoTrimmed      = String(entry.rollNo).trim();
      const studentNameTrimmed = String(entry.studentName || "").trim();
      const marksNum           = Number(entry.marks);

      if (Number.isNaN(marksNum) || marksNum < 0 || marksNum > 100) {
        errors.push({ rollNo: rollNoTrimmed, studentName: studentNameTrimmed, error: "Marks must be between 0 and 100" });
        continue;
      }

      try {
        // Unique key now includes examType — same student can have marks for each exam
        const filter = {
          rollNo:    rollNoTrimmed,
          className: classNameTrimmed,
          section:   sectionTrimmed,
          subject:   subjectTrimmed,
          examType:  examTypeTrimmed
        };

        const update = {
          $set: {
            rollNo:      rollNoTrimmed,
            studentName: studentNameTrimmed,
            className:   classNameTrimmed,
            section:     sectionTrimmed,
            subject:     subjectTrimmed,
            examType:    examTypeTrimmed,
            marks:       marksNum,
            teacherEmail: teacher.email,
            teacherId:   teacher._id,
            status:      "Pending"
          }
        };

        const options = { upsert: true, new: true, setDefaultsOnInsert: true };

        const result = await Mark.findOneAndUpdate(filter, update, options);

        if (result) {
          // Distinguish insert vs update by comparing timestamps
          const isNew =
            result.createdAt &&
            result.updatedAt &&
            Math.abs(result.updatedAt.getTime() - result.createdAt.getTime()) < 1000;

          isNew ? created.push(result) : updated.push(result);
          processed.push(result);
        }
      } catch (err) {
        console.error(`Error processing marks for ${rollNoTrimmed}:`, err);
        errors.push({ rollNo: rollNoTrimmed, studentName: studentNameTrimmed, error: err.message || "Failed to save marks" });
      }
    }

    return res.status(200).json({
      message:      "Bulk marks processed",
      savedCount:   processed.length,
      createdCount: created.length,
      updatedCount: updated.length,
      saved:        processed,
      errors:       errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error("Error saving marks:", error);
    return res.status(500).json({ message: "Error saving marks", error: error.message });
  }
}
app.post("/api/teacher/marks", submitBulkMarks);
app.post("/api/marks/bulk", submitBulkMarks);

// GET /api/homework - list homework (filter by teacherId, className, section optional)
app.get("/api/homework", async (req, res) => {
  try {
    checkMongoConnection();
    const { teacherId, className, section } = req.query;
    
    // Build filter object with only defined values
    const filter = {};
    if (teacherId) filter.teacherId = teacherId;
    if (className) filter.className = String(className).trim();
    if (section) filter.section = String(section).trim();
    
    // Log only the filter that will be used (no undefined values)
    if (Object.keys(filter).length > 0) {
      console.log("GET /api/homework filter:", filter);
    }
    
    const hw = await Homework.find(filter).sort({ createdAt: -1 });
    res.json(Array.isArray(hw) ? hw : []);
  } catch (error) {
    console.error("Error fetching homework:", error);
    if (error.message && error.message.includes('MongoDB not connected')) {
      return res.status(503).json({ message: "Database connection unavailable", error: error.message });
    }
    res.status(500).json({ message: "Error fetching homework", error: error.message });
  }
});

// POST /api/homework - create new homework
app.post("/api/homework", async (req, res) => {
  try {
    checkMongoConnection();
    console.log("POST /api/homework body:", JSON.stringify(req.body));
    const { teacherId, className, section, subject, title, description, dueDate } = req.body;

    // Validate presence of required fields including dueDate
    if (!teacherId || !className || !section || !subject || !title || !description || !dueDate) {
      return res.status(400).json({ message: "teacherId, className, section, subject, title, description and dueDate are required" });
    }

    console.log("Permission check -> teacherId:", teacherId, "class:", className, "section:", section, "subject:", subject);

    const teacher = await Teacher.findById(teacherId).select("teaching email");
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });

    const teaching = Array.isArray(teacher.teaching) ? teacher.teaching : [];
    console.log("Teacher assignments:", JSON.stringify(teaching || []));

    // Normalize helper (Unicode normalized, collapse whitespace, case-insensitive)
    const normalize = (v) => {
      try {
        return String(v || "").normalize('NFKC').replace(/\s+/g, ' ').trim().toLowerCase();
      } catch (e) {
        return String(v || "").trim().toLowerCase();
      }
    };

    // Detailed per-entry comparison to debug mismatch
    let allowed = false;
    const normalizeAlpha = (v) => normalize(v).replace(/[^a-z0-9]/g, '');
    for (let i = 0; i < teaching.length; i++) {
      const t = teaching[i] || {};
      const rawTClass = String(t.className || t.class || '');
      const rawTSection = String(t.section || '');
      const rawTSubject = String(t.subject || '');

      const tClass = normalize(rawTClass);
      const tSection = normalize(rawTSection);
      const tSubject = normalize(rawTSubject);

      const inClass = normalize(className);
      const inSection = normalize(section);
      const inSubject = normalize(subject);

      const classMatch = tClass === inClass;
      const sectionMatch = tSection === inSection;
      const subjectMatch = tSubject === inSubject;

      // Alternative alphanumeric-only comparison (strip punctuation/space)
      const tClassA = normalizeAlpha(rawTClass);
      const tSectionA = normalizeAlpha(rawTSection);
      const tSubjectA = normalizeAlpha(rawTSubject);
      const inClassA = normalizeAlpha(className);
      const inSectionA = normalizeAlpha(section);
      const inSubjectA = normalizeAlpha(subject);

      const classMatchAlt = tClassA === inClassA;
      const sectionMatchAlt = tSectionA === inSectionA;
      const subjectMatchAlt = tSubjectA === inSubjectA;

      console.log(`Assignment check [${i}]: rawT=(${rawTClass}|${rawTSection}|${rawTSubject}) => normalized=(${tClass}|${tSection}|${tSubject}) vs input=(${inClass}|${inSection}|${inSubject}) => matches: ${classMatch}/${sectionMatch}/${subjectMatch}; alnum=(${tClassA}|${tSectionA}|${tSubjectA}) vs inputAlnum=(${inClassA}|${inSectionA}|${inSubjectA}) => altMatches: ${classMatchAlt}/${sectionMatchAlt}/${subjectMatchAlt}`);

      if ((classMatch && sectionMatch && subjectMatch) || (classMatchAlt && sectionMatchAlt && subjectMatchAlt)) {
        allowed = true;
        console.log(`Assignment matched on entry [${i}] (classMatch:${classMatch} sectionMatch:${sectionMatch} subjectMatch:${subjectMatch} alt:${classMatchAlt}/${sectionMatchAlt}/${subjectMatchAlt})`);
        break;
      }
    }

    if (!allowed) {
      console.warn("Unauthorized assignment attempt", { teacherId, className, section, subject, teachingCount: teaching.length });
      return res.status(403).json({ message: "You are not assigned to this class, section, or subject" });
    }

    // Validate dueDate format
    const dt = new Date(dueDate);
    if (isNaN(dt.getTime())) {
      return res.status(400).json({ message: "Invalid dueDate format" });
    }

    const hw = new Homework({
      teacherId: teacher._id,
      teacherEmail: teacher.email || "",
      className: String(className).trim(),
      section: String(section).trim(),
      subject: String(subject).trim(),
      title: String(title).trim(),
      description: String(description).trim(),
      dueDate: dt
    });

    const saved = await hw.save();
    console.log("Saved homework id:", saved._id);
    res.status(201).json(saved);
  } catch (error) {
    console.error("Error creating homework:", error);
    if (error.message && error.message.includes('MongoDB not connected')) {
      return res.status(503).json({ message: "Database connection unavailable", error: error.message });
    }
    res.status(500).json({ message: "Error creating homework", error: error.message });
  }
});

// POST /api/homework/submit - student submits homework with text + optional photo
app.post("/api/homework/submit", homeworkUpload.single("photo"), async (req, res) => {
  try {
    checkMongoConnection();

    const {
      homeworkId,
      studentId,
      rollNo,
      studentName,
      answerText
    } = req.body || {};

    if (!homeworkId || !studentId || !rollNo || !studentName) {
      return res.status(400).json({
        message: "homeworkId, studentId, rollNo, and studentName are required"
      });
    }

    const text = String(answerText || "").trim();
    const photoPath = req.file ? `/uploads/homework/${req.file.filename}` : "";

    if (!text && !photoPath) {
      return res.status(400).json({ message: "Provide answer text or upload a photo" });
    }

    const homework = await Homework.findById(homeworkId).select("_id").lean();
    if (!homework) {
      return res.status(404).json({ message: "Homework not found" });
    }

    const submission = new HomeworkSubmission({
      homeworkId,
      studentId,
      rollNo: String(rollNo).trim(),
      studentName: String(studentName).trim(),
      answerText: text,
      photo: photoPath,
      submittedAt: new Date(),
      status: "Pending"
    });

    const saved = await submission.save();
    return res.status(201).json({ message: "Homework submitted", data: saved });
  } catch (error) {
    console.error("Error submitting homework:", error.stack || error);
    if (error.message && error.message.includes("MongoDB not connected")) {
      return res.status(503).json({ message: "Database connection unavailable", error: error.message });
    }
    return res.status(500).json({ message: "Error submitting homework", error: error.message });
  }
});

// GET /api/homework/submission - get a student's submission for a homework
// Query params: homeworkId (required), studentId (required)
app.get("/api/homework/submission", async (req, res) => {
  try {
    checkMongoConnection();

    const { homeworkId, studentId } = req.query;
    if (!homeworkId || !studentId) {
      return res.status(400).json({ message: "homeworkId and studentId are required" });
    }
    if (!mongoose.Types.ObjectId.isValid(homeworkId) || !mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: "Invalid homeworkId or studentId" });
    }

    const submission = await HomeworkSubmission.findOne({
      homeworkId,
      studentId
    }).sort({ submittedAt: -1 });

    return res.json(submission || null);
  } catch (error) {
    console.error("Error fetching homework submission:", error.stack || error);
    if (error.message && error.message.includes("MongoDB not connected")) {
      return res.status(503).json({ message: "Database connection unavailable", error: error.message });
    }
    return res.status(500).json({ message: "Error fetching submission", error: error.message });
  }
});

// GET /api/homework/submissions - list submissions for a teacher
// Query params: teacherId (required), status (optional)
app.get("/api/homework/submissions", async (req, res) => {
  try {
    checkMongoConnection();

    const { teacherId, status } = req.query;
    if (!teacherId) {
      return res.status(400).json({ message: "teacherId is required" });
    }
    if (!mongoose.Types.ObjectId.isValid(teacherId)) {
      return res.status(400).json({ message: "Invalid teacherId" });
    }
    if (status && !["Pending", "Approved", "Rejected"].includes(String(status))) {
      return res.status(400).json({ message: "status must be Pending, Approved, or Rejected" });
    }

    const homeworks = await Homework.find({ teacherId })
      .select("_id title subject className section dueDate teacherId")
      .lean();

    if (!homeworks || homeworks.length === 0) {
      return res.json([]);
    }

    const homeworkIds = homeworks.map((h) => h._id);
    const filter = { homeworkId: { $in: homeworkIds } };
    if (status) filter.status = String(status);

    const submissions = await HomeworkSubmission.find(filter)
      .populate("homeworkId", "title subject className section dueDate teacherId")
      .sort({ submittedAt: -1 });

    return res.json(Array.isArray(submissions) ? submissions : []);
  } catch (error) {
    console.error("Error fetching homework submissions:", error.stack || error);
    if (error.message && error.message.includes("MongoDB not connected")) {
      return res.status(503).json({ message: "Database connection unavailable", error: error.message });
    }
    return res.status(500).json({ message: "Error fetching submissions", error: error.message });
  }
});

// PUT /api/homework/submissions/:id/status - approve or reject submission
app.put("/api/homework/submissions/:id/status", async (req, res) => {
  try {
    checkMongoConnection();

    const { id } = req.params;
    const { status } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid submission ID" });
    }
    if (!["Pending", "Approved", "Rejected"].includes(status)) {
      return res.status(400).json({ message: "status must be Pending, Approved, or Rejected" });
    }

    const updated = await HomeworkSubmission.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true }
    ).populate("homeworkId", "title subject className section dueDate teacherId");

    if (!updated) {
      return res.status(404).json({ message: "Submission not found" });
    }

    return res.json({ message: "Status updated", data: updated });
  } catch (error) {
    console.error("Error updating submission status:", error.stack || error);
    if (error.message && error.message.includes("MongoDB not connected")) {
      return res.status(503).json({ message: "Database connection unavailable", error: error.message });
    }
    return res.status(500).json({ message: "Error updating submission", error: error.message });
  }
});

// Student routes
// GET /api/student/marks - Get approved marks for a student
// Query params: rollNo, className, section (required)
app.get("/api/student/marks", async (req, res) => {
  try {
    checkMongoConnection();

    const { rollNo, className, section } = req.query;

    if (!rollNo || !className || !section) {
      return res.status(400).json({
        message: "rollNo, className, and section are required"
      });
    }

    // Fetch only approved marks for this student
    const marks = await Mark.find({
      rollNo: String(rollNo).trim(),
      className: String(className).trim(),
      section: String(section).trim(),
      status: "Approved"
    })
      .select("subject examType marks status")
      .sort({ subject: 1, examType: 1 });

    res.json(Array.isArray(marks) ? marks : []);
  } catch (error) {
    console.error("Error fetching student marks:", error);
    if (error.message.includes("MongoDB not connected")) {
      return res.status(503).json({
        message: "Database connection unavailable",
        error: error.message
      });
    }
    return res.status(500).json({
      message: "Error fetching student marks",
      error: error.message
    });
  }
});
