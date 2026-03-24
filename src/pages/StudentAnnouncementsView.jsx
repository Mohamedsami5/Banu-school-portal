import React, { useState, useEffect } from "react";
import { API_BASE } from "../config/api";

export default function StudentAnnouncementsView() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(`${API_BASE}/announcements`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }
      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error("Invalid response format from server");
      }
      const formatted = data.map((a) => ({
        id: a._id,
        title: a.title,
        content: a.description,
        date: a.createdAt ? a.createdAt.split("T")[0] : "",
        author: a.createdBy || "Admin",
        priority: (a.priority || "MEDIUM").toLowerCase(),
      }));
      setAnnouncements(formatted);
    } catch (err) {
      if (err.name === "TypeError" && (err.message.includes("fetch") || err.message.includes("Failed to fetch"))) {
        setError("Cannot connect to backend server. Please ensure the backend is running");
      } else {
        setError(err.message || "Failed to load announcements");
      }
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "#ef5350";
      case "medium":
        return "#ffa726";
      case "low":
        return "#66bb6a";
      default:
        return "#90a4ae";
    }
  };

  const getPriorityLabel = (priority) => {
    return priority ? priority.charAt(0).toUpperCase() + priority.slice(1) : "Normal";
  };

  return (
    <div>
      <h2 style={styles.title}>Announcements</h2>
      <p style={styles.subtitle}>Latest school announcements (read-only)</p>
      {error && <div style={styles.error}>{error}</div>}
      <div style={styles.announcementsList}>
        {loading ? (
          <div style={styles.emptyState}>
            <p>Loading announcements...</p>
          </div>
        ) : announcements.length === 0 ? (
          <div style={styles.emptyState}>
            <p>No announcements yet.</p>
          </div>
        ) : (
          announcements.map((announcement) => (
            <div key={announcement.id} className="announcement-card" style={styles.announcementCard}>
              <div style={styles.announcementHeader}>
                <div style={styles.announcementTitleRow}>
                  <h3 style={styles.announcementTitle}>{announcement.title}</h3>
                  <span
                    style={{
                      ...styles.priorityBadge,
                      background: getPriorityColor(announcement.priority),
                    }}
                  >
                    {getPriorityLabel(announcement.priority)}
                  </span>
                </div>
                <div style={styles.announcementMeta}>
                  <span style={styles.date}>{announcement.date}</span>
                  <span style={styles.author}>By {announcement.author}</span>
                </div>
              </div>
              <p style={styles.announcementContent}>{announcement.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const styles = {
  title: {
    fontSize: 28,
    fontWeight: 700,
    color: "#213547",
    margin: "0 0 8px 0",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    margin: "0 0 20px 0",
  },
  error: {
    padding: "12px 16px",
    backgroundColor: "#fef2f2",
    color: "#dc2626",
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 14,
  },
  announcementsList: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  emptyState: {
    background: "white",
    padding: 48,
    borderRadius: 12,
    textAlign: "center",
    color: "#90a4ae",
    boxShadow: "0 4px 16px rgba(102, 126, 234, 0.05)",
  },
  announcementCard: {
    background: "white",
    padding: 24,
    borderRadius: 12,
    boxShadow: "0 4px 16px rgba(102, 126, 234, 0.1)",
    transition: "all 0.2s ease",
    borderLeft: "4px solid #667eea",
  },
  announcementHeader: {
    marginBottom: 12,
  },
  announcementTitleRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    flexWrap: "wrap",
    gap: 12,
  },
  announcementTitle: {
    fontSize: 20,
    fontWeight: 600,
    color: "#213547",
    margin: 0,
    flex: 1,
  },
  priorityBadge: {
    padding: "4px 12px",
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 600,
    color: "white",
    textTransform: "uppercase",
  },
  announcementMeta: {
    display: "flex",
    gap: 16,
    fontSize: 13,
    color: "#90a4ae",
  },
  date: {
    fontWeight: 500,
  },
  author: {
    fontWeight: 500,
  },
  announcementContent: {
    fontSize: 15,
    color: "#425266",
    lineHeight: 1.6,
    margin: 0,
  },
};

