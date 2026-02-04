import React, { useState, useEffect } from "react";

const API_BASE_URL = "http://localhost:5000/api";

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    priority: "medium"
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(`${API_BASE_URL}/announcements`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
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
        priority: (a.priority || "MEDIUM").toLowerCase()
      }));
      setAnnouncements(formatted);
    } catch (err) {
      if (err.name === "TypeError" && (err.message.includes("fetch") || err.message.includes("Failed to fetch"))) {
        setError("Cannot connect to backend server. Please ensure the backend is running on http://localhost:5000");
      } else {
        setError(err.message || "Failed to load announcements");
      }
      console.error("Error fetching announcements:", err);
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAnnouncement = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      alert("Please fill in all fields");
      return;
    }
    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/announcements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.content.trim(),
          priority: formData.priority.toUpperCase(),
          createdBy: "Admin"
        })
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to add announcement");
      }
      setFormData({ title: "", content: "", priority: "medium" });
      setShowAddForm(false);
      fetchAnnouncements();
    } catch (err) {
      setError(err.message || "Failed to add announcement");
      console.error("Error adding announcement:", err);
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
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  };

  return (
    <div>
      <div style={styles.header}>
        <h2 style={styles.title}>Announcements</h2>
        <button 
          className="add-button"
          style={styles.addButton}
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? "Cancel" : "+ Add Announcement"}
        </button>
      </div>

      {error && (
        <div style={styles.error}>
          {error}
        </div>
      )}

      {showAddForm && (
        <div style={styles.formCard}>
          <h3 style={styles.formTitle}>Create New Announcement</h3>
          <div style={styles.formGroup}>
            <label style={styles.label}>Title</label>
            <input
              type="text"
              className="announcement-input"
              style={styles.input}
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter announcement title"
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Content</label>
            <textarea
              className="announcement-input"
              style={styles.textarea}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Enter announcement content"
              rows={4}
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Priority</label>
            <select
              className="announcement-input"
              style={styles.select}
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <button className="submit-button" style={styles.submitButton} onClick={handleAddAnnouncement}>
            Publish Announcement
          </button>
        </div>
      )}

      <div style={styles.announcementsList}>
        {loading ? (
          <div style={styles.emptyState}>
            <p>Loading announcements...</p>
          </div>
        ) : announcements.length === 0 ? (
          <div style={styles.emptyState}>
            <p>No announcements yet. Click "Add Announcement" to create one.</p>
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
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    color: "#213547",
    margin: 0,
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  addButton: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    padding: "12px 24px",
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
    fontSize: 15,
    fontWeight: 600,
    boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)",
    transition: "all 0.2s ease",
  },
  error: {
    padding: "12px 16px",
    backgroundColor: "#fef2f2",
    color: "#dc2626",
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 14,
  },
  formCard: {
    background: "white",
    padding: 24,
    borderRadius: 12,
    marginBottom: 24,
    boxShadow: "0 4px 16px rgba(102, 126, 234, 0.1)",
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 600,
    color: "#213547",
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    display: "block",
    marginBottom: 8,
    fontSize: 14,
    fontWeight: 500,
    color: "#425266",
  },
  input: {
    width: "100%",
    padding: "12px 16px",
    fontSize: 14,
    border: "1px solid #e0e4e8",
    borderRadius: 8,
    transition: "all 0.2s ease",
  },
  textarea: {
    width: "100%",
    padding: "12px 16px",
    fontSize: 14,
    border: "1px solid #e0e4e8",
    borderRadius: 8,
    fontFamily: "inherit",
    resize: "vertical",
    transition: "all 0.2s ease",
  },
  select: {
    width: "100%",
    padding: "12px 16px",
    fontSize: 14,
    border: "1px solid #e0e4e8",
    borderRadius: 8,
    background: "white",
    cursor: "pointer",
  },
  submitButton: {
    background: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    color: "white",
    padding: "12px 24px",
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
    fontSize: 15,
    fontWeight: 600,
    boxShadow: "0 4px 12px rgba(67, 233, 123, 0.3)",
    transition: "all 0.2s ease",
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
