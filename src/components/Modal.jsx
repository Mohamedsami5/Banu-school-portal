import React from "react";

export default function Modal({ title, children, onClose, searchTerm, onSearchChange }) {
  return (
    <div style={styles.backdrop} onMouseDown={onClose}>
      <div style={styles.modal} onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div style={styles.header}>
          <h3 style={styles.title}>{title}</h3>
          <button onClick={onClose} aria-label="Close" style={styles.closeBtn}>✕</button>
        </div>

        <div style={styles.searchWrap}>
          <input
            value={searchTerm}
            onChange={onSearchChange}
            placeholder="Search by name or email"
            style={styles.searchInput}
          />
        </div>

        <div style={styles.content}>{children}</div>
      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.35)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2000,
    padding: 20,
  },
  modal: {
    width: "100%",
    maxWidth: 900,
    background: "#fff",
    borderRadius: 10,
    boxShadow: "0 12px 40px rgba(0,0,0,0.12)",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 18px",
    borderBottom: "1px solid #efefef",
  },
  title: { margin: 0, fontSize: 16, fontWeight: 700 },
  closeBtn: {
    background: "transparent",
    border: "none",
    fontSize: 18,
    cursor: "pointer",
    padding: 6,
  },
  searchWrap: { padding: "12px 18px", borderBottom: "1px solid #f3f3f3" },
  searchInput: {
    width: "100%",
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid rgba(0,0,0,0.08)",
    fontSize: 14,
  },
  content: { maxHeight: "60vh", overflowY: "auto", padding: 16 },
};
