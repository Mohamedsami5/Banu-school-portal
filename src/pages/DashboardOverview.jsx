import React, { useEffect, useState } from "react";
import { API_BASE } from "../config/api";

export default function DashboardOverview() {
  const [stats, setStats] = useState({
    teachers: 0,
    students: 0,
    parents: 0,
    announcements: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState("");
  const [tableData, setTableData] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [tableError, setTableError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadCounts() {
      setLoading(true);
      setError("");
      try {
        const tasks = [
          fetch(`${API_BASE}/teachers`)
            .then((r) => r.json().catch(() => []))
            .then((d) => ({ key: "teachers", value: Array.isArray(d) ? d.length : 0 })),
          fetch(`${API_BASE}/students`)
            .then((r) => r.json().catch(() => []))
            .then((d) => ({ key: "students", value: Array.isArray(d) ? d.length : 0 })),
          fetch(`${API_BASE}/parents`)
            .then((r) => r.json().catch(() => []))
            .then((d) => ({ key: "parents", value: Array.isArray(d) ? d.length : 0 })),
          fetch(`${API_BASE}/announcements`)
            .then((r) => r.json().catch(() => []))
            .then((d) => ({ key: "announcements", value: Array.isArray(d) ? d.length : 0 })),
        ];

        const results = await Promise.all(tasks);
        if (cancelled) return;
        const next = { teachers: 0, students: 0, parents: 0, announcements: 0 };
        results.forEach((r) => { next[r.key] = r.value; });
        setStats(next);
      } catch (err) {
        if (!cancelled) setError(err.message || "Failed to load dashboard data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadCounts();
    return () => { cancelled = true; };
  }, []);

  const cards = [
    { key: "teachers", label: "Total Teachers", value: stats.teachers },
    { key: "students", label: "Total Students", value: stats.students },
    { key: "parents", label: "Total Parents", value: stats.parents },
    { key: "announcements", label: "Total Announcements", value: stats.announcements },
  ];

  const formatTeaching = (teaching) => {
    if (!Array.isArray(teaching) || teaching.length === 0) return "No assignments";
    return teaching.map((t) => `${t.className}(${t.section}) - ${t.subject}`).join(", ");
  };

  const openSection = async (sectionKey) => {
    setActiveSection(sectionKey);
    setTableError("");
    setTableData([]);
    setTableLoading(true);

    try {
      let url = "";
      if (sectionKey === "teachers") url = `${API_BASE}/teachers`;
      if (sectionKey === "students") url = `${API_BASE}/students`;
      if (sectionKey === "parents") url = `${API_BASE}/parents`;
      if (sectionKey === "announcements") url = `${API_BASE}/announcements`;

      const res = await fetch(url);
      const data = await res.json().catch(() => []);
      if (!res.ok) throw new Error(data?.message || "Failed to load data");
      const arr = Array.isArray(data) ? data : data?.data || [];
      setTableData(arr);
    } catch (err) {
      setTableError(err.message || "Failed to load data");
    } finally {
      setTableLoading(false);
    }
  };

  const closeSection = () => {
    setActiveSection("");
    setTableData([]);
    setTableError("");
  };

  const renderTableContent = () => {
    if (tableLoading) {
      return (
        <div style={styles.placeholderContainer}>
          <p style={styles.placeholderText}>Loading data...</p>
        </div>
      );
    }

    if (tableError) {
      return (
        <div style={styles.errorContainer}>
          <p style={styles.errorText}>{tableError}</p>
        </div>
      );
    }

    if (tableData.length === 0) {
      return (
        <div style={styles.placeholderContainer}>
          <p style={styles.placeholderText}>No records found.</p>
        </div>
      );
    }

    if (activeSection === "teachers") {
      return (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Classes & Subjects</th>
              <th style={styles.th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((t) => (
              <tr key={t._id || t.id}>
                <td style={styles.td}>{t.name}</td>
                <td style={styles.td}>{t.email}</td>
                <td style={styles.td}>{formatTeaching(t.teaching)}</td>
                <td style={styles.td}>{t.status || "Active"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (activeSection === "students") {
      return (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Roll No</th>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Class</th>
              <th style={styles.th}>Section</th>
              <th style={styles.th}>Parent</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((s) => (
              <tr key={s._id || s.id}>
                <td style={styles.td}>{s.rollNo}</td>
                <td style={styles.td}>{s.name}</td>
                <td style={styles.td}>{s.className}</td>
                <td style={styles.td}>{s.section || "A"}</td>
                <td style={styles.td}>{s.parentName || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (activeSection === "parents") {
      return (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Parent Name</th>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Student</th>
              <th style={styles.th}>Class</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((p) => (
              <tr key={p._id || p.id}>
                <td style={styles.td}>{p.parentName || p.name}</td>
                <td style={styles.td}>{p.email}</td>
                <td style={styles.td}>{p.studentName || "-"}</td>
                <td style={styles.td}>{p.className || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    return (
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Title</th>
            <th style={styles.th}>Priority</th>
            <th style={styles.th}>Date</th>
            <th style={styles.th}>Description</th>
          </tr>
        </thead>
        <tbody>
          {tableData.map((a) => (
            <tr key={a._id || a.id}>
              <td style={styles.td}>{a.title}</td>
              <td style={styles.td}>{(a.priority || "Medium").toUpperCase()}</td>
              <td style={styles.td}>{a.createdAt ? new Date(a.createdAt).toLocaleDateString() : "-"}</td>
              <td style={styles.td}>{a.description || a.content || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Dashboard Overview</h2>

      <div style={styles.cards}>
        {cards.map((card, index) => (
          <div
            key={card.key}
            style={{ ...styles.card, background: gradients[index % gradients.length] }}
            onClick={() => openSection(card.key)}
            role="button"
          >
            <div style={styles.cardTitle}>{card.label}</div>
            <div style={styles.cardValue}>{loading ? "..." : card.value}</div>
          </div>
        ))}
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.placeholderSection}>
        <div style={styles.placeholderIcon}>📊</div>
        <p style={styles.placeholderText}>Click a card above to view details</p>
      </div>

      {activeSection && (
        <div style={styles.tableSection}>
          <div style={styles.tableHeader}>
            <h3 style={styles.tableTitle}>
              {activeSection === "teachers"
                ? "Teachers"
                : activeSection === "students"
                ? "Students"
                : activeSection === "parents"
                ? "Parents"
                : "Announcements"}
            </h3>
            <button style={styles.clearButton} onClick={closeSection}>
              Clear
            </button>
          </div>
          <div style={styles.tableCard}>{renderTableContent()}</div>
        </div>
      )}
    </div>
  );
}

const gradients = [
  "linear-gradient(135deg, #756bcd 0%, #5a4fcf 100%)",
  "linear-gradient(135deg, #70ceea 0%, #00a6ff 100%)",
  "linear-gradient(135deg, #e4a0ba 0%, #ff6f85 100%)",
  "linear-gradient(135deg, #d1b186 0%, #f9cf62 100%)",
];

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    color: "#1f2937",
    margin: "0 0 8px 0",
  },
  cards: {
    display: "flex",
    flexWrap: "wrap",
    gap: 16,
  },
  card: {
    minWidth: 180,
    padding: "14px 16px",
    borderRadius: 10,
    color: "white",
    boxShadow: "0 8px 20px rgba(31,41,55,0.12)",
    cursor: "pointer",
    userSelect: "none",
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: 600,
    opacity: 0.95,
    marginBottom: 6,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 700,
  },
  placeholderSection: {
    marginTop: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "8px 12px",
    borderRadius: 10,
    background: "#f3f6fb",
    color: "#374151",
    width: "fit-content",
    maxWidth: 420,
    marginLeft: "auto",
    marginRight: "auto",
    boxShadow: "0 4px 12px rgba(16,24,40,0.05)",
  },
  tableSection: {
    marginTop: 12,
  },
  tableHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  tableTitle: {
    margin: 0,
    fontSize: 16,
    color: "#1f2937",
  },
  clearButton: {
    border: "1px solid #e5e7eb",
    background: "#fff",
    color: "#374151",
    padding: "6px 10px",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 12,
  },
  tableCard: {
    background: "#fff",
    borderRadius: 12,
    padding: 12,
    boxShadow: "0 6px 18px rgba(16,24,40,0.06)",
    border: "1px solid #eef2f7",
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    background: "#fff",
    fontSize: 13,
  },
  th: {
    textAlign: "left",
    padding: "10px 12px",
    borderBottom: "2px solid #e0e4e8",
    color: "#425266",
    fontWeight: 600,
    background: "#f8fafc",
    whiteSpace: "nowrap",
  },
  td: {
    padding: "10px 12px",
    borderBottom: "1px solid #e0e4e8",
    color: "#213547",
    verticalAlign: "top",
  },
  placeholderContainer: {
    padding: 18,
    textAlign: "center",
  },
  errorContainer: {
    padding: 14,
    background: "#fff4f4",
    borderRadius: 8,
    border: "1px solid #ffd2d2",
  },
  errorText: {
    color: "#9b1c1c",
    margin: 0,
  },
  placeholderIcon: {
    fontSize: 16,
    marginBottom: 0,
    opacity: 0.9,
  },
  placeholderText: {
    color: "#4b5563",
    fontSize: 13,
    margin: 0,
  },
  error: {
    background: "#fef2f2",
    color: "#dc2626",
    borderRadius: 8,
    padding: "8px 10px",
    fontSize: 13,
    border: "1px solid #fecaca",
    marginTop: 4,
    width: "fit-content",
  },
};
