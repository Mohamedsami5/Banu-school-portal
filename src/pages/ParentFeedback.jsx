import React, { useEffect, useState } from "react";
import Header from "../components/Header";

const API = "http://localhost:5000/api";

export default function ParentFeedback() {
  const [parent, setParent] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);

  useEffect(() => {
    const s = localStorage.getItem("user");
    if (!s) return;
    try {
      const u = JSON.parse(s);
      if (u.role !== "parent") return;
      setParent(u);
      loadFeedback(u._id);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const loadFeedback = async (parentId) => {
    try {
      const res = await fetch(`${API}/feedback/parent/${parentId}`);
      const data = await res.json();
      setFeedbacks(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header title="Parent Feedback" admin={parent} />
      <main style={{ padding: 24 }}>
        <h2>Teacher Feedback for Your Child</h2>
        {feedbacks.length === 0 ? (
          <div>No feedback available.</div>
        ) : (
          <div>
            {feedbacks.map((f) => (
              <div key={f._id} style={{ border: "1px solid #eee", padding: 12, marginBottom: 8 }}>
                <div><strong>Subject:</strong> {f.subject} — <strong>Class:</strong> {f.class} {f.section}</div>
                <div style={{ marginTop: 6 }}><strong>Feedback:</strong> {f.feedback}</div>
                <div style={{ marginTop: 6 }}><strong>Remarks:</strong> {f.remarks}</div>
                <div style={{ marginTop: 6, fontSize: 12, color: "#666" }}>From teacher: {String(f.teacherId)}</div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
