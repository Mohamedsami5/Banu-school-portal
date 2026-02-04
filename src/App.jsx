import "./index.css";
import { useState } from "react";
import Login from "./Login";
import AdminDashboard from "./pages/AdminDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";

function App() {
  const [user, setUser] = useState(null);
  const [toast, setToast] = useState(null);

  function handleLogin(userInfo) {
    setToast("Login successful");
    setTimeout(() => setToast(null), 2000);
    setUser(userInfo);
  }

  function handleLogout() {
    setUser(null);
  }

  return (
    <div>
      {toast && <div style={styles.toast}>{toast}</div>}
      {!user ? (
        <Login onLogin={handleLogin} />
      ) : user.role === "teacher" ? (
        <TeacherDashboard teacher={user} onLogout={handleLogout} />
      ) : (
        <AdminDashboard admin={user} onLogout={handleLogout} />
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
  },
};

export default App;
