import React from "react";

export default function AdminDashboard({ admin, onLogout }) {
  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1>Admin Dashboard</h1>
        <p>This is a minimal admin dashboard placeholder. Add your widgets here.</p>
        <button style={styles.button} onClick={onLogout}>Logout</button>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f5f7fb",
    padding: "1rem",
  },
  card: {
    width: "100%",
    maxWidth: 900,
    background: "#fff",
    padding: "2rem",
    borderRadius: 8,
    boxShadow: "0 6px 18px rgba(20,30,60,0.08)",
  },
  button: {
    marginTop: "1rem",
    padding: "0.6rem 1rem",
    borderRadius: 6,
    border: "none",
    background: "#2b6cb0",
    color: "white",
    cursor: "pointer",
  }
};
