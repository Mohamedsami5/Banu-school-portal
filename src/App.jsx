import "./index.css";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";

// Pages
import PublicLoginPage from "./pages/PublicLoginPage";
import AdminDashboard from "./pages/AdminDashboard";
import TeacherLayout from "./pages/TeacherLayout";
import TeacherDashboard from "./pages/TeacherDashboard";
import TeacherProfile from "./pages/TeacherProfile";
import TeacherFeedback from "./pages/TeacherFeedback";
import AssignClasses from "./pages/AssignClasses";
import EnterMarks from "./pages/EnterMarks";
import Homework from "./pages/Homework";
import TeacherHomeworkSubmissions from "./pages/TeacherHomeworkSubmissions";
import TeacherChangePassword from "./pages/TeacherChangePassword";
import ParentFeedback from "./pages/ParentFeedback";
import StudentFeedback from "./pages/StudentFeedback";
import StudentDashboard from "./pages/StudentDashboard";
import ParentDashboard from "./pages/ParentDashboard";
import LeaveRequests from "./pages/LeaveRequests";

function App() {
  const [toast, setToast] = useState(null);

  return (
    <Router>
      {toast && <div style={styles.toast}>{toast}</div>}
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Navigate to="/login" replace />} />
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
          <Route path="homework-submissions" element={<TeacherHomeworkSubmissions />} />
          <Route path="leave-requests" element={<LeaveRequests />} />
          <Route path="change-password" element={<TeacherChangePassword />} />
        </Route>

        {/* Student Dashboard */}
        <Route path="/student/dashboard" element={<StudentDashboard />} />

        {/* Parent / Student */}
        <Route path="/parent/dashboard" element={<ParentDashboard />} />
        <Route path="/parent/feedback" element={<ParentFeedback />} />
        <Route path="/student/feedback" element={<StudentFeedback />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
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
