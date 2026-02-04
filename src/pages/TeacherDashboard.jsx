import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import SummaryCard from "../components/SummaryCard";

const API_BASE = "http://localhost:5000/api";

export default function TeacherDashboard({ onLogout, teacher }) {
  const [page, setPage] = useState("dashboard");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [students, setStudents] = useState([]);
  const [studentMarks, setStudentMarks] = useState({});
  const [marksMessage, setMarksMessage] = useState("");
  const [marksList, setMarksList] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [hwForm, setHwForm] = useState({ className: "", subject: "", title: "", description: "", dueDate: "" });
  const [homeworkList, setHomeworkList] = useState([]);
  const [hwMessage, setHwMessage] = useState("");

  const teacherId = teacher?._id;

  const classOptions = [...new Set((assignments || []).map((a) => a.class).filter(Boolean))].sort(
    (a, b) => parseInt(a, 10) - parseInt(b, 10)
  );
  const sectionOptions = [...new Set(
    (assignments || []).filter((a) => a.class === selectedClass).map((a) => a.section).filter(Boolean)
  )].sort();
  const subjectOptions = [...new Set(
    (assignments || []).filter((a) => a.class === selectedClass && a.section === selectedSection).map((a) => a.subject).filter(Boolean)
  )].sort();

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
  }, [teacherId]);

  useEffect(() => {
    fetchMarks();
  }, [teacherId]);

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

  useEffect(() => {
    try {
      const rawHw = localStorage.getItem("teacher_homework");
      if (rawHw) setHomeworkList(JSON.parse(rawHw));
    } catch (err) {
      console.error("Failed to load local data", err);
    }
  }, []);

  const setMarkForStudent = (studentId, value) => {
    setStudentMarks((prev) => ({ ...prev, [studentId]: value }));
  };

  const handleBulkMarkSubmit = async (e) => {
    e.preventDefault();
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
        rollNo: s.rollNo ?? "",
        studentName: s.name || s.studentName || "",
        marks: num !== null && !isNaN(num) ? num : ""
      };
    }).filter((e) => e && (e.marks !== "" && e.marks !== undefined));
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
      const res = await fetch(`${API_BASE}/marks/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId,
          class: selectedClass,
          section: selectedSection,
          subject: selectedSubject,
          entries: entries.map((e) => ({ rollNo: e.rollNo, studentName: e.studentName, marks: Number(e.marks) }))
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMarksMessage(data.message || "Failed to submit marks");
        return;
      }
      setMarksMessage("Marks submitted successfully");
      setTimeout(() => setMarksMessage(""), 3500);
      setStudentMarks({});
      await fetchMarks();
    } catch (err) {
      console.error("Marks submit error", err);
      setMarksMessage(err.message || "Failed to submit marks. Check if backend is running.");
    }
  };

  const handleAssignHomework = (e) => {
    e.preventDefault();
    const { className, subject, title, description, dueDate } = hwForm;
    if (!className.trim() || !subject.trim() || !title.trim() || !description.trim()) {
      setHwMessage("Please fill in Class, Subject, Title, and Description");
      setTimeout(() => setHwMessage(""), 2500);
      return;
    }
    const entry = {
      id: Date.now().toString(),
      className: className.trim(),
      subject: subject.trim(),
      title: title.trim(),
      description: description.trim(),
      dueDate: dueDate || null,
      postedAt: new Date().toISOString(),
    };
    const next = [entry, ...homeworkList];
    setHomeworkList(next);
    try {
      localStorage.setItem("teacher_homework", JSON.stringify(next));
    } catch (err) {
      console.error("Failed to persist homework", err);
    }
    setHwForm({ className: "", subject: "", title: "", description: "", dueDate: "" });
    setHwMessage("Homework assigned successfully");
    setTimeout(() => setHwMessage(""), 3000);
  };

  const teacherMenuItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊", color: "#667eea" },
    { id: "upload", label: "Upload Marks", icon: "⬆️", color: "#4facfe" },
    { id: "homework", label: "Homework", icon: "📝", color: "#43e97b" },
    { id: "logout", label: "Logout", icon: "🚪", color: "#ef5350" },
  ];

  return (
    <div style={styles.appRoot}>
      <Header
        title="Teacher Dashboard"
        onLogout={onLogout}
        admin={teacher}
        onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      <div style={styles.container}>
        <Sidebar
          items={teacherMenuItems}
          active={page}
          isCollapsed={isSidebarCollapsed}
          onNavigate={(id) => {
            if (id === "logout") onLogout();
            else setPage(id);
          }}
        />
        <main style={styles.main}>
          {page === "dashboard" && (
            <div>
              <h2 style={styles.pageTitle}>Dashboard</h2>
              <div style={styles.cards}>
                <SummaryCard title="Classes Today" value={3} index={0} />
                <SummaryCard title="Total Students" value={128} index={1} />
                <SummaryCard title="Homework Given" value={homeworkList.length} index={2} />
              </div>
            </div>
          )}

          {page === "upload" && (
            <div>
              <h2 style={styles.pageTitle}>Upload Marks</h2>
              <section style={styles.card}>
                <h3 style={styles.sectionTitle}>Submit Marks</h3>
                {!teacherId ? (
                  <p style={styles.placeholder}>Unable to load your profile.</p>
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
                            onChange={(e) => { setSelectedClass(e.target.value); setSelectedSection(""); setSelectedSubject(""); }}
                            style={styles.input}
                            required
                          >
                            <option value="">Select Class</option>
                            {classOptions.map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>
                        <div style={styles.formGroup}>
                          <label style={styles.label}>Section</label>
                          <select
                            value={selectedSection}
                            onChange={(e) => { setSelectedSection(e.target.value); setSelectedSubject(""); }}
                            style={styles.input}
                            required
                            disabled={!selectedClass}
                          >
                            <option value="">Select Section</option>
                            {sectionOptions.map((s) => (
                              <option key={s} value={s}>{s}</option>
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
                              <option key={sub} value={sub}>{sub}</option>
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
                                <button type="submit" style={styles.primaryButton}>Submit Marks</button>
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
                              <td style={styles.td}>{row.className}</td>
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
          )}

          {page === "homework" && (
            <div>
              <h2 style={styles.pageTitle}>Homework</h2>
              <section style={styles.card}>
                <h3 style={styles.sectionTitle}>Assign Homework</h3>
              <form onSubmit={handleAssignHomework} style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Class</label>
                  <input value={hwForm.className} onChange={(e) => setHwForm({ ...hwForm, className: e.target.value })} style={styles.input} placeholder="e.g. 5-A" />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Subject</label>
                  <input value={hwForm.subject} onChange={(e) => setHwForm({ ...hwForm, subject: e.target.value })} style={styles.input} placeholder="Subject" />
                </div>
                <div style={styles.formGroupFull}>
                  <label style={styles.label}>Homework Title</label>
                  <input value={hwForm.title} onChange={(e) => setHwForm({ ...hwForm, title: e.target.value })} style={styles.input} placeholder="Title" />
                </div>
                <div style={styles.formGroupFull}>
                  <label style={styles.label}>Homework Description</label>
                  <textarea value={hwForm.description} onChange={(e) => setHwForm({ ...hwForm, description: e.target.value })} style={styles.textarea} rows={4} placeholder="Description" />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Due Date</label>
                  <input type="date" value={hwForm.dueDate} onChange={(e) => setHwForm({ ...hwForm, dueDate: e.target.value })} style={styles.input} />
                </div>
                <div style={{ gridColumn: "1 / -1", display: "flex", gap: 12, alignItems: "center" }}>
                  <button type="submit" style={styles.primaryButton}>Assign Homework</button>
                  <span style={{ color: "#6b7a86", fontSize: 14 }}>{hwMessage}</span>
                </div>
              </form>
              <p style={styles.placeholder}>No homework assigned yet.</p>
              </section>
            </div>
          )}
        </main>
      </div>
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
  cards: {
    display: "flex",
    gap: 20,
    marginBottom: 32,
    flexWrap: "wrap",
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
  placeholder: { marginTop: 18, color: "#90a4ae", fontSize: 15 },
  table: { width: "100%", borderCollapse: "collapse", marginTop: 8, fontSize: 14 },
  th: { textAlign: "left", padding: "10px 12px", borderBottom: "2px solid #e0e4e8", color: "#425266", fontWeight: 600 },
  td: { padding: "10px 12px", borderBottom: "1px solid #e0e4e8", color: "#213547" },
  formGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, alignItems: "end" },
  formGroup: { display: "flex", flexDirection: "column" },
  formGroupFull: { gridColumn: "1 / -1", display: "flex", flexDirection: "column" },
  label: { fontSize: 13, color: "#425266", fontWeight: 600, marginBottom: 6 },
  input: { padding: "8px 10px", borderRadius: 8, border: "1px solid #e0e4e8" },
  textarea: { padding: "10px 12px", borderRadius: 8, border: "1px solid #e0e4e8", fontFamily: "inherit" },
  primaryButton: { background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", color: "white", padding: "10px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 700 },
};
