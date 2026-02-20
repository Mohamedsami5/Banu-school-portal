import React from "react";
import { Link } from "react-router-dom";
import "./Hero.css";

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-gradient-bg"></div>
      <div className="hero-container">
        <div className="hero-content">
          <h1 className="hero-title">Nurturing Young Minds for a Better Tomorrow</h1>
          <p className="hero-subtitle">
            Experience world-class education with modern teaching methods, dedicated educators, and a vibrant learning community.
          </p>
          <div className="hero-buttons">
            <button className="btn btn-primary">Explore Our Programs</button>
            <button className="btn btn-secondary">Admissions Open Now</button>
          </div>
        </div>
        <div className="hero-illustration">
          <svg width="400" height="400" viewBox="0 0 400 400" fill="none">
            {/* Background circle */}
            <circle cx="200" cy="200" r="180" fill="rgba(79, 172, 254, 0.1)" />

            {/* Building */}
            <rect x="80" y="120" width="240" height="180" fill="#e0f2fe" stroke="#4facfe" strokeWidth="2" rx="8" />

            {/* Roof */}
            <polygon points="80,120 200,40 320,120" fill="url(#roofGradient)" stroke="#4facfe" strokeWidth="2" />

            {/* Windows */}
            <rect x="100" y="140" width="30" height="30" fill="#bfdbfe" stroke="#4facfe" strokeWidth="1" rx="2" />
            <rect x="150" y="140" width="30" height="30" fill="#bfdbfe" stroke="#4facfe" strokeWidth="1" rx="2" />
            <rect x="200" y="140" width="30" height="30" fill="#bfdbfe" stroke="#4facfe" strokeWidth="1" rx="2" />
            <rect x="250" y="140" width="30" height="30" fill="#bfdbfe" stroke="#4facfe" strokeWidth="1" rx="2" />

            <rect x="100" y="190" width="30" height="30" fill="#bfdbfe" stroke="#4facfe" strokeWidth="1" rx="2" />
            <rect x="150" y="190" width="30" height="30" fill="#bfdbfe" stroke="#4facfe" strokeWidth="1" rx="2" />
            <rect x="200" y="190" width="30" height="30" fill="#bfdbfe" stroke="#4facfe" strokeWidth="1" rx="2" />
            <rect x="250" y="190" width="30" height="30" fill="#bfdbfe" stroke="#4facfe" strokeWidth="1" rx="2" />

            {/* Door */}
            <rect x="170" y="260" width="60" height="80" fill="#1e40af" stroke="#4facfe" strokeWidth="2" rx="4" />
            <circle cx="225" cy="300" r="4" fill="#fbbf24" />

            {/* Flag */}
            <line x1="340" y1="60" x2="340" y2="120" stroke="#4facfe" strokeWidth="3" />
            <polygon points="340,60 340,80 360,70" fill="#f59e0b" />

            {/* Students */}
            <circle cx="120" cy="330" r="8" fill="#f87171" />
            <circle cx="120" cy="340" r="6" fill="#f87171" opacity="0.8" />
            <circle cx="160" cy="340" r="8" fill="#4facfe" />
            <circle cx="160" cy="350" r="6" fill="#4facfe" opacity="0.8" />
            <circle cx="240" cy="330" r="8" fill="#34d399" />
            <circle cx="240" cy="340" r="6" fill="#34d399" opacity="0.8" />
            <circle cx="280" cy="340" r="8" fill="#a78bfa" />
            <circle cx="280" cy="350" r="6" fill="#a78bfa" opacity="0.8" />

            {/* Decorative elements */}
            <circle cx="350" cy="100" r="20" fill="rgba(79, 172, 254, 0.1)" stroke="#4facfe" strokeWidth="2" />
            <circle cx="50" cy="250" r="15" fill="rgba(0, 242, 254, 0.1)" stroke="#00f2fe" strokeWidth="2" />

            {/* Gradients */}
            <defs>
              <linearGradient id="roofGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#4facfe" />
                <stop offset="100%" stopColor="#00f2fe" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
    </section>
  );
}
