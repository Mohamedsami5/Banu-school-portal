import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import Admin from "./models/Admin.js";
import Teacher from "./models/Teacher.js";
import Student from "./models/Student.js";
import Parent from "./models/Parent.js";
import Mark from "./models/Mark.js";
import announcementRoutes from "./routes/announcementRoutes.js";

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

app.use(express.json());

app.use("/api/announcements", announcementRoutes);

// Server port configuration
const PORT = process.env.PORT || 5000;

// MongoDB connection configuration
const MONGODB_URI = "mongodb://127.0.0.1:27017/BANUSchool";
const mongooseOptions = {
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 10s
  socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
};

// Connect to MongoDB before starting server
mongoose.connect(MONGODB_URI, mongooseOptions)
  .then(() => {
    console.log("MongoDB connected successfully");
    console.log(`Database: BANUSchool (marks collection created on first insert)`);
    console.log(`Connection state: ${mongoose.connection.readyState} (1 = connected)`);
    
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
      const teacher = await Teacher.findOne({ email: normalizedEmail, password: normalizedPassword });
      if (!teacher) {
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

// POST /api/teachers - Add a new teacher (Admin creates teacher with credentials + teaching assignments)
app.post("/api/teachers", async (req, res) => {
  try {
    checkMongoConnection();
    const { name, email, password, subject, status, teaching } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: "Name and email are required" });
    }
    if (!password || String(password).trim() === "") {
      return res.status(400).json({ message: "Teacher password is required" });
    }

    const teachingArr = Array.isArray(teaching)
      ? teaching
          .filter((t) => t && (t.class || t.subject))
          .map((t) => ({
            class: String(t.class || "").trim(),
            section: String(t.section || "A").trim(),
            subject: String(t.subject || "").trim()
          }))
      : [];

    const teacher = new Teacher({
      name,
      email: String(email).trim().toLowerCase(),
      password: String(password).trim(),
      subject: subject ? String(subject).trim() : teachingArr[0]?.subject || "",
      teaching: teachingArr,
      status: status || "Active",
      role: "teacher"
    });

    const savedTeacher = await teacher.save();
    res.status(201).json(savedTeacher);
  } catch (error) {
    console.error("Error creating teacher:", error);
    if (error.message.includes("MongoDB not connected")) {
      res.status(503).json({ message: "Database connection unavailable", error: error.message });
    } else if (error.code === 11000) {
      return res.status(400).json({ message: "Email already exists" });
    }
    res.status(500).json({ message: "Error creating teacher", error: error.message });
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
      filter.$or = [{ section: sec }, { section: { $in: [null, ""] } }, { section: { $exists: false } }];
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
    const { name, email, className, section, rollNo, parentName, parentEmail } = req.body;

    if (!name || !email || !className) {
      return res.status(400).json({ message: "Name, email, and className are required" });
    }

    const student = new Student({
      name,
      email,
      className,
      section: section ? String(section).trim() : "A",
      rollNo: rollNo ? String(rollNo).trim() : "",
      parentName: parentName || "",
      parentEmail: parentEmail || ""
    });

    const savedStudent = await student.save();
    res.status(201).json(savedStudent);
  } catch (error) {
    console.error("Error creating student:", error);
    if (error.message.includes("MongoDB not connected")) {
      res.status(503).json({ message: "Database connection unavailable", error: error.message });
    } else if (error.code === 11000) {
      return res.status(400).json({ message: "Email already exists" });
    }
    res.status(500).json({ message: "Error creating student", error: error.message });
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

// Teacher assignments – classes + subjects assigned to logged-in teacher
app.get("/api/teacher/assignments", async (req, res) => {
  try {
    checkMongoConnection();
    const teacherId = req.query.teacherId;
    if (!teacherId) {
      return res.status(400).json({ message: "teacherId is required" });
    }
    const teacher = await Teacher.findById(teacherId).select("teaching");
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }
    const teaching = Array.isArray(teacher.teaching) ? teacher.teaching : [];
    res.json(teaching);
  } catch (error) {
    console.error("Error fetching teacher assignments:", error);
    if (error.message.includes("MongoDB not connected")) {
      res.status(503).json({ message: "Database connection unavailable", error: error.message });
    } else {
      res.status(500).json({ message: "Error fetching assignments", error: error.message });
    }
  }
});

// Mark routes - teacher uploads
// GET /api/marks - Fetch submitted marks (optional query: teacherId)
app.get("/api/marks", async (req, res) => {
  try {
    checkMongoConnection();
    const teacherId = req.query.teacherId;
    const filter = teacherId ? { teacherId } : {};
    const marks = await Mark.find(filter).sort({ createdAt: -1 });
    res.json(Array.isArray(marks) ? marks : []);
  } catch (error) {
    console.error("Error fetching marks:", error);
    if (error.message.includes("MongoDB not connected")) {
      res.status(503).json({ message: "Database connection unavailable", error: error.message });
    } else {
      res.status(500).json({ message: "Error fetching marks", error: error.message });
    }
  }
});

// POST /api/marks - Save single mark (legacy)
app.post("/api/marks", async (req, res) => {
  try {
    checkMongoConnection();
    const { rollNo, studentName, className, section, subject, marks, teacherEmail, teacherId } = req.body;
    if (!rollNo || !studentName || !className || !section || !subject || marks === undefined || marks === null || marks === "") {
      return res.status(400).json({ message: "rollNo, studentName, className, section, subject, and marks are required" });
    }
    const num = Number(marks);
    if (isNaN(num) || num < 0 || num > 100) {
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
    res.status(201).json(saved);
  } catch (error) {
    console.error("Error saving marks:", error);
    if (error.message.includes("MongoDB not connected")) {
      res.status(503).json({ message: "Database connection unavailable", error: error.message });
    } else {
      res.status(500).json({ message: "Error saving marks", error: error.message });
    }
  }
});

// POST /api/marks/bulk - Submit marks for multiple students at once
app.post("/api/marks/bulk", async (req, res) => {
  try {
    checkMongoConnection();
    const { teacherId, class: className, section, subject, entries } = req.body;
    if (!teacherId || !className || !section || !subject || !Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ message: "teacherId, class, section, subject, and entries array are required" });
    }
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }
    const teaching = Array.isArray(teacher.teaching) ? teacher.teaching : [];
    const allowed = teaching.some(
      (t) =>
        String(t.class).trim() === String(className).trim() &&
        String(t.section).trim() === String(section).trim() &&
        String(t.subject).trim() === String(subject).trim()
    );
    if (!allowed) {
      return res.status(403).json({ message: "You are not assigned to this class, section, or subject" });
    }
    const toSave = [];
    for (const e of entries) {
      const rollNo = e.rollNo != null ? String(e.rollNo).trim() : "";
      const studentName = e.studentName != null ? String(e.studentName).trim() : "";
      let marksVal = e.marks;
      if (marksVal === "" || marksVal === null || marksVal === undefined) continue;
      const num = Number(marksVal);
      if (isNaN(num) || num < 0 || num > 100) {
        return res.status(400).json({ message: `Marks for ${studentName || rollNo} must be between 0 and 100` });
      }
      toSave.push({
        rollNo,
        studentName,
        className: String(className).trim(),
        section: String(section).trim(),
        subject: String(subject).trim(),
        marks: num,
        teacherEmail: teacher.email || "Teacher",
        teacherId: teacher._id,
        status: "Pending"
      });
    }
    if (toSave.length === 0) {
      return res.status(400).json({ message: "At least one student must have marks entered" });
    }
    const saved = await Mark.insertMany(toSave);
    res.status(201).json({ saved: saved.length, data: saved });
  } catch (error) {
    console.error("Error saving bulk marks:", error);
    if (error.message.includes("MongoDB not connected")) {
      res.status(503).json({ message: "Database connection unavailable", error: error.message });
    } else {
      res.status(500).json({ message: "Error saving marks", error: error.message });
    }
  }
});

