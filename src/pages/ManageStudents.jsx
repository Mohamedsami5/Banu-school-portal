import React, { useState, useEffect } from "react";
import StudentsTable from "../components/StudentsTable";

const API_BASE_URL = "http://localhost:5000/api";

export default function ManageStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    className: "",
    parentName: "",
    parentEmail: ""
  });

  // Fetch students from API
  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError("");
      
      const response = await fetch(`${API_BASE_URL}/students`, {
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
      
      // Successfully loaded data (even if empty) - clear any previous errors
      setStudents(data);
      setError("");
    } catch (err) {
      // Only show error for actual network/server failures
      // Empty arrays are NOT errors - they're handled in the UI
      if (err.name === "TypeError" && (err.message.includes("fetch") || err.message.includes("Failed to fetch"))) {
        setError("Cannot connect to backend server. Please ensure the backend is running on http://localhost:5000");
      } else {
        setError(err.message || "Failed to load students");
      }
      console.error("Error fetching students:", err);
      setStudents([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/students`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add student");
      }

      // Reset form and refresh list
      setFormData({ name: "", email: "", className: "", parentName: "", parentEmail: "" });
      setShowForm(false);
      fetchStudents();
    } catch (err) {
      setError(err.message);
      console.error("Error adding student:", err);
    }
  };

  const handleView = (student) => {
    setSelectedStudent(student);
    setShowModal(true);
    setShowForm(false);
  };

  const handleEdit = (student) => {
    setSelectedStudent(student);
    setFormData({
      name: student.name,
      email: student.email,
      className: student.className,
      parentName: student.parentName || "",
      parentEmail: student.parentEmail || ""
    });
    setShowForm(true);
    setShowModal(false);
  };

  const handleDeleteClick = (student) => {
    setSelectedStudent(student);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedStudent) {
      try {
        // Note: Backend delete API would go here if implemented
        // For now, we'll just remove from state (frontend-only)
        setStudents(prevStudents => prevStudents.filter(s => (s._id || s.id) !== (selectedStudent._id || selectedStudent.id)));
        setShowDeleteConfirm(false);
        setSelectedStudent(null);
      } catch (err) {
        setError(err.message || "Failed to delete student");
        console.error("Error deleting student:", err);
      }
    }
  };

  const handleCancel = () => {
    setFormData({ name: "", email: "", className: "", parentName: "", parentEmail: "" });
    setShowForm(false);
    setShowModal(false);
    setSelectedStudent(null);
    setError("");
  };

  return (
    <div>
      <div style={styles.header}>
        <h2 style={styles.title}>Manage Students</h2>
        <button
          onClick={() => {
            handleCancel();
            setShowForm(!showForm);
          }}
          style={styles.addButton}
        >
          {showForm ? "Cancel" : "Add Student"}
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
            {selectedStudent ? "Edit Student" : "Add New Student"}
          </h3>
          <form onSubmit={handleSubmit} style={styles.form}>
            <input
              type="text"
              placeholder="Student Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              style={styles.input}
            />
            <input
              type="email"
              placeholder="Student Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              style={styles.input}
            />
            <input
              type="text"
              placeholder="Class (e.g., 5-A)"
              value={formData.className}
              onChange={(e) => setFormData({ ...formData, className: e.target.value })}
              required
              style={styles.input}
            />
            <input
              type="text"
              placeholder="Parent Name (optional)"
              value={formData.parentName}
              onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
              style={styles.input}
            />
            <input
              type="email"
              placeholder="Parent Email (optional)"
              value={formData.parentEmail}
              onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
              style={styles.input}
            />
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
                {selectedStudent ? "Update Student" : "Add Student"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={styles.tableCard}>
        {loading ? (
          <div style={styles.emptyState}>
            Loading students...
          </div>
        ) : students.length === 0 ? (
          <div style={styles.emptyState}>
            No students found. Add a student to get started.
          </div>
        ) : (
          <StudentsTable 
            data={students} 
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDeleteClick}
          />
        )}
      </div>

      {/* View Modal */}
      {showModal && selectedStudent && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Student Details</h3>
              <button 
                style={styles.closeButton}
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>
            <div style={styles.modalContent}>
              <div style={styles.detailRow}>
                <strong>Student Name:</strong>
                <span>{selectedStudent.name}</span>
              </div>
              <div style={styles.detailRow}>
                <strong>Email:</strong>
                <span>{selectedStudent.email}</span>
              </div>
              <div style={styles.detailRow}>
                <strong>Class:</strong>
                <span>{selectedStudent.className}</span>
              </div>
              <div style={styles.detailRow}>
                <strong>Parent Name:</strong>
                <span>{selectedStudent.parentName || "-"}</span>
              </div>
              <div style={styles.detailRow}>
                <strong>Parent Email:</strong>
                <span>{selectedStudent.parentEmail || "-"}</span>
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button
                style={styles.editButton}
                onClick={() => {
                  setShowModal(false);
                  handleEdit(selectedStudent);
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
      {showDeleteConfirm && selectedStudent && (
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
              <p>Are you sure you want to delete <strong>{selectedStudent.name}</strong>?</p>
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
