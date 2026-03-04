import React, { useState, useEffect } from "react";

const API_BASE = "http://localhost:5000";

export default function EventsAchievements() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    type: "Event",
    title: "",
    description: "",
    date: "",
    image: null,
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`${API_BASE}/api/events`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `Error ${res.status}`);
      }
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err.message.includes("fetch") || err.message.includes("Failed to fetch")) {
        setError("Cannot connect to backend. Ensure it is running on http://localhost:5000");
      } else {
        setError(err.message || "Failed to load events and achievements");
      }
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim() || !formData.date) {
      alert("Please fill in Title, Description and Date.");
      return;
    }
    setError("");
    try {
      const body = new FormData();
      body.append("type", formData.type);
      body.append("title", formData.title.trim());
      body.append("description", formData.description.trim());
      body.append("date", formData.date);
      if (formData.image) {
        body.append("image", formData.image);
      }

      const res = await fetch(`${API_BASE}/api/events`, {
        method: "POST",
        body,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to add");
      }

      setFormData({ type: "Event", title: "", description: "", date: "", image: null });
      setShowForm(false);
      fetchItems();
    } catch (err) {
      setError(err.message || "Failed to add event/achievement");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this item?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/events/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Delete failed");
      }
      fetchItems();
    } catch (err) {
      setError(err.message || "Delete failed");
    }
  };

  const imageUrl = (path) => {
    if (!path) return null;
    const base = path.startsWith("http") ? "" : API_BASE;
    return base + path;
  };

  const formatDate = (d) => {
    if (!d) return "";
    const date = typeof d === "string" ? new Date(d) : d;
    return isNaN(date.getTime()) ? d : date.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
  };

  return (
    <div>
      <div style={styles.header}>
        <h2 style={styles.title}>Events & Achievements</h2>
        <button
          type="button"
          style={styles.addButton}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Cancel" : "+ Add Event / Achievement"}
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} style={styles.formCard}>
          <h3 style={styles.formTitle}>Add Event or Achievement</h3>

          <div style={styles.formGroup}>
            <label style={styles.label}>Type</label>
            <select
              style={styles.select}
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              <option value="Event">Event</option>
              <option value="Achievement">Achievement</option>
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Title</label>
            <input
              type="text"
              style={styles.input}
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter title"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Description</label>
            <textarea
              style={styles.textarea}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter description"
              rows={4}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Date</label>
            <input
              type="date"
              style={styles.input}
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Image (optional)</label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              style={styles.fileInput}
              onChange={(e) => setFormData({ ...formData, image: e.target.files[0] || null })}
            />
          </div>

          <button type="submit" style={styles.submitButton}>
            Save
          </button>
        </form>
      )}

      <div style={styles.list}>
        {loading ? (
          <div style={styles.emptyState}>Loading...</div>
        ) : items.length === 0 ? (
          <div style={styles.emptyState}>
            No events or achievements yet. Click &quot;Add Event / Achievement&quot; to create one.
          </div>
        ) : (
          items.map((item) => (
            <div key={item._id} style={styles.card}>
              <div style={styles.cardContent}>
                {item.imagePath && (
                  <div style={styles.imgWrap}>
                    <img
                      src={imageUrl(item.imagePath)}
                      alt={item.title}
                      style={styles.img}
                    />
                  </div>
                )}
                <div style={styles.cardBody}>
                  <div style={styles.cardHeader}>
                    <span
                      style={{
                        ...styles.badge,
                        background: item.type === "Achievement" ? "#43e97b" : "#667eea",
                      }}
                    >
                      {item.type}
                    </span>
                    <span style={styles.date}>{formatDate(item.date)}</span>
                  </div>
                  <h3 style={styles.cardTitle}>{item.title}</h3>
                  <p style={styles.cardDesc}>{item.description}</p>
                  <button
                    type="button"
                    style={styles.deleteBtn}
                    onClick={() => handleDelete(item._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
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
  },
  textarea: {
    width: "100%",
    padding: "12px 16px",
    fontSize: 14,
    border: "1px solid #e0e4e8",
    borderRadius: 8,
    fontFamily: "inherit",
    resize: "vertical",
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
  fileInput: {
    width: "100%",
    padding: 8,
    fontSize: 14,
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
  },
  list: {
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
  card: {
    background: "white",
    borderRadius: 12,
    boxShadow: "0 4px 16px rgba(102, 126, 234, 0.1)",
    overflow: "hidden",
    borderLeft: "4px solid #667eea",
  },
  cardContent: {
    display: "flex",
    flexDirection: "row",
    minHeight: 0,
  },
  imgWrap: {
    width: 200,
    flexShrink: 0,
    background: "#f5f7fa",
  },
  img: {
    width: "100%",
    height: 180,
    objectFit: "cover",
    display: "block",
  },
  cardBody: {
    flex: 1,
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  badge: {
    padding: "4px 12px",
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 600,
    color: "white",
  },
  date: {
    fontSize: 13,
    color: "#90a4ae",
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 600,
    color: "#213547",
    margin: 0,
  },
  cardDesc: {
    fontSize: 15,
    color: "#425266",
    lineHeight: 1.5,
    margin: 0,
    flex: 1,
  },
  deleteBtn: {
    alignSelf: "flex-start",
    padding: "8px 16px",
    fontSize: 13,
    color: "#dc2626",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: 8,
    cursor: "pointer",
  },
};
