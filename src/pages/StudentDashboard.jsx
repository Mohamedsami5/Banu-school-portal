import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function StudentDashboard() {
  const navigate = useNavigate();
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

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.title}>Student Dashboard</h1>
        <button type="button" style={styles.logoutBtn} onClick={handleLogout}>
          Logout
        </button>
      </header>
      <main style={styles.main}>
        <p style={styles.welcome}>Welcome to Student Dashboard</p>
        {user?.name && (
          <p style={styles.sub}>Hello, {user.name}</p>
        )}
      </main>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f5f7fa",
    display: "flex",
    flexDirection: "column",
  },
  loading: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    fontSize: 18,
    color: "#6b7280",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 24px",
    background: "white",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  },
  title: {
    margin: 0,
    fontSize: 24,
    fontWeight: 700,
    color: "#213547",
    background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  logoutBtn: {
    padding: "8px 16px",
    fontSize: 14,
    fontWeight: 600,
    color: "#6b7280",
    background: "#f3f4f6",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
  },
  main: {
    flex: 1,
    padding: 24,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  welcome: {
    fontSize: 22,
    fontWeight: 600,
    color: "#213547",
    margin: 0,
  },
  sub: {
    fontSize: 16,
    color: "#6b7280",
    marginTop: 8,
  },
};
