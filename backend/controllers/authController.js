import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import Admin from "../models/Admin.js";
import Teacher from "../models/Teacher.js";
import Student from "../models/Student.js";
import Parent from "../models/Parent.js";

const ALLOWED_ROLES = ["admin", "teacher", "student", "parent"];

function normalizeEmail(email) {
  return (email && String(email).trim().toLowerCase()) || "";
}

function normalizePassword(password) {
  return (password && String(password).trim()) || "";
}

function hashPassword(password) {
  return bcrypt.hashSync(String(password).trim(), 10);
}

function passwordMatches(inputPassword, storedPassword) {
  const normalizedStoredPassword = String(storedPassword || "").trim();
  if (!normalizedStoredPassword) return false;
  if (normalizedStoredPassword.startsWith("$2")) {
    return bcrypt.compareSync(String(inputPassword || ""), normalizedStoredPassword);
  }
  return normalizedStoredPassword === String(inputPassword || "");
}

function getModelForRole(role) {
  if (role === "admin") return Admin;
  if (role === "teacher") return Teacher;
  if (role === "student") return Student;
  if (role === "parent") return Parent;
  return null;
}

async function findUserByRoleAndEmail(role, email) {
  const Model = getModelForRole(role);
  if (!Model) return null;
  return Model.findOne({ email });
}

async function updateUserPassword(user, nextPassword) {
  user.password = hashPassword(nextPassword);
  await user.save();
}

export async function login(req, res) {
  try {
    // Fail fast with a clear message if the DB is not ready
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Server is starting up. Please try again in a moment." });
    }

    const { email, password, role } = req.body || {};
    const normalizedEmail = normalizeEmail(email);
    const normalizedPassword = normalizePassword(password);

    if (!normalizedEmail || !normalizedPassword) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    if (!role || !ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({ message: "Role must be admin, teacher, student or parent" });
    }

    if (role === "admin") {
      const admin = await Admin.findOne({
        email: normalizedEmail,
      });
      if (!admin || !passwordMatches(normalizedPassword, admin.password)) {
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
      const passwordMatch = passwordMatches(normalizedPassword, teacher.password);
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
      const passwordMatch = passwordMatches(normalizedPassword, student.password);
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

    if (role === "parent") {
      // Prefer dedicated parent accounts (parents collection), fallback to legacy behavior
      // where parent login is derived from the student's parentEmail + student password.
      const parent = await Parent.findOne({ email: normalizedEmail });
      if (parent) {
        const passwordMatch = passwordMatches(normalizedPassword, parent.password);
        if (!passwordMatch) {
          return res.status(401).json({ message: "Invalid email or password" });
        }

        const parentObj = parent.toObject ? parent.toObject() : { ...parent };
        delete parentObj.password;

        const ids = [];
        if (Array.isArray(parentObj.studentIds)) {
          parentObj.studentIds.forEach((id) => {
            const s = String(id || "").trim();
            if (s && mongoose.Types.ObjectId.isValid(s)) ids.push(s);
          });
        }
        if (parentObj.studentId) {
          const s = String(parentObj.studentId || "").trim();
          if (s && mongoose.Types.ObjectId.isValid(s)) ids.unshift(s);
        }
        const uniq = [];
        const seen = new Set();
        ids.forEach((id) => {
          if (seen.has(id)) return;
          seen.add(id);
          uniq.push(id);
        });

        const childDocs = uniq.length
          ? await Student.find({ _id: { $in: uniq } }).lean()
          : [];
        const children = (Array.isArray(childDocs) ? childDocs : []).map((c) => {
          const out = c?.toObject ? c.toObject() : { ...c };
          delete out.password;
          return out;
        });
        const child = children.length > 0 ? children[0] : null;

        return res.json({
          role: "parent",
          name: parentObj.parentName || parentObj.name || "Parent",
          email: normalizedEmail,
          child, // backward compatibility (single child)
          children, // new (multi-child)
          selectedChildId: child?._id || null,
          parent: parentObj,
        });
      }

      const student = await Student.findOne({ parentEmail: normalizedEmail });
      if (!student) return res.status(401).json({ message: "Invalid email or password" });

      const passwordMatch = passwordMatches(normalizedPassword, student.password);
      if (!passwordMatch) return res.status(401).json({ message: "Invalid email or password" });

      const child = student.toObject ? student.toObject() : { ...student };
      delete child.password;

      return res.json({
        role: "parent",
        name: child.parentName || "Parent",
        email: normalizedEmail,
        child, // backward compatibility (single child)
        children: child ? [child] : [],
        selectedChildId: child?._id || null,
      });
    }
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Login failed" });
  }
}

export async function changePassword(req, res) {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ message: "Server is starting up. Please try again in a moment." });
    }

    const { email, role, userId, oldPassword, newPassword } = req.body || {};
    const normalizedEmail = normalizeEmail(email);
    const normalizedRole = (role && String(role).trim().toLowerCase()) || "";
    const normalizedOldPassword = normalizePassword(oldPassword);
    const normalizedNewPassword = normalizePassword(newPassword);

    if (!normalizedEmail || !normalizedRole || !normalizedOldPassword || !normalizedNewPassword) {
      return res.status(400).json({ message: "Email, role, old password, and new password are required." });
    }

    if (!ALLOWED_ROLES.includes(normalizedRole)) {
      return res.status(400).json({ message: "Invalid role." });
    }

    if (normalizedNewPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters long." });
    }

    const Model = getModelForRole(normalizedRole);
    const query = userId && mongoose.Types.ObjectId.isValid(String(userId).trim())
      ? { _id: String(userId).trim(), email: normalizedEmail }
      : { email: normalizedEmail };
    const user = await Model.findOne(query);

    if (!user) {
      return res.status(404).json({ message: "Account not found." });
    }

    if (!passwordMatches(normalizedOldPassword, user.password)) {
      return res.status(400).json({ message: "Old password is incorrect." });
    }

    if (passwordMatches(normalizedNewPassword, user.password)) {
      return res.status(400).json({ message: "New password must be different from the old password." });
    }

    await updateUserPassword(user, normalizedNewPassword);

    return res.json({ message: "Password changed successfully." });
  } catch (error) {
    console.error("Change password error:", error);
    return res.status(500).json({ message: "Failed to change password." });
  }
}
