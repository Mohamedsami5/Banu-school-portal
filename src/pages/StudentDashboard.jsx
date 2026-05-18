import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import StudentSidebar from "../components/StudentSidebar";
import StudentDashboardOverview from "./StudentDashboardOverview";
import StudentMarks from "./StudentMarks";
import StudentHomework from "./StudentHomework";
import StudentEventsView from "./StudentEventsView";
import StudentAnnouncementsView from "./StudentAnnouncementsView";
import StudentLeaveApplication from "./StudentLeaveApplication";
import ChangePasswordCard from "../components/ChangePasswordCard";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [page, setPage] = useState("overview");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) {
      navigate("/login");
      return;
    }
    try {
      const parsed = JSON.parse(stored);
      if (parsed.role !== "student") {
        if (parsed.role === "admin") navigate("/admin/dashboard");
        else if (parsed.role === "teacher") navigate("/teacher/dashboard");
        else navigate("/login");
        return;
      }
      setUser(parsed);
    } catch {
      navigate("/login");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  function handleLogout() {
    localStorage.removeItem("user");
    navigate("/login");
  }

  if (loading) {
    return (
      <div style={styles.loading}>
        <p>Loading...</p>
      </div>
    );
  }

  function renderMain() {
    switch (page) {
      case "marks":
        return <StudentMarks user={user} />;
      case "homework":
        return <StudentHomework user={user} />;
      case "events":
        return <StudentEventsView />;
      case "announcements":
        return <StudentAnnouncementsView />;
      case "leave":
        return <StudentLeaveApplication user={user} />;
      case "change-password":
        return (
          <ChangePasswordCard
            user={user}
            title="Change Password"
            subtitle="Use your current student password to set a new one."
          />
        );
      default:
        return <StudentDashboardOverview user={user} />;
    }
  }

  return (
    <div style={styles.appRoot}>
      <Header
        title="Student Dashboard"
        onLogout={handleLogout}
        admin={user}
        onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div style={styles.container}>
        <StudentSidebar
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
