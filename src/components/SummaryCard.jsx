import React from "react";

const cardColors = [
  { gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'},
  { gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'},
];

export default function SummaryCard({ title, value, index = 0, onClick }) {
  const colorScheme = cardColors[index % cardColors.length];
  const clickable = typeof onClick === "function";
  
  return (
    <div 
      className="summary-card"
      onClick={clickable ? onClick : undefined}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") onClick(e);
            }
          : undefined
      }
      style={{
        ...styles.card,
        background: colorScheme.gradient,
        cursor: clickable ? "pointer" : styles.card.cursor,
      }}
    >
      {index !== 0 && !!colorScheme.icon && <div style={styles.icon}>{colorScheme.icon}</div>}
      <div style={styles.content}>
        <div style={styles.title}>{title}</div>
        <div style={styles.value}>{value}</div>
      </div>
    </div>
  );
}

const styles = {
  card: {
    background: '#fff',
    padding: 24,
    borderRadius: 16,
    minWidth: 220,
    boxShadow: '0 8px 24px rgba(102, 126, 234, 0.2)',
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    color: 'white',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    cursor: 'default',
  },
  icon: {
    fontSize: 36,
    opacity: 0.9,
  },
  content: {
    flex: 1,
  },
  title: { 
    color: 'rgba(255, 255, 255, 0.9)', 
    marginBottom: 8,
    fontSize: 14,
    fontWeight: 500,
  },
  value: { 
    fontSize: 32, 
    fontWeight: 700, 
    color: '#fff',
    lineHeight: 1,
  }
};
