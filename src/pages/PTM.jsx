import React from "react";
import PTMList from "../components/PTMList";

const mockPTMs = [
  { id: 1, title: 'Term 1 PTM', date: '2026-02-10', time: '10:00 AM', desc: 'Discuss student progress and assessments.' },
  { id: 2, title: 'Class 5 PTM', date: '2026-02-12', time: '2:00 PM', desc: 'Focus on reading and numeracy.' },
  { id: 3, title: 'New Admissions PTM', date: '2026-03-01', time: '11:30 AM', desc: 'Orientation for new students and parents.' },
];

export default function PTMPage() {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2>Parent–Teacher Meetings</h2>
        <button onClick={() => alert('Create PTM (UI only)')} style={{ padding: '8px 12px' }}>Create PTM</button>
      </div>
      <div style={{ background: '#fff', padding: 16, borderRadius: 8, boxShadow: '0 6px 18px rgba(20,30,60,0.04)' }}>
        <PTMList items={mockPTMs} />
      </div>
    </div>
  );
}
