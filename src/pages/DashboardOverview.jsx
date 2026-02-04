import React from "react";
import SummaryCard from "../components/SummaryCard";

export default function DashboardOverview() {
  const stats = {
    teachers: 24,
    parents: 184,
    students: 512,
    announcements: 4,
  };

  return (
    <div>
      <h2 style={styles.pageTitle}>Dashboard Overview</h2>
      <div style={styles.cards}>
        <SummaryCard title="Total Teachers" value={stats.teachers} index={0} />
        <SummaryCard title="Total Parents" value={stats.parents} index={1} />
        <SummaryCard title="Total Students" value={stats.students} index={2} />
        <SummaryCard title="Announcements" value={stats.announcements} index={3} />
      </div>

      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>Welcome to Admin Portal</h3>        
      </section>
    </div>
  );
}

const styles = {
  pageTitle: {
    fontSize: 32,
    fontWeight: 700,
    color: "#213547",
    marginBottom: 24,
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  cards: {
    display: 'flex',
    gap: 20,
    marginBottom: 32,
    flexWrap: 'wrap'
  },
  section: {
    marginTop: 24,
    background: 'linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)',
    padding: 28,
    borderRadius: 16,
    boxShadow: '0 8px 24px rgba(102, 126, 234, 0.1)',
    border: '1px solid rgba(102, 126, 234, 0.1)',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 600,
    color: '#213547',
    marginBottom: 12,
  },
  sectionText: {
    color: '#425266',
    fontSize: 15,
    lineHeight: 1.6,
    margin: 0,
  }
};
