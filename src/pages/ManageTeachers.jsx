import React, { useState, useEffect } from "react";
import TeachersTable from "../components/TeachersTable";

const API_BASE_URL = "http://localhost:5000/api";

// Subjects for primary and senior classes
const SUBJECTS_PRIMARY = ["Tamil", "English", "Maths", "Science", "Social Science", "Computer Science"];
const SUBJECTS_SENIOR = ["Tamil", "English", "Maths", "Physics", "Chemistry", "Biology", "Computer Science"];

// Class dropdown options (LKG, UKG, 1–12)
const CLASS_OPTIONS = [
  { value: "LKG", label: "LKG" },
  { value: "UKG", label: "UKG" },
  ...Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: `Class ${i + 1}` }))
];

function getSubjectsForClass(selectedClass) {
  if (!selectedClass) return [];
  if (selectedClass === "LKG" || selectedClass === "UKG") return SUBJECTS_PRIMARY;
  const num = parseInt(selectedClass, 10);
  if (!isNaN(num) && num >= 1 && num <= 10) return SUBJECTS_PRIMARY;
  if (num === 11 || num === 12) return SUBJECTS_SENIOR;
  return [];
}

export default function ManageTeachers() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [mode, setMode] = useState("add"); // "add" | "edit"
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [credentialPassword, setCredentialPassword] = useState("");
  const [credentialEmail, setCredentialEmail] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [editTeacherId, setEditTeacherId] = useState("");

  // Initial empty teacher form state (used for add mode)
  const INITIAL_TEACHER_FORM = {
    name: "",
    email: "",
    password: "",
    teaching: [{ className: "", section: "A", subject: "" }],
    status: "Active",
    dateOfJoining: ""
  };

  const [formData, setFormData] = useState(INITIAL_TEACHER_FORM);

  const subjectOptionsForClass = (cls) => getSubjectsForClass(cls); // cls is className value (LKG, UKG, 1..12)

  const clearMessages = () => {
    setError("");
    setSuccessMessage("");
  };
  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const resetForm = () => {
    // Clear form state for Add Teacher (do not change `mode` here)
    setFormData(INITIAL_TEACHER_FORM);
    setSelectedTeacher(null);
    setEditTeacherId("");
    setCredentialPassword("");
    setCredentialEmail("");
    setCredentialConfirm("");
    setShowPasswordModal(false);
    setShowEmailModal(false);
    clearMessages();
  };

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
        _id: teacher._id,
        name: teacher.name,
        email: teacher.email,
        subject: teacher.subject,
        teaching: teacher.teaching || [],
        status: teacher.status,
        dateOfJoining: teacher.dateOfJoining
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
    clearMessages();
    try {
      const validTeaching = (formData.teaching || [])
        .filter((t) => t && String(t.className).trim() && String(t.subject).trim())
        .map((t) => ({ className: t.className, section: t.section || "A", subject: t.subject }));

      if (mode === "edit" && editTeacherId) {
      // Format dateOfJoining for API (convert empty string to null)
      const dateOfJoiningValue = formData.dateOfJoining && formData.dateOfJoining.trim() 
        ? formData.dateOfJoining.trim() 
        : null;

      const response = await fetch(`${API_BASE_URL}/admin/teachers/${editTeacherId}/classes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          teaching: validTeaching, 
          status: formData.status,
          dateOfJoining: dateOfJoiningValue
        })
      });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.message || "Failed to update teacher");
        }
        showSuccess("Teacher updated successfully.");
        setShowForm(false);
        setEditTeacherId("");
        setSelectedTeacher(null);
        fetchTeachers();
        return;
      }

      if (!formData.password || !formData.password.trim()) {
        setError("Teacher password is required");
        return;
      }
      if (validTeaching.length === 0) {
        setError("At least one Assign Class & Subjects row is required");
        return;
      }

      // Format dateOfJoining for API (convert empty string to null)
      const dateOfJoiningValue = formData.dateOfJoining && formData.dateOfJoining.trim() 
        ? formData.dateOfJoining.trim() 
        : null;

      const response = await fetch(`${API_BASE_URL}/admin/teachers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
          teaching: validTeaching,
          status: formData.status,
          dateOfJoining: dateOfJoiningValue
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to add teacher");
      }

      showSuccess("Teacher added successfully.");
      resetForm();
      setShowForm(false);
      fetchTeachers();
    } catch (err) {
      setError(err.message);
      console.error(err);
    }
  };

  const handleView = (teacher) => {
    setSelectedTeacher(teacher);
    setShowModal(true);
    setShowForm(false);
  };

  const openAddMode = () => {
    resetForm();
    setMode("add");
    setShowForm(true);
  };

  const openEditMode = () => {
    resetForm();
    setMode("edit");
    setShowForm(true);
  };

  const [credentialConfirm, setCredentialConfirm] = useState("");

  const handleEditSelectTeacher = (teacherId) => {
    const teacher = teachers.find((t) => t.id === teacherId);
    if (!teacher) return;
    setEditTeacherId(teacherId);
    setSelectedTeacher(teacher);
    const teaching = Array.isArray(teacher.teaching) && teacher.teaching.length > 0
      ? teacher.teaching.map((t) => ({ className: t.className || t.class || "", section: t.section || "A", subject: t.subject || "" }))
      : [{ className: "", section: "A", subject: "" }];
    // Format dateOfJoining for input (YYYY-MM-DD)
    const formatDateForInput = (date) => {
      if (!date) return "";
      const d = new Date(date);
      if (isNaN(d.getTime())) return "";
      return d.toISOString().split("T")[0];
    };

    setFormData({
      name: teacher.name,
      email: teacher.email,
      password: "",
      teaching,
      status: teacher.status || "Active",
      dateOfJoining: formatDateForInput(teacher.dateOfJoining)
    });
  };

  const handleEdit = (teacher) => {
    resetForm();
    setMode("edit");
    setShowForm(true);
    if (teacher?.id) handleEditSelectTeacher(teacher.id);
  };

  const handleChangePassword = async () => {
    if (!editTeacherId || !credentialPassword.trim()) {
      setError("Enter a new password");
      return;
    }
    if (credentialConfirm !== "CONFIRM") {
      setError("Admin confirmation is required (type CONFIRM)");
      return;
    }
    clearMessages();
    try {
      const res = await fetch(`${API_BASE_URL}/admin/teachers/${editTeacherId}/credentials`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: credentialPassword.trim() })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to update password");
      showSuccess("Password updated successfully.");
      setShowPasswordModal(false);
      setCredentialPassword("");
      setCredentialConfirm("");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleChangeEmail = async () => {
    if (!editTeacherId || !credentialEmail.trim()) {
      setError("Enter a new email");
      return;
    }
    if (credentialConfirm !== "CONFIRM") {
      setError("Admin confirmation is required (type CONFIRM)");
      return;
    }
    clearMessages();
    try {
      const res = await fetch(`${API_BASE_URL}/admin/teachers/${editTeacherId}/credentials`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: credentialEmail.trim() })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to update email");
      showSuccess("Email updated successfully.");
      setShowEmailModal(false);
      setCredentialEmail("");
      setCredentialConfirm("");
      fetchTeachers();
      const updated = { ...selectedTeacher, email: credentialEmail.trim() };
      setSelectedTeacher(updated);
      setFormData((prev) => ({ ...prev, email: updated.email }));
    } catch (err) {
      setError(err.message);
    }
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
      teaching: [...prev.teaching, { className: "", section: "A", subject: "" }]
    }));
  };
  const removeTeachingRow = (index) => {
    setFormData((prev) => ({
      ...prev,
      teaching: prev.teaching.filter((_, i) => i !== index)
    }));
  };

  const handleDeleteClick = (teacher) => {
    console.log("Delete clicked for teacher:", teacher._id || teacher.id, teacher.name);
    setSelectedTeacher(teacher);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedTeacher) return;
    const idToDelete = selectedTeacher._id || selectedTeacher.id;
    console.log("Deleting teacher id:", idToDelete);
    try {
      const res = await fetch(`${API_BASE_URL}/teachers/${idToDelete}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json().catch(() => ({}));
      console.log("Delete response:", res.status, data);
      if (!res.ok) {
        throw new Error(data.message || `Failed to delete teacher (${res.status})`);
      }
      showSuccess("Teacher deleted successfully.");
      setShowDeleteConfirm(false);
      setSelectedTeacher(null);
      // Refresh the list from server
      fetchTeachers();
    } catch (err) {
      setError(err.message || "Failed to delete teacher");
      console.error("Error deleting teacher:", err);
    }
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
    setShowModal(false);
    setError("");
  };

  return (
    <div>
      <div style={styles.header}>
        <h2 style={styles.title}>Manage Teachers</h2>
        <button
          onClick={() => {
            if (showForm) handleCancel(); else openAddMode();
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
            {mode === "edit" ? (!selectedTeacher ? "Edit Teacher — Select a teacher to edit" : "Edit Teacher") : "Add New Teacher"}
          </h3>
          <form onSubmit={handleSubmit} style={styles.form} autoComplete="off" noValidate>
            {/* Hidden dummy fields to deter browser autofill */}
            <input type="text" name="fake-username" autoComplete="username" style={{ display: "none" }} />
            <input type="password" name="fake-password" autoComplete="new-password" style={{ display: "none" }} />
            {mode === "edit" && !selectedTeacher ? (
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <select
                  value={editTeacherId}
                  onChange={(e) => setEditTeacherId(e.target.value)}
                  style={styles.input}
                >
                  <option value="">Select a teacher</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.name} — {t.email}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => { if (editTeacherId) handleEditSelectTeacher(editTeacherId); }}
                  style={styles.submitButton}
                >
                  Select
                </button>
              </div>
            ) : null}

            <input
              type="text"
              name="teacher-name"
              autoComplete="off"
              placeholder="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              disabled={mode === "edit"}
              style={styles.input}
            />
            <input
              type="email"
              name="teacher-email"
              autoComplete="off"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              disabled={mode === "edit"}
              style={styles.input}
            />
            {mode === "add" && (
              <input
                type="password"
                name="teacher-password"
                autoComplete="new-password"
                placeholder="Password (for teacher login)"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required={mode === "add"}
                style={styles.input}
              />
            )}

            {successMessage && (
              <div style={styles.success}>
                {successMessage}
              </div>
            )} 
            <div style={styles.teachingSection}>
              <div style={styles.teachingHeader}>
                <span style={styles.teachingTitle}>Assign Class & Subjects</span>
                <button type="button" onClick={addTeachingRow} style={styles.addRowButton}>+ Add class/subject</button>
              </div> 
              {formData.teaching.map((row, index) => (
                <div key={index} style={styles.teachingRow}>
                  <select
                    value={row.className}
                    onChange={(e) => updateTeaching(index, "className", e.target.value)}
                    required={index === 0 && mode === "add"}
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
                    required={index === 0 && mode === "add"}
                    style={styles.input}
                    disabled={!row.className}
                  >
                    <option value="">Subject</option>
                    {subjectOptionsForClass(row.className).map((sub) => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                  {formData.teaching.length > 1 && (
                    <button type="button" onClick={() => removeTeachingRow(index)} style={styles.removeRowButton}>Remove</button>
                  )}
                </div>
              ))}
            </div>
            {selectedTeacher && (
              <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: 12 }}>
                <h4 style={{ margin: "8px 0 6px 0", fontSize: 15, color: "#213547" }}>Admin Actions</h4>
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="button" onClick={() => setShowPasswordModal(true)} style={styles.adminButton}>Change Teacher Password</button>
                  <button type="button" onClick={() => setShowEmailModal(true)} style={styles.adminButton}>Change Teacher Email</button>
                </div>
              </div>
            )}

            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              style={styles.input}
            >
              <option value="Active">Active</option>
              <option value="On Leave">On Leave</option>
              <option value="Inactive">Inactive</option>
            </select>

            <div style={styles.formGroupFull}>
              <label style={styles.label}>Date of Joining</label>
              <input
                type="date"
                value={formData.dateOfJoining}
                onChange={(e) => setFormData({ ...formData, dateOfJoining: e.target.value })}
                style={styles.input}
                placeholder="Select date of joining"
              />
              <small style={styles.helpText}>Date when the teacher joined the school (Admin only)</small>
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
                {mode === "edit" ? "Update Teacher" : "Add Teacher"}
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
                <strong>Status:</strong>
                <span>{selectedTeacher.status}</span>
              </div>
              <div style={styles.detailRow}>
                <strong>Date of Joining:</strong>
                <span>
                  {selectedTeacher.dateOfJoining 
                    ? new Date(selectedTeacher.dateOfJoining).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
                    : "Not set"}
                </span>
              </div>
              <div style={styles.detailRow}>
                <strong>Teaching Assignments:</strong>
                <div style={styles.teachingAssignmentsList}>
                  {Array.isArray(selectedTeacher.teaching) && selectedTeacher.teaching.length > 0 ? (
                    <ul style={styles.assignmentList}>
                      {selectedTeacher.teaching.map((assignment, idx) => (
                        <li key={idx} style={styles.assignmentListItem}>
                          <span style={styles.assignmentBadge}>
                            {assignment.className} {assignment.section}
                          </span>
                          <span>{assignment.subject}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span style={styles.noAssignmentMessage}>No teaching assignments</span>
                  )}
                </div>
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

      {/* Admin change password modal */}
      {showPasswordModal && (
        <div style={styles.modalOverlay} onClick={() => setShowPasswordModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Change Teacher Password (Admin)</h3>
              <button style={styles.closeButton} onClick={() => setShowPasswordModal(false)}>×</button>
            </div>
            <div style={styles.modalContent}>
              <p>Enter new password and type <strong>CONFIRM</strong> to authorize this admin action.</p>
              <input type="password" placeholder="New password" value={credentialPassword} onChange={(e) => setCredentialPassword(e.target.value)} style={styles.input} />
              <input type="text" placeholder="Type CONFIRM to authorize" value={credentialConfirm} onChange={(e) => setCredentialConfirm(e.target.value)} style={styles.input} />
            </div>
            <div style={styles.modalFooter}>
              <button style={styles.cancelModalButton} onClick={() => setShowPasswordModal(false)}>Cancel</button>
              <button style={styles.editButton} onClick={handleChangePassword}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Admin change email modal */}
      {showEmailModal && (
        <div style={styles.modalOverlay} onClick={() => setShowEmailModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Change Teacher Email (Admin)</h3>
              <button style={styles.closeButton} onClick={() => setShowEmailModal(false)}>×</button>
            </div>
            <div style={styles.modalContent}>
              <p>Enter new email and type <strong>CONFIRM</strong> to authorize this admin action.</p>
              <input type="email" placeholder="New email" value={credentialEmail} onChange={(e) => setCredentialEmail(e.target.value)} style={styles.input} />
              <input type="text" placeholder="Type CONFIRM to authorize" value={credentialConfirm} onChange={(e) => setCredentialConfirm(e.target.value)} style={styles.input} />
            </div>
            <div style={styles.modalFooter}>
              <button style={styles.cancelModalButton} onClick={() => setShowEmailModal(false)}>Cancel</button>
              <button style={styles.editButton} onClick={handleChangeEmail}>Confirm</button>
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
  adminButton: {
    padding: "8px 12px",
    background: "#f3f4f6",
    color: "#111827",
    border: "1px solid #e5e7eb",
    borderRadius: 6,
    cursor: "pointer",
    fontWeight: 600,
  },
  success: {
    padding: "12px 16px",
    backgroundColor: "#ecfdf5",
    color: "#065f46",
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 14,
  },
  teachingAssignmentsList: {
    marginTop: 12,
    paddingLeft: 16,
  },
  assignmentList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
  },
  assignmentListItem: {
    display: "flex",
    gap: 12,
    alignItems: "center",
    padding: "8px 0",
    fontSize: 13,
  },
  assignmentBadge: {
    display: "inline-block",
    padding: "4px 10px",
    borderRadius: 4,
    backgroundColor: "#e3f2fd",
    color: "#1976d2",
    fontWeight: 600,
    fontSize: 12,
    whiteSpace: "nowrap",
  },
  noAssignmentMessage: {
    color: "#999",
    fontStyle: "italic",
    fontSize: 13,
  },
  helpText: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
    fontStyle: "italic",
  },
};
