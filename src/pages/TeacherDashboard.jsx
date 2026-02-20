import React from "react";
import SummaryCard from "../components/SummaryCard";

export default function TeacherDashboard() {
  return (
    <div>
      <h2 style={styles.pageTitle}>Dashboard</h2>
      <div style={styles.cards}>
        <SummaryCard title="Classes Today" value={3} index={0} />
        <SummaryCard title="Total Students" value={128} index={1} />
        <SummaryCard title="Assignments Posted" value={5} index={2} />
      </div>
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
    display: "flex",
    gap: 20,
    marginBottom: 32,
    flexWrap: "wrap",
  },
};
