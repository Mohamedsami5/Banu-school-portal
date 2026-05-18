import React from "react";

export default function Header({ title, onLogout, admin, onToggleSidebar }) {
  return (
    <header style={styles.header}>
      <div style={styles.left}>
        <button 
          className="hamburger-button"
          style={styles.hamburger}
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        <div style={styles.logo}>🏫</div>
        <h1 style={styles.title}>{title}</h1>
      </div>
      <div style={styles.right}>
        <div style={styles.adminInfo}>{admin ? admin.email : 'Admin'}</div>
        <button className="logout-button" style={styles.logout} onClick={onLogout}>Logout</button>
      </div>
    </header>
  );
}

const styles = {
  header: {
    height: 64,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 20px',
    background: 'linear-gradient(90deg, #6b5fd2 0%, #6b5fd2 35%, #6a56c8 70%, #6b4aa8 100%)',
    boxShadow: '0 2px 10px rgba(59, 47, 126, 0.25)',
    zIndex: 1000,
  },
  left: { display: 'flex', alignItems: 'center', gap: 16 },
  hamburger: {
    background: 'rgba(255, 255, 255, 0.18)',
    border: 'none',
    borderRadius: 8,
    padding: '8px',
    cursor: 'pointer',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  },
  logo: { fontSize: 28 },
  title: { fontSize: 20, color: '#fff', fontWeight: 600 },
  right: { display: 'flex', alignItems: 'center', gap: 16 },
  adminInfo: { color: 'rgba(255, 255, 255, 0.9)', fontSize: 14, fontWeight: 500 },
  logout: { 
    background: '#ef5350', 
    padding: '8px 16px',
    borderRadius: 6,
    fontWeight: 500,
    transition: 'all 0.2s ease',
  },
};
