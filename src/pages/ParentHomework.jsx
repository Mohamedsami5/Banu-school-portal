import React, { useEffect, useState } from "react";
import { API_BASE } from "../config/api";

export default function ParentHomework({ child, allChildren = [] }) {
  const [homework, setHomework] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const className = child?.className || "";
  const section = child?.section || "";
  const studentIds = (Array.isArray(allChildren) ? allChildren : [])
    .map((c) => c?._id)
    .filter(Boolean);

  useEffect(() => {
    async function fetchHomework() {
      if (!className || !section) {
        setLoading(false);
        setError("Child class/section details are missing.");
        return;
      }
      try {
        setLoading(true);
        setError("");
        let res;
        if (studentIds.length > 0) {
          const params = new URLSearchParams({ studentIds: studentIds.join(",") });
          res = await fetch(`${API_BASE}/parent/homework?${params}`);
        } else {
          const params = new URLSearchParams({ className, section });
          res = await fetch(`${API_BASE}/homework?${params}`);
        }
        const data = await res.json().catch(() => []);
        if (!res.ok) throw new Error(data?.message || "Failed to load homework");
        const arr = Array.isArray(data) ? data : [];
        setHomework(arr.filter((hw) => String(hw.className || "").trim() === String(className).trim() && String(hw.section || "").trim() === String(section).trim()));
      } catch (err) {
        setError(err.message || "Failed to load homework");
        setHomework([]);
      } finally {
        setLoading(false);
      }
    }
    fetchHomework();
  }, [className, section, studentIds.join(",")]);

  return (
    <div>
      <h2 style={styles.title}>Homework</h2>
      <p style={styles.subtitle}>Assigned homework for your child (view-only).</p>
      {error && <div style={styles.error}>{error}</div>}
      {loading ? (
        <div style={styles.empty}>Loading homework...</div>
      ) : homework.length === 0 ? (
        <div style={styles.empty}>No homework assigned.</div>
      ) : (
        <div style={styles.list}>
          {homework.map((hw) => (
            <div key={hw._id} style={styles.card}>
              <div style={styles.cardHead}>
                <h3 style={styles.cardTitle}>{hw.title || "Untitled"}</h3>
                <span style={styles.subject}>{hw.subject || "-"}</span>
              </div>
              <p style={styles.desc}>{hw.description || "No description"}</p>
              <p style={styles.meta}>
                Due: {hw.dueDate ? new Date(hw.dueDate).toLocaleDateString() : "-"}
              </p>
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
    borderRadius: 16,
    padding: 16,
    boxShadow: "0 10px 30px rgba(17, 24, 39, 0.06)",
    borderLeft: "4px solid #43e97b",
    border: "1px solid rgba(148, 163, 184, 0.18)",
  },
  cardHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  cardTitle: { margin: 0, color: "#213547", fontSize: 17, fontWeight: 600 },
  subject: { color: "#667eea", fontSize: 13, fontWeight: 600 },
  desc: { margin: "0 0 8px 0", color: "#425266", fontSize: 14, lineHeight: 1.5 },
  meta: { margin: 0, color: "#6b7280", fontSize: 13 },
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
