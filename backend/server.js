import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bcrypt from "bcryptjs";
import Admin from "./models/Admin.js";
import Teacher from "./models/Teacher.js";
import Student from "./models/Student.js";
import Parent from "./models/Parent.js";
import Mark from "./models/Mark.js";
import Homework from "./models/Homework.js";
import announcementRoutes from "./routes/announcementRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";
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

// Connect to MongoDB before starting server
mongoose.connect(MONGODB_URI, mongooseOptions)
  .then(async () => {
    console.log("MongoDB connected successfully");
    console.log(`Database: BANUSchool (marks collection created on first insert)`);
    console.log(`Connection state: ${mongoose.connection.readyState} (1 = connected)`);

    await migrateTeacherJoiningDateField();
    
    // Start server only after MongoDB connection is established
    // Start with a function that handles EADDRINUSE by retrying the next port
    const startServer = (port) => {
      const server = app.listen(port, () => {
        console.log(`Server running on port ${port}`);
        console.log(`API endpoints available at http://localhost:${port}/api`);
      });

      server.on("error", (err) => {
        if (err.code === "EADDRINUSE") {
          console.error(`Port ${port} is already in use. Trying port ${port + 1}...`);
          // Try the next port after a short delay
          setTimeout(() => startServer(port + 1), 1000);
        } else {
          console.error("Server error:", err);
          process.exit(1);
        }
      });
    };

    startServer(PORT);
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
    const { email, password, role } = req.body;
    const normalizedEmail = (email && String(email).trim().toLowerCase()) || "";
    const normalizedPassword = (password && String(password).trim()) || "";

    if (!normalizedEmail || !normalizedPassword) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    if (!role || (role !== "admin" && role !== "teacher")) {
      return res.status(400).json({ message: "Role must be admin or teacher" });
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

// POST /api/students - Add a new student
app.post("/api/students", async (req, res) => {
  try {
    checkMongoConnection();
    console.log("POST /api/students body:", JSON.stringify(req.body));
    const { name, email, className, section, rollNo, parentName, parentEmail } = req.body;

    if (!name || !email || !className || !rollNo || !section) {
      return res.status(400).json({ message: "Name, email, className, section and rollNo are required" });
    }

    console.log("Submitted rollNo:", rollNo, "for class:", className, "section:", section);

    const student = new Student({
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      className: String(className).trim(),
      section: String(section).trim(),
      rollNo: String(rollNo).trim(),
      parentName: parentName || "",
      parentEmail: parentEmail || ""
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
    const { phone, qualification, experience, address, bio, photo, fatherName, motherName, dateOfBirth, languagesKnown } = req.body || {};

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
    const { teacherId, fatherName, motherName, dateOfBirth, phoneNumber, languagesKnown, qualification, experience, address, profilePhoto } = req.body;

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
// GET /api/marks - Fetch submitted marks (optional query: teacherId)
app.get("/api/marks", async (req, res) => {
  try {
    checkMongoConnection();
    const teacherId = req.query.teacherId;
    console.log("GET /api/marks teacherId:", teacherId);
    const filter = teacherId ? { teacherId } : {};
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




// POST /api/marks - Save single mark (legacy)
app.post("/api/marks", async (req, res) => {
  try {
    checkMongoConnection();
    // Log incoming body and request info for debugging
    console.log("POST /api/marks from", req.ip, "body:", JSON.stringify(req.body));

    const { rollNo, studentName, class: className, section, subject, marks, teacherEmail, teacherId } = req.body;
    if (!rollNo || !studentName || !className || !section || !subject || marks === undefined || marks === null || marks === "") {
      console.error("Validation failed for /api/marks", { body: req.body });
      return res.status(400).json({ message: "rollNo, studentName, className, section, subject, and marks are required" });
    }
    const num = Number(marks);
    if (isNaN(num) || num < 0 || num > 100) {
      console.error("Invalid marks value", { marks });
      return res.status(400).json({ message: "Marks must be between 0 and 100" });
    }
    const mark = new Mark({
      rollNo: String(rollNo).trim(),
      studentName: String(studentName).trim(),
      className: String(className).trim(),
      section: String(section).trim(),
      subject: String(subject).trim(),
      marks: num,
      teacherEmail: (teacherEmail && String(teacherEmail).trim()) || "Teacher",
      teacherId: teacherId || undefined,
      status: "Pending"
    });
    const saved = await mark.save();
    console.log("Saved mark id:", saved._id);
    res.status(201).json({ message: "Marks saved", saved });
  } catch (error) {
    console.error("Error saving marks:", error.stack || error, "body:", JSON.stringify(req.body));
    if (error.message.includes("MongoDB not connected")) {
      res.status(503).json({ message: "Database connection unavailable", error: error.message });
    } else {
      res.status(500).json({ message: "Error saving marks", error: error.message });
    }
  }
});

async function submitBulkMarks(req, res) {
  try {
    checkMongoConnection();

    const { teacherId, className, section, subject, entries } = req.body;

    if (!teacherId || !className || !section || !subject || !Array.isArray(entries)) {
      return res.status(400).json({
        message: "teacherId, className, section, subject and entries are required"
      });
    }

    const classNameTrimmed = String(className).trim();
    const sectionTrimmed = String(section).trim();
    const subjectTrimmed = String(subject).trim();

    const teacher = await Teacher.findById(teacherId).select("teaching email");
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const teaching = Array.isArray(teacher.teaching) ? teacher.teaching : [];
    const allowed = teaching.some(
      (t) =>
        String(t.className).trim() === classNameTrimmed &&
        String(t.section).trim() === sectionTrimmed &&
        String(t.subject).trim() === subjectTrimmed
    );

    if (!allowed) {
      return res.status(403).json({
        message: "You are not assigned to this class, section, or subject"
      });
    }

    // Process entries and use findOneAndUpdate with upsert to prevent duplicates
    // This allows editing existing marks instead of skipping them
    const processed = [];
    const updated = [];
    const created = [];
    const errors = [];

    for (const entry of entries) {
      if (!entry || !entry.rollNo || entry.marks === undefined || entry.marks === "") {
        continue;
      }

      const rollNoTrimmed = String(entry.rollNo).trim();
      const studentNameTrimmed = String(entry.studentName || "").trim();
      const marksNum = Number(entry.marks);

      // Validate marks
      if (Number.isNaN(marksNum) || marksNum < 0 || marksNum > 100) {
        errors.push({
          rollNo: rollNoTrimmed,
          studentName: studentNameTrimmed,
          error: `Marks must be between 0 and 100`
        });
        continue;
      }

      // Use findOneAndUpdate with upsert to prevent duplicates
      // If marks exist, update them; if not, create new
      // Status resets to "Pending" when marks are edited
      try {
        const filter = {
          rollNo: rollNoTrimmed,
          className: classNameTrimmed,
          section: sectionTrimmed,
          subject: subjectTrimmed
        };

        const update = {
          $set: {
            rollNo: rollNoTrimmed,
            studentName: studentNameTrimmed,
            className: classNameTrimmed,
            section: sectionTrimmed,
            subject: subjectTrimmed,
            marks: marksNum,
            teacherEmail: teacher.email,
            teacherId: teacher._id,
            status: "Pending" // Reset to Pending when marks are edited
          }
        };

        const options = {
          upsert: true, // Create if doesn't exist
          new: true, // Return updated document
          setDefaultsOnInsert: true
        };

        const result = await Mark.findOneAndUpdate(filter, update, options);
        
        if (result) {
          // Check if this was an update (existing document) or insert (new document)
          const wasNew = !result.createdAt || 
            (result.updatedAt && result.createdAt && 
             result.updatedAt.getTime() - result.createdAt.getTime() < 1000);
          
          if (wasNew) {
            created.push(result);
          } else {
            updated.push(result);
          }
          processed.push(result);
        }
      } catch (error) {
        console.error(`Error processing marks for ${rollNoTrimmed}:`, error);
        errors.push({
          rollNo: rollNoTrimmed,
          studentName: studentNameTrimmed,
          error: error.message || "Failed to save marks"
        });
      }
    }

    return res.status(200).json({
      message: "Bulk marks processed",
      savedCount: processed.length,
      createdCount: created.length,
      updatedCount: updated.length,
      saved: processed,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error("Error saving marks:", error);
    return res.status(500).json({
      message: "Error saving marks",
      error: error.message
    });
  }
}
app.post("/api/teacher/marks", submitBulkMarks);
app.post("/api/marks/bulk", submitBulkMarks);

// GET /api/homework - list homework (filter by teacherId, className, section optional)
app.get("/api/homework", async (req, res) => {
  try {
    checkMongoConnection();
    const { teacherId, className, section } = req.query;
    console.log("GET /api/homework query:", { teacherId, className, section });
    const filter = {};
    if (teacherId) filter.teacherId = teacherId;
    if (className) filter.className = String(className).trim();
    if (section) filter.section = String(section).trim();
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
