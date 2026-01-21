import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import Admin from "./models/Admin.js";

const app = express();

// Allow CORS for development (adjust for production)
app.use(cors());

app.use(express.json());

mongoose.connect("mongodb://localhost:27017/BANUSchool")
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

app.get("/", (req, res) => {
  res.send("Backend is running");
});

// Simple health route to verify reachability
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/admin/login", async (req, res) => {
  console.log("Request body:", req.body);

  const { email, password } = req.body;

  const admin = await Admin.findOne({ email, password });

  if (!admin) {
    // Development fallback: if DB is not populated or not running, allow a mock admin
    if (process.env.NODE_ENV !== "production") {
      console.warn("No admin found in DB — returning development mock admin");
      const mockAdmin = { email, role: "admin", _id: "dev-admin" };
      return res.json({ message: "Login successful (dev)", admin: mockAdmin });
    }

    return res.status(401).json({ message: "Invalid email or password" });
  }

  res.json({ message: "Login successful", admin });
});

const PORT = process.env.PORT || 3000;
app.listen(3000, () => {
  console.log(`Server running on port ${3000}`);
});
