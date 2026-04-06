import React, { useEffect, useMemo, useState } from "react";
import { API_BASE } from "../config/api";
import ParentPerformanceChart from "../components/ParentPerformanceChart";

const EXAM_ORDER = ["Quarterly", "MidTerm", "HalfYearly", "Annual"];

function getPossibleMarks(markRow) {
  const possibleRaw = markRow?.totalMarks ?? markRow?.maxMarks ?? 100;
  const possible = Number(possibleRaw);
  return Number.isFinite(possible) && possible > 0 ? possible : 100;
}

function formatPercentageFromMarks(markRows) {
  const rows = (Array.isArray(markRows) ? markRows : [])
    .map((m) => {
      const scored = Number(m?.marks);
      if (!Number.isFinite(scored)) return null;
      return { scored, possible: getPossibleMarks(m) };
    })
    .filter(Boolean);

  if (rows.length === 0) return "0%";

  const totalMarks = rows.reduce((sum, r) => sum + r.scored, 0);
  const totalPossibleMarks = rows.reduce((sum, r) => sum + r.possible, 0);
  const rawPercentage = totalPossibleMarks > 0 ? (totalMarks / totalPossibleMarks) * 100 : 0;
  const percentage = Number.isFinite(rawPercentage) ? Math.min(100, Math.max(0, rawPercentage)) : 0;

  const rounded1 = Math.round(percentage * 10) / 10;
  const formatted = Number.isInteger(rounded1) ? rounded1.toFixed(0) : rounded1.toFixed(1);

  return `${formatted}%`;
}

