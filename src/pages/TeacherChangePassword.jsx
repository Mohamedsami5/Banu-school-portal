import React from "react";
import ChangePasswordCard from "../components/ChangePasswordCard";

export default function TeacherChangePassword() {
  const storedUser = localStorage.getItem("user");
  let teacher = null;

  try {
    teacher = storedUser ? JSON.parse(storedUser) : null;
  } catch (error) {
    console.error("Unable to read logged in user:", error);
  }

  return (
    <div style={styles.page}>
      <ChangePasswordCard
        user={teacher}
        title="Change Password"
        subtitle="Use your current password to set a new one for your teacher account."
      />
    </div>
  );
}

const styles = {
  page: {
    display: "flex",
    justifyContent: "flex-start",
  },
};
