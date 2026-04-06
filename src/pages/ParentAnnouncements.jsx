import React, { useEffect, useState } from "react";
import { API_BASE } from "../config/api";

export default function ParentAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchAnnouncements() {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(`${API_BASE}/announcements`);
        const data = await res.json().catch(() => []);
        if (!res.ok) throw new Error(data?.message || "Failed to load announcements");
        setAnnouncements(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || "Failed to load announcements");
        setAnnouncements([]);
      } finally {
        setLoading(false);
      }
    }
    fetchAnnouncements();
  }, []);

  return (
    <div>
      <h2 style={styles.title}>Announcements</h2>
      <p style={styles.subtitle}>All school announcements (read-only).</p>
      {error && <div style={styles.error}>{error}</div>}
      {loading ? (
        <div style={styles.empty}>Loading announcements...</div>
      ) : announcements.length === 0 ? (
        <div style={styles.empty}>No announcements available.</div>
      ) : (
        <div style={styles.list}>
          {announcements.map((a) => (
            <div key={a._id} style={styles.card}>
              <div style={styles.head}>
                <h3 style={styles.cardTitle}>{a.title || "-"}</h3>
                <span style={styles.priority}>{(a.priority || "medium").toUpperCase()}</span>
              </div>
              <p style={styles.meta}>
                {a.createdAt ? new Date(a.createdAt).toLocaleDateString() : "-"} | By {a.createdBy || "Admin"}
              </p>
              <p style={styles.desc}>{a.description || a.content || "-"}</p>
            </div>
          ))}
        </div>
      )}
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
  subtitle: { fontSize: 14, color: "#6b7280", margin: "0 0 20px 0" },
  list: { display: "flex", flexDirection: "column", gap: 14 },
  card: {
    background: "white",
    borderRadius: 12,
    padding: 16,
    boxShadow: "0 4px 16px rgba(102, 126, 234, 0.1)",
    borderLeft: "4px solid #667eea",
  },
  head: { display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 8 },
  cardTitle: { margin: 0, fontSize: 18, color: "#213547" },
  priority: {
    background: "#667eea",
    color: "white",
    borderRadius: 10,
    padding: "3px 8px",
    fontSize: 11,
    fontWeight: 600,
    height: "fit-content",
  },
  meta: { margin: "0 0 8px 0", color: "#6b7280", fontSize: 12 },
  desc: { margin: 0, color: "#425266", fontSize: 14, lineHeight: 1.5 },
  empty: {
    background: "white",
    padding: 40,
    borderRadius: 12,
    color: "#6b7280",
    textAlign: "center",
    boxShadow: "0 4px 16px rgba(102, 126, 234, 0.05)",
  },
  error: {
    padding: "12px 16px",
    backgroundColor: "#fef2f2",
    color: "#dc2626",
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 14,
  },
};
