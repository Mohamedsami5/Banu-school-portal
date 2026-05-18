import React, { useState } from "react";
import { API_BASE } from "../config/api";

const initialState = {
  oldPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export default function ChangePasswordCard({ user, title = "Change Password", subtitle = "Update your password securely." }) {
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
    if (notice) setNotice("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!form.oldPassword || !form.newPassword || !form.confirmPassword) {
      setError("Please fill in all password fields.");
      return;
    }

    if (form.newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user?.email,
          role: user?.role,
          userId: user?._id || user?.id || user?.userId,
          oldPassword: form.oldPassword,
          newPassword: form.newPassword,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.message || "Unable to change password right now.");
        setLoading(false);
        return;
      }

      setNotice(data.message || "Password changed successfully.");
      setForm(initialState);
    } catch (requestError) {
      console.error("Change password error:", requestError);
      setError("Unable to reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section style={styles.wrapper}>
      <div style={styles.header}>
        <h2 style={styles.title}>{title}</h2>
        <p style={styles.subtitle}>{subtitle}</p>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        <label style={styles.field}>
          <span style={styles.label}>Old Password</span>
          <input
            type="password"
            name="oldPassword"
            value={form.oldPassword}
            onChange={handleChange}
            placeholder="Enter your current password"
            style={styles.input}
            required
          />
        </label>

        <label style={styles.field}>
          <span style={styles.label}>New Password</span>
          <input
            type="password"
            name="newPassword"
            value={form.newPassword}
            onChange={handleChange}
            placeholder="Create a new password"
            style={styles.input}
            required
          />
        </label>

        <label style={styles.field}>
          <span style={styles.label}>Confirm New Password</span>
          <input
            type="password"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            placeholder="Re-enter the new password"
            style={styles.input}
            required
          />
        </label>

        {error ? <div style={styles.error}>{error}</div> : null}
        {!error && notice ? <div style={styles.notice}>{notice}</div> : null}

        <button type="submit" style={styles.button} disabled={loading}>
          {loading ? "Saving..." : "Update Password"}
        </button>
      </form>
    </section>
  );
}

const styles = {
  wrapper: {
    maxWidth: 520,
    background: "#ffffff",
    borderRadius: 18,
    padding: 24,
    boxShadow: "0 18px 40px rgba(15, 23, 42, 0.08)",
    border: "1px solid rgba(148, 163, 184, 0.18)",
  },
  header: {
    marginBottom: 20,
  },
  title: {
    margin: 0,
    color: "#0f172a",
    fontSize: 24,
  },
  subtitle: {
    margin: "8px 0 0",
    color: "#64748b",
    fontSize: 14,
    lineHeight: 1.5,
  },
  form: {
    display: "grid",
    gap: 16,
  },
  field: {
    display: "grid",
    gap: 8,
  },
  label: {
    color: "#334155",
    fontSize: 13,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid #dbe2ea",
    background: "#f8fafc",
    fontSize: 14,
    color: "#0f172a",
    boxSizing: "border-box",
  },
  error: {
    padding: "12px 14px",
    borderRadius: 12,
    background: "#fff1f2",
    border: "1px solid #fecdd3",
    color: "#be123c",
    fontSize: 13,
    fontWeight: 600,
  },
  notice: {
    padding: "12px 14px",
    borderRadius: 12,
    background: "#ecfeff",
    border: "1px solid #a5f3fc",
    color: "#0f766e",
    fontSize: 13,
    fontWeight: 600,
  },
  button: {
    border: "none",
    borderRadius: 12,
    padding: "13px 18px",
    background: "linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)",
    color: "#ffffff",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 12px 24px rgba(37, 99, 235, 0.22)",
  },
};
