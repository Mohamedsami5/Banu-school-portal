import React, { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";

const API_BASE = "http://localhost:5000/api";

export default function TeacherLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [teacher, setTeacher] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const s = localStorage.getItem("user");
    if (!s) {
      navigate("/login");
      return;
    }
    try {
      const u = JSON.parse(s);
      if (u.role !== "teacher") {
        // send non-teachers to admin or login
        navigate("/login");
        return;
      }
      setTeacher(u);
      
      // Fetch latest teacher data to check profileCompleted status
      const teacherId = u._id || u.id;
      if (teacherId) {
        fetch(`${API_BASE}/teacher/profile/${teacherId}`)
          .then(res => res.json().catch(() => null))
          .then(data => {
            if (data && data.profileCompleted !== undefined) {
              const updatedUser = { ...u, profileCompleted: data.profileCompleted };
              setTeacher(updatedUser);
              localStorage.setItem("user", JSON.stringify(updatedUser));
            }
          })
          .catch(err => console.error("Failed to fetch profile status:", err));
      }
    } catch (err) {
      console.error(err);
      navigate("/login");
    }
  }, [navigate]);

  function handleLogout() {
    localStorage.removeItem("user");
    navigate("/login");
  }

  // Build menu items - Profile appears before Logout
  const menuItems = [
    { id: "dashboard", label: "Dashboard", color: "#667eea" },
    { id: "feedback", label: "Feedback & Remarks", color: "#6b7280" },
    { id: "classes", label: "Assign Classes", color: "#4facfe" },
    { id: "marks", label: "Student Marks", color: "#43e97b" },
    { id: "homework", label: "Homework", color: "#fa709a" },
    { id: "profile", label: "Profile", color: "#22c55e" },
    { id: "logout", label: "Logout", color: "#ef5350" },
  ];

  const getActive = () => {
    const p = location.pathname.replace(/\/$/, "");
    if (p.endsWith("/teacher") || p.endsWith("/teacher/dashboard") || p === "/teacher") return "dashboard";
    if (p.includes("/teacher/feedback")) return "feedback";
    if (p.includes("/teacher/assign-classes")) return "classes";
    if (p.includes("/teacher/marks") || p.includes("/teacher/enter-marks")) return "marks";
    if (p.includes("/teacher/homework")) return "homework";
    if (p.includes("/teacher/profile")) return "profile";
    return "dashboard";
  };

  const handleNavigate = (id) => {
    if (id === "logout") return handleLogout();
    if (id === "dashboard") return navigate("/teacher/dashboard");
    if (id === "feedback") return navigate("/teacher/feedback");
    if (id === "classes") return navigate("/teacher/assign-classes");
    if (id === "marks") return navigate("/teacher/marks");
    if (id === "homework") return navigate("/teacher/homework");
    if (id === "profile") return navigate("/teacher/profile");
  };

  return (
    <div style={styles.appRoot}>
      <Header title="Teacher Portal" onLogout={handleLogout} admin={teacher} onToggleSidebar={() => setIsCollapsed(!isCollapsed)} />
      <div style={styles.container}>
        <Sidebar items={menuItems} active={getActive()} isCollapsed={isCollapsed} onNavigate={handleNavigate} />
        <main style={styles.main}>
          <Outlet />
        </main>
      </div>
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
    padding: 32,
    overflow: "auto",
    background: "#f8f9ff",
  },
};
