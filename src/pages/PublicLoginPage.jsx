import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./PublicLoginPage.css";
import { API_BASE } from "../config/api";

export default function PublicLoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "admin",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        if (!response.ok) {
          setError("Cannot reach the server. Please make sure the backend is running.");
        } else {
          setError("Invalid response from server. Please try again.");
        }
        setLoading(false);
        return;
      }

      if (!response.ok) {
        setError(data.message || "Login failed. Please check your credentials.");
        setLoading(false);
        return;
      }

      localStorage.setItem("user", JSON.stringify(data));

      if (data.role === "admin") {
        navigate("/admin/dashboard");
      } else if (data.role === "teacher") {
        navigate("/teacher/dashboard");
      } else if (data.role === "student") {
        navigate("/student/dashboard");
      } else if (data.role === "parent") {
        navigate("/parent/dashboard");
      }
    } catch (err) {
      console.error("Login error:", err);
      if (
        err instanceof TypeError &&
        (err.message.toLowerCase().includes("fetch") || err.message.toLowerCase().includes("network"))
      ) {
        setError("Cannot reach the server. Please make sure the backend is running.");
      } else {
        setError("An error occurred. Please try again.");
      }
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg-gradient"></div>

      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo">
              <svg width="50" height="50" viewBox="0 0 40 40" fill="none">
                <rect width="40" height="40" rx="8" fill="url(#grad)" />
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="40" y2="40">
                    <stop offset="0%" stopColor="#4facfe" />
                    <stop offset="100%" stopColor="#00f2fe" />
                  </linearGradient>
                </defs>
                <path
                  d="M20 8L28 14v10H12V14L20 8M20 20v6M12 26h16"
                  stroke="white"
                  strokeWidth="1.5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h1 className="login-title">School Portal</h1>
            <p className="login-subtitle">Login to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label className="form-label">Login As</label>
              <div className="role-selector">
                <label className="role-option">
                  <input
                    type="radio"
                    name="role"
                    value="admin"
                    checked={formData.role === "admin"}
                    onChange={handleChange}
                  />
                  <span className="role-label">Admin</span>
                </label>
                <label className="role-option">
                  <input
                    type="radio"
                    name="role"
                    value="teacher"
                    checked={formData.role === "teacher"}
                    onChange={handleChange}
                  />
                  <span className="role-label">Teacher</span>
                </label>
                <label className="role-option">
                  <input
                    type="radio"
                    name="role"
                    value="student"
                    checked={formData.role === "student"}
                    onChange={handleChange}
                  />
                  <span className="role-label">Student</span>
                </label>
                <label className="role-option">
                  <input
                    type="radio"
                    name="role"
                    value="parent"
                    checked={formData.role === "parent"}
                    onChange={handleChange}
                  />
                  <span className="role-label">Parent</span>
                </label>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your.email@example.com"
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="password-field">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className="form-input password-input"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path
                        d="M3 3l18 18"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M10.58 10.58A2 2 0 0 0 12 16a2 2 0 0 0 1.42-.58"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M9.88 5.1A10.4 10.4 0 0 1 12 4c5 0 9.27 3.11 11 8-0.55 1.56-1.4 2.95-2.48 4.07M6.11 6.11C4.1 7.46 2.58 9.5 1 12c1.73 4.89 6 8 11 8 1.09 0 2.14-.15 3.14-.43"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path
                        d="M1 12c1.73-4.89 6-8 11-8s9.27 3.11 11 8c-1.73 4.89-6 8-11 8S2.73 16.89 1 12Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <div className="login-footer">
            <p className="login-footer-text">First time? Contact the administration for your credentials.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
