import React, { useState } from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import DashboardOverview from "./DashboardOverview";
import ManageTeachers from "./ManageTeachers";
import ManageStudents from "./ManageStudents";
import ManageParents from "./ManageParents";
import Announcements from "./Announcements";

export default function AdminDashboard({ admin, onLogout }) {
  const [page, setPage] = useState("overview");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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
      default:
        return <DashboardOverview />;
    }
  }

  return (
    <div style={styles.appRoot}>
      <Header 
        title="Admin Dashboard" 
        onLogout={onLogout} 
        admin={admin}
        onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      <div style={styles.container}>
        <Sidebar 
          active={page} 
          isCollapsed={isSidebarCollapsed}
          onNavigate={(id) => {
            if (id === 'logout') { onLogout(); return; }
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
    padding: "32px",
    overflow: "auto",
    background: "#f8f9ff",
  },
};
