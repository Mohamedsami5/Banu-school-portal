import React, { useState, useEffect } from "react";
import { API_BASE, withOrigin } from "../config/api";

export default function StudentEventsView() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`${API_BASE}/events`, {
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
      if (err.message?.includes("fetch") || err.message?.includes("Failed to fetch")) {
        setError("Cannot connect to backend. Ensure it is running");
      } else {
        setError(err.message || "Failed to load events and achievements");
      }
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const imageUrl = (path) => {
    if (!path) return null;
    return withOrigin(path);
  };

  const formatDate = (d) => {
    if (!d) return "";
    const date = typeof d === "string" ? new Date(d) : d;
    return isNaN(date.getTime()) ? d : date.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
  };

  return (
    <div>
      <h2 style={styles.title}>Events & Achievements</h2>
      <p style={styles.subtitle}>School events and achievements (read-only)</p>
      {error && <div style={styles.error}>{error}</div>}
      <div style={styles.list}>
        {loading ? (
          <div style={styles.emptyState}>Loading...</div>
        ) : items.length === 0 ? (
          <div style={styles.emptyState}>No events or achievements yet.</div>
        ) : (
          items.map((item) => (
            <div key={item._id} style={styles.card}>
              <div style={styles.cardContent}>
                {item.imagePath && (
                  <div style={styles.imgWrap}>
                    <img src={imageUrl(item.imagePath)} alt={item.title} style={styles.img} />
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
};

