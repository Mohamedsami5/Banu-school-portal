import React, { useEffect, useState } from "react";
import { API_BASE } from "../config/api";
import Modal from "../components/Modal";

export default function StudentDashboardOverview({ user }) {
  const name = user?.name || "Student";
  const rollNo = user?.rollNo || "";
  const className = user?.className || "";
  const section = user?.section || "";

  const [stats, setStats] = useState({
    marks: 0,
    homework: 0,
    events: 0,
    announcements: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState("");
  const [tableData, setTableData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [tableError, setTableError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadCounts() {
      setLoading(true);
      setError("");
      try {
        const tasks = [];

        if (rollNo && className && section) {
          const params = new URLSearchParams({ rollNo, className, section });
          tasks.push(
            fetch(`${API_BASE}/student/marks?${params}`)
              .then((r) => r.json().catch(() => []))
              .then((d) => ({ key: "marks", value: Array.isArray(d) ? d.length : 0 }))
          );
        } else {
          tasks.push(Promise.resolve({ key: "marks", value: 0 }));
        }

        if (className && section) {
          const params = new URLSearchParams({ className, section });
          tasks.push(
            fetch(`${API_BASE}/homework?${params}`)
              .then((r) => r.json().catch(() => []))
              .then((d) => ({ key: "homework", value: Array.isArray(d) ? d.length : 0 }))
          );
        } else {
          tasks.push(Promise.resolve({ key: "homework", value: 0 }));
        }

        tasks.push(
          fetch(`${API_BASE}/events`)
            .then((r) => r.json().catch(() => []))
            .then((d) => ({ key: "events", value: Array.isArray(d) ? d.length : 0 }))
        );

        tasks.push(
          fetch(`${API_BASE}/announcements`)
            .then((r) => r.json().catch(() => []))
            .then((d) => ({ key: "announcements", value: Array.isArray(d) ? d.length : 0 }))
        );

        const results = await Promise.all(tasks);
        if (cancelled) return;
        const next = { marks: 0, homework: 0, events: 0, announcements: 0 };
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
  }, [rollNo, className, section]);

  useEffect(() => {
    if (!activeSection) return;
    const q = searchTerm.trim().toLowerCase();
    if (!q) {
      setFilteredData(tableData);
      return;
    }

    const filtered = tableData.filter((item) => {
      const fields = [];
      if (activeSection === "marks") {
        fields.push(item.subject, item.examType, item.marks, item.status);
      } else if (activeSection === "homework") {
        fields.push(item.title, item.subject, item.description, item.dueDate);
      } else if (activeSection === "events") {
        fields.push(item.title, item.description, item.type, item.date);
      } else if (activeSection === "announcements") {
        fields.push(item.title, item.description, item.createdBy, item.priority);
      }
      return fields
        .map((v) => String(v ?? "").toLowerCase())
        .some((v) => v.includes(q));
    });
    setFilteredData(filtered);
  }, [searchTerm, tableData, activeSection]);

  const openSection = async (sectionKey) => {
    setActiveSection(sectionKey);
    setSearchTerm("");
    setTableError("");
    setTableData([]);
    setFilteredData([]);
    setTableLoading(true);

    try {
      let url = "";
      if (sectionKey === "marks") {
        const params = new URLSearchParams({ rollNo, className, section });
        url = `${API_BASE}/student/marks?${params}`;
      } else if (sectionKey === "homework") {
        const params = new URLSearchParams({ className, section });
        url = `${API_BASE}/homework?${params}`;
      } else if (sectionKey === "events") {
        url = `${API_BASE}/events`;
      } else if (sectionKey === "announcements") {
        url = `${API_BASE}/announcements`;
      }

      const res = await fetch(url);
      const data = await res.json().catch(() => []);
      if (!res.ok) {
        throw new Error(data?.message || "Failed to load data");
      }
      const arr = Array.isArray(data) ? data : data?.data || [];
      setTableData(arr);
      setFilteredData(arr);
    } catch (err) {
      setTableError(err.message || "Failed to load data");
    } finally {
      setTableLoading(false);
    }
  };

  const closeModal = () => {
    setActiveSection("");
    setTableData([]);
    setFilteredData([]);
    setSearchTerm("");
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

    if (filteredData.length === 0) {
      return (
        <div style={styles.placeholderContainer}>
          <p style={styles.placeholderText}>No records found.</p>
        </div>
      );
    }

    if (activeSection === "marks") {
      return (
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
            {filteredData.map((m) => (
              <tr key={m._id}>
                <td style={styles.td}>{m.subject}</td>
                <td style={styles.td}>{m.examType}</td>
                <td style={styles.td}>{m.marks}</td>
                <td style={styles.td}>{m.status || "Approved"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (activeSection === "homework") {
      return (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Title</th>
              <th style={styles.th}>Subject</th>
              <th style={styles.th}>Due Date</th>
              <th style={styles.th}>Description</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((hw) => (
              <tr key={hw._id}>
                <td style={styles.td}>{hw.title || "—"}</td>
                <td style={styles.td}>{hw.subject || "—"}</td>
                <td style={styles.td}>{hw.dueDate ? new Date(hw.dueDate).toLocaleDateString() : "—"}</td>
                <td style={styles.td}>{hw.description || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    if (activeSection === "events") {
      return (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Title</th>
              <th style={styles.th}>Type</th>
              <th style={styles.th}>Date</th>
              <th style={styles.th}>Description</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((e) => (
              <tr key={e._id}>
                <td style={styles.td}>{e.title || "—"}</td>
                <td style={styles.td}>{e.type || "Event"}</td>
                <td style={styles.td}>{e.date ? new Date(e.date).toLocaleDateString() : "—"}</td>
                <td style={styles.td}>{e.description || "—"}</td>
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
          {filteredData.map((a) => (
            <tr key={a._id}>
              <td style={styles.td}>{a.title || "—"}</td>
              <td style={styles.td}>{(a.priority || "Medium").toUpperCase()}</td>
              <td style={styles.td}>{a.createdAt ? new Date(a.createdAt).toLocaleDateString() : "—"}</td>
              <td style={styles.td}>{a.description || a.content || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const modalTitle =
    activeSection === "marks" ? "Marks List" :
    activeSection === "homework" ? "Homework List" :
    activeSection === "events" ? "Events & Achievements" :
    activeSection === "announcements" ? "Announcements" :
    "";

  return (
    <div>
      <h2 style={styles.title}>Welcome back, {name}</h2>
      <p style={styles.subtitle}>
        Use the sidebar to view your marks, homework, events, and announcements.
      </p>

      <div style={styles.cards}>
        <DashboardCard title="Total Marks" value={loading ? "…" : stats.marks} index={0} onClick={() => openSection("marks")} />
        <DashboardCard title="Total Homework" value={loading ? "…" : stats.homework} index={1} onClick={() => openSection("homework")} />
        <DashboardCard title="Total Events" value={loading ? "…" : stats.events} index={2} onClick={() => openSection("events")} />
        <DashboardCard title="Total Announcements" value={loading ? "…" : stats.announcements} index={3} onClick={() => openSection("announcements")} />
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.placeholderSection}>
        <div style={styles.placeholderIcon}>📊</div>
        <p style={styles.placeholderText}>Click a card above to view details</p>
      </div>

      {activeSection && (
        <Modal
          title={modalTitle}
          onClose={closeModal}
          searchTerm={searchTerm}
          onSearchChange={(e) => setSearchTerm(e.target.value)}
        >
          {renderTableContent()}
        </Modal>
      )}
    </div>
  );
}

function DashboardCard({ title, value, index = 0, onClick }) {
  const cardColors = [
    { gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" },
    { gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)" },
    { gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" },
    { gradient: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)" },
  ];
  const scheme = cardColors[index % cardColors.length];

  return (
    <div style={{ ...styles.card, background: scheme.gradient }} onClick={onClick} role="button">
      <div style={styles.cardTitle}>{title}</div>
      <div style={styles.cardValue}>{value}</div>
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
    fontSize: 16,
    color: "#6b7280",
    margin: "0 0 24px 0",
    lineHeight: 1.5,
  },
  cards: {
    display: "flex",
    gap: 16,
    marginBottom: 24,
    flexWrap: "wrap",
  },
  card: {
    padding: 18,
    borderRadius: 12,
    minWidth: 200,
    color: "white",
    boxShadow: "0 8px 20px rgba(33,53,71,0.06)",
    cursor: "pointer",
    userSelect: "none",
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 6,
    color: "rgba(255,255,255,0.95)",
  },
  cardValue: {
    fontSize: 26,
    fontWeight: 700,
  },
  placeholderSection: {
    marginTop: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: "8px 12px",
    borderRadius: 10,
    background: "#f3f6fb",
    color: "#374151",
    width: "fit-content",
    maxWidth: 520,
    marginLeft: "auto",
    marginRight: "auto",
    boxShadow: "0 4px 12px rgba(16,24,40,0.04)",
  },
  placeholderIcon: {
    fontSize: 18,
    marginBottom: 0,
    opacity: 0.9,
  },
  placeholderText: {
    color: "#4b5563",
    fontSize: 14,
    margin: 0,
  },
  placeholderContainer: {
    padding: 28,
    textAlign: "center",
  },
  errorContainer: {
    padding: 20,
    background: "#fff4f4",
    borderRadius: 8,
    border: "1px solid #ffd2d2",
  },
  errorText: {
    color: "#9b1c1c",
    margin: 0,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    background: "#fff",
    fontSize: 14,
  },
  th: {
    textAlign: "left",
    padding: "10px 12px",
    borderBottom: "2px solid #e0e4e8",
    color: "#425266",
    fontWeight: 600,
    background: "#f8fafc",
  },
  td: {
    padding: "10px 12px",
    borderBottom: "1px solid #e0e4e8",
    color: "#213547",
    verticalAlign: "top",
  },
  error: {
    background: "#fef2f2",
    color: "#dc2626",
    borderRadius: 8,
    padding: "8px 10px",
    fontSize: 13,
    border: "1px solid #fecaca",
    marginBottom: 12,
  },
};
