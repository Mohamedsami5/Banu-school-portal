import React, { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";

const API_BASE = "http://localhost:5000/api";

const emptyForm = {
  // Admin-controlled fields (read-only) - not in form, displayed separately
  // name, email, teaching, dateOfJoining
  
  // Teacher-editable fields
  phone: "",
  qualification: "",
  experience: "",
  address: "",
  bio: "",
  photo: "",
  fatherName: "",
  motherName: "",
  dateOfBirth: "",
  languagesKnown: "",
};

export default function TeacherProfile() {
  const [teacher, setTeacher] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadTeacherProfile();
  }, []);

  async function loadTeacherProfile() {
    try {
      setLoading(true);
      setError("");
      const stored = localStorage.getItem("user");
      if (!stored) {
        setError("Teacher session not found. Please login again.");
        setLoading(false);
        return;
      }

      const user = JSON.parse(stored);
      const teacherId = user?._id || user?.id;
      
      if (!teacherId) {
        setError("Teacher ID not found. Please login again.");
        setLoading(false);
        return;
      }

      // Use GET /api/teacher/profile/:teacherId endpoint
      const res = await fetch(`${API_BASE}/teacher/profile/${teacherId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 404) {
          throw new Error("Teacher profile not found");
        } else if (res.status === 503) {
          throw new Error("Database connection unavailable. Please check if backend is running.");
        } else {
          throw new Error(data.message || `Unable to load profile (${res.status})`);
        }
      }

      const data = await res.json();
      const normalizedTeaching = Array.isArray(data?.teaching)
        ? data.teaching
        : (Array.isArray(data?.subjectsHandled) ? data.subjectsHandled : []);
      const normalizedTeacher = { ...data, teaching: normalizedTeaching };
      setTeacher(normalizedTeacher);
      
      // Format dateOfBirth for input (YYYY-MM-DD)
      const formatDateForInput = (date) => {
        if (!date) return "";
        const d = new Date(date);
        if (isNaN(d.getTime())) return "";
        return d.toISOString().split("T")[0];
      };
      
      // Format languagesKnown array to comma-separated string
      const formatLanguages = (langs) => {
        if (Array.isArray(langs)) return langs.join(", ");
        if (typeof langs === "string") return langs;
        return "";
      };
      
      setForm({
        phone: data?.phoneNumber || data?.phone || "",
        qualification: data?.qualification || "",
        experience: data?.experience || "",
        address: data?.address || "",
        bio: data?.bio || "",
        photo: data?.profilePhoto || data?.photo || "",
        fatherName: data?.fatherName || "",
        motherName: data?.motherName || "",
        dateOfBirth: formatDateForInput(data?.dateOfBirth),
        languagesKnown: formatLanguages(data?.languagesKnown),
      });
    } catch (err) {
      console.error("Failed to load teacher profile:", err);
      // Handle network errors gracefully
      if (err.name === "TypeError" && (err.message.includes("fetch") || err.message.includes("Failed to fetch"))) {
        setError("Cannot connect to backend server. Please ensure the backend is running on http://localhost:5000");
      } else {
        setError(err.message || "Failed to load profile");
      }
    } finally {
      setLoading(false);
    }
  }

  const initials = useMemo(() => {
    const src = teacher?.name || "Teacher";
    return src
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase() || "")
      .join("");
  }, [teacher?.name]);

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    const dob = new Date(dateOfBirth);
    if (isNaN(dob.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  };

  const age = useMemo(() => {
    return calculateAge(form.dateOfBirth || teacher?.dateOfBirth);
  }, [form.dateOfBirth, teacher?.dateOfBirth]);

  // Format appointment date for display
  const formatDate = (date) => {
    if (!date) return "Not set";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "Not set";
    return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  };

  // Convert image URL to Base64 (handles both data URLs and external URLs)
  async function imageUrlToBase64(url) {
    try {
      if (!url || url.trim() === "") return null;
      
      // If already base64 data URL, return as is
      if (url.startsWith("data:image")) {
        return url;
      }
      
      // For localhost or same-origin URLs, fetch directly
      // For external URLs, we'll try to fetch with CORS handling
      try {
        const response = await fetch(url, {
          mode: 'cors',
          credentials: 'omit'
        });
        
        if (!response.ok) {
          console.warn("Failed to fetch image:", response.status);
          return null;
        }
        
        const blob = await response.blob();
        
        // Check if blob is an image
        if (!blob.type.startsWith('image/')) {
          console.warn("URL does not point to an image");
          return null;
        }
        
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = () => {
            console.error("FileReader error");
            reject(new Error("Failed to read image"));
          };
          reader.readAsDataURL(blob);
        });
      } catch (fetchError) {
        // If fetch fails (CORS or network error), try creating an image element
        console.warn("Fetch failed, trying alternative method:", fetchError);
        return new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            try {
              const canvas = document.createElement('canvas');
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0);
              const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
              resolve(dataUrl);
            } catch (canvasError) {
              console.error("Canvas conversion failed:", canvasError);
              resolve(null);
            }
          };
          img.onerror = () => {
            console.error("Image load failed");
            resolve(null);
          };
          img.src = url;
        });
      }
    } catch (error) {
      console.error("Error converting image to base64:", error);
      return null;
    }
  }

  // Generate and download profile PDF
  async function downloadProfilePDF() {
    if (!teacher) {
      setError("Profile data not available. Please wait for profile to load.");
      return;
    }

    try {
      setMessage("Generating PDF...");
      
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const photoSize = 50; // Size of profile photo
      // Content on LEFT, photo on RIGHT
      const contentStartX = margin;
      const photoX = pageWidth - margin - photoSize; // Top-right position
      const photoY = margin + 10;

      // Convert profile photo URL to Base64 for PDF
      const profilePhotoUrl = teacher.profilePhoto || teacher.photo || form.photo || "";
      let photoBase64 = null;
      
      if (profilePhotoUrl) {
        try {
          photoBase64 = await imageUrlToBase64(profilePhotoUrl);
          if (photoBase64) {
            // Determine image format from base64 string
            let imgFormat = "JPEG";
            if (photoBase64.startsWith("data:image/png")) {
              imgFormat = "PNG";
            } else if (photoBase64.startsWith("data:image/jpeg") || photoBase64.startsWith("data:image/jpg")) {
              imgFormat = "JPEG";
            }
            
            // Extract base64 data (remove data:image/...;base64, prefix)
            const base64Data = photoBase64.split(',')[1] || photoBase64;
            
            // Add image to PDF at top-right position
            doc.addImage(base64Data, imgFormat, photoX, photoY, photoSize, photoSize);
          } else {
            console.warn("Photo conversion failed, PDF will be generated without photo");
          }
        } catch (err) {
          console.error("Error adding photo to PDF:", err);
        }
      }

      // Content starts on the left
      let contentY = margin;

      // Helper function to add a line with label and value
      const addLine = (label, value, isBold = false, xOffset = 0) => {
        if (contentY > 270) { // Start new page if near bottom
          doc.addPage();
          contentY = margin;
        }
        const labelText = `${label}:`;
        const valueText = value || "Not provided";
        
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(labelText, contentStartX + xOffset, contentY);
        
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        if (isBold) {
          doc.setFont(undefined, "bold");
        }
        doc.text(valueText, contentStartX + xOffset + 60, contentY);
        doc.setFont(undefined, "normal");
        
        contentY += 8;
      };

      // Title (centered at top)
      const titleY = margin;
      doc.setFontSize(18);
      doc.setTextColor(102, 126, 234);
      doc.setFont(undefined, "bold");
      doc.text("Faculty Profile", pageWidth / 2, titleY, { align: "center" });
      contentY = titleY + 15;

      // Personal Information Section
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, "bold");
      doc.text("Personal Information", contentStartX, contentY);
      contentY += 10;
      doc.setDrawColor(200, 200, 200);
      doc.line(contentStartX, contentY, pageWidth - margin, contentY);
      contentY += 8;

      addLine("Full Name", teacher.name || "Not set", true);
      addLine("Email ID", teacher.email || "Not set");
      addLine("Date of Joining", formatDate(teacher.dateOfJoining));

      // Subjects Handled
      if (Array.isArray(teacher.teaching) && teacher.teaching.length > 0) {
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text("Subjects Handled:", contentStartX, contentY);
        contentY += 8;
        
        teacher.teaching.forEach((assignment, idx) => {
          const subjectText = `${assignment.className} ${assignment.section} - ${assignment.subject}`;
          doc.setFontSize(10);
          doc.setTextColor(0, 0, 0);
          doc.text(`  • ${subjectText}`, contentStartX + 5, contentY);
          contentY += 7;
        });
      } else {
        addLine("Subjects Handled", "No assignments");
      }

      contentY += 5;

      // Additional Information Section
      doc.setFontSize(14);
      doc.setFont(undefined, "bold");
      doc.text("Additional Information", contentStartX, contentY);
      contentY += 10;
      doc.line(contentStartX, contentY, pageWidth - margin, contentY);
      contentY += 8;

      addLine("Father Name", form.fatherName || teacher.fatherName || "Not provided");
      addLine("Mother Name", form.motherName || teacher.motherName || "Not provided");
      
      // Date of Birth and Age
      const dobText = form.dateOfBirth || teacher.dateOfBirth 
        ? formatDate(form.dateOfBirth || teacher.dateOfBirth)
        : "Not provided";
      const ageText = age !== null ? `${age} years` : "N/A";
      addLine("Date of Birth", dobText);
      addLine("Age", ageText);
      
      addLine("Phone Number", form.phone || teacher.phone || "Not provided");
      
      // Languages Known
      const languagesText = form.languagesKnown || (Array.isArray(teacher.languagesKnown) && teacher.languagesKnown.length > 0 
        ? teacher.languagesKnown.join(", ")
        : "Not provided");
      addLine("Languages Known", languagesText);
      
      addLine("Qualification", form.qualification || teacher.qualification || "Not provided");
      addLine("Experience", form.experience || teacher.experience || "Not provided");
      addLine("Address", form.address || teacher.address || "Not provided");

      // Bio (if available)
      if (form.bio || teacher.bio) {
        contentY += 5;
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text("Bio:", contentStartX, contentY);
        contentY += 8;
        
        const bioText = form.bio || teacher.bio || "";
        const splitBio = doc.splitTextToSize(bioText, pageWidth - contentStartX - margin);
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text(splitBio, contentStartX + 5, contentY);
        contentY += splitBio.length * 5;
      }

      // Footer
      const totalPages = doc.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Generated on ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: "center" }
        );
      }

      // Generate filename: Teacher_Profile.pdf
      const filename = "Teacher_Profile.pdf";

      // Save PDF
      doc.save(filename);
      setMessage("Profile PDF downloaded successfully!");
    } catch (err) {
      console.error("Error generating PDF:", err);
      setError("Failed to generate PDF. Please try again.");
    }
  }

  function onChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function onPhotoSelected(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxMb = 2;
    if (file.size > maxMb * 1024 * 1024) {
      setError(`Image size must be less than ${maxMb}MB`);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({ ...prev, photo: reader.result || "" }));
      setError("");
    };
    reader.onerror = () => setError("Could not read selected image");
    reader.readAsDataURL(file);
  }

  async function onSave(e) {
    e.preventDefault();
    const teacherId = teacher?._id || teacher?.id;
    if (!teacherId) {
      setError("Teacher id not found. Please login again.");
      return;
    }

    // Validate phone number (optional but if provided, should be valid)
    if (form.phone && form.phone.trim()) {
      const phoneRegex = /^[\d\s\-\+\(\)]+$/;
      if (!phoneRegex.test(form.phone.trim())) {
        setError("Invalid phone number format");
        return;
      }
    }

    // Validate date of birth
    if (form.dateOfBirth) {
      const dob = new Date(form.dateOfBirth);
      if (isNaN(dob.getTime())) {
        setError("Invalid date of birth");
        return;
      }
      if (dob > new Date()) {
        setError("Date of birth cannot be in the future");
        return;
      }
    }

    // Validate experience (should be a number or contain "years")
    if (form.experience && form.experience.trim()) {
      const exp = form.experience.trim();
      if (isNaN(parseFloat(exp)) && !exp.toLowerCase().includes("year")) {
        setError("Experience should be a number or contain 'years'");
        return;
      }
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      // Prepare payload for POST /api/teacher/profile endpoint
      // This endpoint sets profileCompleted = true automatically
      const payload = {
        teacherId: teacherId,
        phoneNumber: form.phone,
        qualification: form.qualification,
        experience: form.experience,
        address: form.address,
        fatherName: form.fatherName,
        motherName: form.motherName,
        dateOfBirth: form.dateOfBirth || null,
        languagesKnown: form.languagesKnown ? form.languagesKnown.split(",").map(l => l.trim()).filter(l => l) : [],
        profilePhoto: form.photo || "", // Store profile photo URL
      };

      // Use POST /api/teacher/profile endpoint (sets profileCompleted = true)
      const res = await fetch(`${API_BASE}/teacher/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 400) {
          throw new Error(data.message || "Invalid data provided");
        } else if (res.status === 404) {
          throw new Error("Teacher profile not found");
        } else if (res.status === 503) {
          throw new Error("Database connection unavailable. Please check if backend is running.");
        } else {
          throw new Error(data.message || `Failed to save profile (${res.status})`);
        }
      }

      // Update teacher state and localStorage with profileCompleted status
      const normalizedUser = { ...data, role: data?.role || "teacher", profileCompleted: true };
      setTeacher(normalizedUser);
      localStorage.setItem("user", JSON.stringify(normalizedUser));
      setMessage("Profile saved successfully! Profile completion status updated.");
      
      // Reload profile to get updated data including profileCompleted status
      await loadTeacherProfile();
    } catch (err) {
      console.error("Failed to save profile:", err);
      // Handle network errors gracefully
      if (err.name === "TypeError" && (err.message.includes("fetch") || err.message.includes("Failed to fetch"))) {
        setError("Cannot connect to backend server. Please ensure the backend is running on http://localhost:5000");
      } else {
        setError(err.message || "Failed to save profile");
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div style={styles.loading}>Loading profile...</div>;

  return (
    <div>
      <h2 style={styles.pageTitle}>My Profile</h2>
      
      {/* Personal Information (Read-Only) */}
      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>Personal Information</h3>
        <div style={styles.readOnlyGrid}>
          <div style={styles.readOnlyItem}>
            <label style={styles.readOnlyLabel}>Full Name</label>
            <div style={styles.readOnlyValue}>{teacher?.name || "Not set"}</div>
          </div>
          <div style={styles.readOnlyItem}>
            <label style={styles.readOnlyLabel}>Email ID</label>
            <div style={styles.readOnlyValue}>{teacher?.email || "Not set"}</div>
          </div>
          <div style={styles.readOnlyItem}>
            <label style={styles.readOnlyLabel}>Date of Joining</label>
            <div style={styles.readOnlyValue}>{formatDate(teacher?.dateOfJoining)}</div>
          </div>
          <div style={styles.readOnlyItemFull}>
            <label style={styles.readOnlyLabel}>Subjects Handled</label>
            <div style={styles.teachingList}>
              {Array.isArray(teacher?.teaching) && teacher.teaching.length > 0 ? (
                <ul style={styles.assignmentList}>
                  {teacher.teaching.map((assignment, idx) => (
                    <li key={idx} style={styles.assignmentItem}>
                      <span style={styles.assignmentBadge}>
                        {assignment.className} {assignment.section}
                      </span>
                      <span>{assignment.subject}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <span style={styles.noAssignment}>No teaching assignments</span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Teacher-Editable Additional Information */}
      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>Additional Information (Editable)</h3>
        <form onSubmit={onSave} style={styles.profileLayout}>
          {/* Form Content - Left side */}
          <div style={styles.contentContainer}>
            <div style={styles.formColumn}>
            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Father Name</label>
                <input name="fatherName" value={form.fatherName} onChange={onChange} style={styles.input} placeholder="Enter father's name" />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Mother Name</label>
                <input name="motherName" value={form.motherName} onChange={onChange} style={styles.input} placeholder="Enter mother's name" />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Date of Birth</label>
                <input 
                  type="date" 
                  name="dateOfBirth" 
                  value={form.dateOfBirth} 
                  onChange={onChange} 
                  style={styles.input} 
                  max={new Date().toISOString().split("T")[0]}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Age</label>
                <input 
                  type="text" 
                  value={age !== null ? `${age} years` : "Enter date of birth"} 
                  style={{...styles.input, ...styles.readOnlyInput}} 
                  readOnly 
                  disabled
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Phone Number</label>
                <input 
                  name="phone" 
                  value={form.phone} 
                  onChange={onChange} 
                  style={styles.input} 
                  placeholder="Enter phone number"
                  pattern="[\d\s\-\+\(\)]+"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Languages Known</label>
                <input 
                  name="languagesKnown" 
                  value={form.languagesKnown} 
                  onChange={onChange} 
                  style={styles.input} 
                  placeholder="e.g., English, Tamil, Hindi (comma separated)"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Qualification</label>
                <input name="qualification" value={form.qualification} onChange={onChange} style={styles.input} placeholder="B.Ed, M.Sc..." />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Experience</label>
                <input name="experience" value={form.experience} onChange={onChange} style={styles.input} placeholder="e.g., 8 years" />
              </div>

              <div style={styles.formGroupFull}>
                <label style={styles.label}>Address</label>
                <input name="address" value={form.address} onChange={onChange} style={styles.input} placeholder="Enter address" />
              </div>

              <div style={styles.formGroupFull}>
                <label style={styles.label}>Bio / Additional Information</label>
                <textarea
                  name="bio"
                  value={form.bio}
                  onChange={onChange}
                  rows={4}
                  style={styles.textarea}
                  placeholder="Write a short profile summary..."
                />
              </div>
            </div>

            {message ? <div style={styles.success}>{message}</div> : null}
            {error ? <div style={styles.error}>{error}</div> : null}

            <div style={styles.actions}>
              <button 
                type="button" 
                onClick={downloadProfilePDF}
                style={styles.pdfButton}
                disabled={loading || !teacher}
              >
                📄 Download Profile PDF
              </button>
              <button type="submit" style={styles.primaryButton} disabled={saving}>
                {saving ? "Saving..." : "Save Profile"}
              </button>
            </div>
            </div>
          </div>

          {/* Profile Photo Upload - Right side */}
          <div style={styles.photoContainer}>
            <div style={styles.profilePhotoWrap}>
              {form.photo ? (
                <img src={form.photo} alt="Teacher profile" style={styles.profilePhotoImage} />
              ) : (
                <div style={styles.profilePhotoFallback}>{initials || "T"}</div>
              )}
            </div>
            <label style={styles.uploadLabel}>
              Add Photo
              <input type="file" accept="image/*" onChange={onPhotoSelected} style={styles.hiddenInput} />
            </label>
          </div>
        </form>
      </section>
    </div>
  );
}

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
  section: {
    background: "linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)",
    padding: 24,
    borderRadius: 16,
    boxShadow: "0 8px 24px rgba(102, 126, 234, 0.1)",
    border: "1px solid rgba(102, 126, 234, 0.12)",
    marginBottom: 24,
  },
  // Flexbox layout: photo on left, content on right
  // flexWrap allows stacking on smaller screens
  profileLayout: {
    display: "flex",
    alignItems: "flex-start",
    gap: 24,
    flexWrap: "wrap",
  },
  // Photo container - fixed size, top-left
  photoContainer: {
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
    minWidth: 150,
  },
  profilePhotoWrap: {
    width: 150,
    height: 150,
    borderRadius: "50%",
    overflow: "hidden",
    border: "2px solid #c7d2fe",
    background: "#eef2ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  profilePhotoImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  profilePhotoFallback: {
    fontSize: 36,
    fontWeight: 700,
    color: "#4f46e5",
  },
  // Content container - flexible, right of photo
  contentContainer: {
    flex: 1,
    minWidth: 0, // Allows flex item to shrink below content size
  },
  profileGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 22,
    alignItems: "start",
  },
  avatarColumn: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 10,
  },
  avatarWrap: {
    width: 150,
    height: 150,
    borderRadius: "50%",
    overflow: "hidden",
    border: "2px solid #c7d2fe",
    background: "#eef2ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  avatarFallback: {
    fontSize: 36,
    fontWeight: 700,
    color: "#4f46e5",
  },
  uploadLabel: {
    background: "#eef2ff",
    color: "#4338ca",
    padding: "8px 12px",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 600,
  },
  hiddenInput: {
    display: "none",
  },
  formColumn: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 12,
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
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #e0e4e8",
    fontSize: 14,
  },
  textarea: {
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid #e0e4e8",
    fontFamily: "inherit",
    resize: "vertical",
  },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 12,
    flexWrap: "wrap",
  },
  primaryButton: {
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    padding: "10px 16px",
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
    fontWeight: 700,
  },
  pdfButton: {
    background: "linear-gradient(135deg, #ef5350 0%, #e53935 100%)",
    color: "white",
    padding: "10px 16px",
    borderRadius: 8,
    border: "none",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  success: {
    color: "#047857",
    background: "#ecfdf5",
    border: "1px solid #a7f3d0",
    borderRadius: 8,
    padding: "8px 10px",
    fontSize: 13,
  },
  error: {
    color: "#b91c1c",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: 8,
    padding: "8px 10px",
    fontSize: 13,
  },
  loading: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    fontSize: 18,
    color: "#6b7280",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 600,
    color: "#213547",
    marginTop: 0,
    marginBottom: 16,
    paddingBottom: 8,
    borderBottom: "2px solid #e0e4e8",
  },
  readOnlyGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 16,
  },
  readOnlyItem: {
    display: "flex",
    flexDirection: "column",
  },
  readOnlyItemFull: {
    gridColumn: "1 / -1",
    display: "flex",
    flexDirection: "column",
  },
  readOnlyLabel: {
    fontSize: 13,
    color: "#6b7280",
    fontWeight: 600,
    marginBottom: 6,
  },
  readOnlyValue: {
    fontSize: 14,
    color: "#213547",
    padding: "10px 12px",
    borderRadius: 8,
    backgroundColor: "#f9fafb",
    border: "1px solid #e5e7eb",
    fontWeight: 500,
  },
  readOnlyInput: {
    backgroundColor: "#f9fafb",
    color: "#6b7280",
    cursor: "not-allowed",
  },
  teachingList: {
    marginTop: 8,
  },
  assignmentList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },
  assignmentItem: {
    display: "flex",
    gap: 8,
    alignItems: "center",
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
  noAssignment: {
    color: "#9ca3af",
    fontStyle: "italic",
    fontSize: 13,
  },
};
