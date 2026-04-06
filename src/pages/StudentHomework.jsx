import React, { useState, useEffect } from "react";
import { API_BASE } from "../config/api";

export default function StudentHomework({ user }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [answerText, setAnswerText] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submission, setSubmission] = useState(null);
  const [submissionLoading, setSubmissionLoading] = useState(false);
  const [submissionError, setSubmissionError] = useState("");

  const className = user?.className ?? "";
  const section = user?.section ?? "";

  useEffect(() => {
    if (!className || !section) {
      setLoading(false);
      setError("Your profile is missing class or section.");
      return;
    }
    fetchHomework();
  }, [className, section]);

  async function fetchHomework() {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams({ className, section });
      const res = await fetch(`${API_BASE}/homework?${params}`);
      const data = await res.json().catch(() => []);
      setList(Array.isArray(data) ? data : []);
    } catch (err) {
      if (err.message?.includes("fetch") || err.message?.includes("Failed to fetch")) {
        setError("Cannot connect to server. Ensure the backend is running");
      } else {
        setError(err.message || "Failed to load homework");
      }
      setList([]);
    } finally {
      setLoading(false);
    }
  }

  const openDetails = (hw) => {
    setSelected(hw);
    setAnswerText("");
    setPhotoFile(null);
    setSubmitMessage("");
    setSubmission(null);
    setSubmissionError("");
    if (hw?._id) fetchSubmission(hw._id);
  };

  const closeDetails = () => {
    setSelected(null);
    setAnswerText("");
    setPhotoFile(null);
    setSubmitMessage("");
    setSubmission(null);
    setSubmissionError("");
  };

  const getStudentId = () => user?._id || user?.id || user?.userId || "";

  const fetchSubmission = async (homeworkId) => {
    const studentId = getStudentId();
    if (!homeworkId || !studentId) return;
    try {
      setSubmissionLoading(true);
      setSubmissionError("");
      const params = new URLSearchParams({ homeworkId, studentId });
      const res = await fetch(`${API_BASE}/homework/submission?${params}`);
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "Failed to load submission");
      setSubmission(data || null);
    } catch (err) {
      setSubmissionError(err.message || "Failed to load submission");
      setSubmission(null);
    } finally {
      setSubmissionLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selected) return;

    if (submission) {
      setSubmitMessage("You already submitted this homework.");
      return;
    }

    if (!answerText.trim() && !photoFile) {
      setSubmitMessage("Please enter an answer or upload a photo.");
      return;
    }

    setSubmitting(true);
    setSubmitMessage("");
    try {
      const form = new FormData();
      form.append("homeworkId", selected._id);
      form.append("studentId", getStudentId());
      form.append("rollNo", String(user?.rollNo || "").trim());
      form.append("studentName", user?.name || user?.studentName || "Student");
      form.append("answerText", answerText.trim());
      if (photoFile) form.append("photo", photoFile);

      const res = await fetch(`${API_BASE}/homework/submit`, {
        method: "POST",
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "Failed to submit homework");
      }
      setSubmitMessage("Homework submitted successfully. Status: Pending");
      if (data?.data) {
        setSubmission(data.data);
      } else {
        fetchSubmission(selected._id);
      }
      setAnswerText("");
      setPhotoFile(null);
    } catch (err) {
      setSubmitMessage(err.message || "Failed to submit homework");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (d) => {
    if (!d) return "â€”";
    const date = typeof d === "string" ? new Date(d) : d;
    return isNaN(date.getTime()) ? d : date.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
  };

  if (loading) {
    return (
      <div style={styles.emptyState}>
        <p>Loading homework...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h2 style={styles.title}>Homework</h2>
        <div style={styles.error}>{error}</div>
      </div>
    );
  }

  if (selected) {
    return (
      <div>
        <button type="button" style={styles.backBtn} onClick={closeDetails}>
          ? Back to Homework
        </button>

        <h2 style={styles.title}>Homework Details</h2>
        <p style={styles.subtitle}>
          Class {className}-{section}
        </p>

        <div style={styles.detailCard}>
          <div style={styles.detailHeader}>
            <h3 style={styles.detailTitle}>{selected.title || "Untitled"}</h3>
            <span style={styles.subject}>{selected.subject || "—"}</span>
          </div>
          <p style={styles.detailMeta}>Due: {formatDate(selected.dueDate)}</p>
          <p style={styles.detailDesc}>{selected.description || "No description provided."}</p>
        </div>

        <div style={styles.submissionCard}>
          <h3 style={styles.sectionTitle}>Your Submission</h3>
          {submissionLoading ? (
            <p style={styles.submissionMeta}>Loading submission...</p>
          ) : submissionError ? (
            <div style={styles.error}>{submissionError}</div>
          ) : submission ? (
            <div style={styles.submissionBody}>
              <div style={styles.submissionRow}>
                <span style={styles.submissionLabel}>Status</span>
                <span style={statusBadgeStyle(submission.status || "Pending")}>
                  {submission.status || "Pending"}
                </span>
              </div>
              <div style={styles.submissionRow}>
                <span style={styles.submissionLabel}>Submitted</span>
                <span style={styles.submissionValue}>
                  {submission.submittedAt
                    ? new Date(submission.submittedAt).toLocaleString()
                    : "—"}
                </span>
              </div>
              <div style={styles.submissionRow}>
                <span style={styles.submissionLabel}>Answer</span>
                <span style={styles.submissionValue}>{submission.answerText || "—"}</span>
              </div>
              <div style={styles.submissionRow}>
                <span style={styles.submissionLabel}>Photo</span>
                <span style={styles.submissionValue}>
                  {submission.photo ? "Uploaded" : "—"}
                </span>
              </div>
            </div>
          ) : (
            <p style={styles.submissionMeta}>No submission yet.</p>
          )}
        </div>

        <div style={styles.submitCard}>
          <h3 style={styles.sectionTitle}>Submit Homework</h3>
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Answer Text</label>
              <textarea
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                rows={5}
                style={styles.textarea}
                placeholder="Write your answer here..."
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Upload Photo (optional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                style={styles.fileInput}
              />
            </div>

            {submitMessage && <div style={styles.message}>{submitMessage}</div>}

            <button type="submit" style={styles.submitBtn} disabled={submitting || !!submission}>
              {submission ? "Already Submitted" : (submitting ? "Submitting..." : "Submit Homework")}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 style={styles.title}>Homework</h2>
      <p style={styles.subtitle}>
        Assignments for Class {className}-{section}
      </p>
      {list.length === 0 ? (
        <div style={styles.emptyState}>
          <p>No homework assigned yet.</p>
        </div>
      ) : (
        <div style={styles.list}>
          {list.map((hw) => (
            <div key={hw._id} style={styles.card} onClick={() => openDetails(hw)}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>{hw.title || "Untitled"}</h3>
                <span style={styles.subject}>{hw.subject || "â€”"}</span>
              </div>
              {hw.description && <p style={styles.desc}>{hw.description}</p>}
              <div style={styles.meta}>
                <span>Due: {formatDate(hw.dueDate)}</span>
              </div>
            </div>
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
  emptyState: {
    background: "white",
    padding: 48,
    borderRadius: 12,
    textAlign: "center",
    color: "#90a4ae",
    boxShadow: "0 4px 16px rgba(102, 126, 234, 0.05)",
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  card: {
    background: "white",
    padding: 20,
    borderRadius: 12,
    boxShadow: "0 4px 16px rgba(102, 126, 234, 0.1)",
    borderLeft: "4px solid #43e97b",
    cursor: "pointer",
    transition: "transform 0.15s ease, box-shadow 0.15s ease",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 600,
    color: "#213547",
    margin: 0,
  },
  subject: {
    fontSize: 13,
    color: "#667eea",
    fontWeight: 500,
  },
  desc: {
    fontSize: 15,
    color: "#425266",
    lineHeight: 1.5,
    margin: "0 0 12px 0",
  },
  meta: {
    fontSize: 13,
    color: "#90a4ae",
  },
  backBtn: {
    background: "transparent",
    border: "none",
    color: "#4f46e5",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 12,
  },
  detailCard: {
    background: "white",
    padding: 20,
    borderRadius: 12,
    boxShadow: "0 4px 16px rgba(102, 126, 234, 0.08)",
    border: "1px solid #e8eaf0",
    marginBottom: 20,
  },
  detailHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 8,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: "#213547",
    margin: 0,
  },
  detailMeta: {
    fontSize: 13,
    color: "#6b7280",
    marginBottom: 8,
  },
  detailDesc: {
    fontSize: 15,
    color: "#425266",
    lineHeight: 1.6,
    margin: 0,
  },
  submitCard: {
    background: "white",
    padding: 20,
    borderRadius: 12,
    boxShadow: "0 4px 16px rgba(102, 126, 234, 0.08)",
    border: "1px solid #e8eaf0",
  },
  submissionCard: {
    background: "white",
    padding: 20,
    borderRadius: 12,
    boxShadow: "0 4px 16px rgba(102, 126, 234, 0.08)",
    border: "1px solid #e8eaf0",
    marginBottom: 20,
  },
  submissionBody: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  submissionRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },
  submissionLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: "#425266",
  },
  submissionValue: {
    fontSize: 13,
    color: "#475569",
  },
  submissionMeta: {
    fontSize: 13,
    color: "#6b7280",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: "#213547",
    marginTop: 0,
    marginBottom: 12,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: "#425266",
    marginBottom: 6,
  },
  textarea: {
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #e0e4e8",
    fontSize: 14,
    fontFamily: "inherit",
    resize: "vertical",
  },
  fileInput: {
    padding: 8,
    borderRadius: 8,
    border: "1px solid #e0e4e8",
    background: "#fff",
    fontSize: 14,
  },
  submitBtn: {
    alignSelf: "flex-start",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    padding: "10px 16px",
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
    fontWeight: 700,
  },
  message: {
    color: "#0f766e",
    background: "#ecfdf5",
    border: "1px solid #a7f3d0",
    borderRadius: 8,
    padding: "8px 10px",
    fontSize: 13,
  },
};

function statusBadgeStyle(status) {
  const base = {
    display: "inline-block",
    padding: "4px 12px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.3px",
  };
  if (status === "Approved")
    return { ...base, background: "#dcfce7", color: "#15803d", border: "1px solid #bbf7d0" };
  if (status === "Rejected")
    return { ...base, background: "#fee2e2", color: "#b91c1c", border: "1px solid #fecaca" };
  return { ...base, background: "#fef9c3", color: "#854d0e", border: "1px solid #fde68a" };
}

