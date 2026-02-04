import React from "react";

export default function ParentsTable({ data = [], onView, onEdit, onDelete }) {
  return (
    <table style={styles.table}>
      <thead>
        <tr>
          <th style={styles.th}>Name</th>
          <th style={styles.th}>Email</th>
          <th style={styles.th}>Student Name</th>
          <th style={styles.th}>Class</th>
          <th style={styles.th}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {data.map((p) => (
          <tr key={p.id} className="parent-table-row" style={styles.tr}>
            <td style={styles.td}>{p.name}</td>
            <td style={styles.td}>{p.email}</td>
            <td style={styles.td}>{p.studentName}</td>
            <td style={styles.td}>{p.className}</td>
            <td style={styles.td}>
              <div style={styles.actions}>
                <button 
                  className="view-button"
                  onClick={() => onView && onView(p)} 
                  style={styles.viewButton}
                  title="View details"
                >
                  View
                </button>
                <button 
                  className="edit-button"
                  onClick={() => onEdit && onEdit(p)} 
                  style={styles.editButton}
                  title="Edit parent"
                >
                  Edit
                </button>
                <button 
                  className="delete-button"
                  onClick={() => onDelete && onDelete(p)} 
                  style={styles.deleteButton}
                  title="Delete parent"
                >
                  Delete
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const styles = {
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    padding: '12px 16px',
    textAlign: 'left',
    backgroundColor: '#f8f9ff',
    color: '#213547',
    fontWeight: 600,
    fontSize: 14,
    borderBottom: '2px solid #e0e4e8',
  },
  tr: {
    borderBottom: '1px solid #f3f4f6',
    transition: 'background-color 0.2s ease',
  },
  td: {
    padding: '14px 16px',
    fontSize: 14,
    color: '#425266',
  },
  actions: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
  },
  viewButton: {
    padding: '6px 12px',
    borderRadius: 6,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
    transition: 'all 0.2s ease',
  },
  editButton: {
    padding: '6px 12px',
    borderRadius: 6,
    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
    transition: 'all 0.2s ease',
  },
  deleteButton: {
    padding: '6px 12px',
    borderRadius: 6,
    background: '#ef5350',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 500,
    transition: 'all 0.2s ease',
  },
};
