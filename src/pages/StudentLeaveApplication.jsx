import React, { useEffect, useState } from "react";
import { API_BASE } from "../config/api";

// Format date as YYYY-MM-DD using local date (avoids timezone issues)
function toYYYYMMDD(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Parse YYYY-MM-DD string; return Date in local time or null if invalid
function parseDateStr(str) {
  if (!str || typeof str !== "string") return null;
  const trimmed = str.trim();
  const match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(trimmed);
  if (!match) return null;
  const [, y, m, d] = match;
  const month = parseInt(m, 10);
  const date = parseInt(d, 10);
  if (month < 1 || month > 12 || date < 1 || date > 31) return null;
  const parsed = new Date(parseInt(y, 10), month - 1, date);
  if (parsed.getFullYear() !== parseInt(y, 10) || parsed.getMonth() !== month - 1 || parsed.getDate() !== date) return null;
  return parsed;
}

export default function StudentLeaveApplication() {
  const [student, setStudent] = useState(null);
  const [leaveType, setLeaveType] = useState("Leave");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Auto-fill from localStorage
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.role === "student") {
          setStudent(parsed);
        }
      }
    } catch (e) {
      console.error("Failed to read student from localStorage", e);
    }
  }, []);

  useEffect(() => {
    if (!student) return;
    fetchLeaves();
  }, [student]);

  async function fetchLeaves() {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams({
        studentId: (student && (student.userId || student._id)) || "",
      });
      const res = await fetch(`${API_BASE}/leave?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to load leave applications");
      }
      const data = await res.json();
      setLeaves(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load leave applications");
    } finally {
      setLoading(false);
    }
  }

  // Date bounds: past from (today - 10 days) to yesterday, and all dates from today onward (local, YYYY-MM-DD)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const minDate = new Date(today);
  minDate.setDate(minDate.getDate() - 10);
  const minDateStr = toYYYYMMDD(minDate);
  // No max: allow all future dates

  // Validate date: YYYY-MM-DD and within [minStr, maxStr]. maxStr optional = no upper bound.
  function validateDate(value, minStr, maxStr, fieldLabel) {
    if (!value || !value.trim()) return { valid: false, error: `Please select ${fieldLabel}.` };
    const parsed = parseDateStr(value);
    if (!parsed) return { valid: false, error: "Invalid date format. Use YYYY-MM-DD (e.g. 2025-03-20)." };
    const normalized = toYYYYMMDD(parsed);
    const minD = parseDateStr(minStr);
    if (minD && parsed < minD) return { valid: false, error: `${fieldLabel} cannot be earlier than 10 days ago. Select a date from the past 10 days or today onward.` };
    if (maxStr) {
      const maxD = parseDateStr(maxStr);
      if (maxD && parsed > maxD) return { valid: false, error: `${fieldLabel} must be on or before ${maxStr}.` };
    }
    return { valid: true, normalized };
  }

  function handleStartDateBlur() {
    if (!startDate.trim()) return;
    const result = validateDate(startDate, minDateStr, null, "Start date");
    if (!result.valid) {
      setError(result.error);
      setStartDate("");
      setEndDate("");
    } else {
      if (result.normalized !== startDate) setStartDate(result.normalized);
      setError("");
    }
  }

  function handleEndDateBlur() {
    if (!endDate.trim()) return;
    const endMin = startDate || minDateStr;
    const result = validateDate(endDate, endMin, null, "End date");
    if (!result.valid) {
      setError(result.error);
      setEndDate("");
    } else {
      const startParsed = parseDateStr(startDate);
      const endParsed = parseDateStr(result.normalized);
      if (startParsed && endParsed && endParsed < startParsed) {
        setError("End date cannot be earlier than start date.");
        setEndDate("");
      } else {
        if (result.normalized !== endDate) setEndDate(result.normalized);
        setError("");
      }
    }
  }

  function getValidationError() {
    if (!startDate || !endDate) {
      return "Please select both start and end dates.";
    }
    const start = parseDateStr(startDate);
    const end = parseDateStr(endDate);
    if (!start) return "Invalid start date format. Use YYYY-MM-DD.";
    if (!end) return "Invalid end date format. Use YYYY-MM-DD.";
    const minD = parseDateStr(minDateStr);
    if (minD && start < minD) return "Start date cannot be earlier than 10 days ago. Select a date from the past 10 days or today onward.";
    if (minD && end < minD) return "End date cannot be earlier than 10 days ago. Select a date from the past 10 days or today onward.";
    if (end < start) return "End date cannot be earlier than start date. Please select an end date on or after the start date.";
    if (leaveType === "Medical") {
      const oneDayMs = 24 * 60 * 60 * 1000;
      const daysDiff = (end.getTime() - start.getTime()) / oneDayMs;
      if (daysDiff < 1) return "Medical leave must be for at least 2 days. Please select a date range that spans at least 2 calendar days.";
    }
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const validationError = getValidationError();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      if (!student) {
        setError("Student information not available. Please re-login.");
        return;
      }

      setSubmitting(true);
      const startParsed = parseDateStr(startDate);
      const endParsed = parseDateStr(endDate);
      const payload = {
        studentId: student.userId || student._id,
        studentName: student.name,
        rollNo: student.rollNo,
        className: student.className,
        section: student.section,
        leaveType,
        startDate: startParsed ? toYYYYMMDD(startParsed) : startDate,
        endDate: endParsed ? toYYYYMMDD(endParsed) : endDate,
        reason,
      };

      const res = await fetch(`${API_BASE}/leave/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to submit leave application");
      }

      setSuccess("Leave application submitted successfully.");
      setLeaveType("Leave");
      setStartDate("");
      setEndDate("");
      setReason("");
      await fetchLeaves();
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to submit leave application");
    } finally {
      setSubmitting(false);
    }
  }

  const statusColor = (status) => {
    if (status === "Approved") return "#16a34a";
    if (status === "Rejected") return "#dc2626";
    return "#f59e0b";
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <h2 style={styles.title}>Leave Application</h2>
        <p style={styles.subtitle}>
          Submit a leave request. Status will be updated by your teacher/admin.
          You can select past dates (up to 10 days ago) or any date from today onward. Medical leave must be at least 2 days.
        </p>

        {student && (
          <div style={styles.studentInfoRow}>
            <div style={styles.infoField}>
              <span style={styles.infoLabel}>Student Name</span>
              <span style={styles.infoValue}>{student.name}</span>
            </div>
            <div style={styles.infoField}>
              <span style={styles.infoLabel}>Roll No</span>
              <span style={styles.infoValue}>{student.rollNo}</span>
            </div>
            <div style={styles.infoField}>
              <span style={styles.infoLabel}>Class</span>
              <span style={styles.infoValue}>{student.className}</span>
            </div>
            <div style={styles.infoField}>
              <span style={styles.infoLabel}>Section</span>
              <span style={styles.infoValue}>{student.section}</span>
            </div>
          </div>
        )}

        {error && <div style={{ ...styles.alert, ...styles.alertError }}>{error}</div>}
        {success && (
          <div style={{ ...styles.alert, ...styles.alertSuccess }}>{success}</div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.fieldRow}>
            <div style={styles.field}>
              <label style={styles.label}>Leave Type</label>
              <select
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value)}
                style={styles.input}
              >
                <option value="Leave">Leave</option>
                <option value="Medical">Medical</option>
                <option value="Exemption">Exemption</option>
              </select>
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Start Date</label>
              <input
                type="date"
                value={startDate}
                min={minDateStr}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setError("");
                }}
                onBlur={handleStartDateBlur}
                style={styles.input}
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>End Date</label>
              <input
                type="date"
                value={endDate}
                min={startDate || minDateStr}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setError("");
                }}
                onBlur={handleEndDateBlur}
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Reason</label>
            <textarea
              rows={3}
              placeholder="Reason for leave"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{ ...styles.input, resize: "vertical" }}
            />
          </div>

          <button type="submit" style={styles.button} disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Leave Application"}
          </button>
        </form>
      </div>

      <div style={styles.card}>
        <h3 style={styles.sectionTitle}>My Leave Applications</h3>
        {loading ? (
          <p style={styles.muted}>Loading...</p>
        ) : leaves.length === 0 ? (
          <p style={styles.muted}>No leave applications yet.</p>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Leave Type</th>
                  <th style={styles.th}>Start Date</th>
                  <th style={styles.th}>End Date</th>
                  <th style={styles.th}>Reason</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Applied At</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map((lv) => (
                  <tr key={lv._id}>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  studentInfoRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    background: "#f9fafb",
    marginBottom: 12,
  },
  infoField: {
    minWidth: 140,
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    color: "#6b7280",
  },
  infoValue: {
    fontSize: 14,
    color: "#111827",
  },
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 600,
    marginBottom: 12,
    color: "#111827",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  fieldRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
  },
  field: {
    flex: 1,
    minWidth: 200,
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: 500,
    color: "#374151",
  },
  input: {
    borderRadius: 8,
    border: "1px solid #d1d5db",
    padding: "8px 10px",
    fontSize: 14,
    outline: "none",
    fontFamily: "inherit",
  },
  button: {
    marginTop: 4,
    alignSelf: "flex-start",
    padding: "8px 16px",
    borderRadius: 999,
    border: "none",
    background:
      "linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%)",
    color: "#ffffff",
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
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
  muted: {
    fontSize: 13,
    color: "#6b7280",
  },
};

