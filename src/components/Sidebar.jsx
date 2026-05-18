import React from "react";

const defaultItems = [
  { id: "overview", label: "Dashboard", color: "#6b5fd2" },
  { id: "teachers", label: "Manage Teachers", color: "#6b5fd2" },
  { id: "students", label: "Manage Students", color: "#00c2ff" },
  { id: "parents", label: "Manage Parents", color: "#ff6aa2" },
  { id: "announcements", label: "Announcements", color: "#f7a63c" },
  { id: "events", label: "Events & Achievements", color: "#a855f7" },
  { id: "leave-requests", label: "Leave Requests", color: "#0ea5e9" },
  { id: "marks", label: "Marks Approval", color: "#ff9800" },
  { id: "change-password", label: "Change Password", color: "#2563eb" },
  { id: "logout", label: "Logout", color: "#ef5350" },
];

export default function Sidebar({
  items = defaultItems,
  active,
  onNavigate,
  isCollapsed = false,
}) {
  return (
    <aside
      style={{
        ...styles.card,
        width: isCollapsed ? 80 : 220,
        transition: "width 0.3s ease",
      }}
    >
      <nav style={styles.nav}>
        {items.map((it) => {
          const isActive = active === it.id;

          return (
            <div
              key={it.id}
              style={{
                ...styles.item,
                padding: isCollapsed ? "14px" : "14px 16px",
                justifyContent: isCollapsed ? "center" : "flex-start",
                ...(isActive
                  ? {
                      ...styles.active,
                      background: `${it.color}15`,
                      borderLeft: `4px solid ${it.color}`,
                    }
                  : {}),
              }}
              onClick={() => onNavigate(it.id)}
              title={isCollapsed ? it.label : ""}
            >
              {!isCollapsed && (
                <span
                  style={{
                    ...styles.label,
                    ...(isActive
                      ? { color: it.color, fontWeight: 600 }
                      : {}),
                  }}
                >
                  {it.label}
                </span>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

const styles = {
  card: {
    background: "#ffffff",
    padding: 12,
    borderRadius: 12,
    boxShadow: "0 4px 16px rgba(102, 126, 234, 0.1)",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  item: {
    borderRadius: 12,
    cursor: "pointer",
    color: "#213547",
    display: "flex",
    alignItems: "center",
    transition: "all 0.2s ease",
  },
  label: {
    fontSize: 14,
    color: "#425266",
    transition: "all 0.2s ease",
  },
  active: {
    fontWeight: 600,
    transform: "translateX(2px)",
  },
};
