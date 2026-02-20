import express from "express";
import { getDashboardStats } from "../controllers/dashboardController.js";

const router = express.Router();

// GET /api/dashboard/stats - Fetch dashboard statistics (counts)
router.get("/stats", getDashboardStats);

export default router;
