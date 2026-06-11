import React, { useState } from "react";
import { auth } from "../firebase.config";

export default function Profile() {
  const [userPhone, setUserPhone] = useState(localStorage.getItem("userPhone") || "");
  const [caregiverEmail, setCaregiverEmail] = useState(localStorage.getItem("caregiverEmail") || "");
  const [caregiverName, setCaregiverName] = useState(localStorage.getItem("caregiverName") || "");
  const [saved, setSaved] = useState(false);
  const [sending, setSending] = useState(false);

  const saveProfile = () => {
    localStorage.setItem("userPhone", userPhone);
    localStorage.setItem("caregiverEmail", caregiverEmail);
    localStorage.setItem("caregiverName", caregiverName);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const sendReport = async () => {
    const cEmail = localStorage.getItem("caregiverEmail");
    if (!cEmail) { alert("Please save caregiver email first"); return; }
    setSending(true);
    try {
      const user = auth.currentUser;
      const token = await user.getIdToken();
      const response = await fetch("http://localhost:5001/api/notify/caregiver-report", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ caregiverEmail: cEmail, userName: user.email }),
      });
      const data = await response.json();
      if (data.success) alert("✅ Report sent to caregiver successfully!");
      else alert("❌ Failed: " + data.message);
    } catch (err) {
      alert("❌ Error: " + err.message);
    }
    setSending(false);
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>👤 Profile & Caregiver Settings</h2>
      <div style={styles.card}>
        <h3 style={styles.section}>Your Phone Number</h3>
        <p style={styles.hint}>You will receive SMS when your alarm triggers</p>
        <input style={styles.input} placeholder="10 digit phone number e.g. 9876543210"
          value={userPhone} onChange={e => setUserPhone(e.target.value)} />

        <h3 style={styles.section}>Caregiver Details</h3>
        <p style={styles.hint}>Caregiver will receive medication Excel report on email</p>
        <input style={styles.input} placeholder="Caregiver Name"
          value={caregiverName} onChange={e => setCaregiverName(e.target.value)} />
        <input style={styles.input} placeholder="Caregiver Email"
          value={caregiverEmail} onChange={e => setCaregiverEmail(e.target.value)} />

        <button style={styles.saveBtn} onClick={saveProfile}>
          {saved ? "✅ Saved!" : "Save Profile"}
        </button>

        <hr style={{ margin: "24px 0", border: "none", borderTop: "1px solid #eee" }} />

        <h3 style={styles.section}>Send Report to Caregiver</h3>
        <p style={styles.hint}>Sends today's full medication history as Excel file</p>
        <button style={styles.reportBtn} onClick={sendReport} disabled={sending}>
          {sending ? "Sending..." : "📊 Send Excel Report to Caregiver"}
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: "600px", margin: "0 auto", padding: "24px" },
  title: { fontSize: "24px", color: "#1976d2", marginBottom: "24px" },
  card: { background: "white", borderRadius: "16px", padding: "32px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" },
  section: { fontSize: "16px", color: "#333", margin: "0 0 6px 0" },
  hint: { fontSize: "13px", color: "#999", marginBottom: "12px" },
  input: { width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "14px", marginBottom: "12px", boxSizing: "border-box" },
  saveBtn: { width: "100%", padding: "12px", background: "#1976d2", color: "white", border: "none", borderRadius: "8px", fontSize: "15px", cursor: "pointer", marginBottom: "8px" },
  reportBtn: { width: "100%", padding: "12px", background: "#43a047", color: "white", border: "none", borderRadius: "8px", fontSize: "15px", cursor: "pointer" },
};