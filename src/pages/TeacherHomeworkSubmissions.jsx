import React, { useEffect, useState } from "react";
import { API_BASE, withOrigin } from "../config/api";

export default function TeacherHomeworkSubmissions() {
  const [teacher, setTeacher] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    const s = localStorage.getItem("user");
    if (!s) return;
    try {
      const u = JSON.parse(s);
      if (u.role !== "teacher") return;
      setTeacher(u);
    } catch {
      setTeacher(null);
    }
  }, []);

  const teacherId = teacher?._id || teacher?.id;

  const fetchSubmissions = async () => {
    if (!teacherId) return;
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams({ teacherId });
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`${API_BASE}/homework/submissions?${params}`);
      const data = await res.json().catch(() => []);
      if (!res.ok) throw new Error(data.message || "Failed to load submissions");
      const list = Array.isArray(data) ? data : [];
      setSubmissions(list);
      setFiltered(list);
    } catch (err) {
      setError(err.message || "Failed to load submissions");
      setSubmissions([]);
      setFiltered([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [teacherId, statusFilter]);

  useEffect(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) {
      setFiltered(submissions);
      return;
    }
    const data = submissions.filter((s) => {
      const hw = s.homeworkId || {};
      const fields = [
        s.studentName,
        s.rollNo,
        hw.title,
        hw.subject,
        hw.className,
        hw.section,
        s.answerText,
        s.status
      ];
      return fields
        .map((v) => String(v ?? "").toLowerCase())
        .some((v) => v.includes(q));
    });
    setFiltered(data);
  }, [searchTerm, submissions]);

  const updateStatus = async (id, status) => {
    try {
      setUpdatingId(id);
      setError("");
      const res = await fetch(`${API_BASE}/homework/submissions/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to update status");
      setSubmissions((prev) =>
        prev.map((s) => (s._id === id ? { ...s, status } : s))
      );
    } catch (err) {
      setError(err.message || "Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div>
      <h2 style={styles.title}>Homework Submissions</h2>

      <div style={styles.controls}>
        <div style={styles.searchWrap}>
          <span style={styles.searchIcon}>🔍</span>
          <input
            placeholder="Search by student, roll, subject or title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={styles.select}
        >
          <option value="">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>

        <button onClick={fetchSubmissions} style={styles.refreshBtn}>
          ↻ Refresh
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {loading ? (
        <p style={styles.loadingText}>Loading submissions…</p>
      ) : filtered.length === 0 ? (
        <p style={styles.emptyText}>No submissions found.</p>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Student</th>
                <th style={styles.th}>Roll</th>
                <th style={styles.th}>Class</th>
                <th style={styles.th}>Subject</th>
                <th style={styles.th}>Homework</th>
                <th style={styles.th}>Submitted</th>
                <th style={styles.th}>Answer</th>
                <th style={styles.th}>Photo</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, idx) => {
                const hw = s.homeworkId || {};
                return (
                  <tr key={s._id} style={idx % 2 === 0 ? styles.trEven : styles.trOdd}>
                    <td style={styles.td}>{s.studentName}</td>
                    <td style={styles.td}>{s.rollNo}</td>
                    <td style={styles.td}>{hw.className ? `${hw.className}-${hw.section}` : "—"}</td>
                    <td style={styles.td}>{hw.subject || "—"}</td>
                    <td style={styles.td}>{hw.title || "—"}</td>
                    <td style={styles.td}>{s.submittedAt ? new Date(s.submittedAt).toLocaleString() : "—"}</td>
                    <td style={styles.td}>{s.answerText || "—"}</td>
                    <td style={styles.td}>
                      {s.photo ? (
                        <a href={withOrigin(s.photo)} target="_blank" rel="noreferrer">View</a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td style={styles.td}>
                      <span style={statusBadgeStyle(s.status || "Pending")}>
                        {s.status || "Pending"}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {s.status === "Pending" ? (
                        <div style={styles.actionGroup}>
                          <button
                            style={{ ...styles.approve, opacity: updatingId === s._id ? 0.6 : 1 }}
                            disabled={updatingId === s._id}
                            onClick={() => updateStatus(s._id, "Approved")}
                          >
                            Approve
                          </button>
                          <button
                            style={{ ...styles.reject, opacity: updatingId === s._id ? 0.6 : 1 }}
                            disabled={updatingId === s._id}
                            onClick={() => updateStatus(s._id, "Rejected")}
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span style={styles.noAction}>—</span>
                      )}
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

function statusBadgeStyle(status) {
  const base = {
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.2px",
  };
  if (status === "Approved")
    return { ...base, background: "#dcfce7", color: "#15803d", border: "1px solid #bbf7d0" };
  if (status === "Rejected")
    return { ...base, background: "#fee2e2", color: "#b91c1c", border: "1px solid #fecaca" };
  return { ...base, background: "#fef9c3", color: "#854d0e", border: "1px solid #fde68a" };
}

const styles = {
  title: {
    fontSize: 28,
    fontWeight: 700,
    marginBottom: 24,
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  controls: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
    flexWrap: "wrap",
  },
  searchWrap: {
    position: "relative",
    flex: "1 1 260px",
  },
  searchIcon: {
    position: "absolute",
    left: 10,
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: 14,
    pointerEvents: "none",
  },
  searchInput: {
    width: "100%",
    padding: "9px 12px 9px 34px",
    borderRadius: 8,
    border: "1px solid #dde1ea",
    fontSize: 14,
    color: "#213547",
    background: "#fff",
    boxSizing: "border-box",
    outline: "none",
  },
  select: {
    padding: "9px 12px",
    borderRadius: 8,
    border: "1px solid #dde1ea",
    fontSize: 14,
    color: "#213547",
    background: "#fff",
    cursor: "pointer",
    minWidth: 150,
  },
  refreshBtn: {
    padding: "9px 18px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
    whiteSpace: "nowrap",
  },
  tableWrapper: {
    borderRadius: 12,
    overflow: "hidden",
    boxShadow: "0 4px 20px rgba(102, 126, 234, 0.1)",
    border: "1px solid #e8eaf0",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    background: "#fff",
    fontSize: 14,
  },
  th: {
    padding: "13px 16px",
    textAlign: "left",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "#fff",
    fontWeight: 600,
    fontSize: 13,
    letterSpacing: "0.3px",
  },
  td: {
    padding: "12px 16px",
    color: "#374151",
    borderBottom: "1px solid #f0f1f5",
    verticalAlign: "top",
  },
  trEven: { background: "#ffffff" },
  trOdd: { background: "#f8f9ff" },
  actionGroup: {
    display: "flex",
    gap: 8,
  },
  approve: {
    padding: "6px 14px",
    background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 13,
  },
  reject: {
    padding: "6px 14px",
    background: "linear-gradient(135deg, #f87171 0%, #dc2626 100%)",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 13,
  },
  noAction: {
    color: "#9ca3af",
    fontSize: 16,
  },
  loadingText: { color: "#6b7280", fontSize: 15, marginTop: 20 },
  emptyText: { color: "#9ca3af", fontSize: 15, marginTop: 20 },
  error: {
    background: "#fee2e2",
    color: "#b91c1c",
    padding: "10px 16px",
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 14,
    border: "1px solid #fecaca",
  },
};
