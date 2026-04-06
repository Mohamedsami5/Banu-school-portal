import React from "react";

export default function ParentStudentProfile({ child, parent }) {
  const classLine =
    child?.className && child?.section
      ? `${child.className} - ${child.section}`
      : child?.className || child?.section || "-";
  const avatarText = String(child?.name || "Student")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0] || "")
    .join("")
    .toUpperCase();

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Student Profile</h2>
          <p style={styles.subtitle}>Read-only details for your child.</p>
        </div>
      </div>

      <section style={styles.card}>
        <div style={styles.top}>
          <div style={styles.avatar} aria-hidden="true">
            {avatarText}
          </div>
          <div style={styles.topText}>
            <div style={styles.name}>{child?.name || "Student"}</div>
            <div style={styles.meta}>{classLine}</div>
          </div>
        </div>

        <div style={styles.grid}>
          <DetailField label="Roll No" value={child?.rollNo} />
          <DetailField label="Class" value={child?.className} />
          <DetailField label="Section" value={child?.section} />
          <DetailField label="Parent Name" value={child?.parentName || parent?.name} />
          <DetailField label="Email" value={child?.email} />
        </div>
      </section>
    </div>
  );
}

function DetailField({ label, value }) {
  return (
    <div style={styles.field}>
      <div style={styles.label}>{label}</div>
      <div style={styles.value}>{value || "-"}</div>
    </div>
  );
}

const styles = {
  page: {
    width: "100%",
  },
  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    color: "#213547",
    margin: "0 0 8px 0",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    margin: 0,
  },
  card: {
    background: "white",
    borderRadius: 16,
    boxShadow: "0 10px 30px rgba(102, 126, 234, 0.12)",
    padding: 20,
    width: "100%",
    border: "1px solid rgba(102, 126, 234, 0.12)",
  },
  top: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    paddingBottom: 16,
    marginBottom: 16,
    borderBottom: "1px solid #f1f5f9",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    letterSpacing: "0.4px",
    color: "#ffffff",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    boxShadow: "0 8px 20px rgba(102, 126, 234, 0.25)",
    flexShrink: 0,
  },
  topText: { display: "flex", flexDirection: "column", gap: 4, minWidth: 0 },
  name: {
    fontSize: 18,
    fontWeight: 700,
    color: "#111827",
    lineHeight: 1.2,
  },
  meta: {
    fontSize: 13,
    color: "#6b7280",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 12,
  },
  field: {
    background: "#f9fafb",
    border: "1px solid #eef2f7",
    borderRadius: 14,
    padding: "12px 14px",
  },
  label: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.2px",
    marginBottom: 6,
  },
  value: {
    color: "#0f172a",
    fontSize: 15,
    fontWeight: 600,
    overflowWrap: "anywhere",
  },
};
