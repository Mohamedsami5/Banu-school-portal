import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json"
  }
});

/**
 * Dashboard API Service
 * Handles all dashboard-related API calls
 */

/**
 * Fetch dashboard statistics (counts of teachers, students, parents, announcements)
 * @returns {Promise<Object>} Dashboard stats object with counts
 */
export const fetchDashboardStats = async () => {
  try {
    const response = await apiClient.get("/dashboard/stats");
    return response.data.data;
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    throw error;
  }
};

export default apiClient;
