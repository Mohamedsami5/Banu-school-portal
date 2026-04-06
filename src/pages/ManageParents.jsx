import React, { useState, useEffect } from "react";
import ParentsTable from "../components/ParentsTable";
import { API_BASE } from "../config/api";

export default function ManageParents() {
  const [parents, setParents] = useState([]);
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedParent, setSelectedParent] = useState(null);

  const [formData, setFormData] = useState({
    parentName: "",
    email: "",
    password: "",
    studentIds: [],
    studentId: "",
    studentName: "",
    className: "",
    section: ""
  });
  const [error, setError] = useState("");

  // Fetch parents from API on load
  useEffect(() => {
    fetchParents();
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setStudentsLoading(true);
      const response = await fetch(`${API_BASE}/students`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }

      const data = await response.json();
      setStudents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching students:", err);
      setStudents([]);
    } finally {
      setStudentsLoading(false);
    }
  };

  const fetchParents = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_BASE}/parents`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("Invalid response format from server");
      }

      const formattedData = data.map((p) => ({
        id: p._id,
        parentName: p.parentName || p.name,
        email: p.email,
        studentIds: p.studentIds || (p.studentId ? [p.studentId] : []),
        studentId: p.studentId,
        studentName: p.studentName,
        className: p.className,
        section: p.section || "A"
      }));

      setParents(formattedData);
      setError("");
    } catch (err) {
      if (err.name === "TypeError" && (err.message.includes("fetch") || err.message.includes("Failed to fetch"))) {
        setError("Cannot connect to backend server. Please ensure the backend is running");
      } else {
        setError(err.message || "Failed to load parents");
      }
      console.error("Error fetching parents:", err);
      setParents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.parentName.trim() || !formData.email.trim() || !Array.isArray(formData.studentIds) || formData.studentIds.length === 0) {
      setError("Please fill in all required fields");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (!selectedParent && !formData.password.trim()) {
      setError("Password is required");
      return;
    }

    if (selectedParent) {
      // Edit: update local state only (no PUT API)
      setParents((prev) =>
        prev.map((p) =>
          p.id === selectedParent.id ? { ...formData, id: selectedParent.id } : p
        )
      );
      setFormData({ parentName: "", email: "", password: "", studentIds: [], studentId: "", studentName: "", className: "", section: "" });
      setShowForm(false);
      setShowModal(false);
      setSelectedParent(null);
      setError("");
      return;
    }

    try {
      const payload = { ...formData };
      const response = await fetch(`${API_BASE}/parents`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to add parent");
      }

      const saved = await response.json();
      setParents((prev) => [
        ...prev,
        {
          id: saved._id,
          parentName: saved.parentName || saved.name,
          email: saved.email,
          studentIds: saved.studentIds || (saved.studentId ? [saved.studentId] : []),
          studentId: saved.studentId,
          studentName: saved.studentName,
          className: saved.className,
          section: saved.section || "A"
        }
      ]);
      setFormData({ parentName: "", email: "", password: "", studentIds: [], studentId: "", studentName: "", className: "", section: "" });
      setShowForm(false);
      setShowModal(false);
      setSelectedParent(null);
      setError("");
    } catch (err) {
      setError(err.message || "Failed to add parent");
      console.error("Error adding parent:", err);
    }
  };

  const handleView = (parent) => {
    setSelectedParent(parent);
    setFormData({
      parentName: parent.parentName || parent.name,
      email: parent.email,
      password: "",
      studentIds: parent.studentIds || (parent.studentId ? [parent.studentId] : []),
      studentId: parent.studentId || "",
      studentName: parent.studentName,
      className: parent.className,
      section: parent.section || "A"
    });
    setShowModal(true);
    setShowForm(false);
  };

  const handleEdit = (parent) => {
    setSelectedParent(parent);
    setFormData({
      parentName: parent.parentName || parent.name,
      email: parent.email,
      password: "",
      studentIds: parent.studentIds || (parent.studentId ? [parent.studentId] : []),
      studentId: parent.studentId || "",
      studentName: parent.studentName,
      className: parent.className,
      section: parent.section || "A"
    });
    setShowForm(true);
    setShowModal(false);
  };

  const handleDeleteClick = (parent) => {
    setSelectedParent(parent);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedParent) return;
    try {
      const response = await fetch(`${API_BASE}/parents/${selectedParent.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to delete parent");
      }

      setParents((prev) => prev.filter((p) => p.id !== selectedParent.id));
      setShowDeleteConfirm(false);
      setSelectedParent(null);
      setError("");
    } catch (err) {
      setError(err.message || "Failed to delete parent");
      console.error("Error deleting parent:", err);
    }
  };

  const handleCancel = () => {
    setFormData({ parentName: "", email: "", password: "", studentIds: [], studentId: "", studentName: "", className: "", section: "" });
    setShowForm(false);
    setShowModal(false);
    setSelectedParent(null);
    setError("");
  };

  const handleStudentsSelect = (selectedIds) => {
    const ids = Array.isArray(selectedIds) ? selectedIds.filter(Boolean) : [];
    const primaryId = ids[0] || "";
    const primary = students.find((s) => String(s._id) === String(primaryId));

    setFormData((prev) => ({
      ...prev,
      studentIds: ids,
      // Legacy fields: keep a primary child for older consumers
      studentId: primary?._id || primaryId || "",
      studentName: primary?.name || "",
      className: primary?.className || "",
      section: primary?.section || ""
    }));
  };

  return (
    <div>
      <div style={styles.header}>
        <h2 style={styles.title}>Manage Parents</h2>
        <button
          onClick={() => {
            handleCancel();
            setShowForm(!showForm);
          }}
          style={styles.addButton}
        >
          {showForm ? "Cancel" : "Add Parent"}
        </button>
      </div>

      {error && (
        <div style={styles.error}>
          {error}
        </div>
      )}

      {showForm && (
        <div style={styles.formCard}>
          <h3 style={styles.formTitle}>
            {selectedParent ? "Edit Parent" : "Add New Parent"}
          </h3>
          <form onSubmit={handleSubmit} style={styles.form}>
            <input
              type="text"
              placeholder="Parent Name"
              value={formData.parentName}
              onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
              required
              style={styles.input}
            />
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              style={styles.input}
            />
            <input
              type="password"
              placeholder={selectedParent ? "Password (leave blank to keep unchanged)" : "Password"}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required={!selectedParent}
              style={styles.input}
            />
            <select
              multiple
              size={5}
              value={formData.studentIds}
              onChange={(e) => handleStudentsSelect(Array.from(e.target.selectedOptions).map((o) => o.value))}
              style={styles.input}
              required
              disabled={studentsLoading}
            >
              <option value="" disabled>
                {studentsLoading ? "Loading students..." : "Select Students (Ctrl/⌘+Click)"}
              </option>
              {students.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} {s.rollNo ? `(${s.rollNo})` : ""}{s.className ? ` - ${s.className}${s.section ? `-${s.section}` : ""}` : ""}
                </option>
              ))}
            </select>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <input
                type="text"
                placeholder="Class"
                value={formData.className}
                readOnly
                style={{ ...styles.input, backgroundColor: "#f8fafc" }}
              />
              <input
                type="text"
                placeholder="Section"
                value={formData.section}
                readOnly
                style={{ ...styles.input, backgroundColor: "#f8fafc" }}
              />
            </div>
            <div style={styles.buttonGroup}>
              <button
                type="button"
                onClick={handleCancel}
                style={styles.cancelButton}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={styles.submitButton}
              >
                {selectedParent ? "Update Parent" : "Add Parent"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={styles.tableCard}>
        {loading ? (
          <div style={styles.emptyState}>
            Loading parents...
          </div>
        ) : parents.length === 0 ? (
          <div style={styles.emptyState}>
            No parents found. Add a parent to get started.
          </div>
        ) : (
          <ParentsTable 
            data={parents} 
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDeleteClick}
          />
        )}
      </div>

      {/* View Modal */}
      {showModal && selectedParent && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Parent Details</h3>
              <button 
                style={styles.closeButton}
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>
            <div style={styles.modalContent}>
              <div style={styles.detailRow}>
                <strong>Parent Name:</strong>
                <span>{selectedParent.parentName || selectedParent.name}</span>
              </div>
              <div style={styles.detailRow}>
                <strong>Email:</strong>
                <span>{selectedParent.email}</span>
              </div>
              <div style={styles.detailRow}>
                <strong>Student Name:</strong>
                <span>{selectedParent.studentName}</span>
              </div>
              <div style={styles.detailRow}>
                <strong>Class:</strong>
                <span>{selectedParent.className}</span>
              </div>
              <div style={styles.detailRow}>
                <strong>Section:</strong>
                <span>{selectedParent.section || "A"}</span>
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button
                style={styles.editButton}
                onClick={() => {
                  setShowModal(false);
                  handleEdit(selectedParent);
                }}
              >
                Edit
              </button>
              <button
                style={styles.closeModalButton}
                onClick={() => setShowModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedParent && (
        <div style={styles.modalOverlay} onClick={() => setShowDeleteConfirm(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Confirm Delete</h3>
              <button 
                style={styles.closeButton}
                onClick={() => setShowDeleteConfirm(false)}
              >
                ×
              </button>
            </div>
            <div style={styles.modalContent}>
              <p>Are you sure you want to delete <strong>{selectedParent.parentName || selectedParent.name}</strong>?</p>
              <p style={styles.warningText}>This action cannot be undone.</p>
            </div>
            <div style={styles.modalFooter}>
              <button
                style={styles.deleteButton}
                onClick={handleDeleteConfirm}
              >
                Delete
              </button>
              <button
                style={styles.cancelModalButton}
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    color: "#213547",
    margin: 0,
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  addButton: {
    padding: "12px 24px",
    backgroundColor: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 15,
    boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)",
    transition: "all 0.2s ease",
  },
  error: {
    padding: "12px 16px",
    backgroundColor: "#fef2f2",
    color: "#dc2626",
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 14,
  },
  formCard: {
    background: "white",
    padding: 24,
    borderRadius: 12,
    marginBottom: 24,
    boxShadow: "0 4px 16px rgba(102, 126, 234, 0.1)",
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 600,
    color: "#213547",
    marginTop: 0,
    marginBottom: 20,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  input: {
    padding: "12px 16px",
    fontSize: 14,
    border: "1px solid #e0e4e8",
    borderRadius: 8,
    transition: "all 0.2s ease",
  },
  buttonGroup: {
    display: "flex",
    gap: 12,
    justifyContent: "flex-end",
    marginTop: 8,
  },
  submitButton: {
    padding: "12px 24px",
    background: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    color: "white",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 15,
    boxShadow: "0 4px 12px rgba(67, 233, 123, 0.3)",
    transition: "all 0.2s ease",
  },
  cancelButton: {
    padding: "12px 24px",
    background: "#f3f4f6",
    color: "#374151",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 15,
    transition: "all 0.2s ease",
  },
  tableCard: {
    background: "white",
    padding: 24,
    borderRadius: 12,
    boxShadow: "0 4px 16px rgba(102, 126, 234, 0.1)",
  },
  emptyState: {
    textAlign: "center",
    padding: "40px 20px",
    color: "#718096",
    fontSize: 15,
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
    maxWidth: 500,
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
    transition: "all 0.2s ease",
  },
  modalContent: {
    padding: "24px",
  },
  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "12px 0",
    borderBottom: "1px solid #f3f4f6",
  },
  warningText: {
    color: "#dc2626",
    fontSize: 14,
    marginTop: 8,
  },
  modalFooter: {
    display: "flex",
    gap: 12,
    justifyContent: "flex-end",
    padding: "20px 24px",
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
  cancelModalButton: {
    padding: "10px 20px",
    background: "#f3f4f6",
    color: "#374151",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
  },
};

