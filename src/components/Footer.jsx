import React from "react";
import "./Footer.css";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-grid">
          {/* About */}
          <div className="footer-section">
            <h3 className="footer-title">About Us</h3>
            <p className="footer-text">
              EduVision Academy is committed to providing world-class education with modern teaching methods and a vibrant learning community.
            </p>
            <div className="social-links">
              <a href="#" className="social-link" aria-label="Facebook">
                f
              </a>
              <a href="#" className="social-link" aria-label="Twitter">
                𝕏
              </a>
              <a href="#" className="social-link" aria-label="Instagram">
                📷
              </a>
              <a href="#" className="social-link" aria-label="LinkedIn">
                in
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-section">
            <h3 className="footer-title">Quick Links</h3>
            <ul className="footer-links">
              <li>
                <a href="#home">Home</a>
              </li>
              <li>
                <a href="#academics">Academics</a>
              </li>
              <li>
                <a href="#achievements">Achievements</a>
              </li>
              <li>
                <a href="#admissions">Admissions</a>
              </li>
            </ul>
          </div>

          {/* Programs */}
          <div className="footer-section">
            <h3 className="footer-title">Programs</h3>
            <ul className="footer-links">
              <li>
                <a href="#programs">Primary Education</a>
              </li>
              <li>
                <a href="#programs">Secondary Education</a>
              </li>
              <li>
                <a href="#programs">Senior Secondary</a>
              </li>
              <li>
                <a href="#programs">Special Programs</a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="footer-section">
            <h3 className="footer-title">Contact Info</h3>
            <ul className="contact-info">
              <li>
                <span className="contact-icon">📍</span>
                <a href="mailto:info@eduvision.edu">123 Education Road, Tech City</a>
              </li>
              <li>
                <span className="contact-icon">📞</span>
                <a href="tel:+1234567890">+1 (234) 567-890</a>
              </li>
              <li>
                <span className="contact-icon">✉️</span>
                <a href="mailto:info@eduvision.edu">info@eduvision.edu</a>
              </li>
              <li>
                <span className="contact-icon">⏰</span>
                <span>Mon - Fri: 8:00 AM - 4:00 PM</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <p className="footer-copyright">
            &copy; {currentYear} EduVision Academy. All rights reserved.
          </p>
          <div className="footer-bottom-links">
            <a href="#privacy">Privacy Policy</a>
            <span className="divider">•</span>
            <a href="#terms">Terms of Service</a>
            <span className="divider">•</span>
            <a href="#cookies">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
