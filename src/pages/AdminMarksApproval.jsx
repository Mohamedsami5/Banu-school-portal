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

      {/* Controls */}
      <div style={styles.controls}>
        <input
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.input}
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={styles.input}
        >
          <option value="">All</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>

        <button onClick={fetchMarks} style={styles.refreshBtn}>
          Refresh
        </button>
      </div>

      {/* TABLE */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table style={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Roll</th>
              <th>Class</th>
              <th>Section</th>
              <th>Subject</th>
              <th>Marks</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredMarks.map((m) => (
              <tr key={m._id}>
                <td>{m.studentName}</td>
                <td>{m.rollNo}</td>
                <td>{m.className}</td>
                <td>{m.section}</td>
                <td>{m.subject}</td>
                <td>{m.marks}</td>
                <td>
                  <span
                    style={{
                      ...styles.badge,
                      backgroundColor:
                        m.status === "Approved"
                          ? "#d4edda"
                          : m.status === "Rejected"
                          ? "#f8d7da"
                          : "#fff3cd",
                    }}
                  >
                    {m.status}
                  </span>
                </td>
                <td>
                  {m.status === "Pending" ? (
                    <>
                      <button
                        style={styles.approve}
                        disabled={updatingId === m._id}
                        onClick={() =>
                          updateStatus(m._id, "Approved")
                        }
                      >
                        Approve
                      </button>

                      <button
                        style={styles.reject}
                        disabled={updatingId === m._id}
                        onClick={() =>
                          updateStatus(m._id, "Rejected")
                        }
                      >
                        Reject
                      </button>
                    </>
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const styles = {
  container: { padding: 30, background: "#f4f6fa", minHeight: "100vh" },
  title: { fontSize: 24, fontWeight: 700, marginBottom: 20 },
  controls: { display: "flex", gap: 10, marginBottom: 20 },
  input: { padding: 8, borderRadius: 6, border: "1px solid #ccc" },
  refreshBtn: {
    padding: "8px 14px",
    background: "#667eea",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
  },
  table: { width: "100%", borderCollapse: "collapse", background: "#fff" },
  badge: { padding: "4px 10px", borderRadius: 12, fontSize: 12 },
  approve: {
    marginRight: 5,
    padding: "6px 10px",
    background: "#28a745",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
  },
  reject: {
    padding: "6px 10px",
    background: "#dc3545",
    color: "#fff",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
  },
  error: { background: "#f8d7da", padding: 10, borderRadius: 6 },
  success: { background: "#d4edda", padding: 10, borderRadius: 6 },
};
