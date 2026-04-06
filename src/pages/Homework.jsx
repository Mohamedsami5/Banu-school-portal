import React, { useState, useEffect } from "react";
import { API_BASE } from "../config/api";

export default function Homework() {
  const [teacher, setTeacher] = useState(null);
  const [loadError, setLoadError] = useState("");

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

  // Modal state
  const [selectedHomework, setSelectedHomework] = useState(null);
  const [showHwModal, setShowHwModal] = useState(false);
  const [modalMode, setModalMode] = useState("view"); // "view" | "edit" | "delete"

  // Edit form state
  const [editForm, setEditForm] = useState({ title: "", description: "", dueDate: "" });
  const [editMessage, setEditMessage] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

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

  const teacherId = teacher?._id || teacher?.id || teacher?.teacherId || teacher?.userId || "";

  // Fetch assignments
  const fetchAssignments = async () => {
    if (!teacherId) return;
    try {
      setLoadError("");
      const res = await fetch(`${API_BASE}/teacher/assignments?teacherId=${encodeURIComponent(teacherId)}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to fetch assignments");
      setAssignments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch assignments", err);
      setLoadError(err.message || "Failed to fetch assignments");
      setAssignments([]);
    }
  };

  // Fetch homework
  const fetchHomework = async () => {
    try {
      setLoadError("");
      const url = teacherId
        ? `${API_BASE}/homework?teacherId=${encodeURIComponent(teacherId)}`
        : `${API_BASE}/homework`;
      const res = await fetch(url);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to fetch homework");
      setHomeworkList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch homework", err);
      setLoadError(err.message || "Failed to fetch homework");
      setHomeworkList([]);
    }
  };

  useEffect(() => {
    if (!teacher) return;
    if (!teacherId) {
      setLoadError("Teacher session is missing an id. Please logout and login again.");
      return;
    }
    setLoadError("");
    fetchAssignments();
    fetchHomework();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teacherId, teacher]);

  // Subject options specifically for the Homework form
  const normalizeLocal = (v) => String(v || "").trim().toLowerCase();
  const inferHomeworkType = (cls) => {
    const raw = String(cls || "").trim();
    const upper = raw.toUpperCase();
    if (upper === "LKG" || upper === "UKG" || upper === "KG") return "Assignment";
    const n = parseInt(raw, 10);
    if (Number.isNaN(n)) return "Homework";
    if (n >= 1 && n <= 6) return "Assignment";
    if (n >= 7 && n <= 9) return "Homework";
    if (n >= 10 && n <= 12) return "Test Submission";
    return "Homework";
  };
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
    if (!teacherId) {
      setHwMessage("Teacher session not found. Please logout and login again.");
      setTimeout(() => setHwMessage(""), 3500);
      return;
    }
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
        type: inferHomeworkType(className),
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

  const openHwModal = (hw) => {
    setSelectedHomework(hw);
    setModalMode("view");
    setEditMessage("");
    setShowHwModal(true);
  };

  const closeHwModal = () => {
    setShowHwModal(false);
    setSelectedHomework(null);
    setModalMode("view");
    setEditMessage("");
  };

  const enterEditMode = () => {
    const dueDateValue = selectedHomework.dueDate
      ? new Date(selectedHomework.dueDate).toISOString().split("T")[0]
      : "";
    setEditForm({
      title: selectedHomework.title || "",
      description: selectedHomework.description || "",
      dueDate: dueDateValue,
    });
    setEditMessage("");
    setModalMode("edit");
  };

  const handleEditHomework = async (e) => {
    e.preventDefault();
    if (!editForm.title || !editForm.description || !editForm.dueDate) {
      setEditMessage("Please fill in all fields.");
      return;
    }
    setEditLoading(true);
    setEditMessage("");
    try {
      const id = selectedHomework._id || selectedHomework.id;
      const res = await fetch(`${API_BASE}/homework/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editForm.title,
          description: editForm.description,
          dueDate: editForm.dueDate,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setEditMessage(data.message || "Failed to update homework.");
        return;
      }
      await fetchHomework();
      setSelectedHomework((prev) => ({ ...prev, ...editForm }));
      setModalMode("view");
      setEditMessage("");
    } catch (err) {
      setEditMessage(err.message || "Failed to update homework.");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteHomework = async () => {
    setDeleteLoading(true);
    try {
      const id = selectedHomework._id || selectedHomework.id;
      const res = await fetch(`${API_BASE}/homework/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setEditMessage(data.message || "Failed to delete homework.");
        setModalMode("view");
        return;
      }
      await fetchHomework();
      closeHwModal();
    } catch (err) {
      setEditMessage(err.message || "Failed to delete homework.");
      setModalMode("view");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div>
      <h2 style={styles.pageTitle}>Homework</h2>
      {loadError && (
        <div style={styles.errorBanner}>
          {loadError}
        </div>
      )}
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
                        <th style={styles.th}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {homeworkList.map((hw) => (
                        <tr
                          key={hw._id || hw.id}
                          style={styles.trHover}
                          onClick={() => openHwModal(hw)}
                        >
                          <td style={styles.td}>{hw.title}</td>
                          <td style={styles.td}>{hw.className}</td>
                          <td style={styles.td}>{hw.section}</td>
                          <td style={styles.td}>{hw.subject}</td>
                          <td style={styles.td}>{hw.dueDate ? new Date(hw.dueDate).toLocaleDateString() : "-"}</td>
                          <td style={styles.td}>
                            {new Date(hw.createdAt || hw.postedAt || Date.now()).toLocaleString()}
                          </td>
                          <td style={styles.td} onClick={(e) => e.stopPropagation()}>
                            <button
                              style={styles.viewButton}
                              onClick={() => openHwModal(hw)}
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
      </section>

      {/* Homework Modal */}
      {showHwModal && selectedHomework && (
        <div style={styles.modalOverlay} onClick={closeHwModal}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>

            {/* ── VIEW MODE ── */}
            {modalMode === "view" && (
              <>
                <div style={styles.modalHeader}>
                  <h3 style={styles.modalTitle}>Homework Details</h3>
                  <button style={styles.closeButton} onClick={closeHwModal}>×</button>
                </div>
                <div style={styles.modalContent}>
                  <div style={styles.detailRow}>
                    <strong>Title</strong>
                    <span>{selectedHomework.title}</span>
                  </div>
                  <div style={styles.detailRow}>
                    <strong>Class</strong>
                    <span>{selectedHomework.className}</span>
                  </div>
                  <div style={styles.detailRow}>
                    <strong>Section</strong>
                    <span>{selectedHomework.section}</span>
                  </div>
                  <div style={styles.detailRow}>
                    <strong>Subject</strong>
                    <span>{selectedHomework.subject}</span>
                  </div>
                  <div style={styles.detailRow}>
                    <strong>Due Date</strong>
                    <span>{selectedHomework.dueDate ? new Date(selectedHomework.dueDate).toLocaleDateString() : "-"}</span>
                  </div>
                  <div style={styles.detailRow}>
                    <strong>Posted</strong>
                    <span>{new Date(selectedHomework.createdAt || selectedHomework.postedAt || Date.now()).toLocaleString()}</span>
                  </div>
                  <div style={styles.descriptionBlock}>
                    <strong style={styles.descriptionLabel}>Description</strong>
                    <p style={styles.descriptionText}>{selectedHomework.description || "No description provided."}</p>
                  </div>
                  {editMessage && <p style={styles.errorText}>{editMessage}</p>}
                </div>
                <div style={styles.modalFooter}>
                  <button style={styles.deleteButton} onClick={() => setModalMode("delete")}>Delete</button>
                  <button style={styles.editButton} onClick={enterEditMode}>Edit</button>
                  <button style={styles.closeModalButton} onClick={closeHwModal}>Close</button>
                </div>
              </>
            )}

            {/* ── EDIT MODE ── */}
            {modalMode === "edit" && (
              <>
                <div style={styles.modalHeader}>
                  <h3 style={styles.modalTitle}>Edit Homework</h3>
                  <button style={styles.closeButton} onClick={closeHwModal}>×</button>
                </div>
                <form onSubmit={handleEditHomework}>
                  <div style={styles.modalContent}>
                    <div style={styles.editField}>
                      <label style={styles.editLabel}>Title</label>
                      <input
                        style={styles.editInput}
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        placeholder="Homework title"
                        required
                      />
                    </div>
                    <div style={styles.editField}>
                      <label style={styles.editLabel}>Due Date</label>
                      <input
                        type="date"
                        style={styles.editInput}
                        value={editForm.dueDate}
                        onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                        required
                      />
                    </div>
                    <div style={styles.editField}>
                      <label style={styles.editLabel}>Description</label>
                      <textarea
                        style={styles.editTextarea}
                        rows={5}
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        placeholder="Homework description"
                        required
                      />
                    </div>
                    {editMessage && <p style={styles.errorText}>{editMessage}</p>}
                  </div>
                  <div style={styles.modalFooter}>
                    <button
                      type="button"
                      style={styles.closeModalButton}
                      onClick={() => { setModalMode("view"); setEditMessage(""); }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      style={{ ...styles.editButton, opacity: editLoading ? 0.7 : 1 }}
                      disabled={editLoading}
                    >
                      {editLoading ? "Saving…" : "Save Changes"}
                    </button>
                  </div>
                </form>
              </>
            )}

            {/* ── DELETE CONFIRM MODE ── */}
            {modalMode === "delete" && (
              <>
                <div style={styles.modalHeader}>
                  <h3 style={styles.modalTitle}>Confirm Delete</h3>
                  <button style={styles.closeButton} onClick={closeHwModal}>×</button>
                </div>
                <div style={styles.modalContent}>
                  <p style={styles.confirmText}>
                    Are you sure you want to delete the homework{" "}
                    <strong>"{selectedHomework.title}"</strong>?
                    <br />
                    This action cannot be undone.
                  </p>
                  {editMessage && <p style={styles.errorText}>{editMessage}</p>}
                </div>
                <div style={styles.modalFooter}>
                  <button
                    style={styles.closeModalButton}
                    onClick={() => { setModalMode("view"); setEditMessage(""); }}
                  >
                    Cancel
                  </button>
                  <button
                    style={{ ...styles.deleteButton, opacity: deleteLoading ? 0.7 : 1 }}
                    onClick={handleDeleteHomework}
                    disabled={deleteLoading}
                  >
                    {deleteLoading ? "Deleting…" : "Yes, Delete"}
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}
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
  errorBanner: {
    padding: "12px 16px",
    backgroundColor: "#fef2f2",
    color: "#dc2626",
    borderRadius: 10,
    marginBottom: 16,
    fontSize: 14,
    border: "1px solid #fecaca",
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
  trHover: {
    cursor: "pointer",
    transition: "background 0.15s ease",
  },
  viewButton: {
    padding: "6px 14px",
    borderRadius: 6,
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "#fff",
    border: "none",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 500,
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    background: "white",
    borderRadius: 12,
    padding: 0,
    maxWidth: 520,
    width: "90%",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 24px",
    borderBottom: "1px solid #e0e4e8",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 600,
    color: "#213547",
    margin: 0,
  },
  closeButton: {
    background: "none",
    border: "none",
    fontSize: 28,
    color: "#718096",
    cursor: "pointer",
    padding: 0,
    width: 32,
    height: 32,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 4,
  },
  modalContent: {
    padding: "24px",
  },
  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px 0",
    borderBottom: "1px solid #f3f4f6",
    fontSize: 14,
    color: "#213547",
  },
  descriptionBlock: {
    marginTop: 16,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  descriptionLabel: {
    fontSize: 14,
    color: "#213547",
  },
  descriptionText: {
    margin: 0,
    fontSize: 14,
    color: "#425266",
    lineHeight: 1.7,
    whiteSpace: "pre-wrap",
    background: "#f8f9ff",
    border: "1px solid #e0e4e8",
    borderRadius: 8,
    padding: "12px 14px",
  },
  modalFooter: {
    display: "flex",
    justifyContent: "flex-end",
    padding: "16px 24px",
    borderTop: "1px solid #e0e4e8",
  },
  editButton: {
    padding: "10px 20px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
  },
  deleteButton: {
    padding: "10px 20px",
    background: "#ef5350",
    color: "white",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
  },
  closeModalButton: {
    padding: "10px 20px",
    background: "#f3f4f6",
    color: "#374151",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
  },
  editField: {
    display: "flex",
    flexDirection: "column",
    marginBottom: 16,
  },
  editLabel: {
    fontSize: 13,
    fontWeight: 600,
    color: "#425266",
    marginBottom: 6,
  },
  editInput: {
    padding: "9px 12px",
    borderRadius: 8,
    border: "1px solid #e0e4e8",
    fontSize: 14,
    color: "#213547",
    fontFamily: "inherit",
  },
  editTextarea: {
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #e0e4e8",
    fontSize: 14,
    color: "#213547",
    fontFamily: "inherit",
    lineHeight: 1.6,
    resize: "vertical",
  },
  confirmText: {
    fontSize: 15,
    color: "#374151",
    lineHeight: 1.7,
    margin: 0,
  },
  errorText: {
    marginTop: 10,
    fontSize: 13,
    color: "#ef5350",
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
