import React, { useEffect, useState } from "react";
import { API_BASE } from "../config/api";

// Validate leave before approving: Medical min 2 days, end >= start
function getApproveValidationError(lv) {
  if (!lv.startDate || !lv.endDate) {
    return "Leave has invalid or missing dates. Cannot approve.";
  }
  const start = new Date(lv.startDate);
  const end = new Date(lv.endDate);
  if (end < start) {
    return "End date cannot be earlier than start date. Cannot approve.";
  }
  const leaveType = (lv.leaveType || "Leave").toString().trim();
  if (leaveType === "Medical") {
    const oneDayMs = 24 * 60 * 60 * 1000;
    const daysDiff = (end.getTime() - start.getTime()) / oneDayMs;
    if (daysDiff < 1) {
      return "Medical leave must be for at least 2 days. Cannot approve.";
    }
  }
  return null;
}

export default function LeaveRequests() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchLeaves();
  }, []);

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(""), 4000);
    return () => clearTimeout(t);
  }, [success]);

  async function fetchLeaves() {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`${API_BASE}/leave`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to load leave requests");
      }
      const data = await res.json();
      setLeaves(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load leave requests");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id, status, leaveRecord) {
    setError("");
    setSuccess("");

    if (status === "Approved") {
      const validationError = getApproveValidationError(leaveRecord);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    try {
      setUpdatingId(id);
      const res = await fetch(`${API_BASE}/leave/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "Failed to update leave status");
      }
      setSuccess(data.message || (status === "Approved" ? "Leave approved." : "Leave rejected."));
      await fetchLeaves();
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to update leave status");
    } finally {
      setUpdatingId(null);
    }
  }

  const statusColor = (status) => {
    if (status === "Approved") return "#16a34a";
    if (status === "Rejected") return "#dc2626";
    return "#f59e0b";
  };

  return (
    <div style={styles.card}>
      <h2 style={styles.title}>Leave Requests</h2>
      <p style={styles.subtitle}>
        Review and approve or reject leave applications submitted by students.
      </p>
      {error && <div style={{ ...styles.alert, ...styles.alertError }}>{error}</div>}
      {success && <div style={{ ...styles.alert, ...styles.alertSuccess }}>{success}</div>}

      {loading ? (
        <p style={styles.muted}>Loading...</p>
      ) : leaves.length === 0 ? (
        <p style={styles.muted}>No leave requests found.</p>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Student Name</th>
                <th style={styles.th}>Roll No</th>
                <th style={styles.th}>Class</th>
                <th style={styles.th}>Section</th>
                <th style={styles.th}>Leave Type</th>
                <th style={styles.th}>Start Date</th>
                <th style={styles.th}>End Date</th>
                <th style={styles.th}>Reason</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Applied At</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leaves.map((lv) => (
                <tr key={lv._id}>
                  <td style={styles.td}>{lv.studentName}</td>
                  <td style={styles.td}>{lv.rollNo}</td>
                  <td style={styles.td}>{lv.className}</td>
                  <td style={styles.td}>{lv.section}</td>
                  <td style={styles.td}>
                    {lv.leaveType || "Leave"}
                  </td>
                  <td style={styles.td}>
                    {lv.startDate
                      ? new Date(lv.startDate).toLocaleDateString()
                      : "-"}
                  </td>
                  <td style={styles.td}>
                    {lv.endDate
                      ? new Date(lv.endDate).toLocaleDateString()
                      : "-"}
                  </td>
                  <td style={styles.td}>{lv.reason}</td>
                  <td style={styles.td}>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: 999,
                        fontSize: 12,
                        background: `${statusColor(lv.status)}15`,
                        color: statusColor(lv.status),
                        fontWeight: 600,
                      }}
                    >
                      {lv.status || "Pending"}
                    </span>
                  </td>
                  <td style={styles.td}>
                    {lv.appliedAt
                      ? new Date(lv.appliedAt).toLocaleString()
                      : "-"}
                  </td>
                  <td style={styles.td}>
                    <div style={styles.actions}>
                      <button
                        style={{
                          ...styles.actionButton,
                          background: "#16a34a",
                        }}
                        disabled={updatingId === lv._id || (lv.status || "Pending") !== "Pending"}
                        onClick={() => updateStatus(lv._id, "Approved", lv)}
                      >
                        Approve
                      </button>
                      <button
                        style={{
                          ...styles.actionButton,
                          background: "#dc2626",
                        }}
                        disabled={updatingId === lv._id || (lv.status || "Pending") !== "Pending"}
                        onClick={() => updateStatus(lv._id, "Rejected", lv)}
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const styles = {
  card: {
    background: "#ffffff",
    borderRadius: 16,
    padding: 20,
    boxShadow: "0 4px 14px rgba(15, 23, 42, 0.05)",
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 4,
    color: "#111827",
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 16,
  },
  tableWrapper: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 13,
  },
  th: {
    textAlign: "left",
    padding: "8px 10px",
    borderBottom: "1px solid #e5e7eb",
    background: "#f9fafb",
    color: "#4b5563",
    fontWeight: 600,
    whiteSpace: "nowrap",
  },
  td: {
    padding: "8px 10px",
    borderBottom: "1px solid #f3f4f6",
    color: "#374151",
    whiteSpace: "nowrap",
  },
  actions: {
    display: "flex",
    gap: 6,
  },
  actionButton: {
    border: "none",
    borderRadius: 999,
    padding: "4px 10px",
    color: "#ffffff",
    fontSize: 12,
    cursor: "pointer",
  },
  muted: {
    fontSize: 13,
    color: "#6b7280",
  },
  alert: {
    padding: "8px 12px",
    borderRadius: 8,
    fontSize: 13,
    marginBottom: 8,
  },
  alertError: {
    background: "#fee2e2",
    color: "#b91c1c",
  },
  alertSuccess: {
    background: "#dcfce7",
    color: "#166534",
  },
};

