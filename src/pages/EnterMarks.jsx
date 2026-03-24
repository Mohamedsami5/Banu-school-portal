import React, { useState, useEffect, useCallback } from "react";
import { API_BASE } from "../config/api";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ReferenceLine, Cell, ResponsiveContainer,
} from "recharts";

const EXAM_TYPES = ["Quarterly", "MidTerm", "HalfYearly", "Annual"];
const PASS_MARK  = 35;

// ── Colour palette for each exam bar ──────────────────────────────────────────
const EXAM_COLORS = {
  Quarterly:   "#667eea",
  MidTerm:     "#43e97b",
  HalfYearly:  "#fa709a",
  Annual:      "#f6d365",
};

// ── Custom tooltip shown on bar hover ─────────────────────────────────────────
function CustomTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const { examType, marks, result } = payload[0].payload;
  return (
    <div style={tooltipStyle}>
      <p style={{ fontWeight: 700, marginBottom: 4 }}>{examType}</p>
      <p>Marks: <strong>{marks}</strong> / 100</p>
      <p style={{ color: result === "Pass" ? "#22c55e" : "#ef4444" }}>
        {result === "Pass" ? "✓ Pass" : "✗ Fail"}
      </p>
    </div>
  );
}

// ── ProgressChart — per-student exam-wise bar chart ───────────────────────────
function ProgressChart({ className, section, subject, rollNo, studentName }) {
  const [chartData, setChartData]   = useState([]);
  const [loading, setLoading]       = useState(false);
  const [noData, setNoData]         = useState(false);

  useEffect(() => {
    if (!className || !section || !subject || !rollNo) {
      setChartData([]);
      setNoData(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      setNoData(false);
      try {
        const params = new URLSearchParams({ rollNo, className, section, subject });
        const res    = await fetch(`${API_BASE}/marks/analytics/student-progress?${params}`);
        const data   = await res.json().catch(() => ({}));

        if (res.ok && Array.isArray(data.exams) && data.exams.length > 0) {
          setChartData(data.exams);
          setNoData(false);
        } else {
          setChartData([]);
          setNoData(true);
        }
      } catch {
        setChartData([]);
        setNoData(true);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [rollNo, className, section, subject]);

  if (!rollNo) return null;

  return (
    <div style={chartStyles.wrapper}>
      <h4 style={chartStyles.title}>
        Progress Chart — {studentName || `Roll No ${rollNo}`}
        <span style={chartStyles.subtitle}> · {subject} · {className}-{section}</span>
      </h4>

      {loading && <p style={chartStyles.note}>Loading chart…</p>}

      {!loading && noData && (
        <p style={chartStyles.note}>
          No approved marks found for this student yet. Marks must be approved by admin to appear here.
        </p>
      )}

      {!loading && chartData.length > 0 && (
        <>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e4e8" />
              <XAxis dataKey="examType" tick={{ fontSize: 13, fill: "#425266" }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "#425266" }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={(value) => (
                  <span style={{ fontSize: 13, color: "#425266" }}>{value}</span>
                )}
              />
              {/* Pass/Fail reference line */}
              <ReferenceLine
                y={PASS_MARK}
                stroke="#ef4444"
                strokeDasharray="5 4"
                label={{ value: "Pass (35)", position: "insideTopRight", fontSize: 11, fill: "#ef4444" }}
              />
              <Bar dataKey="marks" name="Marks" radius={[6, 6, 0, 0]} maxBarSize={60}>
                {chartData.map((entry) => (
                  <Cell
                    key={entry.examType}
                    fill={EXAM_COLORS[entry.examType] || "#667eea"}
                    opacity={entry.result === "Fail" ? 0.55 : 1}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Summary pills */}
          <div style={chartStyles.pills}>
            {chartData.map((e) => (
              <span
                key={e.examType}
                style={{
                  ...chartStyles.pill,
                  background: e.result === "Pass" ? "#dcfce7" : "#fee2e2",
                  color:      e.result === "Pass" ? "#166534" : "#991b1b",
                  borderColor: e.result === "Pass" ? "#86efac" : "#fca5a5",
                }}
              >
                {e.examType}: {e.marks} — {e.result}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── ClassProgressChart — class-average bar chart ──────────────────────────────
function ClassProgressChart({ className, section, subject }) {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading]     = useState(false);
  const [noData, setNoData]       = useState(false);

  useEffect(() => {
    if (!className || !section || !subject) {
      setChartData([]);
      setNoData(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      setNoData(false);
      try {
        const params = new URLSearchParams({ className, section, subject });
        const res    = await fetch(`${API_BASE}/marks/analytics/class-progress?${params}`);
        const data   = await res.json().catch(() => ({}));

        if (res.ok && Array.isArray(data.exams) && data.exams.length > 0) {
          // Shape for recharts: [{ examType, classAvg }]
          setChartData(data.exams.map((e) => ({ examType: e.examType, classAvg: e.classAvg })));
          setNoData(false);
        } else {
          setChartData([]);
          setNoData(true);
        }
      } catch {
        setChartData([]);
        setNoData(true);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [className, section, subject]);

  if (!className || !section || !subject) return null;

  return (
    <div style={chartStyles.wrapper}>
      <h4 style={chartStyles.title}>
        Class Average — {subject}
        <span style={chartStyles.subtitle}> · {className}-{section}</span>
      </h4>

      {loading && <p style={chartStyles.note}>Loading chart…</p>}

      {!loading && noData && (
        <p style={chartStyles.note}>
          No approved marks for this class/subject yet.
        </p>
      )}

      {!loading && chartData.length > 0 && (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e4e8" />
            <XAxis dataKey="examType" tick={{ fontSize: 13, fill: "#425266" }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "#425266" }} />
            <Tooltip
              formatter={(val) => [`${val} / 100`, "Class Avg"]}
              labelStyle={{ fontWeight: 700 }}
            />
            <ReferenceLine
              y={PASS_MARK}
              stroke="#ef4444"
              strokeDasharray="5 4"
              label={{ value: "Pass (35)", position: "insideTopRight", fontSize: 11, fill: "#ef4444" }}
            />
            <Bar dataKey="classAvg" name="Class Avg" radius={[6, 6, 0, 0]} maxBarSize={60}>
              {chartData.map((entry) => (
                <Cell key={entry.examType} fill={EXAM_COLORS[entry.examType] || "#667eea"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function EnterMarks() {
  const [teacher, setTeacher]               = useState(null);
  const [assignments, setAssignments]       = useState([]);
  const [selectedClass, setSelectedClass]   = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedExamType, setSelectedExamType] = useState("");
  const [students, setStudents]             = useState([]);
  const [studentMarks, setStudentMarks]     = useState({});
  const [marksMessage, setMarksMessage]     = useState("");
  const [assignmentsError, setAssignmentsError] = useState("");
  const [marksList, setMarksList]           = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [marksLoading, setMarksLoading]     = useState(false);
  const [marksSearch, setMarksSearch]       = useState("");

  // Which student row is selected for the per-student chart
  const [chartRollNo, setChartRollNo]         = useState("");
  const [chartStudentName, setChartStudentName] = useState("");

  // Load teacher from localStorage
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

  const teacherId    = teacher?._id || teacher?.id;
  const teacherEmail = teacher?.email ? String(teacher.email).trim().toLowerCase() : "";

  // ── Fetch assignments ────────────────────────────────────────────────────────
  const fetchAssignments = useCallback(async () => {
    if (!teacherId && !teacherEmail) return;
    try {
      setAssignmentsError("");
      const query = teacherId
        ? `teacherId=${encodeURIComponent(teacherId)}`
        : `teacherEmail=${encodeURIComponent(teacherEmail)}`;
      const res  = await fetch(`${API_BASE}/teacher/assignments?${query}`);
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
  }, [teacherId, teacherEmail]);

  useEffect(() => { fetchAssignments(); }, [fetchAssignments]);

  // ── Fetch submitted marks list ───────────────────────────────────────────────
  const fetchMarksList = useCallback(async () => {
    if (!teacherId) return;
    try {
      const params = new URLSearchParams({ teacherId });
      if (selectedExamType) params.set("examType", selectedExamType);
      const res  = await fetch(`${API_BASE}/marks?${params}`);
      const data = await res.json().catch(() => []);
      setMarksList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch marks", err);
      setMarksList([]);
    }
  }, [teacherId, selectedExamType]);

  useEffect(() => { fetchMarksList(); }, [fetchMarksList]);

  // ── Fetch students when class/section changes ────────────────────────────────
  useEffect(() => {
    if (!selectedClass || !selectedSection) {
      setStudents([]);
      setStudentMarks({});
      setChartRollNo("");
      return;
    }
    setStudentsLoading(true);
    setStudents([]);
    setStudentMarks({});
    setChartRollNo("");
    fetch(`${API_BASE}/students?class=${encodeURIComponent(selectedClass)}&section=${encodeURIComponent(selectedSection)}`)
      .then((res) => res.json().catch(() => []))
      .then((data) => setStudents(Array.isArray(data) ? data : []))
      .catch(() => setStudents([]))
      .finally(() => setStudentsLoading(false));
  }, [selectedClass, selectedSection]);

  // ── Pre-fill marks when all four filters are set ─────────────────────────────
  useEffect(() => {
    if (!teacherId || !selectedClass || !selectedSection || !selectedSubject || !selectedExamType) {
      setStudentMarks({});
      return;
    }

    const loadExistingMarks = async () => {
      setMarksLoading(true);
      try {
        const params = new URLSearchParams({
          teacherId,
          className: selectedClass,
          section:   selectedSection,
          subject:   selectedSubject,
          examType:  selectedExamType,
        });
        const res  = await fetch(`${API_BASE}/marks?${params}`);
        const data = await res.json().catch(() => []);

        if (res.ok && Array.isArray(data) && data.length > 0) {
          const prefill = {};
          data.forEach((m) => {
            if (m.rollNo != null) prefill[String(m.rollNo).trim()] = m.marks;
          });
          setStudentMarks((prev) => {
            const next = { ...prev };
            students.forEach((s) => {
              const roll = s.rollNo != null ? String(s.rollNo).trim() : null;
              if (roll && prefill[roll] !== undefined) next[s._id] = prefill[roll];
            });
            return next;
          });
        } else {
          setStudentMarks({});
        }
      } catch (err) {
        console.error("Failed to pre-fill marks", err);
        setStudentMarks({});
      } finally {
        setMarksLoading(false);
      }
    };

    if (students.length > 0) loadExistingMarks();
  }, [selectedClass, selectedSection, selectedSubject, selectedExamType, students, teacherId]);

  // ── Dropdown options ─────────────────────────────────────────────────────────
  const classOptions = [...new Set(
    (assignments || []).map((a) => a.className || a.class).filter(Boolean)
  )].sort((a, b) => {
    const pri = (x) => (x === "LKG" ? -2 : x === "UKG" ? -1 : parseInt(x, 10));
    return pri(a) - pri(b);
  });

  const sectionOptions = [...new Set(
    (assignments || [])
      .filter((a) => (a.className || a.class) === selectedClass)
      .map((a) => a.section).filter(Boolean)
  )].sort();

  const subjectOptions = [...new Set(
    (assignments || [])
      .filter((a) => (a.className || a.class) === selectedClass && a.section === selectedSection)
      .map((a) => a.subject).filter(Boolean)
  )].sort();

  const canEnterMarks = Boolean(selectedClass && selectedSection && selectedSubject && selectedExamType);

  const setMarkForStudent = (studentId, value) => {
    setStudentMarks((prev) => ({ ...prev, [studentId]: value }));
  };

  // ── Submit marks ─────────────────────────────────────────────────────────────
  const handleBulkMarkSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!canEnterMarks) {
      setMarksMessage("Please select Class, Section, Subject, and Exam Type");
      setTimeout(() => setMarksMessage(""), 2500);
      return;
    }

    const entries = students
      .map((s) => {
        const marksVal = studentMarks[s._id];
        const num = marksVal !== "" && marksVal !== undefined && marksVal !== null ? Number(marksVal) : null;
        if (num !== null && (isNaN(num) || num < 0 || num > 100)) return null;
        return {
          rollNo:      s.rollNo != null ? String(s.rollNo).trim() : "",
          studentName: s.name || s.studentName || "",
          marks:       num !== null && !isNaN(num) ? num : "",
        };
      })
      .filter((e) => e && e.marks !== "" && e.marks !== undefined);

    const missing = entries.filter((e) => !e.rollNo);
    if (missing.length > 0) {
      setMarksMessage(`Cannot submit marks. Missing Roll No for: ${missing.map((m) => m.studentName || "Unknown").join(", ")}`);
      setTimeout(() => setMarksMessage(""), 4000);
      return;
    }
    if (entries.length === 0) {
      setMarksMessage("Enter at least one mark (0–100)");
      setTimeout(() => setMarksMessage(""), 2500);
      return;
    }
    const invalid = entries.find((e) => { const n = Number(e.marks); return isNaN(n) || n < 0 || n > 100; });
    if (invalid) {
      setMarksMessage("All marks must be between 0 and 100");
      setTimeout(() => setMarksMessage(""), 2500);
      return;
    }

    setMarksMessage("");
    try {
      const res = await fetch(`${API_BASE}/teacher/marks`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId,
          className: selectedClass,
          section:   selectedSection,
          subject:   selectedSubject,
          examType:  selectedExamType,
          entries:   entries.map((e) => ({ rollNo: e.rollNo, studentName: e.studentName, marks: Number(e.marks) })),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setMarksMessage(data.message || "Failed to submit marks"); return; }

      const createdCount = Number(data?.createdCount ?? 0);
      const updatedCount = Number(data?.updatedCount ?? 0);
      const errors       = Array.isArray(data?.errors) ? data.errors : [];

      if (updatedCount > 0 && createdCount > 0) {
        setMarksMessage(`${createdCount} marks saved, ${updatedCount} updated. Status reset to "Pending".`);
      } else if (updatedCount > 0) {
        setMarksMessage(`${updatedCount} marks updated. Status reset to "Pending" for admin review.`);
      } else if (createdCount > 0) {
        setMarksMessage(`${createdCount} marks submitted successfully.`);
      } else if (errors.length > 0) {
        setMarksMessage("Some marks failed to save. Please check the data and try again.");
      } else {
        setMarksMessage(data.message || "Marks processed.");
      }

      setTimeout(() => setMarksMessage(""), 4500);
      await fetchMarksList();
    } catch (err) {
      console.error("Marks submit error", err);
      setMarksMessage(err.message || "Failed to submit marks. Check if backend is running.");
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div>
      <h2 style={styles.pageTitle}>Enter Student Marks</h2>

      {/* ════════════════════════════════════════════════════════════════════════
          SECTION 1 — Submit Marks
      ════════════════════════════════════════════════════════════════════════ */}
      <section style={styles.card}>
        <h3 style={styles.sectionTitle}>Submit Marks</h3>

        {!teacherId ? (
          <p style={styles.placeholder}>Unable to load your profile.</p>
        ) : assignmentsError ? (
          <p style={styles.placeholder}>{assignmentsError}</p>
        ) : assignments.length === 0 ? (
          <p style={styles.placeholder}>No classes or subjects assigned yet. Contact admin.</p>
        ) : (
          <form onSubmit={handleBulkMarkSubmit}>
            {/* Filter row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Class</label>
                <select
                  value={selectedClass}
                  onChange={(e) => { setSelectedClass(e.target.value); setSelectedSection(""); setSelectedSubject(""); setSelectedExamType(""); }}
                  style={styles.input} required
                >
                  <option value="">Select Class</option>
                  {classOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Section</label>
                <select
                  value={selectedSection}
                  onChange={(e) => { setSelectedSection(e.target.value); setSelectedSubject(""); setSelectedExamType(""); }}
                  style={styles.input} required disabled={!selectedClass}
                >
                  <option value="">Select Section</option>
                  {sectionOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Subject</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => { setSelectedSubject(e.target.value); setSelectedExamType(""); }}
                  style={styles.input} required disabled={!selectedSection}
                >
                  <option value="">Select Subject</option>
                  {subjectOptions.map((sub) => <option key={sub} value={sub}>{sub}</option>)}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Exam Type</label>
                <select
                  value={selectedExamType}
                  onChange={(e) => setSelectedExamType(e.target.value)}
                  style={styles.input} required disabled={!selectedSubject}
                >
                  <option value="">Select Exam Type</option>
                  {EXAM_TYPES.map((et) => <option key={et} value={et}>{et}</option>)}
                </select>
              </div>
            </div>

            {/* Student marks table */}
            {selectedClass && selectedSection && (
              <>
                {studentsLoading ? (
                  <p style={styles.placeholder}>Loading students…</p>
                ) : students.length === 0 ? (
                  <p style={styles.placeholder}>No students in this class and section.</p>
                ) : (
                  <>
                    {!canEnterMarks && (
                      <p style={{ ...styles.placeholder, color: "#f59e0b", marginBottom: 8 }}>
                        Select Subject and Exam Type to enter marks.
                      </p>
                    )}
                    {marksLoading && (
                      <p style={{ ...styles.placeholder, marginBottom: 8 }}>Loading existing marks…</p>
                    )}
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.th}>Roll No</th>
                          <th style={styles.th}>Name</th>
                          <th style={styles.th}>Marks (0–100)</th>
                          {selectedSubject && <th style={styles.th}>View Progress</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((s) => {
                          const roll = s.rollNo != null ? String(s.rollNo).trim() : "";
                          const isSelected = chartRollNo === roll && !!roll;
                          return (
                            <tr key={s._id} style={isSelected ? { background: "#f0f4ff" } : {}}>
                              <td style={styles.td}>{roll}</td>
                              <td style={styles.td}>{s.name || s.studentName || ""}</td>
                              <td style={styles.td}>
                                <input
                                  type="number" min={0} max={100}
                                  value={studentMarks[s._id] ?? ""}
                                  onChange={(e) => setMarkForStudent(s._id, e.target.value)}
                                  style={{ ...styles.input, width: "80px" }}
                                  placeholder="0–100"
                                  disabled={!canEnterMarks}
                                />
                              </td>
                              {selectedSubject && (
                                <td style={styles.td}>
                                  <button
                                    type="button"
                                    style={{
                                      ...styles.chartBtn,
                                      background: isSelected ? "#667eea" : "#f0f4ff",
                                      color:      isSelected ? "#fff"    : "#667eea",
                                    }}
                                    onClick={() => {
                                      if (isSelected) {
                                        setChartRollNo("");
                                        setChartStudentName("");
                                      } else {
                                        setChartRollNo(roll);
                                        setChartStudentName(s.name || s.studentName || "");
                                      }
                                    }}
                                    disabled={!roll}
                                  >
                                    {isSelected ? "Hide" : "Chart"}
                                  </button>
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 12 }}>
                      <button
                        type="button"
                        style={{
                          ...styles.primaryButton,
                          opacity: canEnterMarks && students.length > 0 ? 1 : 0.5,
                          cursor:  canEnterMarks && students.length > 0 ? "pointer" : "not-allowed",
                        }}
                        onClick={handleBulkMarkSubmit}
                        disabled={!canEnterMarks || students.length === 0}
                      >
                        Submit Marks
                      </button>
                      {marksMessage && (
                        <span style={{ color: "#6b7a86", fontSize: 14 }}>{marksMessage}</span>
                      )}
                    </div>
                  </>
                )}
              </>
            )}
          </form>
        )}
      </section>

      {/* ════════════════════════════════════════════════════════════════════════
          SECTION 2 — Progress Charts (only when class + section + subject set)
      ════════════════════════════════════════════════════════════════════════ */}
      {selectedClass && selectedSection && selectedSubject && (
        <section style={{ ...styles.card, marginTop: 20 }}>
          <h3 style={styles.sectionTitle}>Performance Analytics</h3>
          <p style={{ color: "#6b7280", fontSize: 13, marginTop: -8, marginBottom: 16 }}>
            Only <strong>Approved</strong> marks are shown. Pass mark = 35.
          </p>

          {/* Class-average chart — always visible when subject is selected */}
          <ClassProgressChart
            className={selectedClass}
            section={selectedSection}
            subject={selectedSubject}
          />

          {/* Per-student chart — visible when a row's "Chart" button is clicked */}
          {chartRollNo && (
            <ProgressChart
              className={selectedClass}
              section={selectedSection}
              subject={selectedSubject}
              rollNo={chartRollNo}
              studentName={chartStudentName}
            />
          )}
        </section>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
          SECTION 3 — Submitted Marks table
      ════════════════════════════════════════════════════════════════════════ */}
      <section style={{ ...styles.card, marginTop: 20 }}>
        <h3 style={styles.sectionTitle}>Submitted Marks</h3>

        {marksList.length === 0 ? (
          <p style={styles.placeholder}>No marks submitted yet.</p>
        ) : (
          <>
            {/* Search bar */}
            <div style={styles.marksSearchWrap}>
              <span style={styles.marksSearchIcon}>🔍</span>
              <input
                type="text"
                placeholder="Search by roll no, name, class, section, subject, exam type or status…"
                value={marksSearch}
                onChange={(e) => setMarksSearch(e.target.value)}
                style={styles.marksSearchInput}
              />
              {marksSearch && (
                <button
                  onClick={() => setMarksSearch("")}
                  style={styles.marksSearchClear}
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filtered table */}
            {(() => {
              const q = marksSearch.trim().toLowerCase();
              const filtered = q
                ? marksList.filter((row) =>
                    [
                      row.rollNo,
                      row.studentName,
                      row.className ?? row.class,
                      row.section,
                      row.subject,
                      row.examType,
                      row.status || "Pending",
                    ]
                      .map((v) => String(v ?? "").toLowerCase())
                      .some((v) => v.includes(q))
                  )
                : marksList;

              if (filtered.length === 0) {
                return (
                  <p style={styles.placeholder}>
                    No records match <strong>"{marksSearch}"</strong>.
                  </p>
                );
              }

              return (
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Roll No</th>
                      <th style={styles.th}>Student Name</th>
                      <th style={styles.th}>Class</th>
                      <th style={styles.th}>Section</th>
                      <th style={styles.th}>Subject</th>
                      <th style={styles.th}>Exam Type</th>
                      <th style={styles.th}>Marks</th>
                      <th style={styles.th}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((row, idx) => (
                      <tr
                        key={row._id}
                        style={idx % 2 === 0 ? styles.trEven : styles.trOdd}
                      >
                        <td style={styles.td}>{row.rollNo ?? ""}</td>
                        <td style={styles.td}>{row.studentName}</td>
                        <td style={styles.td}>{row.className ?? row.class ?? ""}</td>
                        <td style={styles.td}>{row.section ?? ""}</td>
                        <td style={styles.td}>{row.subject}</td>
                        <td style={styles.td}>{row.examType ?? "—"}</td>
                        <td style={{ ...styles.td, fontWeight: 600 }}>{row.marks}</td>
                        <td style={styles.td}>
                          <span style={marksStatusBadge(row.status || "Pending")}>
                            {row.status || "Pending"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              );
            })()}
          </>
        )}
      </section>
    </div>
  );
}

// ── Status badge helper for Submitted Marks table ─────────────────────────────
function marksStatusBadge(status) {
  const base = {
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.2px",
  };
  if (status === "Approved")
    return { ...base, background: "#dcfce7", color: "#15803d", border: "1px solid #bbf7d0" };
  if (status === "Rejected")
    return { ...base, background: "#fee2e2", color: "#b91c1c", border: "1px solid #fecaca" };
  return { ...base, background: "#fef9c3", color: "#854d0e", border: "1px solid #fde68a" };
}

// ── Styles ────────────────────────────────────────────────────────────────────
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
  chartBtn: {
    padding: "4px 12px",
    borderRadius: 6,
    border: "1px solid #667eea",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 600,
    transition: "all 0.15s",
  },

  // ── Submitted Marks search bar ──
  marksSearchWrap: {
    position: "relative",
    display: "flex",
    alignItems: "center",
    marginBottom: 14,
  },
  marksSearchIcon: {
    position: "absolute",
    left: 11,
    fontSize: 13,
    pointerEvents: "none",
  },
  marksSearchInput: {
    width: "100%",
    padding: "9px 36px 9px 32px",
    borderRadius: 8,
    border: "1px solid #dde1ea",
    fontSize: 14,
    color: "#213547",
    background: "#fff",
    boxSizing: "border-box",
    outline: "none",
  },
  marksSearchClear: {
    position: "absolute",
    right: 10,
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 13,
    color: "#9ca3af",
    padding: "2px 4px",
    lineHeight: 1,
  },

  // ── Zebra striping ──
  trEven: { background: "#ffffff" },
  trOdd:  { background: "#f8f9ff" },
};

const chartStyles = {
  wrapper: {
    background: "#f8f9ff",
    border: "1px solid #e0e4e8",
    borderRadius: 12,
    padding: "20px 24px",
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: 700,
    color: "#213547",
    marginTop: 0,
    marginBottom: 16,
  },
  subtitle: {
    fontWeight: 400,
    color: "#6b7280",
    fontSize: 14,
  },
  note: {
    color: "#90a4ae",
    fontSize: 14,
    margin: 0,
  },
  pills: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  pill: {
    padding: "4px 12px",
    borderRadius: 20,
    border: "1px solid",
    fontSize: 13,
    fontWeight: 600,
  },
};

const tooltipStyle = {
  background: "#fff",
  border: "1px solid #e0e4e8",
  borderRadius: 8,
  padding: "10px 14px",
  fontSize: 13,
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
};
