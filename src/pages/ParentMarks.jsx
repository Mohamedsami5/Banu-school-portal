import React, { useEffect, useState } from "react";
import { API_BASE } from "../config/api";

export default function ParentMarks({ child, allChildren = [] }) {
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const rollNo = child?.rollNo || "";
  const className = child?.className || "";
  const section = child?.section || "";
  const studentId = child?._id || "";
  const studentIds = (Array.isArray(allChildren) ? allChildren : [])
    .map((c) => c?._id)
    .filter(Boolean);

  useEffect(() => {
    async function fetchMarks() {
      if (!rollNo || !className || !section) {
        setLoading(false);
        setError("Child profile is incomplete.");
        return;
      }
      try {
        setLoading(true);
        setError("");
        let res;
        if (studentIds.length > 0) {
          const params = new URLSearchParams({ studentIds: studentIds.join(",") });
          res = await fetch(`${API_BASE}/parent/marks?${params}`);
        } else {
          const params = new URLSearchParams({ rollNo, className, section });
          res = await fetch(`${API_BASE}/student/marks?${params}`);
        }
        const data = await res.json().catch(() => []);
        if (!res.ok) throw new Error(data?.message || "Failed to load marks");
        const arr = Array.isArray(data) ? data : [];
        setMarks(studentIds.length > 0 ? arr.filter((m) => String(m.studentId) === String(studentId)) : arr);
      } catch (err) {
        setError(err.message || "Failed to load marks");
        setMarks([]);
      } finally {
        setLoading(false);
      }
    }
    fetchMarks();
  }, [rollNo, className, section, studentId, studentIds.join(",")]);

  return (
    <div>
      <h2 style={styles.title}>Marks</h2>
      <p style={styles.subtitle}>Approved marks only for your child.</p>
      {error && <div style={styles.error}>{error}</div>}
      {loading ? (
        <div style={styles.empty}>Loading marks...</div>
      ) : marks.length === 0 ? (
        <div style={styles.empty}>No approved marks available.</div>
      ) : (
        <div style={styles.card}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Subject</th>
                <th style={styles.th}>Exam Type</th>
                <th style={styles.th}>Marks</th>
                <th style={styles.th}>Pass/Fail</th>
              </tr>
            </thead>
            <tbody>
              {marks.map((m) => {
                const pass = Number(m.marks) >= 35;
                return (
                  <tr key={m._id}>
                    <td style={styles.td}>{m.subject}</td>
                    <td style={styles.td}>{m.examType}</td>
                    <td style={styles.td}>{m.marks}</td>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, ...(pass ? styles.pass : styles.fail) }}>
                        {pass ? "Pass" : "Fail"}
                      </span>
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
  subtitle: { fontSize: 14, color: "#6b7280", margin: "0 0 20px 0" },
  card: {
    background: "white",
    borderRadius: 16,
    boxShadow: "0 10px 30px rgba(17, 24, 39, 0.06)",
    overflow: "hidden",
    border: "1px solid rgba(148, 163, 184, 0.18)",
  },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 14 },
  th: {
    textAlign: "left",
    padding: "12px 14px",
    background: "#f8fafc",
    color: "#475569",
    borderBottom: "1px solid #e5e7eb",
    fontWeight: 800,
    fontSize: 12,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
  },
  td: {
    padding: "12px 14px",
    color: "#213547",
    borderBottom: "1px solid #f3f4f6",
  },
  badge: { fontSize: 12, fontWeight: 600, borderRadius: 8, padding: "4px 10px", color: "white" },
  pass: { background: "#16a34a" },
  fail: { background: "#dc2626" },
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
