import React, { useState, useEffect } from "react";

const API_BASE = "http://localhost:5000/api";

export default function EnterMarks() {
  const [teacher, setTeacher] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [students, setStudents] = useState([]);
  const [studentMarks, setStudentMarks] = useState({});
  const [existingMarks, setExistingMarks] = useState([]);
  const [marksMessage, setMarksMessage] = useState("");
  const [assignmentsError, setAssignmentsError] = useState("");
  const [marksList, setMarksList] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);

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

  const teacherId = teacher?._id || teacher?.id;
  const teacherEmail = teacher?.email ? String(teacher.email).trim().toLowerCase() : "";

  // Fetch assignments
  const fetchAssignments = async () => {
    if (!teacherId && !teacherEmail) return;
    try {
      setAssignmentsError("");
      const query = teacherId
        ? `teacherId=${encodeURIComponent(teacherId)}`
        : `teacherEmail=${encodeURIComponent(teacherEmail)}`;
      const res = await fetch(`${API_BASE}/teacher/assignments?${query}`);
      const data = await res.json().catch(() => []);
      if (!res.ok) {
        setAssignments([]);
        setAssignmentsError(data?.message || "Failed to fetch assignments");
        return;
      }
      setAssignments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch assignments", err);
      setAssignments([]);
      setAssignmentsError("Failed to fetch assignments");
    }
  };

  const fetchMarks = async () => {
    if (!teacherId) return;
    try {
      const res = await fetch(`${API_BASE}/marks?teacherId=${encodeURIComponent(teacherId)}`);
      const data = await res.json().catch(() => []);
      setMarksList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch marks", err);
      setMarksList([]);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [teacherId, teacherEmail]);

  useEffect(() => {
    fetchMarks();
  }, [teacherId]);

  // Fetch students when class/section changes
  useEffect(() => {
    if (!selectedClass || !selectedSection) {
      setStudents([]);
      setStudentMarks({});
      return;
    }
    setStudentsLoading(true);
    setStudents([]);
    setStudentMarks({});
    fetch(`${API_BASE}/students?class=${encodeURIComponent(selectedClass)}&section=${encodeURIComponent(selectedSection)}`)
      .then((res) => res.json().catch(() => []))
      .then((data) => {
        setStudents(Array.isArray(data) ? data : []);
        setStudentMarks({});
      })
      .catch(() => setStudents([]))
      .finally(() => setStudentsLoading(false));
  }, [selectedClass, selectedSection]);

  // Build dropdown options from assignments only
  const classOptions = [...new Set((assignments || []).map((a) => a.className || a.class).filter(Boolean))].sort(
    (a, b) => {
      const pri = (x) => (x === "LKG" ? -2 : x === "UKG" ? -1 : parseInt(x, 10));
      return pri(a) - pri(b);
    }
  );

  const sectionOptions = [...new Set(
    (assignments || []).filter((a) => (a.className || a.class) === selectedClass).map((a) => a.section).filter(Boolean)
  )].sort();

  const subjectOptions = [...new Set(
    (assignments || []).filter((a) => (a.className || a.class) === selectedClass && a.section === selectedSection).map((a) => a.subject).filter(Boolean)
  )].sort();


  const setMarkForStudent = (studentId, value) => {
    setStudentMarks((prev) => ({ ...prev, [studentId]: value }));
  };

  const handleBulkMarkSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!teacherId || !selectedClass || !selectedSection || !selectedSubject) {
      setMarksMessage("Please select Class, Section, and Subject");
      setTimeout(() => setMarksMessage(""), 2500);
      return;
    }

    const entries = students.map((s) => {
      const marksVal = studentMarks[s._id];
      const num = marksVal !== "" && marksVal !== undefined && marksVal !== null ? Number(marksVal) : null;
      if (num !== null && (isNaN(num) || num < 0 || num > 100)) {
        return null;
      }
      return {
        rollNo: s.rollNo != null ? String(s.rollNo).trim() : "",
        studentName: s.name || s.studentName || "",
        marks: num !== null && !isNaN(num) ? num : "",
      };
    }).filter((e) => e && (e.marks !== "" && e.marks !== undefined));

    const missing = entries.filter((e) => !e.rollNo);
    if (missing.length > 0) {
      setMarksMessage(`Cannot submit marks. Missing Roll No for: ${missing.map((m) => m.studentName || m.rollNo || "Unknown").join(", ")}`);
      setTimeout(() => setMarksMessage(""), 4000);
      return;
    }

    if (entries.length === 0) {
      setMarksMessage("Enter at least one mark (0–100)");
      setTimeout(() => setMarksMessage(""), 2500);
      return;
    }

    const invalid = entries.find((e) => {
      const n = Number(e.marks);
      return isNaN(n) || n < 0 || n > 100;
    });

    if (invalid) {
      setMarksMessage("All marks must be between 0 and 100");
      setTimeout(() => setMarksMessage(""), 2500);
      return;
    }

    setMarksMessage("");
    try {
      const res = await fetch(`${API_BASE}/teacher/marks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId,
          className: selectedClass,
          section: selectedSection,
          subject: selectedSubject,
          entries: entries.map((e) => ({ rollNo: e.rollNo, studentName: e.studentName, marks: Number(e.marks) })),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMarksMessage(data.message || "Failed to submit marks");
        return;
      }

      const savedCount = Number(data?.savedCount ?? 0);
      const createdCount = Number(data?.createdCount ?? 0);
      const updatedCount = Number(data?.updatedCount ?? 0);
      const errors = Array.isArray(data?.errors) ? data.errors : [];

      // Check if any marks were duplicates (updated instead of created)
      if (updatedCount > 0) {
        setMarksMessage(`Marks already submitted. ${updatedCount} marks updated. Please note: Status reset to "Pending" for admin review.`);
      } else if (createdCount > 0) {
        setMarksMessage(`${createdCount} marks submitted successfully`);
      } else if (savedCount > 0) {
        setMarksMessage(`${savedCount} marks processed successfully`);
      } else if (errors.length > 0) {
        setMarksMessage(`Some marks failed to save. Please check the data and try again.`);
      } else {
        setMarksMessage(data.message || "Marks processed");
      }

      setTimeout(() => setMarksMessage(""), 4500);
      setStudentMarks({});
      await fetchMarks();
    } catch (err) {
      console.error("Marks submit error", err);
      setMarksMessage(err.message || "Failed to submit marks. Check if backend is running.");
    }
  };

  return (
    <div>
      <h2 style={styles.pageTitle}>Enter Student Marks</h2>
      <section style={styles.card}>
                <h3 style={styles.sectionTitle}>Submit Marks</h3>
                {!teacherId ? (
                  <p style={styles.placeholder}>Unable to load your profile.</p>
                ) : assignmentsError ? (
                  <p style={styles.placeholder}>{assignmentsError}</p>
                ) : assignments.length === 0 ? (
                  <p style={styles.placeholder}>No classes or subjects assigned yet. Contact admin.</p>
                ) : (
                  <>
                    <form onSubmit={handleBulkMarkSubmit}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
                        <div style={styles.formGroup}>
                          <label style={styles.label}>Class</label>
                          <select
                            value={selectedClass}
                            onChange={(e) => {
                              setSelectedClass(e.target.value);
                              setSelectedSection("");
                              setSelectedSubject("");
                            }}
                            style={styles.input}
                            required
                          >
                            <option value="">Select Class</option>
                            {classOptions.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div style={styles.formGroup}>
                          <label style={styles.label}>Section</label>
                          <select
                            value={selectedSection}
                            onChange={(e) => {
                              setSelectedSection(e.target.value);
                              setSelectedSubject("");
                            }}
                            style={styles.input}
                            required
                            disabled={!selectedClass}
                          >
                            <option value="">Select Section</option>
                            {sectionOptions.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div style={styles.formGroup}>
                          <label style={styles.label}>Subject</label>
                          <select
                            value={selectedSubject}
                            onChange={(e) => setSelectedSubject(e.target.value)}
                            style={styles.input}
                            required
                            disabled={!selectedSection}
                          >
                            <option value="">Select Subject</option>
                            {subjectOptions.map((sub) => (
                              <option key={sub} value={sub}>
                                {sub}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {selectedClass && selectedSection && (
                        <>
                          {studentsLoading ? (
                            <p style={styles.placeholder}>Loading students...</p>
                          ) : students.length === 0 ? (
                            <p style={styles.placeholder}>No students in this class and section.</p>
                          ) : (
                            <>
                              <table style={styles.table}>
                                <thead>
                                  <tr>
                                    <th style={styles.th}>Roll No</th>
                                    <th style={styles.th}>Name</th>
                                    <th style={styles.th}>Marks</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {students.map((s) => (
                                    <tr key={s._id}>
                                      <td style={styles.td}>{s.rollNo ?? ""}</td>
                                      <td style={styles.td}>{s.name || s.studentName || ""}</td>
                                      <td style={styles.td}>
                                        <input
                                          type="number"
                                          min={0}
                                          max={100}
                                          value={studentMarks[s._id] ?? ""}
                                          onChange={(e) => setMarkForStudent(s._id, e.target.value)}
                                          style={{ ...styles.input, width: "80px" }}
                                          placeholder="0–100"
                                        />
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                              <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 12 }}>
                                <button
                                  type="button"
                                  style={styles.primaryButton}
                                  onClick={handleBulkMarkSubmit}
                                  disabled={!selectedClass || !selectedSection || !selectedSubject || students.length === 0}
                                >
                                  Submit Marks
                                </button>
                                <span style={{ color: "#6b7a86", fontSize: 14 }}>{marksMessage}</span>
                              </div>
                            </>
                          )}
                        </>
                      )}
                    </form>

                    <h3 style={{ ...styles.sectionTitle, marginTop: 24 }}>Submitted Marks</h3>
                    {marksList.length === 0 ? (
                      <p style={styles.placeholder}>No marks submitted yet.</p>
                    ) : (
                      <table style={styles.table}>
                        <thead>
                          <tr>
                            <th style={styles.th}>Roll No</th>
                            <th style={styles.th}>Student Name</th>
                            <th style={styles.th}>Class</th>
                            <th style={styles.th}>Section</th>
                            <th style={styles.th}>Subject</th>
                            <th style={styles.th}>Marks</th>
                            <th style={styles.th}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {marksList.map((row) => (
                            <tr key={row._id}>
                              <td style={styles.td}>{row.rollNo ?? ""}</td>
                              <td style={styles.td}>{row.studentName}</td>
                              <td style={styles.td}>{row.className ?? row.class ?? ""}</td>
                              <td style={styles.td}>{row.section ?? ""}</td>
                              <td style={styles.td}>{row.subject}</td>
                              <td style={styles.td}>{row.marks}</td>
                              <td style={styles.td}>{row.status || "Pending"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </>
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
