import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import ParentSidebar from "../components/ParentSidebar";
import ParentDashboardOverview from "./ParentDashboardOverview";
import ParentStudentProfile from "./ParentStudentProfile";
import ParentMarks from "./ParentMarks";
import ParentHomework from "./ParentHomework";
import ParentAnnouncements from "./ParentAnnouncements";
import ParentLeaveStatus from "./ParentLeaveStatus";
import ParentEventsView from "./ParentEventsView";
import ChangePasswordCard from "../components/ChangePasswordCard";

export default function ParentDashboard() {
  const navigate = useNavigate();
  const [page, setPage] = useState("overview");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedChildId, setSelectedChildId] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) {
      navigate("/login");
      return;
    }
    try {
      const parsed = JSON.parse(stored);
      if (parsed.role !== "parent") {
        if (parsed.role === "admin") navigate("/admin/dashboard");
        else if (parsed.role === "teacher") navigate("/teacher/dashboard");
        else if (parsed.role === "student") navigate("/student/dashboard");
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

  useEffect(() => {
    if (!user) return;
    const children = Array.isArray(user.children)
      ? user.children
      : (user.child ? [user.child] : []);
    const initial = user.selectedChildId || children[0]?._id || "";
    setSelectedChildId((prev) => prev || initial);
  }, [user]);

  function handleLogout() {
    localStorage.removeItem("user");
    navigate("/login");
  }

  function renderMain() {
    const children = Array.isArray(user?.children)
      ? user.children
      : (user?.child ? [user.child] : []);
    const selected =
      children.find((c) => String(c?._id) === String(selectedChildId)) ||
      children[0] ||
      {};

    switch (page) {
      case "profile":
        return <ParentStudentProfile child={selected} parent={user} />;
      case "marks":
        return <ParentMarks child={selected} allChildren={children} />;
      case "homework":
        return <ParentHomework child={selected} allChildren={children} />;
      case "announcements":
        return <ParentAnnouncements />;
      case "leave-status":
        return <ParentLeaveStatus child={selected} allChildren={children} />;
      case "events":
        return <ParentEventsView />;
      case "change-password":
        return (
          <ChangePasswordCard
            user={user}
            title="Change Password"
            subtitle="Use your current parent password to set a new one."
          />
        );
      default:
        return <ParentDashboardOverview child={selected} allChildren={children} parentUser={user} />;
    }
  }

  if (loading) {
    return (
      <div style={styles.loading}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div style={styles.appRoot}>
      <Header
        title="Parent Dashboard"
        onLogout={handleLogout}
        admin={user}
        onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div style={styles.container}>
        <ParentSidebar
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

        <main style={styles.main}>
          {(() => {
            const children = Array.isArray(user?.children)
              ? user.children
              : (user?.child ? [user.child] : []);
            if (children.length <= 1) return null;
            return (
              <div style={styles.childPicker}>
                <div style={styles.childPickerLabel}>Student</div>
                <select
                  value={selectedChildId}
                  onChange={(e) => setSelectedChildId(e.target.value)}
                  style={styles.childPickerSelect}
                >
                  {children.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name || "Student"}{c.rollNo ? ` (${c.rollNo})` : ""}{c.className ? ` - ${c.className}${c.section ? `-${c.section}` : ""}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            );
          })()}

          {renderMain()}
        </main>
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
    backgroundColor: "#f4f6fb",
  },
  container: {
    display: "flex",
    flex: 1,
  },
  main: {
    flex: 1,
    padding: "24px",
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  childPicker: {
    background: "white",
    borderRadius: 12,
    padding: "12px 14px",
    boxShadow: "0 4px 16px rgba(102, 126, 234, 0.08)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  childPickerLabel: {
    color: "#6b7280",
    fontSize: 13,
    fontWeight: 600,
  },
  childPickerSelect: {
    flex: 1,
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid #e5e7eb",
    background: "#f9fafb",
    color: "#213547",
    fontSize: 14,
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
