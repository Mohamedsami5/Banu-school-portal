import React, { useState, useEffect } from "react";

const API_BASE = "http://localhost:5000/api";

export default function AdminMarksApproval() {
  const [admin, setAdmin] = useState(null);
  const [marks, setMarks] = useState([]);
  const [filteredMarks, setFilteredMarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  // ==============================
  // CHECK ADMIN LOGIN
  // ==============================
  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      setError("Please login as admin");
      return;
    }

    const user = JSON.parse(storedUser);

    if (user.role !== "admin") {
      setError("Access denied. Admin only.");
      return;
    }

    setAdmin(user);
  }, []);

  // ==============================
  // FETCH MARKS
  // ==============================
  const fetchMarks = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${API_BASE}/marks`);
      if (!res.ok) throw new Error("Failed to fetch marks");

      const data = await res.json();

      setMarks(Array.isArray(data) ? data : []);
      setFilteredMarks(Array.isArray(data) ? data : []);
    } catch (err) {
      setError("Failed to load marks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (admin) fetchMarks();
  }, [admin]);

  // ==============================
  // FILTER + SEARCH
  // ==============================
  useEffect(() => {
    let data = [...marks];

    if (statusFilter) {
      data = data.filter((m) => m.status === statusFilter);
    }

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      data = data.filter(
        (m) =>
          m.studentName.toLowerCase().includes(search) ||
          m.rollNo.toLowerCase().includes(search) ||
          m.subject.toLowerCase().includes(search) ||
          m.className.toLowerCase().includes(search)
      );
    }

    setFilteredMarks(data);
  }, [statusFilter, searchTerm, marks]);

  // ==============================
  // UPDATE STATUS
  // ==============================
  const updateStatus = async (id, status) => {
    try {
      setUpdatingId(id);
      setError("");

      const res = await fetch(`${API_BASE}/marks/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) throw new Error("Failed to update status");

      const updatedMarks = marks.map((m) =>
        m._id === id ? { ...m, status } : m
      );

      setMarks(updatedMarks);
      setSuccess(`Mark ${status} successfully`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  // ==============================
  // RENDER
  // ==============================
  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Marks Approval</h2>

      {error && <div style={styles.error}>{error}</div>}
      {success && <div style={styles.success}>{success}</div>}

      {/* Filter bar */}
      <div style={styles.controls}>
        <div style={styles.searchWrap}>
          <span style={styles.searchIcon}>🔍</span>
          <input
            placeholder="Search by name, roll, subject or class…"
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

        <button onClick={fetchMarks} style={styles.refreshBtn}>
          ↻ Refresh
        </button>
      </div>

      {/* TABLE */}
      {loading ? (
        <p style={styles.loadingText}>Loading marks…</p>
      ) : filteredMarks.length === 0 ? (
        <p style={styles.emptyText}>No records match your filters.</p>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Roll</th>
                <th style={styles.th}>Class</th>
                <th style={styles.th}>Section</th>
                <th style={styles.th}>Subject</th>
                <th style={styles.th}>Marks</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMarks.map((m, idx) => (
                <tr
                  key={m._id}
                  style={idx % 2 === 0 ? styles.trEven : styles.trOdd}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#eef0fb")}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background =
                      idx % 2 === 0 ? styles.trEven.background : styles.trOdd.background)
                  }
                >
                  <td style={styles.td}>{m.studentName}</td>
                  <td style={styles.td}>{m.rollNo}</td>
                  <td style={styles.td}>{m.className}</td>
                  <td style={styles.td}>{m.section}</td>
                  <td style={styles.td}>{m.subject}</td>
                  <td style={{ ...styles.td, fontWeight: 600 }}>{m.marks}</td>
                  <td style={styles.td}>
                    <span style={statusBadgeStyle(m.status)}>{m.status}</span>
                  </td>
                  <td style={styles.td}>
                    {m.status === "Pending" ? (
                      <div style={styles.actionGroup}>
                        <button
                          style={{
                            ...styles.approve,
                            opacity: updatingId === m._id ? 0.6 : 1,
                          }}
                          disabled={updatingId === m._id}
                          onClick={() => updateStatus(m._id, "Approved")}
                        >
                          Approve
                        </button>
                        <button
                          style={{
                            ...styles.reject,
                            opacity: updatingId === m._id ? 0.6 : 1,
                          }}
                          disabled={updatingId === m._id}
                          onClick={() => updateStatus(m._id, "Rejected")}
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span style={styles.noAction}>—</span>
                    )}
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

function statusBadgeStyle(status) {
  const base = {
    display: "inline-block",
    padding: "4px 12px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.3px",
  };
  if (status === "Approved")
    return { ...base, background: "#dcfce7", color: "#15803d", border: "1px solid #bbf7d0" };
  if (status === "Rejected")
    return { ...base, background: "#fee2e2", color: "#b91c1c", border: "1px solid #fecaca" };
  return { ...base, background: "#fef9c3", color: "#854d0e", border: "1px solid #fde68a" };
}

const styles = {
  container: {
    padding: 32,
    background: "#f4f6fa",
    minHeight: "100vh",
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    marginBottom: 24,
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },

  // ── Filter bar ──
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

  // ── Table ──
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
    position: "sticky",
    top: 0,
    zIndex: 1,
  },
  trEven: { background: "#ffffff", transition: "background 0.15s ease" },
  trOdd:  { background: "#f8f9ff", transition: "background 0.15s ease" },
  td: {
    padding: "12px 16px",
    color: "#374151",
    borderBottom: "1px solid #f0f1f5",
  },

  // ── Action buttons ──
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

  // ── Feedback ──
  error: {
    background: "#fee2e2",
    color: "#b91c1c",
    padding: "10px 16px",
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 14,
    border: "1px solid #fecaca",
  },
  success: {
    background: "#dcfce7",
    color: "#15803d",
    padding: "10px 16px",
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 14,
    border: "1px solid #bbf7d0",
  },
  loadingText: { color: "#6b7280", fontSize: 15, marginTop: 20 },
  emptyText:   { color: "#9ca3af", fontSize: 15, marginTop: 20 },
};
