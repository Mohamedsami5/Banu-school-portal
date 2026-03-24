import React, { useState, useEffect } from "react";
import { API_BASE } from "../config/api";

export default function StudentMarks({ user }) {
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const rollNo = user?.rollNo ?? "";
  const className = user?.className ?? "";
  const section = user?.section ?? "";

  useEffect(() => {
    if (!rollNo || !className || !section) {
      setLoading(false);
      setError("Your profile is missing class, section, or roll number.");
      return;
    }
    fetchMarks();
  }, [rollNo, className, section]);

  async function fetchMarks() {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams({
        rollNo: rollNo,
        className: className,
        section: section
      });
      const res = await fetch(`${API_BASE}/student/marks?${params}`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Error ${res.status}`);
      }
      const data = await res.json();
      setMarks(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err.message?.includes("fetch") || err.message?.includes("Failed to fetch")) {
        setError("Cannot connect to server. Ensure the backend is running");
      } else {
        setError(err.message || "Failed to load marks");
      }
      setMarks([]);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={styles.emptyState}>
        <p>Loading marks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h2 style={styles.title}>Marks</h2>
        <div style={styles.error}>{error}</div>
      </div>
    );
  }

  return (
    <div>
      <h2 style={styles.title}>My Marks</h2>
      <p style={styles.subtitle}>
        Approved marks for Roll No. {rollNo}, Class {className}-{section}
      </p>
      {marks.length === 0 ? (
        <div style={styles.emptyState}>
          <p>No approved marks yet. Marks will appear here once your teacher submits and admin approves them.</p>
        </div>
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Subject</th>
                <th style={styles.th}>Exam Type</th>
                <th style={styles.th}>Marks</th>
                <th style={styles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {marks.map((m) => {
                const passStatus = m.marks >= 35 ? "Pass" : "Fail";
                const badgeColor = m.marks >= 35 ? "#43e97b" : "#ef4444";
                return (
                  <tr key={m._id}>
                    <td style={styles.td}>{m.subject}</td>
                    <td style={styles.td}>{m.examType}</td>
                    <td style={styles.td}>{m.marks}</td>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, background: badgeColor }}>{passStatus}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
  emptyState: {
    background: "white",
    padding: 48,
    borderRadius: 12,
    textAlign: "center",
    color: "#90a4ae",
    boxShadow: "0 4px 16px rgba(102, 126, 234, 0.05)",
  },
  tableWrap: {
    background: "white",
    borderRadius: 12,
    boxShadow: "0 4px 16px rgba(102, 126, 234, 0.1)",
    overflow: "hidden",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 14,
  },
  th: {
    textAlign: "left",
    padding: "14px 16px",
    background: "#f5f7fa",
    fontWeight: 600,
    color: "#425266",
  },
  td: {
    padding: "14px 16px",
    borderTop: "1px solid #e0e4e8",
    color: "#213547",
  },
  badge: {
    padding: "4px 10px",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 600,
    color: "white",
  },
};

