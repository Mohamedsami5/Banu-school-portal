import React, { useState, useEffect } from "react";
import TeachersTable from "../components/TeachersTable";

const API_BASE_URL = "http://localhost:5000/api";

// Subjects for Class 1–10
const SUBJECTS_PRIMARY = ["Tamil", "English", "Maths", "Science", "Social Science", "Computer Science"];
// Subjects for Class 11–12
const SUBJECTS_SENIOR = ["Tamil", "English", "Maths", "Physics", "Chemistry", "Biology", "Computer Science"];

const CLASS_OPTIONS = Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: `Class ${i + 1}` }));

function getSubjectsForClass(selectedClass) {
  if (!selectedClass) return [];
  const num = parseInt(selectedClass, 10);
  if (num >= 1 && num <= 10) return SUBJECTS_PRIMARY;
  if (num === 11 || num === 12) return SUBJECTS_SENIOR;
  return [];
}

export default function ManageTeachers() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    teaching: [{ class: "", section: "A", subject: "" }],
    status: "Active"
  });

  const subjectOptionsForClass = (cls) => getSubjectsForClass(cls);

  // Fetch teachers from API
  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      setError("");
      
      const response = await fetch(`${API_BASE_URL}/teachers`, {
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
      
      // Ensure data is an array
      if (!Array.isArray(data)) {
        throw new Error("Invalid response format from server");
      }
      
      // Convert MongoDB _id to id for compatibility
      // Empty array is a valid successful response
      const formattedData = data.map(teacher => ({
        id: teacher._id,
        name: teacher.name,
        email: teacher.email,
        subject: teacher.subject,
        teaching: teacher.teaching || [],
        status: teacher.status
      }));
      
      // Successfully loaded data (even if empty) - clear any previous errors
      setTeachers(formattedData);
      setError("");
    } catch (err) {
      // Only show error for actual network/server failures
      // Empty arrays are NOT errors - they're handled in the UI
      if (err.name === "TypeError" && (err.message.includes("fetch") || err.message.includes("Failed to fetch"))) {
        setError("Cannot connect to backend server. Please ensure the backend is running on http://localhost:5000");
      } else {
        setError(err.message || "Failed to load teachers");
      }
      console.error("Error fetching teachers:", err);
      setTeachers([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const { teaching, ...rest } = formData;
      const payload = { ...rest };
      if (!selectedTeacher && (!payload.password || !payload.password.trim())) {
        setError("Teacher password is required");
        return;
      }
      const validTeaching = Array.isArray(teaching)
        ? teaching.filter((t) => t && String(t.class).trim() && String(t.subject).trim())
        : [];
      if (!selectedTeacher && validTeaching.length === 0) {
        setError("At least one class/section/subject assignment is required");
        return;
      }
      payload.teaching = validTeaching;
      if (selectedTeacher) delete payload.password;
      const response = await fetch(`${API_BASE_URL}/teachers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add teacher");
      }

      setFormData({ name: "", email: "", password: "", teaching: [{ class: "", section: "A", subject: "" }], status: "Active" });
      setShowForm(false);
      fetchTeachers();
    } catch (err) {
      setError(err.message);
      console.error("Error adding teacher:", err);
    }
  };

  const handleView = (teacher) => {
    setSelectedTeacher(teacher);
    setShowModal(true);
    setShowForm(false);
  };

  const handleEdit = (teacher) => {
    setSelectedTeacher(teacher);
    const teaching = Array.isArray(teacher.teaching) && teacher.teaching.length > 0
      ? teacher.teaching.map((t) => ({ class: t.class || "", section: t.section || "A", subject: t.subject || "" }))
      : [{ class: "", section: "A", subject: "" }];
    setFormData({
      name: teacher.name,
      email: teacher.email,
      password: "",
      teaching,
      status: teacher.status || "Active"
    });
    setShowForm(true);
    setShowModal(false);
  };

  const updateTeaching = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      teaching: prev.teaching.map((t, i) =>
        i === index ? { ...t, [field]: value } : t
      )
    }));
  };
  const addTeachingRow = () => {
    setFormData((prev) => ({
      ...prev,
      teaching: [...prev.teaching, { class: "", section: "A", subject: "" }]
    }));
  };
  const removeTeachingRow = (index) => {
    setFormData((prev) => ({
      ...prev,
      teaching: prev.teaching.filter((_, i) => i !== index)
    }));
  };

  const handleDeleteClick = (teacher) => {
    setSelectedTeacher(teacher);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedTeacher) {
      try {
        // Note: Backend delete API would go here if implemented
        // For now, we'll just remove from state (frontend-only)
        setTeachers(prevTeachers => prevTeachers.filter(t => t.id !== selectedTeacher.id));
        setShowDeleteConfirm(false);
        setSelectedTeacher(null);
      } catch (err) {
        setError(err.message || "Failed to delete teacher");
        console.error("Error deleting teacher:", err);
      }
    }
  };

  const handleCancel = () => {
    setFormData({ name: "", email: "", password: "", teaching: [{ class: "", section: "A", subject: "" }], status: "Active" });
    setShowForm(false);
    setShowModal(false);
    setSelectedTeacher(null);
    setError("");
  };

  return (
    <div>
      <div style={styles.header}>
        <h2 style={styles.title}>Manage Teachers</h2>
        <button
          onClick={() => {
            handleCancel();
            setShowForm(!showForm);
          }}
          style={styles.addButton}
        >
          {showForm ? "Cancel" : "Add Teacher"}
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
            {selectedTeacher ? "Edit Teacher" : "Add New Teacher"}
          </h3>
          <form onSubmit={handleSubmit} style={styles.form}>
            <input
              type="text"
              placeholder="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
            {!selectedTeacher && (
              <input
                type="password"
                placeholder="Password (for teacher login)"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required={!selectedTeacher}
                style={styles.input}
              />
            )}
            <div style={styles.teachingSection}>
              <div style={styles.teachingHeader}>
                <span style={styles.teachingTitle}>Class / Section / Subject assignments</span>
                <button type="button" onClick={addTeachingRow} style={styles.addRowButton}>+ Add assignment</button>
              </div>
              {formData.teaching.map((row, index) => (
                <div key={index} style={styles.teachingRow}>
                  <select
                    value={row.class}
                    onChange={(e) => updateTeaching(index, "class", e.target.value)}
                    required={index === 0 && !selectedTeacher}
                    style={styles.input}
                  >
                    <option value="">Class</option>
                    {CLASS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <select
                    value={row.section}
                    onChange={(e) => updateTeaching(index, "section", e.target.value)}
                    style={styles.input}
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                  </select>
                  <select
                    value={row.subject}
                    onChange={(e) => updateTeaching(index, "subject", e.target.value)}
                    required={index === 0 && !selectedTeacher}
                    style={styles.input}
                    disabled={!row.class}
                  >
                    <option value="">Subject</option>
                    {subjectOptionsForClass(row.class).map((sub) => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                  {formData.teaching.length > 1 && (
                    <button type="button" onClick={() => removeTeachingRow(index)} style={styles.removeRowButton}>Remove</button>
                  )}
                </div>
              ))}
            </div>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              style={styles.input}
            >
              <option value="Active">Active</option>
              <option value="On Leave">On Leave</option>
              <option value="Inactive">Inactive</option>
            </select>
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
                {selectedTeacher ? "Update Teacher" : "Add Teacher"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={styles.tableCard}>
        {loading ? (
          <div style={styles.emptyState}>
            Loading teachers...
          </div>
        ) : teachers.length === 0 ? (
          <div style={styles.emptyState}>
            No teachers found. Add a teacher to get started.
          </div>
        ) : (
          <TeachersTable 
            data={teachers} 
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDeleteClick}
          />
        )}
      </div>

      {/* View Modal */}
      {showModal && selectedTeacher && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Teacher Details</h3>
              <button 
                style={styles.closeButton}
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>
            <div style={styles.modalContent}>
              <div style={styles.detailRow}>
                <strong>Name:</strong>
                <span>{selectedTeacher.name}</span>
              </div>
              <div style={styles.detailRow}>
                <strong>Email:</strong>
                <span>{selectedTeacher.email}</span>
              </div>
              <div style={styles.detailRow}>
                <strong>Subject:</strong>
                <span>{selectedTeacher.subject}</span>
              </div>
              <div style={styles.detailRow}>
                <strong>Status:</strong>
                <span>{selectedTeacher.status}</span>
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button
                style={styles.editButton}
                onClick={() => {
                  setShowModal(false);
                  handleEdit(selectedTeacher);
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
      {showDeleteConfirm && selectedTeacher && (
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
              <p>Are you sure you want to delete <strong>{selectedTeacher.name}</strong>?</p>
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
  teachingSection: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  teachingHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  teachingTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: "#425266",
  },
  addRowButton: {
    padding: "8px 12px",
    fontSize: 13,
    background: "#e0e7ff",
    color: "#4338ca",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontWeight: 600,
  },
  teachingRow: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr auto",
    gap: 12,
    alignItems: "center",
  },
  removeRowButton: {
    padding: "8px 12px",
    fontSize: 13,
    background: "#fef2f2",
    color: "#dc2626",
    border: "1px solid #fecaca",
    borderRadius: 6,
    cursor: "pointer",
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