export default function ParentDashboardOverview({ child, allChildren = [], parentUser }) {
  const [allMarks, setAllMarks] = useState([]);
  const [pendingHomework, setPendingHomework] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const rollNo = child?.rollNo || "";
  const className = child?.className || "";
  const section = child?.section || "";
  const parentId = parentUser?.parent?._id || "";

  const legacyIds = useMemo(() => {
    const ids = (Array.isArray(allChildren) ? allChildren : [])
      .map((c) => c?._id)
      .filter(Boolean);
    if (ids.length > 0) return ids;
    return child?._id ? [child._id] : [];
  }, [allChildren, child?._id]);

  useEffect(() => {
    async function loadData() {
      if (!rollNo || !className || !section) {
        setLoading(false);
        setError("Child profile is incomplete.");
        return;
      }
      try {
        setLoading(true);
        setError("");
        const marksParams = new URLSearchParams({ rollNo, className, section });
        const hwParams = new URLSearchParams({ className, section });

        const [marksRes, hwRes] = await Promise.all([
          fetch(`${API_BASE}/student/marks?${marksParams}`),
          fetch(`${API_BASE}/homework?${hwParams}`),
        ]);

        const marksData = await marksRes.json().catch(() => []);
        const hwData = await hwRes.json().catch(() => []);

        const marksArr = Array.isArray(marksData) ? marksData : [];
        const hwArr = Array.isArray(hwData) ? hwData : [];

        setAllMarks(marksArr);
        setPendingHomework(hwArr.slice(0, 5));
      } catch (err) {
        setError(err.message || "Failed to load dashboard data");
        setAllMarks([]);
        setPendingHomework([]);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [rollNo, className, section]);

  useEffect(() => {
    let cancelled = false;

    async function loadNotifications() {
      const ids = parentId ? [parentId] : legacyIds;
      if (!ids || ids.length === 0) return;

      setNotificationsLoading(true);
      setNotificationsError("");

      try {
        const results = await Promise.all(
          ids.map(async (id) => {
            const res = await fetch(`${API_BASE}/notifications/${id}?role=parent`);
            const data = await res.json().catch(() => []);
            if (!res.ok) throw new Error(data?.message || "Failed to load notifications");
            return Array.isArray(data) ? data : [];
          })
        );

        const merged = results.flat();
        merged.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        if (!cancelled) setNotifications(merged);
      } catch (err) {
        if (!cancelled) setNotificationsError(err.message || "Failed to load notifications");
      } finally {
        if (!cancelled) setNotificationsLoading(false);
      }
    }

    loadNotifications();
    return () => {
      cancelled = true;
    };
  }, [parentId, legacyIds]);

  const performanceText = useMemo(() => {
    return formatPercentageFromMarks(allMarks);
  }, [allMarks]);

  const examPerformanceRows = useMemo(() => {
    return EXAM_ORDER.map((examType) => {
      const filtered = (Array.isArray(allMarks) ? allMarks : []).filter(
        (m) => String(m?.examType || "").trim() === examType
      );
      return { examType, percentageText: formatPercentageFromMarks(filtered) };
    });
  }, [allMarks]);

  return (
    <div>
      <section style={styles.banner}>
        <div style={styles.bannerTop}>
          <div>
            <div style={styles.bannerKicker}>Parent Dashboard</div>
            <h2 style={styles.bannerTitle}>Welcome back</h2>
            <div style={styles.bannerSub}>
              Here’s a quick overview of <span style={styles.bannerStrong}>{child?.name || "your child"}</span>.
            </div>
          </div>
          <div style={styles.bannerAccent} aria-hidden="true" />
        </div>

        <div style={styles.summaryGrid}>
          <InfoCard title="Student Name" value={child?.name || "-"} icon="student" />
          <InfoCard
            title="Class & Section"
            value={className && section ? `${className} - ${section}` : "-"}
            icon="class"
          />
          <InfoCard title="Overall Performance" value={performanceText} icon="performance" />
        </div>
      </section>

      {error && <div style={styles.error}>{error}</div>}

      {notificationsError && <div style={styles.error}>{notificationsError}</div>}

      <div style={styles.block}>
        <div style={styles.blockHeader}>
          <h3 style={styles.blockTitle}>Notifications</h3>
          <div style={styles.blockHint}>Latest updates</div>
        </div>
        {notificationsLoading ? (
          <p style={styles.muted}>Loading...</p>
        ) : notifications.length === 0 ? (
          <p style={styles.muted}>No notifications yet.</p>
        ) : (
          <div style={styles.notifGrid}>
            {notifications.slice(0, 8).map((n) => (
              <div key={n._id} style={styles.notifCard}>
                <div style={styles.notifIcon} aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 17h5l-1.4-1.4a2 2 0 0 1-.6-1.4V11a6 6 0 1 0-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5" />
                    <path d="M9 17a3 3 0 0 0 6 0" />
                  </svg>
                </div>
                <div style={styles.notifBody}>
                  <div style={styles.notifMessage}>{n.message}</div>
                  <div style={styles.notifMeta}>
                    {n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={styles.block}>
        <div style={styles.blockHeader}>
          <h3 style={styles.blockTitle}>Recent Marks</h3>
          <div style={styles.blockHint}>Approved results</div>
        </div>
        {loading ? (
          <p style={styles.muted}>Loading...</p>
        ) : (
          <div style={styles.tableCard}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Exam Type</th>
                  <th style={styles.thRight}>Overall %</th>
                </tr>
              </thead>
              <tbody>
                {examPerformanceRows.map((row, idx) => (
                  <tr key={row.examType} style={idx % 2 ? styles.trAlt : null}>
                    <td style={styles.td}>{row.examType}</td>
                    <td style={styles.tdRight}>{row.percentageText}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <ParentPerformanceChart marks={allMarks} />
      </div>

      <div style={styles.block}>
        <div style={styles.blockHeader}>
          <h3 style={styles.blockTitle}>Pending Homework</h3>
          <div style={styles.blockHint}>Due soon</div>
        </div>
        {loading ? (
          <p style={styles.muted}>Loading...</p>
        ) : pendingHomework.length === 0 ? (
          <p style={styles.muted}>No homework assigned currently.</p>
        ) : (
          <div style={styles.hwGrid}>
            {pendingHomework.map((hw) => (
              <div key={hw._id} style={styles.hwCard}>
                <div style={styles.hwTop}>
                  <div style={styles.hwTitle}>{hw.title || "-"}</div>
                  <div style={styles.hwChip}>{hw.subject || "-"}</div>
                </div>
                <div style={styles.hwDesc}>{hw.description || "No description"}</div>
                <div style={styles.hwMeta}>
                  <span style={styles.hwMetaLabel}>Due</span>{" "}
                  {hw.dueDate ? new Date(hw.dueDate).toLocaleDateString() : "-"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoCard({ title, value, icon }) {
  return (
    <div style={styles.card}>
      <div style={styles.cardHead}>
        <div style={styles.cardIcon} aria-hidden="true">
          {icon === "student" ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21a8 8 0 1 0-16 0" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          ) : icon === "class" ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18" />
              <path d="M7 6v14" />
              <path d="M3 10h18" />
              <path d="M5 18h14" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 20V10" />
              <path d="M18 20V4" />
              <path d="M6 20v-6" />
            </svg>
          )}
        </div>
        <div style={styles.cardTitle}>{title}</div>
      </div>
      <div style={styles.cardValue}>{value}</div>
    </div>
  );
}

const styles = {
  banner: {
    background: "linear-gradient(135deg, rgba(102,126,234,0.96) 0%, rgba(118,75,162,0.96) 100%)",
    borderRadius: 18,
    boxShadow: "0 14px 40px rgba(102, 126, 234, 0.25)",
    padding: 18,
    marginBottom: 16,
    color: "white",
    position: "relative",
    overflow: "hidden",
  },
  bannerTop: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
    position: "relative",
    zIndex: 1,
  },
  bannerAccent: {
    width: 160,
    height: 160,
    borderRadius: 999,
    background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.0) 60%)",
    opacity: 0.9,
  },
  bannerKicker: {
    fontSize: 12,
    letterSpacing: "0.14em",
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.85)",
    fontWeight: 700,
    marginBottom: 6,
  },
  bannerTitle: {
    fontSize: 26,
    fontWeight: 800,
    margin: "0 0 6px 0",
    color: "white",
  },
  bannerSub: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    lineHeight: 1.4,
  },
  bannerStrong: { color: "white", fontWeight: 800 },
  summaryGrid: {
    marginTop: 16,
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 12,
    position: "relative",
    zIndex: 1,
  },
  card: {
    background: "rgba(255,255,255,0.14)",
    borderRadius: 16,
    padding: 14,
    border: "1px solid rgba(255,255,255,0.22)",
    backdropFilter: "blur(6px)",
  },
  cardHead: { display: "flex", alignItems: "center", gap: 10, marginBottom: 8 },
  cardIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(255,255,255,0.18)",
    color: "rgba(255,255,255,0.95)",
    flexShrink: 0,
  },
  cardTitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.9)",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  cardValue: {
    fontSize: 20,
    color: "white",
    fontWeight: 800,
  },
  block: {
    background: "white",
    borderRadius: 16,
    padding: 16,
    boxShadow: "0 10px 30px rgba(17, 24, 39, 0.06)",
    marginBottom: 16,
    border: "1px solid rgba(148, 163, 184, 0.18)",
  },
  blockHeader: {
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  blockTitle: {
    fontSize: 18,
    margin: 0,
    color: "#213547",
  },
  blockHint: { color: "#94a3b8", fontSize: 13, fontWeight: 600 },
  tableCard: {
    borderRadius: 14,
    overflow: "hidden",
    border: "1px solid #eef2f7",
    background: "#ffffff",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 14,
  },
  th: {
    textAlign: "left",
    padding: "10px 12px",
    borderBottom: "1px solid #e5e7eb",
    background: "#f8fafc",
    color: "#475569",
    fontWeight: 800,
    fontSize: 12,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
  },
  thRight: {
    textAlign: "right",
    padding: "10px 12px",
    borderBottom: "1px solid #e5e7eb",
    background: "#f8fafc",
    color: "#475569",
    fontWeight: 800,
    fontSize: 12,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
  },
  td: {
    padding: "10px 12px",
    borderBottom: "1px solid #f3f4f6",
    color: "#213547",
  },
  tdRight: {
    padding: "10px 12px",
    borderBottom: "1px solid #f3f4f6",
    color: "#213547",
    textAlign: "right",
    fontWeight: 700,
  },
  trAlt: { background: "#fbfdff" },
  muted: {
    color: "#6b7280",
    fontSize: 14,
  },
  notifGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 12,
  },
  notifCard: {
    border: "1px solid #eef2f7",
    borderRadius: 14,
    padding: 12,
    background: "linear-gradient(180deg, #ffffff 0%, #fbfcff 100%)",
    display: "flex",
    gap: 10,
    boxShadow: "0 6px 16px rgba(17, 24, 39, 0.05)",
  },
  notifIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(102, 126, 234, 0.14)",
    color: "#667eea",
    flexShrink: 0,
    border: "1px solid rgba(102, 126, 234, 0.22)",
  },
  notifBody: { minWidth: 0 },
  notifMessage: {
    color: "#213547",
    fontSize: 14,
    lineHeight: 1.35,
  },
  notifMeta: {
    marginTop: 6,
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: 600,
  },
  hwGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 12,
  },
  hwCard: {
    background: "linear-gradient(180deg, #ffffff 0%, #fbfcff 100%)",
    borderRadius: 16,
    padding: 14,
    border: "1px solid #eef2f7",
    boxShadow: "0 6px 18px rgba(17, 24, 39, 0.05)",
  },
  hwTop: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 10 },
  hwTitle: { color: "#0f172a", fontSize: 16, fontWeight: 800, lineHeight: 1.25 },
  hwChip: {
    padding: "4px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    color: "#667eea",
    background: "rgba(102, 126, 234, 0.12)",
    border: "1px solid rgba(102, 126, 234, 0.18)",
    whiteSpace: "nowrap",
    height: "fit-content",
  },
  hwDesc: { color: "#425266", fontSize: 14, lineHeight: 1.5, marginBottom: 10 },
  hwMeta: { color: "#64748b", fontSize: 13, fontWeight: 700 },
  hwMetaLabel: { color: "#94a3b8", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" },
  error: {
    padding: "10px 12px",
    backgroundColor: "#fef2f2",
    color: "#dc2626",
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 14,
  },
};
