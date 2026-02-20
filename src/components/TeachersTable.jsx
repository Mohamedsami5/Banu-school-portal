import React from "react";

export default function TeachersTable({ data = [], onView, onEdit, onDelete }) {
  // Format teaching assignments for display
  const formatTeaching = (teaching) => {
    if (!Array.isArray(teaching) || teaching.length === 0) {
      return "No assignments";
    }
    return teaching
      .map((t) => `${t.className}(${t.section}) - ${t.subject}`)
      .join(", ");
  };

  return (
    <table style={styles.table}>
      <thead>
        <tr>
          <th style={styles.th}>Name</th>
          <th style={styles.th}>Email</th>
          <th style={styles.th}>Classes & Subjects</th>
          <th style={styles.th}>Status</th>
          <th style={styles.th}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {data.map((teacher) => (
          <tr key={teacher._id || teacher.id} className="parent-table-row" style={styles.tr}>
            <td style={styles.td}>{teacher.name}</td>
            <td style={styles.td}>{teacher.email}</td>
            <td style={styles.td}>
              <div style={styles.teachingCell}>
                {Array.isArray(teacher.teaching) && teacher.teaching.length > 0 ? (
                  <details style={styles.details}>
                    <summary style={styles.summary}>
                      {teacher.teaching.length} assignment(s)
                    </summary>
                    <div style={styles.assignmentList}>
                      {teacher.teaching.map((t, idx) => (
                        <div key={idx} style={styles.assignmentItem}>
                          <span style={styles.assignmentBadge}>{t.className} {t.section}</span>
                          <span>{t.subject}</span>
                        </div>
                      ))}
                    </div>
                  </details>
                ) : (
                  <span style={styles.noAssignments}>No assignments</span>
                )}
              </div>
            </td>
            <td style={styles.td}>{teacher.status}</td>
            <td style={styles.td}>
              <div style={styles.actions}>
                <button 
                  className="view-button"
                  onClick={() => onView && onView(teacher)} 
                  style={styles.viewButton}
                  title="View details"
                >
                  View
                </button>
                <button 
                  className="edit-button"
                  onClick={() => onEdit && onEdit(teacher)} 
                  style={styles.editButton}
                  title="Edit teacher"
                >
                  Edit
                </button>
                <button 
                  className="delete-button"
                  onClick={() => onDelete && onDelete(teacher)} 
                  style={styles.deleteButton}
                  title="Delete teacher"
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
  teachingCell: {
    fontSize: 13,
  },
  details: {
    cursor: 'pointer',
  },
  summary: {
    cursor: 'pointer',
    fontWeight: 500,
    color: '#213547',
    padding: '4px 8px',
    borderRadius: 4,
    backgroundColor: '#f0f2f5',
  },
  assignmentList: {
    marginTop: 8,
    paddingLeft: 16,
    borderLeft: '2px solid #667eea',
  },
  assignmentItem: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
    padding: '6px 0',
    fontSize: 12,
  },
  assignmentBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: 3,
    backgroundColor: '#e3f2fd',
    color: '#1976d2',
    fontWeight: 500,
    fontSize: 11,
  },
  noAssignments: {
    color: '#999',
    fontStyle: 'italic',
  },
};
