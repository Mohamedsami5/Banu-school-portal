import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, Cell, ResponsiveContainer,
  PieChart, Pie, Legend,
} from "recharts";
import SummaryCard from "../components/SummaryCard";

const API_BASE   = "http://localhost:5000/api";
const EXAM_TYPES = ["Quarterly", "MidTerm", "HalfYearly", "Annual"];
const PASS_MARK  = 35;

const EXAM_COLORS = {
  Quarterly:  "#667eea",
  MidTerm:    "#43e97b",
  HalfYearly: "#fa709a",
  Annual:     "#f6d365",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function useFetch(url) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  useEffect(() => {
    if (!url) { setData(null); return; }
    let cancelled = false;
    setLoading(true);
    setError("");
    fetch(url)
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [url]);

  return { data, loading, error };
}

// ── Custom bar tooltip ────────────────────────────────────────────────────────
function BarTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={tt}>
      <p style={{ fontWeight: 700, marginBottom: 4 }}>{d.examType}</p>
      <p>Avg: <strong>{d.average ?? d.marks}</strong> / 100</p>
      {d.result && (
        <p style={{ color: d.result === "Pass" ? "#22c55e" : "#ef4444" }}>
          {d.result === "Pass" ? "✓ Pass" : "✗ Fail"}
        </p>
      )}
    </div>
  );
}

// ── Custom pie label ──────────────────────────────────────────────────────────
function PieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const r  = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x  = cx + r * Math.cos(-midAngle * RADIAN);
  const y  = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight={700}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

