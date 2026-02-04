import React from "react";

export default function PTMList({ items = [] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {items.map((it) => (
        <div key={it.id} style={styles.item}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={styles.title}>{it.title}</div>
              <div style={styles.meta}>{it.date} • {it.time}</div>
            </div>
            <div>
              <button onClick={() => alert(`View ${it.title} (UI only)`)} style={{ marginRight: 8 }}>View</button>
              <button onClick={() => alert(`Edit ${it.title} (UI only)`)}>Edit</button>
            </div>
          </div>
          <div style={{ marginTop: 8, color: '#425266' }}>{it.desc}</div>
        </div>
      ))}
    </div>
  );
}

const styles = {
  item: { background: '#f9fbff', padding: 12, borderRadius: 8 },
  title: { fontWeight: 700, color: '#213547' },
  meta: { color: '#6b7a86', fontSize: 13 }
};
