import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import DashboardOverview from "./DashboardOverview";
import ManageTeachers from "./ManageTeachers";
import ManageStudents from "./ManageStudents";
import ManageParents from "./ManageParents";
import Announcements from "./Announcements";
import AdminMarksApproval from "./AdminMarksApproval"; 

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [page, setPage] = useState("overview");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/login");
      return;
    }

    try {
      const user = JSON.parse(storedUser);
      if (user.role !== "admin") {
        navigate("/teacher/dashboard");
        return;
      }
      setAdmin(user);
    } catch (err) {
      navigate("/login");
    }
    setLoading(false);
  }, [navigate]);

  function handleLogout() {
    localStorage.removeItem("user");
    navigate("/login");
  }

  if (loading) {
    return <div style={styles.loading}>Loading...</div>;
  }

  function renderMain() {
    switch (page) {
      case "teachers":
        return <ManageTeachers />;
      case "students":
        return <ManageStudents />;
      case "parents":
        return <ManageParents />;
      case "announcements":
        return <Announcements />;
      case "marks":                        
        return <AdminMarksApproval />;
      default:
        return <DashboardOverview />;
    }
  }

  return (
    <div style={styles.appRoot}>
      <Header
        title="Admin Dashboard"
        onLogout={handleLogout}
        admin={admin}
        onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div style={styles.container}>
        <Sidebar
          active={page}
          isCollapsed={isSidebarCollapsed}
          onNavigate={(id) => {
            if (id === "logout") {
              handleLogout();
              return;
            }
            setPage(id);
          }}
        />

        <main style={styles.main}>{renderMain()}</main>
      </div>
    </div>
  );
}

const styles = {
  appRoot: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
    minHeight: "100vh",
    backgroundColor: "#f5f7fa",
  },
  container: {
    display: "flex",
    flex: 1,
  },
  main: {
    flex: 1,
    padding: "20px",
    overflowY: "auto",
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
