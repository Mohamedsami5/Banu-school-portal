import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./PublicLoginPage.css";

export default function PublicLoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "admin",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Login failed. Please check your credentials.");
        setLoading(false);
        return;
      }

      // Store user data in localStorage
      localStorage.setItem("user", JSON.stringify(data));

      // Navigate to appropriate dashboard
      if (data.role === "admin") {
        navigate("/admin/dashboard");
      } else if (data.role === "teacher") {
        navigate("/teacher/dashboard");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg-gradient"></div>

      <div className="login-container">
        {/* Back Button */}
        <button className="back-button" onClick={() => navigate("/")}>
          ← Back to Home
        </button>

        {/* Login Card */}
        <div className="login-card">
          {/* Header */}
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="login-form">
            {/* Role Selection */}
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
              </div>
            </div>

            {/* Email Field */}
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

            {/* Password Field */}
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="form-input"
                required
              />
            </div>

            {/* Error Message */}
            {error && <div className="error-message">{error}</div>}

            {/* Submit Button */}
            <button type="submit" className="login-button" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          {/* Footer */}
          <div className="login-footer">
            <p className="login-footer-text">
              First time? Contact the administration for your credentials.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
