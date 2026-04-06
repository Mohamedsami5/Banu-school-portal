import React, { useEffect, useState } from "react";
import { API_BASE } from "../config/api";

export default function ParentLeaveStatus({ child, allChildren = [] }) {
  const [leaves, setLeaves] = useState([]);
  const [allLeaves, setAllLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const studentId = child?._id || "";
  const studentIds = (Array.isArray(allChildren) ? allChildren : [])
    .map((c) => c?._id)
    .filter(Boolean);

  useEffect(() => {
    async function fetchLeaveStatus() {
      const ids = studentIds.length > 0 ? studentIds : (studentId ? [studentId] : []);
      if (ids.length === 0) {
        setLoading(false);
        setError("Child record is unavailable.");
        return;
      }
      try {
        setLoading(true);
        setError("");
        const params = new URLSearchParams({ studentIds: ids.join(",") });
        const res = await fetch(`${API_BASE}/leave?${params}`);
        const data = await res.json().catch(() => []);
        if (!res.ok) throw new Error(data?.message || "Failed to load leave status");
        const arr = Array.isArray(data) ? data : [];
        setAllLeaves(arr);
        setLeaves(arr.filter((lv) => String(lv.studentId) === String(studentId)));
      } catch (err) {
        setError(err.message || "Failed to load leave status");
        setLeaves([]);
        setAllLeaves([]);
      } finally {
        setLoading(false);
      }
    }
    fetchLeaveStatus();
  }, [studentId, studentIds.join(",")]);

  useEffect(() => {
    setLeaves((Array.isArray(allLeaves) ? allLeaves : []).filter((lv) => String(lv.studentId) === String(studentId)));
  }, [studentId, allLeaves]);

  const badge = (status) => {
    if (status === "Approved") return { bg: "#dcfce7", fg: "#15803d" };
    if (status === "Rejected") return { bg: "#fee2e2", fg: "#b91c1c" };
    return { bg: "#fef9c3", fg: "#854d0e" };
  };

  return (
    <div>
      <h2 style={styles.title}>Leave Status</h2>
      <p style={styles.subtitle}>Track your child's leave request statuses.</p>
      {error && <div style={styles.error}>{error}</div>}
      {loading ? (
        <div style={styles.empty}>Loading leave requests...</div>
      ) : leaves.length === 0 ? (
        <div style={styles.empty}>No leave requests found.</div>
      ) : (
        <div style={styles.card}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Leave Type</th>
                <th style={styles.th}>From</th>
                <th style={styles.th}>To</th>
                <th style={styles.th}>Reason</th>
                <th style={styles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {leaves.map((lv) => {
                const c = badge(lv.status);
                return (
                  <tr key={lv._id}>
                    <td style={styles.td}>{lv.leaveType || "Leave"}</td>
                    <td style={styles.td}>{lv.startDate ? new Date(lv.startDate).toLocaleDateString() : "-"}</td>
                    <td style={styles.td}>{lv.endDate ? new Date(lv.endDate).toLocaleDateString() : "-"}</td>
                    <td style={styles.td}>{lv.reason || "-"}</td>
                    <td style={styles.td}>
                      <span style={{ ...styles.badge, background: c.bg, color: c.fg }}>
                        {lv.status || "Pending"}
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
    borderRadius: 12,
    boxShadow: "0 4px 16px rgba(102, 126, 234, 0.1)",
    overflowX: "auto",
  },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 14 },
  th: {
    textAlign: "left",
    padding: "12px 14px",
    background: "#f5f7fa",
    color: "#425266",
    borderBottom: "1px solid #e5e7eb",
    whiteSpace: "nowrap",
  },
  td: {
    padding: "12px 14px",
    color: "#213547",
    borderBottom: "1px solid #f3f4f6",
    whiteSpace: "nowrap",
  },
  badge: { borderRadius: 999, padding: "3px 10px", fontSize: 12, fontWeight: 700 },
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