// ── Class Average Bar Chart ───────────────────────────────────────────────────
function ClassAvgChart({ className, section, subject }) {
  const params = className && section && subject
    ? `${API_BASE}/marks/analytics/class-average?className=${encodeURIComponent(className)}&section=${encodeURIComponent(section)}&subject=${encodeURIComponent(subject)}`
    : null;
  const { data, loading } = useFetch(params);

  const chartData = data?.averages ?? [];

  return (
    <div style={card}>
      <p style={cardTitle}>Class Average — Exam Wise</p>
      {!className || !section || !subject ? (
        <p style={hint}>Select class, section and subject to view.</p>
      ) : loading ? (
        <p style={hint}>Loading…</p>
      ) : chartData.length === 0 ? (
        <p style={hint}>No approved marks yet for this selection.</p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 8, right: 16, left: 28, bottom: 24 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e4e8" />
            <XAxis
              dataKey="examType"
              tick={{ fontSize: 12, fill: "#425266" }}
              label={{ value: "Exam Type", position: "insideBottom", offset: -8, fontSize: 12, fill: "#425266" }}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: "#425266" }}
              label={{ value: "Marks", angle: -90, position: "insideLeft", style: { textAnchor: "middle" }, fontSize: 12, fill: "#425266" }}
            />
            <Tooltip content={<BarTooltip />} />
            <ReferenceLine y={PASS_MARK} stroke="#ef4444" strokeDasharray="5 4"
              label={{ value: "Pass 35", position: "insideTopRight", fontSize: 10, fill: "#ef4444" }} />
            <Bar dataKey="average" name="Avg Marks" radius={[6, 6, 0, 0]} maxBarSize={56}>
              {chartData.map((e) => (
                <Cell key={e.examType}
                  fill={EXAM_COLORS[e.examType] || "#667eea"}
                  opacity={e.result === "Fail" ? 0.5 : 1} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// ── Pass / Fail Pie Chart ─────────────────────────────────────────────────────
function PassFailChart({ className, section, subject, examType }) {
  const ready = className && section && subject && examType;
  const params = ready
    ? `${API_BASE}/marks/analytics/pass-fail?className=${encodeURIComponent(className)}&section=${encodeURIComponent(section)}&subject=${encodeURIComponent(subject)}&examType=${encodeURIComponent(examType)}`
    : null;
  const { data, loading } = useFetch(params);

  const pieData = data
    ? [
        { name: "Pass", value: data.passCount, fill: "#22c55e" },
        { name: "Fail", value: data.failCount, fill: "#ef4444" },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <div style={card}>
      <p style={cardTitle}>Pass / Fail Distribution</p>
      {!ready ? (
        <p style={hint}>Select class, section, subject and exam type.</p>
      ) : loading ? (
        <p style={hint}>Loading…</p>
      ) : pieData.length === 0 ? (
        <p style={hint}>No approved marks for {examType}.</p>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                labelLine={false}
                label={<PieLabel />}
              >
                {pieData.map((d) => <Cell key={d.name} fill={d.fill} />)}
              </Pie>
              <Legend iconType="circle" iconSize={10} />
              <Tooltip formatter={(v, n) => [`${v} students`, n]} />
            </PieChart>
          </ResponsiveContainer>
          <div style={pillRow}>
            <span style={{ ...pill, background: "#dcfce7", color: "#166534", borderColor: "#86efac" }}>
              Pass: {data.passCount} ({data.passPercent}%)
            </span>
            <span style={{ ...pill, background: "#fee2e2", color: "#991b1b", borderColor: "#fca5a5" }}>
              Fail: {data.failCount} ({data.failPercent}%)
            </span>
            <span style={{ ...pill, background: "#f1f5f9", color: "#475569", borderColor: "#cbd5e1" }}>
              Total: {data.total}
            </span>
          </div>
        </>
      )}
    </div>
  );
}

// ── Student Performance Bar Chart ───────────────────────────────────────────
function StudentProgressChart({ className, section, subject, students }) {
  const [rollNo, setRollNo]           = useState("");
  const [studentName, setStudentName] = useState("");

  // Reset when filters change
  useEffect(() => { setRollNo(""); setStudentName(""); }, [className, section, subject]);

  const ready = className && section && subject && rollNo;
  const params = ready
    ? `${API_BASE}/marks/analytics/student-progress?rollNo=${encodeURIComponent(rollNo)}&className=${encodeURIComponent(className)}&section=${encodeURIComponent(section)}&subject=${encodeURIComponent(subject)}`
    : null;
  const { data, loading } = useFetch(params);

  const rawData = data?.exams ?? [];
  const chartData = [...rawData].sort(
    (a, b) => EXAM_TYPES.indexOf(a.examType) - EXAM_TYPES.indexOf(b.examType)
  );

  return (
    <div style={card}>
      <p style={cardTitle}>Student Performance</p>

      {/* Student picker */}
      <div style={{ marginBottom: 12 }}>
        <select
          value={rollNo}
          onChange={(e) => {
            const opt = e.target.options[e.target.selectedIndex];
            setRollNo(e.target.value);
            setStudentName(opt.dataset.name || "");
          }}
          style={selectStyle}
          disabled={!className || !section || !subject}
        >
          <option value="">— Select student —</option>
          {(students || []).map((s) => (
            <option key={s._id} value={String(s.rollNo ?? "")} data-name={s.name || s.studentName || ""}>
              {s.rollNo} — {s.name || s.studentName || ""}
            </option>
          ))}
        </select>
      </div>

      {!className || !section || !subject ? (
        <p style={hint}>Select class, section and subject first.</p>
      ) : !rollNo ? (
        <p style={hint}>Select a student to view their exam-wise progress.</p>
      ) : loading ? (
        <p style={hint}>Loading…</p>
      ) : chartData.length === 0 ? (
        <p style={hint}>No approved marks found for {studentName || `Roll ${rollNo}`}.</p>
      ) : (
        <>
          <p style={{ fontSize: 13, color: "#6b7280", marginBottom: 8 }}>
            {studentName} — {subject} · {className}-{section}
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 8, right: 16, left: 28, bottom: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e4e8" />
              <XAxis
                dataKey="examType"
                tick={{ fontSize: 12, fill: "#425266" }}
                label={{ value: "Exam Type", position: "insideBottom", offset: -8, fontSize: 12, fill: "#425266" }}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 11, fill: "#425266" }}
                label={{ value: "Marks", angle: -90, position: "insideLeft", offset: 0, style: { textAnchor: "middle" }, fontSize: 12, fill: "#425266" }}
              />
              <Tooltip content={<BarTooltip />} />
              <ReferenceLine y={PASS_MARK} stroke="#ef4444" strokeDasharray="5 4"
                label={{ value: "Pass 35", position: "insideTopRight", fontSize: 10, fill: "#ef4444" }} />
              <Bar dataKey="marks" name="Marks" radius={[6, 6, 0, 0]} maxBarSize={56}>
                {chartData.map((e) => (
                  <Cell key={e.examType}
                    fill={EXAM_COLORS[e.examType] || "#667eea"}
                    opacity={e.result === "Fail" ? 0.5 : 1} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {/* Summary pills */}
          <div style={pillRow}>
            {chartData.map((e) => (
              <span key={e.examType} style={{
                ...pill,
                background:  e.result === "Pass" ? "#dcfce7" : "#fee2e2",
                color:       e.result === "Pass" ? "#166534" : "#991b1b",
                borderColor: e.result === "Pass" ? "#86efac" : "#fca5a5",
              }}>
                {e.examType}: {e.marks} — {e.result}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Mark range options: [label, minMarks, maxMarks] ──────────────────────────
const MARK_RANGES = [
  { label: "0–10",   min: 0,  max: 10  },
  { label: "11–20",  min: 11, max: 20  },
  { label: "21–30",  min: 21, max: 30  },
  { label: "31–40",  min: 31, max: 40  },
  { label: "41–50",  min: 41, max: 50  },
  { label: "51–60",  min: 51, max: 60  },
  { label: "61–70",  min: 61, max: 70  },
  { label: "71–80",  min: 71, max: 80  },
  { label: "81–90",  min: 81, max: 90  },
  { label: "91–100", min: 91, max: 100 },
];

function rangeAccent(min) {
  if (min <= 20)  return "#ef4444";
  if (min <= 40)  return "#f97316";
  if (min <= 60)  return "#eab308";
  if (min <= 80)  return "#22c55e";
  return "#667eea";
}

// ── Mark Range Summary Card (shown below filter row) ─────────────────────────
function MarkRangeSummary({ className, section, subject, examType, rangeKey }) {
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const range = MARK_RANGES.find((r) => r.label === rangeKey) || null;

  useEffect(() => {
    setResult(null);
    setError("");
    if (!range || !className || !section || !subject) return;

    let cancelled = false;
    setLoading(true);

    const params = new URLSearchParams({
      minMarks:  range.min,
      maxMarks:  range.max,
      className,
      section,
      subject,
    });
    if (examType) params.set("examType", examType);

    fetch(`${API_BASE}/marks/analytics/mark-range-count?${params}`)
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setResult(d); })
      .catch((e) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [rangeKey, className, section, subject, examType]);

  if (!rangeKey) return null;

  const accent = range ? rangeAccent(range.min) : "#667eea";

  return (
    <div style={rangeCard(accent)}>
      {loading ? (
        <span style={{ color: "#94a3b8", fontSize: 13 }}>Loading…</span>
      ) : error ? (
        <span style={{ color: "#ef4444", fontSize: 13 }}>{error}</span>
      ) : result ? (
        <div style={rangeCardInner}>
          <div style={rangeCardLeft}>
            <span style={rangeBadge(accent)}>{result.range} marks</span>
            {examType && (
              <span style={rangeSubBadge}>{examType}</span>
            )}
            <p style={rangeDesc}>
              Students with <strong>Approved</strong> marks in this range
              {className && ` · ${className}${section ? `-${section}` : ""}${subject ? ` · ${subject}` : ""}`}
            </p>
          </div>
          <div style={rangeCountWrap(accent)}>
            <span style={rangeCount(accent)}>{result.count}</span>
            <span style={rangeCountLabel}>student{result.count !== 1 ? "s" : ""}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ── Analytics Panel (filter row + mark range summary + charts) ────────────────
function AnalyticsPanel({ teacherId }) {
  const [assignments, setAssignments] = useState([]);
  const [students, setStudents]       = useState([]);
  const [selClass, setSelClass]       = useState("");
  const [selSection, setSelSection]   = useState("");
  const [selSubject, setSelSubject]   = useState("");
  const [selExam, setSelExam]         = useState("");
  const [selRange, setSelRange]       = useState("");

  // Fetch assignments once
  useEffect(() => {
    if (!teacherId) return;
    fetch(`${API_BASE}/teacher/assignments?teacherId=${encodeURIComponent(teacherId)}`)
      .then((r) => r.json().catch(() => []))
      .then((d) => setAssignments(Array.isArray(d) ? d : []));
  }, [teacherId]);

  // Fetch students when class+section change
  useEffect(() => {
    if (!selClass || !selSection) { setStudents([]); return; }
    fetch(`${API_BASE}/students?class=${encodeURIComponent(selClass)}&section=${encodeURIComponent(selSection)}`)
      .then((r) => r.json().catch(() => []))
      .then((d) => setStudents(Array.isArray(d) ? d : []));
  }, [selClass, selSection]);

  const classOptions = [...new Set(
    assignments.map((a) => a.className || a.class).filter(Boolean)
  )].sort((a, b) => {
    const p = (x) => (x === "LKG" ? -2 : x === "UKG" ? -1 : parseInt(x, 10));
    return p(a) - p(b);
  });

  const sectionOptions = [...new Set(
    assignments.filter((a) => (a.className || a.class) === selClass).map((a) => a.section).filter(Boolean)
  )].sort();

  const subjectOptions = [...new Set(
    assignments.filter((a) => (a.className || a.class) === selClass && a.section === selSection).map((a) => a.subject).filter(Boolean)
  )].sort();

  function resetFilters(level) {
    if (level <= 1) { setSelSection(""); setSelSubject(""); setSelExam(""); setSelRange(""); }
    if (level <= 2) { setSelSubject(""); setSelExam(""); setSelRange(""); }
    if (level <= 3) { setSelExam(""); setSelRange(""); }
  }

  return (
    <div style={{ marginBottom: 32 }}>
      <h3 style={sectionHeading}>Performance Analytics</h3>
      <p style={{ color: "#6b7280", fontSize: 13, marginTop: -8, marginBottom: 16 }}>
        Only <strong>Approved</strong> marks are included. Pass mark = 35.
      </p>

      {/* ── Filter row ── */}
      <div style={filterRow}>
        {/* Class */}
        <div style={fg}>
          <label style={lbl}>Class</label>
          <select style={selectStyle} value={selClass}
            onChange={(e) => { setSelClass(e.target.value); resetFilters(1); }}>
            <option value="">All Classes</option>
            {classOptions.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Section */}
        <div style={fg}>
          <label style={lbl}>Section</label>
          <select style={selectStyle} value={selSection} disabled={!selClass}
            onChange={(e) => { setSelSection(e.target.value); resetFilters(2); }}>
            <option value="">All Sections</option>
            {sectionOptions.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Subject */}
        <div style={fg}>
          <label style={lbl}>Subject</label>
          <select style={selectStyle} value={selSubject} disabled={!selSection}
            onChange={(e) => { setSelSubject(e.target.value); resetFilters(3); }}>
            <option value="">All Subjects</option>
            {subjectOptions.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Exam Type */}
        <div style={fg}>
          <label style={lbl}>Exam Type</label>
          <select style={selectStyle} value={selExam} disabled={!selSubject}
            onChange={(e) => { setSelExam(e.target.value); setSelRange(""); }}>
            <option value="">Select Exam</option>
            {EXAM_TYPES.map((et) => <option key={et} value={et}>{et}</option>)}
          </select>
        </div>

        {/* Mark Range */}
        <div style={fg}>
          <label style={lbl}>Mark Range</label>
          <select style={selectStyle} value={selRange} disabled={!selSubject}
            onChange={(e) => setSelRange(e.target.value)}>
            <option value="">Select Range</option>
            {MARK_RANGES.map((r) => (
              <option key={r.label} value={r.label}>{r.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Mark Range Summary (shown only when a range is selected) ── */}
      <MarkRangeSummary
        className={selClass}
        section={selSection}
        subject={selSubject}
        examType={selExam}
        rangeKey={selRange}
      />

      {/* ── Charts grid ── */}
      <div style={chartsGrid}>
        {/* Class Average — spans full width */}
        <div style={{ gridColumn: "span 2" }}>
          <ClassAvgChart className={selClass} section={selSection} subject={selSubject} />
        </div>

        {/* Pass/Fail Pie */}
        <PassFailChart
          className={selClass} section={selSection}
          subject={selSubject} examType={selExam}
        />

        {/* Student Performance */}
        <StudentProgressChart
          className={selClass} section={selSection}
          subject={selSubject} students={students}
        />
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function TeacherDashboard() {
  const didLoadRef = useRef(false);
  const [stats, setStats]   = useState({ classesToday: 0, totalStudents: 0, assignmentsPosted: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");
  const [teacherId, setTeacherId] = useState("");

  useEffect(() => {
    if (didLoadRef.current) return;
    didLoadRef.current = true;
    loadStats();
  }, []);

  async function loadStats() {
    try {
      setLoading(true);
      setError("");

      const stored = localStorage.getItem("user");
      if (!stored) throw new Error("Teacher session not found. Please login again.");

      const user = JSON.parse(stored);
      const tid  = user?._id || user?.id;
      if (!tid)  throw new Error("Teacher ID not found. Please login again.");

      setTeacherId(tid);

      const [assignmentsRes, studentsRes, homeworkRes] = await Promise.all([
        fetch(`${API_BASE}/teacher/assignments?teacherId=${tid}`),
        fetch(`${API_BASE}/students`),
        fetch(`${API_BASE}/homework?teacherId=${tid}`),
      ]);

      if (!assignmentsRes.ok || !studentsRes.ok || !homeworkRes.ok) {
        throw new Error("Failed to load dashboard stats");
      }

      const assignments = await assignmentsRes.json().catch(() => []);
      const students    = await studentsRes.json().catch(() => []);
      const homework    = await homeworkRes.json().catch(() => []);

      const classSet = new Set();
      if (Array.isArray(assignments)) {
        assignments.forEach((a) => {
          const key = `${a?.className || ""}-${a?.section || ""}`.trim();
          if (key) classSet.add(key);
        });
      }

      setStats({
        classesToday:      classSet.size,
        totalStudents:     Array.isArray(students)  ? students.length  : 0,
        assignmentsPosted: Array.isArray(homework)  ? homework.length  : 0,
      });
    } catch (err) {
      console.error("Failed to load dashboard stats:", err);
      setError(err.message || "Failed to load dashboard stats");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 style={styles.pageTitle}>Dashboard</h2>

      {/* Summary cards */}
      <div style={styles.cards}>
        <SummaryCard title="Classes Today"      value={loading ? "…" : stats.classesToday}      index={0} />
        <SummaryCard title="Total Students"     value={loading ? "…" : stats.totalStudents}     index={1} />
        <SummaryCard title="Assignments Posted" value={loading ? "…" : stats.assignmentsPosted} index={2} />
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {/* Analytics panel — sits below summary cards */}
      {teacherId && <AnalyticsPanel teacherId={teacherId} />}
    </div>
  );
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
  cards: {
    display: "flex",
    gap: 20,
    marginBottom: 32,
    flexWrap: "wrap",
  },
  error: {
    color: "#b91c1c",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: 8,
    padding: "8px 10px",
    fontSize: 13,
    marginBottom: 16,
  },
};

// Shared micro-styles
const card = {
  background: "#fff",
  border: "1px solid #e0e4e8",
  borderRadius: 14,
  padding: "18px 20px",
  boxShadow: "0 4px 16px rgba(102,126,234,0.07)",
};

const cardTitle = {
  fontSize: 15,
  fontWeight: 700,
  color: "#213547",
  marginTop: 0,
  marginBottom: 14,
};

const hint = {
  color: "#90a4ae",
  fontSize: 13,
  margin: 0,
};

const sectionHeading = {
  fontSize: 20,
  fontWeight: 700,
  color: "#213547",
  marginTop: 0,
  marginBottom: 6,
};

const filterRow = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: 12,
  marginBottom: 20,
  background: "#fff",
  border: "1px solid #e0e4e8",
  borderRadius: 12,
  padding: "16px 20px",
  boxShadow: "0 2px 8px rgba(102,126,234,0.06)",
};

const chartsGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: 16,
};

const fg = { display: "flex", flexDirection: "column" };

const lbl = {
  fontSize: 12,
  fontWeight: 600,
  color: "#425266",
  marginBottom: 5,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

const selectStyle = {
  padding: "7px 10px",
  borderRadius: 8,
  border: "1px solid #e0e4e8",
  fontSize: 13,
  color: "#213547",
  background: "#f8f9ff",
  cursor: "pointer",
};

const pillRow = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  marginTop: 12,
};

const pill = {
  padding: "3px 11px",
  borderRadius: 20,
  border: "1px solid",
  fontSize: 12,
  fontWeight: 600,
};

const tt = {
  background: "#fff",
  border: "1px solid #e0e4e8",
  borderRadius: 8,
  padding: "10px 14px",
  fontSize: 13,
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
};

// ── Mark Range summary card styles ────────────────────────────────────────────
const rangeCard = (accent) => ({
  background:   `${accent}0d`,
  border:       `1.5px solid ${accent}33`,
  borderRadius: 12,
  padding:      "14px 20px",
  marginBottom: 20,
});

const rangeCardInner = {
  display:        "flex",
  alignItems:     "center",
  justifyContent: "space-between",
  gap:            16,
  flexWrap:       "wrap",
};

const rangeCardLeft = {
  display:       "flex",
  flexDirection: "column",
  gap:           6,
};

const rangeBadge = (accent) => ({
  display:       "inline-block",
  background:    accent,
  color:         "#fff",
  borderRadius:  20,
  padding:       "3px 14px",
  fontSize:      13,
  fontWeight:    700,
  letterSpacing: "0.03em",
  width:         "fit-content",
});

const rangeSubBadge = {
  display:     "inline-block",
  background:  "#f1f5f9",
  color:       "#475569",
  border:      "1px solid #e2e8f0",
  borderRadius: 20,
  padding:     "2px 12px",
  fontSize:    12,
  fontWeight:  600,
  width:       "fit-content",
};

const rangeDesc = {
  fontSize: 13,
  color:    "#6b7280",
  margin:   0,
};

const rangeCountWrap = (accent) => ({
  display:        "flex",
  flexDirection:  "column",
  alignItems:     "center",
  background:     "#fff",
  border:         `1.5px solid ${accent}33`,
  borderRadius:   12,
  padding:        "10px 24px",
  minWidth:       90,
  boxShadow:      `0 2px 8px ${accent}18`,
});

const rangeCount = (accent) => ({
  fontSize:   44,
  fontWeight: 800,
  color:      accent,
  lineHeight: 1,
});

const rangeCountLabel = {
  fontSize:  12,
  color:     "#94a3b8",
  marginTop: 2,
  fontWeight: 500,
};
