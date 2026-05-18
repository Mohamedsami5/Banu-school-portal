import React from "react";

const studentMenuItems = [
  { id: "overview", label: "Dashboard", color: "#667eea" },
  { id: "marks", label: "Marks", color: "#4facfe" },
  { id: "homework", label: "Homework", color: "#43e97b" },
  { id: "events", label: "Events & Achievements", color: "#a855f7" },
  { id: "announcements", label: "Announcements", color: "#fa709a" },
  { id: "leave", label: "Leave Application", color: "#0ea5e9" },
  { id: "change-password", label: "Change Password", color: "#2563eb" },
  { id: "logout", label: "Logout", color: "#ef5350" },
];

export default function StudentSidebar({
  items = studentMenuItems,
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
          const iconNode =
            it.icon ||
            (typeof it.label === "string" && it.label.trim()
              ? it.label.trim().slice(0, 1).toUpperCase()
              : "•");

          return (
            <div
              key={it.id}
              className="sidebar-item"
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
              <span
                style={{
                  ...styles.iconWrap,
                  ...(isActive ? { color: it.color } : {}),
                }}
                aria-hidden="true"
              >
                {typeof iconNode === "string" ? <span style={styles.iconText}>{iconNode}</span> : iconNode}
              </span>

              {!isCollapsed && (
                <span
                  style={{
                    ...styles.label,
                    ...(isActive ? { color: it.color, fontWeight: 700 } : {}),
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
    gap: 12,
    transition: "all 0.2s ease",
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f8fafc",
    border: "1px solid rgba(148, 163, 184, 0.25)",
    color: "#64748b",
    flexShrink: 0,
  },
  iconText: {
    fontSize: 13,
    fontWeight: 800,
    letterSpacing: "0.02em",
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
