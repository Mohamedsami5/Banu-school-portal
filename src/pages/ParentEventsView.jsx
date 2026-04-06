import React, { useEffect, useMemo, useState } from "react";
import { API_BASE, withOrigin } from "../config/api";

export default function ParentEventsView() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function fetchItems() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`${API_BASE}/events`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.message || `Error ${res.status}`);
        }

        const data = await res.json().catch(() => []);
        const arr = Array.isArray(data) ? data : [];

        arr.sort((a, b) => {
          const bTime = new Date(b?.date || b?.createdAt || 0).getTime();
          const aTime = new Date(a?.date || a?.createdAt || 0).getTime();
          return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0);
        });

        if (!cancelled) setItems(arr);
      } catch (err) {
        const msg = err?.message || "Failed to load events";
        if (msg.includes("fetch") || msg.includes("Failed to fetch")) {
          if (!cancelled) setError("Cannot connect to backend. Ensure it is running");
        } else {
          if (!cancelled) setError(msg);
        }
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchItems();
    return () => {
      cancelled = true;
    };
  }, []);

  const formatDate = (d) => {
    if (!d) return "-";
    const date = typeof d === "string" ? new Date(d) : d;
    if (date instanceof Date && !isNaN(date.getTime())) {
      return date.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
    }
    return String(d);
  };

  const cards = useMemo(
    () =>
      (Array.isArray(items) ? items : []).map((item) => ({
        id: item?._id || `${item?.title || "event"}-${item?.date || ""}`,
        title: item?.title || "-",
        description: item?.description || "-",
        date: formatDate(item?.date),
        imageUrl: item?.imagePath ? withOrigin(item.imagePath) : null,
        type: item?.type || "",
      })),
    [items]
  );

  return (
    <div>
      <h2 style={styles.title}>Events & Achievements</h2>
      <p style={styles.subtitle}>Latest school events and achievements (read-only).</p>

      {error && <div style={styles.error}>{error}</div>}

      {loading ? (
        <div style={styles.emptyState}>Loading...</div>
      ) : cards.length === 0 ? (
        <div style={styles.emptyState}>No events or achievements yet.</div>
      ) : (
        <div style={styles.list}>
          {cards.map((c) => (
            <article key={c.id} style={styles.card}>
              <div style={styles.cardContent}>
                {c.imageUrl && (
                  <div style={styles.imgWrap}>
                    <img src={c.imageUrl} alt={c.title} style={styles.img} />
                  </div>
                )}
                <div style={styles.cardBody}>
                  <div style={styles.cardHeader}>
                    {c.type ? (
                      <span
                        style={{
                          ...styles.badge,
                          background: c.type === "Achievement" ? "#43e97b" : "#667eea",
                        }}
                      >
                        {c.type}
                      </span>
                    ) : null}
                    <span style={styles.date}>{c.date}</span>
                  </div>
                  <h3 style={styles.cardTitle}>{c.title}</h3>
                  <p style={styles.cardDesc}>{c.description}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  title: {
    fontSize: 28,
    fontWeight: 700,
    color: "#213547",
    margin: "0 0 8px 0",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    margin: "0 0 20px 0",
  },
  error: {
    padding: "12px 16px",
    backgroundColor: "#fef2f2",
    color: "#dc2626",
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 14,
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  emptyState: {
    background: "white",
    padding: 48,
    borderRadius: 12,
    textAlign: "center",
    color: "#90a4ae",
    boxShadow: "0 4px 16px rgba(102, 126, 234, 0.05)",
  },
  card: {
    background: "white",
    borderRadius: 12,
    boxShadow: "0 4px 16px rgba(102, 126, 234, 0.1)",
    overflow: "hidden",
    borderLeft: "4px solid #667eea",
  },
  cardContent: {
    display: "flex",
    flexDirection: "row",
    minHeight: 0,
  },
  imgWrap: {
    width: 220,
    flexShrink: 0,
    background: "#f5f7fa",
  },
  img: {
    width: "100%",
    height: 190,
    objectFit: "cover",
    display: "block",
  },
  cardBody: {
    flex: 1,
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  badge: {
    padding: "4px 12px",
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 600,
    color: "white",
  },
  date: {
    fontSize: 13,
    color: "#90a4ae",
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 600,
    color: "#213547",
    margin: 0,
  },
  cardDesc: {
    fontSize: 15,
    color: "#425266",
    lineHeight: 1.5,
    margin: 0,
  },
};

