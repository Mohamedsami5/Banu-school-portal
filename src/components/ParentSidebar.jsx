import React from "react";
import StudentSidebar from "./StudentSidebar";

const icon = {
  dashboard: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 12l9-9 9 9" />
      <path d="M9 21V9h6v12" />
    </svg>
  ),
  marks: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 19V5" />
      <path d="M10 19V9" />
      <path d="M16 19V13" />
      <path d="M22 19H2" />
    </svg>
  ),
  homework: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 5h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" />
      <path d="M7 9H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2" />
      <path d="M10 12h8" />
      <path d="M10 16h8" />
    </svg>
  ),
  announcements: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 11v2a2 2 0 0 0 2 2h2l5 4V5L7 9H5a2 2 0 0 0-2 2z" />
      <path d="M14 10a4 4 0 0 1 0 4" />
      <path d="M16 8a7 7 0 0 1 0 8" />
    </svg>
  ),
  leave: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h8" />
      <path d="M8 17h8" />
    </svg>
  ),
  events: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <path d="M3 8h18" />
      <path d="M5 6h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" />
      <path d="M8 12h.01" />
      <path d="M12 12h.01" />
      <path d="M16 12h.01" />
    </svg>
  ),
  profile: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21a8 8 0 1 0-16 0" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  logout: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10 17l5-5-5-5" />
      <path d="M15 12H3" />
      <path d="M21 4v16" />
    </svg>
  ),
};

const parentMenuItems = [
  { id: "overview", label: "Dashboard", color: "#667eea", icon: icon.dashboard },
  { id: "marks", label: "Marks", color: "#43e97b", icon: icon.marks },
  { id: "homework", label: "Homework", color: "#a855f7", icon: icon.homework },
  { id: "announcements", label: "Announcements", color: "#fa709a", icon: icon.announcements },
  { id: "leave-status", label: "Leave Status", color: "#0ea5e9", icon: icon.leave },
  { id: "events", label: "Events & Achievements", color: "#a855f7", icon: icon.events },
  { id: "profile", label: "Student Profile", color: "#4facfe", icon: icon.profile },
  { id: "logout", label: "Logout", color: "#ef5350", icon: icon.logout },
];

export default function ParentSidebar(props) {
  return <StudentSidebar items={parentMenuItems} {...props} />;
}
