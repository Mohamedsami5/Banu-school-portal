import React, { useState, useEffect } from "react";
import TeachersTable from "../components/TeachersTable";
import StudentsTable from "../components/StudentsTable";
import ParentsTable from "../components/ParentsTable";
import Modal from "../components/Modal";
import { fetchDashboardStats } from "../services/dashboardService";

const API_BASE_URL = "http://localhost:5000/api";

export default function DashboardOverview() {
  const [stats, setStats] = useState({ teachers: 0, students: 0, parents: 0, announcements: 0 });
  const [activeSection, setActiveSection] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchCounts();
  }, []);

  async function fetchCounts() {
    try {
      const data = await fetchDashboardStats();
      setStats({
        teachers: data.teachers || 0,
        students: data.students || 0,
        parents: data.parents || 0,
        announcements: data.announcements || 0,
      });
    } catch (err) {
      console.error("Error fetching dashboard stats:", err);
      // Keep default values on error
      setStats({ teachers: 0, students: 0, parents: 0, announcements: 0 });
    }
  }

  const handleCardClick = async (section) => {
    if (activeSection === section) return; // no-op if already active
    setActiveSection(section);
    setLoading(true);
    setError("");
    setTableData([]);
    setFilteredData([]);
    setSearchTerm("");

    let url = "";
    switch (section) {
      case "teachers":
        url = `${API_BASE_URL}/teachers`;
        break;
      case "students":
        url = `${API_BASE_URL}/students`;
        break;
      case "parents":
        url = `${API_BASE_URL}/parents`;
        break;
      case "announcements":
        url = `${API_BASE_URL}/announcements`;
        break;
      default:
        setLoading(false);
        return;
    }

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch ${section}`);
      const data = await res.json();
      const arr = Array.isArray(data) ? data : data?.data || [];
      setTableData(arr);
      setFilteredData(arr);
    } catch (err) {
      console.error(err);
      setError(`Failed to load ${section} data`);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    const val = e.target.value || "";
    setSearchTerm(val);
    const q = val.toLowerCase();

    const filtered = tableData.filter((item) => {
      // Teachers / Students / Parents: name + email
      const name = (item.name || `${item.firstName || ""} ${item.lastName || ""}`).toLowerCase();
      const email = (item.email || "").toLowerCase();
      if (name.includes(q) || email.includes(q)) return true;

      // Announcements: title + description
      const title = (item.title || "").toLowerCase();
      const desc = (item.description || item.content || "").toLowerCase();
      if (title.includes(q) || desc.includes(q)) return true;

      return false;
    });

    setFilteredData(filtered);
  };

  const handleCloseDetails = () => {
    setActiveSection(null);
    setTableData([]);
    setFilteredData([]);
    setSearchTerm("");
    setError("");
  };

  const renderTableContent = () => {
    if (loading) {
      return (
        <div style={styles.placeholderContainer}>
          <p style={styles.placeholderText}>Loading data...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div style={styles.errorContainer}>
          <p style={styles.errorText}>{error}</p>
        </div>
      );
    }

    switch (activeSection) {
      case "teachers":
        return filteredData.length === 0 ? (
          <div style={styles.placeholderContainer}>
            <p style={styles.placeholderText}>{searchTerm ? "No teachers found" : "No teachers available"}</p>
          </div>
        ) : (
          <TeachersTable data={filteredData} />
        );

      case "students":
        return filteredData.length === 0 ? (
          <div style={styles.placeholderContainer}>
            <p style={styles.placeholderText}>No students available</p>
          </div>
        ) : (
          <StudentsTable data={filteredData} />
        );

      case "parents":
        return filteredData.length === 0 ? (
          <div style={styles.placeholderContainer}>
            <p style={styles.placeholderText}>No parents available</p>
          </div>
        ) : (
          <ParentsTable data={filteredData} />
        );

      case "announcements":
        return filteredData.length === 0 ? (
          <div style={styles.placeholderContainer}>
            <p style={styles.placeholderText}>No announcements available</p>
          </div>
        ) : (
          <AnnouncementsList data={filteredData} />
        );

      default:
        return null;
    }
  };

  return (
    <div>
      <h2 style={styles.pageTitle}>Dashboard Overview</h2>

      <div style={styles.cards}>
        <DashboardCard title="Total Teachers" value={stats.teachers} index={0} isActive={activeSection === "teachers"} onClick={() => handleCardClick("teachers")} />
        <DashboardCard title="Total Students" value={stats.students} index={1} isActive={activeSection === "students"} onClick={() => handleCardClick("students")} />
        <DashboardCard title="Total Parents" value={stats.parents} index={2} isActive={activeSection === "parents"} onClick={() => handleCardClick("parents")} />
        <DashboardCard title="Total Announcements" value={stats.announcements} index={3} isActive={activeSection === "announcements"} onClick={() => handleCardClick("announcements")} />
      </div>

      {activeSection ? (
        <Modal
          title={
            activeSection === "teachers"
              ? "Teachers List"
              : activeSection === "students"
              ? "Students List"
              : activeSection === "parents"
              ? "Parents List"
              : "Announcements"
          }
          onClose={handleCloseDetails}
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
        >
          {renderTableContent()}
        </Modal>
      ) : (
        <div style={styles.placeholderSection}>
          <div style={styles.placeholderIcon}>📊</div>
          <p style={styles.placeholderText}>Click a card above to view details</p>
        </div>
      )}
    </div>
  );
}

// Dashboard Card helper
function DashboardCard({ title, value, index = 0, isActive = false, onClick = () => {} }) {
  const cardColors = [
    { gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",},
    { gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",},
    { gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",},
    { gradient: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",},
  ];

  const scheme = cardColors[index % cardColors.length];

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => (e.key === "Enter" ? onClick() : null)}
      style={{
        ...styles.card,
        background: scheme.gradient,
        boxShadow: isActive ? "0 12px 32px rgba(0,0,0,0.18)" : styles.card.boxShadow,
        transform: isActive ? "scale(1.02)" : "scale(1)",
      }}
    >
      <div style={styles.icon}>{scheme.icon}</div>
      <div style={styles.content}>
        <div style={styles.cardTitle}>{title}</div>
        <div style={styles.cardValue}>{value}</div>
      </div>
    </div>
  );
}

// Announcements list helper
function AnnouncementsList({ data = [] }) {
  const getPriorityColor = (p) => {
    if (!p) return "#90a4ae";
    switch (p.toLowerCase()) {
      case "high":
        return "#ef5350";
      case "medium":
        return "#ffa726";
      case "low":
        return "#66bb6a";
      default:
        return "#90a4ae";
    }
  };

  return (
    <div style={styles.announcementsList}>
      {data.map((a) => (
        <div key={a._id || a.id || JSON.stringify(a)} style={{ ...styles.announcementItem, borderLeftColor: getPriorityColor(a.priority) }}>
          <div style={styles.announcementHeader}>
            <h4 style={styles.announcementTitle}>{a.title}</h4>
            <span style={{ ...styles.priorityBadge, backgroundColor: getPriorityColor(a.priority) }}>{(a.priority || "Medium").toUpperCase()}</span>
          </div>
          <div style={styles.announcementContent}>{a.description || a.content || ""}</div>
          <div style={styles.announcementFooter}>
            <span style={styles.announcementMeta}>By {a.createdBy || "Admin"}</span>
            <span style={styles.announcementMeta}>{a.createdAt ? new Date(a.createdAt).toLocaleDateString() : "N/A"}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

const styles = {
  pageTitle: {
    fontSize: 28,
    fontWeight: 700,
    color: "#213547",
    marginBottom: 20,
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
    display: "flex",
    alignItems: "center",
    gap: 12,
    color: "white",
    transition: "all 0.15s ease",
    cursor: "pointer",
    boxShadow: "0 8px 20px rgba(33,53,71,0.06)",
  },
  icon: {
    fontSize: 32,
    opacity: 0.95,
  },
  content: {
    flex: 1,
  },
  cardTitle: {
    color: "rgba(255,255,255,0.95)",
    marginBottom: 6,
    fontSize: 13,
    fontWeight: 600,
  },
  cardValue: {
    fontSize: 26,
    fontWeight: 700,
  },
  dashboardDetails: {
    marginTop: 24,
    background: "#ffffff",
    padding: 20,
    borderRadius: 12,
    boxShadow: "0 8px 24px rgba(102, 126, 234, 0.06)",
    border: "1px solid rgba(0,0,0,0.04)",
  },
  detailsContent: {
    marginTop: 12,
    overflowX: "auto",
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
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    margin: 0,
    fontSize: 18,
    fontWeight: 700,
  },
  closeButton: {
    background: "transparent",
    border: "none",
    fontSize: 18,
    cursor: "pointer",
    padding: 6,
  },
  searchContainer: {
    marginBottom: 14,
    display: "flex",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid rgba(0,0,0,0.08)",
    fontSize: 14,
  },
  placeholderContainer: {
    padding: 28,
    textAlign: "center",
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
  announcementsList: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  announcementItem: {
    padding: 14,
    borderRadius: 8,
    borderLeft: "6px solid #90a4ae",
    background: "#ffffff",
    boxShadow: "0 4px 12px rgba(33,53,71,0.03)",
  },
  announcementHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 8,
  },
  announcementTitle: {
    margin: 0,
    fontSize: 16,
    fontWeight: 700,
  },
  priorityBadge: {
    color: "white",
    padding: "4px 8px",
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 700,
  },
  announcementContent: {
    marginBottom: 8,
    color: "#374151",
  },
  announcementFooter: {
    display: "flex",
    justifyContent: "space-between",
    color: "#6b7280",
    fontSize: 13,
  },
  announcementMeta: {},
};

