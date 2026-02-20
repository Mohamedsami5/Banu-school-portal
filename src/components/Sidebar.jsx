import React from "react";

const defaultItems = [
  { id: "overview", label: "Dashboard", color: "#667eea" },
  { id: "teachers", label: "Manage Teachers", color: "#f093fb" },
  { id: "students", label: "Manage Students", color: "#4facfe" },
  { id: "parents", label: "Manage Parents", color: "#43e97b" },
  { id: "announcements", label: "Announcements", color: "#fa709a" },
  { id: "marks", label: "Marks Approval", color: "#ff9800" }, // ✅ Added
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
