import React, { useEffect, useState } from "react";

const API = "http://localhost:5000/api";

export default function TeacherFeedback() {
  const [teacher, setTeacher] = useState(null);
  const [classes, setClasses] = useState([]);
  const [className, setClassName] = useState("");
  const [sections, setSections] = useState([]);
  const [section, setSection] = useState("");
  const [students, setStudents] = useState([]);
  const [generalFeedback, setGeneralFeedback] = useState("");
  const [visibleToParent, setVisibleToParent] = useState(true);
  const [visibleToStudent, setVisibleToStudent] = useState(true);
  const [message, setMessage] = useState("");
  const [savedFeedbacks, setSavedFeedbacks] = useState([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);
  const [isSendingAll, setIsSendingAll] = useState(false);

  useEffect(() => {
    const s = localStorage.getItem("user");
    if (!s) return;

    try {
      const u = JSON.parse(s);
      if (u.role !== "teacher") return;
      setTeacher(u);
      setClasses(Array.isArray(u.teaching) ? u.teaching : []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  // Load saved feedback for this teacher from backend on page load / teacher change
  const teacherId = teacher?._id || teacher?.id;

  useEffect(() => {
    if (!teacherId) return;

    const loadAssignments = async () => {
      try {
        const res = await fetch(
          `${API}/teacher/assignments?teacherId=${encodeURIComponent(teacherId)}`
        );
        const data = await res.json().catch(() => []);
        if (res.ok && Array.isArray(data)) {
          setClasses(data);
        }
      } catch (err) {
        console.error("Failed to fetch teacher assignments", err);
      }
    };

    loadAssignments();
  }, [teacherId]);

  useEffect(() => {
    if (!teacherId) return;

    const fetchSaved = async () => {
      try {
        setIsLoadingSaved(true);
        const res = await fetch(
          `${API}/feedback?teacherId=${encodeURIComponent(teacherId)}`
        );
        const data = await res.json().catch(() => []);
        if (!res.ok) {
          throw new Error(
            (data && data.message) || "Failed to load saved feedback"
          );
        }
        const list = Array.isArray(data) ? data : [];
        setSavedFeedbacks(list);
      } catch (err) {
        console.error("Failed to load saved feedback", err);
        setMessage(err.message || "Failed to load saved feedback");
      } finally {
        setIsLoadingSaved(false);
      }
    };

    fetchSaved();
  }, [teacherId]);

  useEffect(() => {
    if (!className) {
      setSections([]);
      setSection("");
      setStudents([]);
      return;
    }

    const uniqueSections = [
      ...new Set(
        classes
          .filter((c) => (c.className || c.class) === className)
          .map((c) => c.section || "A")
      ),
    ];

    setSections(uniqueSections);
    setSection("");
    setStudents([]);
  }, [className, classes]);

  useEffect(() => {
    if (!className || !section) {
      setStudents([]);
      return;
    }
    setStudents([]);
  }, [className, section]);

  const loadStudents = async () => {
    if (!className || !section) {
      setMessage("Please select class and section");
      return;
    }

    try {
      setMessage("Loading students...");
      const res = await fetch(
        `${API}/students?class=${encodeURIComponent(
          className
        )}&section=${encodeURIComponent(section)}`
      );
      const data = await res.json();

      const list = Array.isArray(data) ? data : [];
      setStudents(list);
      setMessage("");
    } catch (err) {
      console.error("Failed to load students", err);
      setMessage("Failed to load students. Please check if backend is running.");
    }
  };

  const sendGeneralFeedbackToAll = async () => {
    if (!teacherId) {
      setMessage("Cannot send feedback: teacher profile not loaded.");
      return;
    }
    if (!className || !section) {
      setMessage("Please select class and section");
      return;
    }
    if (!generalFeedback.trim()) {
      setMessage("Please enter general feedback");
      return;
    }
    if (students.length === 0) {
      setMessage("No students loaded for selected class and section");
      return;
    }

    try {
      setIsSendingAll(true);
      setMessage("Sending general feedback to all students...");

      const requests = students.map(async (student) => {
        const payload = {
          teacherId,
          studentId: student._id,
          class: className,
          section,
          feedback: generalFeedback.trim(),
          visibleToParent: !!visibleToParent,
          visibleToStudent: !!visibleToStudent,
        };
        if (student.parentId) payload.parentId = student.parentId;

        const res = await fetch(`${API}/feedback`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(data.message || `Failed for ${student.name || student.studentName || "student"}`);
        }
        return data;
      });

      await Promise.all(requests);

      const res = await fetch(`${API}/feedback?teacherId=${encodeURIComponent(teacherId)}`);
      const data = await res.json().catch(() => []);
      setSavedFeedbacks(Array.isArray(data) ? data : []);

      setGeneralFeedback("");
      setMessage(`General feedback sent to ${students.length} students`);
    } catch (err) {
      console.error("Unable to send general feedback", err);
      setMessage(err.message || "Unable to send general feedback");
    } finally {
      setIsSendingAll(false);
    }
  };

  return (
    <div style={{ width: "100%", maxWidth: "100%", margin: "0 auto" }}>
      <h2 style={styles.pageTitle}>Student Feedback</h2>

      {/* Give Feedback section (top) */}
      <section style={styles.card}>
        <h3 style={styles.sectionTitle}>Give Feedback</h3>

        {!teacher || classes.length === 0 ? (
          <p style={styles.placeholder}>
            No classes found for your profile. Once classes are assigned, you
            can draft feedback here.
          </p>
        ) : (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr auto",
                gap: 12,
                marginBottom: 16,
              }}
            >
              <div style={styles.formGroup}>
                <label style={styles.label}>Class</label>
                <select
                  value={className}
                  onChange={(e) => {
                    setClassName(e.target.value);
                    setSection("");
                    setStudents([]);
                  }}
                  style={styles.input}
                >
                  <option value="">Select Class</option>
                  {[...new Set(classes.map((c) => c.className || c.class))]
                    .filter(Boolean)
                    .map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Section</label>
                <select
                  value={section}
                  onChange={(e) => {
                    setSection(e.target.value);
                    setStudents([]);
                  }}
                  style={styles.input}
                  disabled={!className}
                >
                  <option value="">Select Section</option>
                  {sections.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <button
                  onClick={loadStudents}
                  style={styles.primaryButton}
                  disabled={!className || !section}
                  title={
                    !className || !section
                      ? "Select class and section first"
                      : ""
                  }
                >
                  Load Students
                </button>
              </div>
            </div>

            {message && <div style={styles.message}>{message}</div>}

            {students.length === 0 ? (
              <p style={styles.placeholder}>
                No students loaded yet. Choose class and section and click
                &nbsp;
                <strong>Load Students</strong> to work with a sample list.
              </p>
            ) : (
              <div>
                <div style={styles.bulkPanel}>
                  <div style={styles.bulkTitle}>
                    General feedback for {className} - {section} ({students.length} students)
                  </div>
                  <textarea
                    style={styles.textarea}
                    placeholder="Write one feedback message that should be sent to all loaded students..."
                    value={generalFeedback}
                    onChange={(e) => setGeneralFeedback(e.target.value)}
                  />
                  <div style={styles.bulkOptions}>
                    <label style={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={visibleToParent}
                        onChange={(e) => setVisibleToParent(e.target.checked)}
                      />
                      <span>Visible to Parent</span>
                    </label>
                    <label style={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={visibleToStudent}
                        onChange={(e) => setVisibleToStudent(e.target.checked)}
                      />
                      <span>Visible to Student</span>
                    </label>
                    <button
                      style={styles.primaryButton}
                      onClick={sendGeneralFeedbackToAll}
                      disabled={isSendingAll || !generalFeedback.trim()}
                    >
                      {isSendingAll ? "Sending..." : "Send to All Students"}
                    </button>
                  </div>
                </div>

                <div style={styles.tableWrap}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>#</th>
                        <th style={styles.th}>Name</th>
                        <th style={styles.th}>Roll No</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((s, i) => (
                        <tr key={s._id || i}>
                          <td style={styles.td}>{i + 1}</td>
                          <td style={styles.td}>{s.name}</td>
                          <td style={styles.td}>{s.rollNo || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* Saved Feedback section (below Give Feedback) */}
      <section style={{ ...styles.card, marginTop: 24 }}>
        <h3 style={styles.sectionTitle}>Saved Feedback</h3>
        {isLoadingSaved ? (
          <p style={styles.placeholder}>Loading saved feedback...</p>
        ) : savedFeedbacks.length === 0 ? (
          <p style={styles.placeholder}>No feedback saved yet.</p>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Student Name</th>
                  <th style={styles.th}>Roll No</th>
                  <th style={styles.th}>Class</th>
                  <th style={styles.th}>Section</th>
                  <th style={styles.th}>Subject</th>
                  <th style={styles.th}>Feedback</th>
                  <th style={styles.th}>Parent</th>
                  <th style={styles.th}>Student</th>
                  <th style={styles.th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {savedFeedbacks.map((fb) => (
                  <tr key={fb._id}>
                    <td style={styles.td}>{fb.studentName || ""}</td>
                    <td style={styles.td}>{fb.rollNo || "-"}</td>
                    <td style={styles.td}>{fb.class || ""}</td>
                    <td style={styles.td}>{fb.section || ""}</td>
                    <td style={styles.td}>{fb.subject || ""}</td>
                    <td style={styles.td}>{fb.feedback || ""}</td>
                    <td style={styles.td}>
                      {fb.visibleToParent ? "Yes" : "No"}
                    </td>
                    <td style={styles.td}>
                      {fb.visibleToStudent ? "Yes" : "No"}
                    </td>
                    <td style={styles.td}>
                      <button
                        style={styles.dangerButton}
                        onClick={async () => {
                          if (!fb._id) return;
                          const ok = window.confirm("Delete this feedback?");
                          if (!ok) return;
                          try {
                            const res = await fetch(
                              `${API}/feedback/${fb._id}`,
                              {
                                method: "DELETE",
                              }
                            );
                            const data = await res.json().catch(() => ({}));
                            if (!res.ok) {
                              throw new Error(
                                data.message || "Failed to delete feedback"
                              );
                            }
                            setSavedFeedbacks((prev) =>
                              prev.filter((item) => item._id !== fb._id)
                            );
                            setMessage("Feedback deleted successfully");
                          } catch (err) {
                            console.error("Error deleting feedback", err);
                            setMessage(
                              err.message || "Error deleting feedback"
                            );
                          }
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
  card: {
    background: "linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)",
    padding: 28,
    borderRadius: 16,
    boxShadow: "0 8px 24px rgba(102, 126, 234, 0.1)",
    border: "1px solid rgba(102, 126, 234, 0.1)",
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
  tableWrap: {
    width: "100%",
    overflowX: "auto",
    maxHeight: 260,
    overflowY: "auto",
    borderRadius: 12,
    border: "1px solid #e2e8f0",
    marginTop: 8,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    background: "#fff",
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
    verticalAlign: "top",
  },
  formGroup: {
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
    background: "#fff",
  },
  textarea: {
    width: "100%",
    minHeight: 70,
    padding: 10,
    borderRadius: 10,
    border: "1px solid #cbd5e1",
    outline: "none",
    resize: "vertical",
    fontFamily: "inherit",
    fontSize: 14,
  },
  bulkPanel: {
    border: "1px solid #e2e8f0",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    background: "#fff",
  },
  bulkTitle: {
    marginBottom: 8,
    fontWeight: 600,
    color: "#334155",
  },
  bulkOptions: {
    marginTop: 10,
    display: "flex",
    alignItems: "center",
    gap: 14,
    flexWrap: "wrap",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    color: "#334155",
    fontSize: 14,
  },
  primaryButton: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "#fff",
    border: "none",
    padding: "10px 16px",
    borderRadius: 10,
    cursor: "pointer",
    fontWeight: 700,
    whiteSpace: "nowrap",
  },
  dangerButton: {
    background: "#ef4444",
    color: "#fff",
    border: "none",
    padding: "8px 14px",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 600,
    whiteSpace: "nowrap",
  },
  message: {
    margin: "10px 0",
    color: "#0f766e",
    fontWeight: 600,
  },
};
