import React, { useState, useEffect } from "react";

const API_BASE = "http://localhost:5000/api";

export default function AssignClasses() {
  const [teacher, setTeacher] = useState(null);
  const [assignments, setAssignments] = useState([]);

  useEffect(() => {
    const s = localStorage.getItem("user");
    if (!s) return;
    try {
      const u = JSON.parse(s);
      if (u.role !== "teacher") return;
      setTeacher(u);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const teacherId = teacher?._id;

  useEffect(() => {
    if (!teacherId) return;
    fetchAssignments();
  }, [teacherId]);

  const fetchAssignments = async () => {
    if (!teacherId) return;
    try {
      const res = await fetch(`${API_BASE}/teacher/assignments?teacherId=${encodeURIComponent(teacherId)}`);
      const data = await res.json().catch(() => []);
      setAssignments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch assignments", err);
      setAssignments([]);
    }
  };

  return (
    <div>
      <h2 style={styles.pageTitle}>Assigned Classes</h2>
      <section style={styles.card}>
        <h3 style={styles.sectionTitle}>Your Teaching Assignments</h3>
        {!teacherId ? (
          <p style={styles.placeholder}>Unable to load your profile.</p>
        ) : assignments.length === 0 ? (
          <p style={styles.placeholder}>No classes assigned yet. Contact your administrator.</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Class</th>
                <th style={styles.th}>Section</th>
                <th style={styles.th}>Subject</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((assignment, idx) => (
                <tr key={idx}>
                  <td style={styles.td}>{assignment.className || assignment.class || ""}</td>
                  <td style={styles.td}>{assignment.section || ""}</td>
                  <td style={styles.td}>{assignment.subject || ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {assignments.length > 0 && (
        <section style={styles.card}>
          <h3 style={styles.sectionTitle}>Summary</h3>
          <div style={styles.summaryGrid}>
            <div style={styles.summaryItem}>
              <div style={styles.summaryLabel}>Total Assignments</div>
              <div style={styles.summaryValue}>{assignments.length}</div>
            </div>
            <div style={styles.summaryItem}>
              <div style={styles.summaryLabel}>Classes</div>
              <div style={styles.summaryValue}>
                {new Set(assignments.map((a) => a.className || a.class)).size}
              </div>
            </div>
            <div style={styles.summaryItem}>
              <div style={styles.summaryLabel}>Subjects</div>
              <div style={styles.summaryValue}>
                {new Set(assignments.map((a) => a.subject)).size}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

const styles = {
  appRoot: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
  },
  container: {
    display: "flex",
    flex: 1,
    height: "calc(100vh - 64px)",
    overflow: "hidden",
  },
  main: {
    flex: 1,
    padding: "32px",
    overflow: "auto",
    background: "#f8f9ff",
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: 700,
    color: "#213547",
    marginBottom: 24,
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  card: {
    background: "linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)",
    padding: 28,
    borderRadius: 16,
    boxShadow: "0 8px 24px rgba(102, 126, 234, 0.1)",
    border: "1px solid rgba(102, 126, 234, 0.1)",
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 600,
    color: "#213547",
    marginTop: 0,
    marginBottom: 20,
  },
  placeholder: {
    marginTop: 18,
    color: "#90a4ae",
    fontSize: 15,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: 8,
    fontSize: 14,
  },
  th: {
    textAlign: "left",
    padding: "12px 16px",
    borderBottom: "2px solid #e0e4e8",
    color: "#425266",
    fontWeight: 600,
    backgroundColor: "#f8f9ff",
  },
  td: {
    padding: "12px 16px",
    borderBottom: "1px solid #e0e4e8",
    color: "#213547",
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: 16,
  },
  summaryItem: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#f0f2f5",
    textAlign: "center",
  },
  summaryLabel: {
    fontSize: 13,
    color: "#6b7a86",
    fontWeight: 600,
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: 700,
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  loading: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    fontSize: "18px",
    color: "#6b7280",
  },
};
