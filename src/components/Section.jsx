import React from "react";
import "./Section.css";

export default function Section({ id, title, subtitle, children, layout = "grid", bgColor = "white" }) {
  return (
    <section id={id} className={`section section-${bgColor}`}>
      <div className="section-container">
        {(title || subtitle) && (
          <div className="section-header">
            {title && <h2 className="section-title">{title}</h2>}
            {subtitle && <p className="section-subtitle">{subtitle}</p>}
          </div>
        )}
        <div className={`section-content section-${layout}`}>{children}</div>
      </div>
    </section>
  );
}

export function Card({ icon, title, description, color = "blue" }) {
  return (
    <div className={`card card-${color}`}>
      <div className="card-icon">{icon}</div>
      <h3 className="card-title">{title}</h3>
      <p className="card-description">{description}</p>
    </div>
  );
}
