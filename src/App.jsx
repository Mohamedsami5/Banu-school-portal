import "./index.css";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";

// Pages
import HomePage from "./pages/HomePage";
import PublicLoginPage from "./pages/PublicLoginPage";
import AdminDashboard from "./pages/AdminDashboard";
import TeacherLayout from "./pages/TeacherLayout";
import TeacherDashboard from "./pages/TeacherDashboard";
import TeacherProfile from "./pages/TeacherProfile";
import TeacherFeedback from "./pages/TeacherFeedback";
import AssignClasses from "./pages/AssignClasses";
import EnterMarks from "./pages/EnterMarks";
import Homework from "./pages/Homework";
import ParentFeedback from "./pages/ParentFeedback";
import StudentFeedback from "./pages/StudentFeedback";

function App() {
  const [toast, setToast] = useState(null);

  return (
    <Router>
      {toast && <div style={styles.toast}>{toast}</div>}
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<PublicLoginPage />} />

        {/* Admin Dashboard */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />

        {/* Teacher Layout */}
        <Route path="/teacher" element={<TeacherLayout />}>
          <Route index element={<TeacherDashboard />} />
          <Route path="dashboard" element={<TeacherDashboard />} />
          <Route path="profile" element={<TeacherProfile />} />
          <Route path="feedback" element={<TeacherFeedback />} />
          <Route path="assign-classes" element={<AssignClasses />} />
          <Route path="marks" element={<EnterMarks />} />
          <Route path="homework" element={<Homework />} />
        </Route>

        {/* Parent / Student */}
        <Route path="/parent/feedback" element={<ParentFeedback />} />
        <Route path="/student/feedback" element={<StudentFeedback />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
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
  },
};

export default App;
