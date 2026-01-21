import "./index.css";
import { useState } from "react";
import AdminLogin from "./AdminLogin";
import AdminDashboard from "./AdminDashboard";

function App() {
  const [admin, setAdmin] = useState(null);
  const [toast, setToast] = useState(null);

  function handleLogin(adminData) {
    // show temporary toast then navigate to dashboard
    setToast("Login successful");
    setTimeout(() => setToast(null), 2000);
    // after a short delay navigate
    setTimeout(() => setAdmin(adminData || { email: "admin@dev" }), 1000);
  }

  function handleLogout() {
    setAdmin(null);
  }

  return (
    <div>
      {/* top-bar toast */}
      {toast && (
        <div style={styles.toast}>{toast}</div>
      )}

      {admin ? (
        <AdminDashboard admin={admin} onLogout={handleLogout} />
      ) : (
        <AdminLogin onLogin={handleLogin} />
      )}
    </div>
  );
}

const styles = {
  toast: {
    position: "fixed",
    left: "50%",
    transform: "translateX(-50%)",
    top: 12,
    background: "#2b6cb0",
    color: "white",
    padding: "0.5rem 1rem",
    borderRadius: 6,
    zIndex: 9999,
    boxShadow: "0 6px 18px rgba(20,30,60,0.12)",
  }
};

export default App;

