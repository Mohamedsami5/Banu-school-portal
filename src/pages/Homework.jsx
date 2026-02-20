import React, { useState, useEffect } from "react";

const API_BASE = "http://localhost:5000/api";

export default function Homework() {
  const [teacher, setTeacher] = useState(null);

  // Homework state
  const [assignments, setAssignments] = useState([]);
  const [hwForm, setHwForm] = useState({
    className: "",
    section: "",
    subject: "",
    title: "",
    description: "",
    dueDate: "",
  });
  const [homeworkList, setHomeworkList] = useState([]);
  const [hwMessage, setHwMessage] = useState("");

  // Class and section options
  const CLASS_OPTIONS = ["LKG", "UKG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
  const SECTION_OPTIONS = ["A", "B", "C"];

  useEffect(() => {
    const s = localStorage.getItem("user");
    if (!s) return;
    try {
      const u = JSON.parse(s);
      if (u.role !== "teacher") return;
      setTeacher(u);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const teacherId = teacher?._id;

  // Fetch assignments
  const fetchAssignments = async () => {
    if (!teacherId) return;
    try {
      const res = await fetch(`${API_BASE}/teacher/assignments?teacherId=${encodeURIComponent(teacherId)}`);
      const data = await res.json().catch(() => []);
      setAssignments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch assignments", err);
      setAssignments([]);
    }
  };

  // Fetch homework
  const fetchHomework = async () => {
    if (!teacherId) return;
    try {
      const res = await fetch(`${API_BASE}/homework?teacherId=${encodeURIComponent(teacherId)}`);
      const data = await res.json().catch(() => []);
      setHomeworkList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch homework", err);
      setHomeworkList([]);
    }
  };

  useEffect(() => {
    fetchAssignments();
    fetchHomework();
  }, [teacherId]);

  // Subject options specifically for the Homework form
  const normalizeLocal = (v) => String(v || "").trim().toLowerCase();
  const hwSubjectOptions = [...new Set(
    (assignments || [])
      .filter(
        (a) =>
          normalizeLocal(a.className || a.class) === normalizeLocal(hwForm.className) &&
          normalizeLocal(a.section) === normalizeLocal(hwForm.section)
      )
      .map((a) => a.subject)
      .filter(Boolean)
  )].sort();

  const handleAssignHomework = async (e) => {
    e.preventDefault();
    const { className, subject, title, description, dueDate } = hwForm;
    if (!className || !subject || !title || !description || !dueDate) {
      setHwMessage("Please fill in Class, Section, Subject, Title, Description, and Due Date");
      setTimeout(() => setHwMessage(""), 3500);
      return;
    }

    try {
      const payload = {
        teacherId,
        className,
        section: hwForm.section,
        subject,
        title,
        description,
        dueDate,
      };
      const res = await fetch(`${API_BASE}/homework`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setHwMessage(data.message || "Failed to assign homework");
        return;
      }
      setHwMessage("Homework assigned successfully");
      setHwForm({ className: "", section: "", subject: "", title: "", description: "", dueDate: "" });
      await fetchHomework();
      setTimeout(() => setHwMessage(""), 3000);
    } catch (err) {
      console.error("Failed to assign homework", err);
      setHwMessage(err.message || "Failed to assign homework. Check server.");
    }
  };

  return (
    <div>
      <h2 style={styles.pageTitle}>Homework</h2>
      <section style={styles.card}>
        <h3 style={styles.sectionTitle}>Assign Homework</h3>
        <form onSubmit={handleAssignHomework} style={styles.formGrid}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Class</label>
                    <select
                      value={hwForm.className}
                      onChange={(e) => setHwForm({ ...hwForm, className: e.target.value, section: "", subject: "" })}
                      style={styles.input}
                      required
                    >
                      <option value="">Select Class</option>
                      {CLASS_OPTIONS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Section</label>
                    <select
                      value={hwForm.section}
                      onChange={(e) => setHwForm({ ...hwForm, section: e.target.value, subject: "" })}
                      style={styles.input}
                      required
                    >
                      <option value="">Select Section</option>
                      {SECTION_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Subject</label>
                    <select
                      value={hwForm.subject}
                      onChange={(e) => setHwForm({ ...hwForm, subject: e.target.value })}
                      style={styles.input}
                      required
                      disabled={!hwForm.className || !hwForm.section}
                    >
                      <option value="">Select Subject</option>
                      {hwSubjectOptions.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={styles.formGroupFull}>
                    <label style={styles.label}>Homework Title</label>
                    <input
                      value={hwForm.title}
                      onChange={(e) => setHwForm({ ...hwForm, title: e.target.value })}
                      style={styles.input}
                      placeholder="Title"
                    />
                  </div>
                  <div style={styles.formGroupFull}>
                    <label style={styles.label}>Homework Description</label>
                    <textarea
                      value={hwForm.description}
                      onChange={(e) => setHwForm({ ...hwForm, description: e.target.value })}
                      style={styles.textarea}
                      rows={4}
                      placeholder="Description"
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Due Date</label>
                    <input
                      type="date"
                      required
                      value={hwForm.dueDate}
                      onChange={(e) => setHwForm({ ...hwForm, dueDate: e.target.value })}
                      style={styles.input}
                    />
                  </div>
                  <div style={{ gridColumn: "1 / -1", display: "flex", gap: 12, alignItems: "center" }}>
                    <button
                      type="submit"
                      style={{
                        ...styles.primaryButton,
                        opacity:
                          !hwForm.className ||
                          !hwForm.section ||
                          !hwForm.subject ||
                          !hwForm.title ||
                          !hwForm.description ||
                          !hwForm.dueDate
                            ? 0.6
                            : 1,
                      }}
                      disabled={
                        !hwForm.className ||
                        !hwForm.section ||
                        !hwForm.subject ||
                        !hwForm.title ||
                        !hwForm.description ||
                        !hwForm.dueDate
                      }
                    >
                      Assign Homework
                    </button>
                    <span style={{ color: "#6b7a86", fontSize: 14 }}>{hwMessage}</span>
                  </div>
                </form>
              </section>

              <section style={styles.card}>
                <h3 style={styles.sectionTitle}>Assigned Homework</h3>
                {homeworkList.length === 0 ? (
                  <p style={styles.placeholder}>No homework assigned yet.</p>
                ) : (
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Title</th>
                        <th style={styles.th}>Class</th>
                        <th style={styles.th}>Section</th>
                        <th style={styles.th}>Subject</th>
                        <th style={styles.th}>Due Date</th>
                        <th style={styles.th}>Posted</th>
                      </tr>
                    </thead>
                    <tbody>
                      {homeworkList.map((hw) => (
                        <tr key={hw._id || hw.id}>
                          <td style={styles.td}>{hw.title}</td>
                          <td style={styles.td}>{hw.className}</td>
                          <td style={styles.td}>{hw.section}</td>
                          <td style={styles.td}>{hw.subject}</td>
                          <td style={styles.td}>{hw.dueDate ? new Date(hw.dueDate).toLocaleDateString() : "-"}</td>
                          <td style={styles.td}>
                            {new Date(hw.createdAt || hw.postedAt || Date.now()).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
      </section>

      <section style={styles.card}>
        <h3 style={styles.sectionTitle}>Assigned Homework</h3>
        {homeworkList.length === 0 ? (
          <p style={styles.placeholder}>No homework assigned yet.</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Title</th>
                <th style={styles.th}>Class</th>
                <th style={styles.th}>Section</th>
                <th style={styles.th}>Subject</th>
                <th style={styles.th}>Due Date</th>
                <th style={styles.th}>Posted</th>
              </tr>
            </thead>
            <tbody>
              {homeworkList.map((hw) => (
                <tr key={hw._id || hw.id}>
                  <td style={styles.td}>{hw.title}</td>
                  <td style={styles.td}>{hw.className}</td>
                  <td style={styles.td}>{hw.section}</td>
                  <td style={styles.td}>{hw.subject}</td>
                  <td style={styles.td}>{hw.dueDate ? new Date(hw.dueDate).toLocaleDateString() : "-"}</td>
                  <td style={styles.td}>{new Date(hw.createdAt || hw.postedAt || Date.now()).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
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
  pageTitle: {
    fontSize: 32,
    fontWeight: 700,
    color: "#213547",
    marginBottom: 24,
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  card: {
    background: "linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)",
    padding: 28,
    borderRadius: 16,
    boxShadow: "0 8px 24px rgba(102, 126, 234, 0.1)",
    border: "1px solid rgba(102, 126, 234, 0.1)",
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 600,
    color: "#213547",
    marginTop: 0,
    marginBottom: 12,
  },
  placeholder: {
    marginTop: 18,
    color: "#90a4ae",
    fontSize: 15,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: 8,
    fontSize: 14,
  },
  th: {
    textAlign: "left",
    padding: "10px 12px",
    borderBottom: "2px solid #e0e4e8",
    color: "#425266",
    fontWeight: 600,
  },
  td: {
    padding: "10px 12px",
    borderBottom: "1px solid #e0e4e8",
    color: "#213547",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 12,
    alignItems: "end",
    marginBottom: 24,
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
  },
  formGroupFull: {
    gridColumn: "1 / -1",
    display: "flex",
    flexDirection: "column",
  },
  label: {
    fontSize: 13,
    color: "#425266",
    fontWeight: 600,
    marginBottom: 6,
  },
  input: {
    padding: "8px 10px",
    borderRadius: 8,
    border: "1px solid #e0e4e8",
  },
  textarea: {
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #e0e4e8",
    fontFamily: "inherit",
  },
  primaryButton: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    padding: "10px 14px",
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
    fontWeight: 700,
  },
  loading: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    fontSize: "18px",
    color: "#6b7280",
  },
};
