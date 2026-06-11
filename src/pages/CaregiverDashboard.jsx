// src/pages/CaregiverDashboard.jsx

import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";

function CaregiverDashboard() {
  const [logs, setLogs] = useState([]);
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [sending, setSending] = useState(false);

  const userName = localStorage.getItem("userName") || "Patient";
  const userAge = localStorage.getItem("userAge") || "Not set";
  const userConditions = localStorage.getItem("userConditions") || "None";
  const caregiverEmail = localStorage.getItem("caregiverEmail") || "";

  const getHeaders = () => {
    const token = localStorage.getItem("token") || "dummy-token";
    const userId = localStorage.getItem("userId") || "guest-user";
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      "X-User-ID": userId,
    };
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5001/api/history", { headers: getHeaders() });
      if (!response.ok) throw new Error("Failed to fetch data");
      const data = await response.json();
      setLogs(data.intakeLogs || []);
      setMedications(data.medications || []);
    } catch (error) {
      toast.error("Error fetching data");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const takenCount = logs.filter(l => l.status === "taken").length;
  const missedCount = logs.filter(l => l.status === "missed").length;
  const snoozedCount = logs.filter(l => l.status === "snoozed").length;
  const adherenceScore = logs.length > 0
    ? Math.round((takenCount / logs.length) * 100)
    : 0;

  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const dayLogs = logs.filter(l => {
      const logDate = new Date(l.timestamp).toISOString().split("T")[0];
      return logDate === dateStr;
    });
    return {
      date: dateStr,
      day: d.toLocaleDateString("en-US", { weekday: "short" }),
      taken: dayLogs.filter(l => l.status === "taken").length,
      missed: dayLogs.filter(l => l.status === "missed").length,
      total: dayLogs.length,
    };
  }).reverse();

  const consecutiveMissed = () => {
    let count = 0;
    for (let i = 0; i < logs.length; i++) {
      if (logs[i].status === "missed") count++;
      else break;
    }
    return count;
  };
  const missedStreak = consecutiveMissed();

  const exportToExcel = () => {
    try {
      if (logs.length === 0) { toast.error("No data to export!"); return; }
      const data = logs.map(log => ({
        "Medication Name": log.medName || "",
        "Status": log.status || "",
        "Date & Time": new Date(log.timestamp).toLocaleString(),
      }));
      medications.forEach(med => {
        const hasLog = logs.find(l => l.medId === med.id);
        if (!hasLog) {
          data.push({ "Medication Name": med.name, "Status": "NOT TAKEN YET", "Date & Time": "-" });
        }
      });
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Caregiver Report");
      XLSX.writeFile(workbook, "caregiver_report.xlsx");
      toast.success("Report exported successfully!");
    } catch (error) {
      toast.error("Error exporting report");
    }
  };

  const sendReportToCaregiver = async () => {
    if (!caregiverEmail) {
      toast.error("No caregiver email saved! Go to Profile and save caregiver email.");
      return;
    }
    setSending(true);
    try {
      const response = await fetch("http://localhost:5001/api/notify/caregiver-report", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ caregiverEmail, userName }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Report sent to caregiver email!");
      } else {
        toast.error("Failed: " + (data.message || "Unknown error"));
      }
    } catch (err) {
      toast.error("Error sending report: " + err.message);
    }
    setSending(false);
  };

  if (loading) return <div style={styles.loading}>Loading caregiver dashboard...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Caregiver Dashboard</h1>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button style={styles.exportBtn} onClick={exportToExcel}>Export Excel</button>
          <button style={styles.sendBtn} onClick={sendReportToCaregiver} disabled={sending}>
            {sending ? "Sending..." : "Send to Caregiver"}
          </button>
          <button style={styles.refreshBtn} onClick={fetchAllData}>Refresh</button>
        </div>
      </div>

      {missedStreak >= 2 && (
        <div style={styles.alertBanner}>
          Alert: {userName} has missed {missedStreak} consecutive doses! Please follow up immediately.
        </div>
      )}

      <div style={styles.patientCard}>
        <div style={styles.patientAvatar}>{userName.charAt(0).toUpperCase()}</div>
        <div style={styles.patientInfo}>
          <h2 style={styles.patientName}>{userName}</h2>
          <p style={styles.patientDetail}>Age: {userAge}</p>
          <p style={styles.patientDetail}>Conditions: {userConditions || "None"}</p>
          <p style={styles.patientDetail}>Caregiver Email: {caregiverEmail || "Not set"}</p>
        </div>
        <div style={styles.adherenceBadge}>
          <div style={{
            ...styles.adherenceBadgeValue,
            color: adherenceScore >= 80 ? "#4caf50" : adherenceScore >= 50 ? "#ff9800" : "#ef5350"
          }}>{adherenceScore}%</div>
          <div style={styles.adherenceBadgeLabel}>Adherence</div>
        </div>
      </div>

      <div style={styles.tabs}>
        {["overview", "medications", "history", "patterns"].map(tab => (
          <button key={tab}
            style={activeTab === tab ? styles.activeTab : styles.tab}
            onClick={() => setActiveTab(tab)}>
            {tab === "overview" ? "Overview" :
              tab === "medications" ? "Medications" :
                tab === "history" ? "History" : "Patterns"}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div>
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <h3 style={styles.statValue}>{medications.length}</h3>
              <p style={styles.statLabel}>Total Medications</p>
            </div>
            <div style={{ ...styles.statCard, borderTop: "4px solid #4caf50" }}>
              <h3 style={{ ...styles.statValue, color: "#4caf50" }}>{takenCount}</h3>
              <p style={styles.statLabel}>Taken</p>
            </div>
            <div style={{ ...styles.statCard, borderTop: "4px solid #ef5350" }}>
              <h3 style={{ ...styles.statValue, color: "#ef5350" }}>{missedCount}</h3>
              <p style={styles.statLabel}>Missed</p>
            </div>
            <div style={{ ...styles.statCard, borderTop: "4px solid #ff9800" }}>
              <h3 style={{ ...styles.statValue, color: "#ff9800" }}>{snoozedCount}</h3>
              <p style={styles.statLabel}>Snoozed</p>
            </div>
          </div>

          <div style={styles.adherenceCard}>
            <div style={styles.adherenceHeader}>
              <span style={styles.adherenceLabel}>Overall Adherence Score</span>
              <span style={{
                ...styles.adherenceValue,
                color: adherenceScore >= 80 ? "#4caf50" : adherenceScore >= 50 ? "#ff9800" : "#ef5350"
              }}>{adherenceScore}%</span>
            </div>
            <div style={styles.progressBar}>
              <div style={{
                ...styles.progressFill,
                width: `${adherenceScore}%`,
                backgroundColor: adherenceScore >= 80 ? "#4caf50" : adherenceScore >= 50 ? "#ff9800" : "#ef5350",
              }} />
            </div>
            <p style={styles.adherenceMsg}>
              {adherenceScore >= 80 ? "Excellent adherence! Patient is doing great." :
                adherenceScore >= 50 ? "Moderate adherence. Patient needs reminders." :
                  "Poor adherence. Immediate attention required!"}
            </p>
          </div>

          <h2 style={styles.sectionTitle}>Last 7 Days Activity</h2>
          <div style={styles.weekGrid}>
            {last7Days.map((day, i) => (
              <div key={i} style={{
                ...styles.dayCard,
                borderTop: day.missed > 0 ? "3px solid #ef5350" : "3px solid #4caf50"
              }}>
                <div style={styles.dayName}>{day.day}</div>
                <div style={styles.dayDate}>{day.date.slice(5)}</div>
                <div style={styles.dayTaken}>T: {day.taken}</div>
                <div style={styles.dayMissed}>M: {day.missed}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "medications" && (
        <div>
          <h2 style={styles.sectionTitle}>Current Medications</h2>
          {medications.length === 0 ? (
            <div style={styles.emptyState}>No medications found</div>
          ) : (
            <div style={styles.medGrid}>
              {medications.map(med => (
                <div key={med.id} style={styles.medCard}>
                  <h3 style={styles.medName}>{med.name}</h3>
                  <p style={styles.medInfo}>Dosage: {med.dosage}</p>
                  <p style={styles.medInfo}>Frequency: {med.frequency}</p>
                  <p style={styles.medInfo}>Reminder: {med.reminderTime}</p>
                  <p style={styles.medInfo}>Start: {med.startDate}</p>
                  {med.notes && <p style={styles.medNotes}>{med.notes}</p>}
                  <span style={med.status === "taken" ? styles.takenBadge : styles.pendingBadge}>
                    {med.status === "taken" ? "Taken" : "Pending"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "history" && (
        <div>
          <h2 style={styles.sectionTitle}>Medication History</h2>
          {logs.length === 0 ? (
            <div style={styles.emptyState}>No history found. Mark medications as taken to see history.</div>
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeader}>
                    <th style={styles.th}>#</th>
                    <th style={styles.th}>Medication</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Date & Time</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, i) => (
                    <tr key={log.id} style={i % 2 === 0 ? styles.evenRow : styles.oddRow}>
                      <td style={styles.td}>{i + 1}</td>
                      <td style={styles.td}><strong>{log.medName}</strong></td>
                      <td style={styles.td}>
                        <span style={
                          log.status === "taken" ? styles.takenBadge :
                            log.status === "missed" ? styles.missedBadge :
                              styles.snoozedBadge
                        }>
                          {log.status === "taken" ? "Taken" :
                            log.status === "missed" ? "Missed" : "Snoozed"}
                        </span>
                      </td>
                      <td style={styles.td}>{new Date(log.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "patterns" && (
        <div>
          <h2 style={styles.sectionTitle}>Pattern Analysis</h2>
          <div style={styles.patternsGrid}>
            <div style={styles.patternCard}>
              <h3 style={styles.patternTitle}>Consecutive Missed Doses</h3>
              <div style={{
                ...styles.patternValue,
                color: missedStreak === 0 ? "#4caf50" : missedStreak >= 3 ? "#ef5350" : "#ff9800"
              }}>{missedStreak}</div>
              <p style={styles.patternDesc}>
                {missedStreak === 0 ? "No consecutive missed doses. Great!" :
                  missedStreak >= 3 ? "Critical: Multiple consecutive missed doses!" :
                    "Warning: Some doses missed recently."}
              </p>
            </div>
            <div style={styles.patternCard}>
              <h3 style={styles.patternTitle}>Adherence Rate</h3>
              <div style={{
                ...styles.patternValue,
                color: adherenceScore >= 80 ? "#4caf50" : adherenceScore >= 50 ? "#ff9800" : "#ef5350"
              }}>{adherenceScore}%</div>
              <p style={styles.patternDesc}>Based on {logs.length} total recorded doses</p>
            </div>
            <div style={styles.patternCard}>
              <h3 style={styles.patternTitle}>Miss Rate</h3>
              <div style={{ ...styles.patternValue, color: "#ef5350" }}>
                {logs.length > 0 ? Math.round((missedCount / logs.length) * 100) : 0}%
              </div>
              <p style={styles.patternDesc}>{missedCount} missed out of {logs.length} total doses</p>
            </div>
            <div style={styles.patternCard}>
              <h3 style={styles.patternTitle}>Overall Status</h3>
              <div style={{ ...styles.patternValue, fontSize: "28px" }}>
                {adherenceScore >= 80 ? "Good" : adherenceScore >= 50 ? "Fair" : "Poor"}
              </div>
              <p style={styles.patternDesc}>
                {adherenceScore >= 80 ? "Patient is managing medications well" :
                  adherenceScore >= 50 ? "Patient needs more support and reminders" :
                    "Caregiver intervention recommended"}
              </p>
            </div>
          </div>

          <h2 style={{ ...styles.sectionTitle, marginTop: "24px" }}>Medication Wise Breakdown</h2>
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeader}>
                  <th style={styles.th}>Medication</th>
                  <th style={styles.th}>Total Taken</th>
                  <th style={styles.th}>Reminder Time</th>
                  <th style={styles.th}>Current Status</th>
                </tr>
              </thead>
              <tbody>
                {medications.map((med, i) => {
                  const medLogs = logs.filter(l => l.medId === med.id);
                  const medTaken = medLogs.filter(l => l.status === "taken").length;
                  return (
                    <tr key={med.id} style={i % 2 === 0 ? styles.evenRow : styles.oddRow}>
                      <td style={styles.td}><strong>{med.name}</strong></td>
                      <td style={styles.td}>{medTaken} times</td>
                      <td style={styles.td}>{med.reminderTime}</td>
                      <td style={styles.td}>
                        <span style={med.status === "taken" ? styles.takenBadge : styles.pendingBadge}>
                          {med.status === "taken" ? "Taken" : "Pending"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { padding: "32px", maxWidth: "1100px", margin: "0 auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" },
  title: { fontSize: "28px", color: "#333", margin: "0" },
  exportBtn: { backgroundColor: "#4caf50", color: "white", border: "none", padding: "10px 16px", borderRadius: "8px", cursor: "pointer", fontSize: "14px" },
  sendBtn: { backgroundColor: "#1976d2", color: "white", border: "none", padding: "10px 16px", borderRadius: "8px", cursor: "pointer", fontSize: "14px" },
  refreshBtn: { backgroundColor: "#757575", color: "white", border: "none", padding: "10px 16px", borderRadius: "8px", cursor: "pointer", fontSize: "14px" },
  alertBanner: { backgroundColor: "#fce4ec", border: "1px solid #ef5350", padding: "12px 20px", borderRadius: "8px", marginBottom: "20px", color: "#c62828", fontSize: "15px" },
  patientCard: { backgroundColor: "white", padding: "20px", borderRadius: "12px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", display: "flex", alignItems: "center", gap: "20px", marginBottom: "24px", flexWrap: "wrap" },
  patientAvatar: { width: "60px", height: "60px", borderRadius: "50%", backgroundColor: "#1976d2", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", fontWeight: "bold", flexShrink: 0 },
  patientInfo: { flex: 1 },
  patientName: { fontSize: "20px", color: "#333", margin: "0 0 4px 0" },
  patientDetail: { color: "#666", fontSize: "14px", margin: "2px 0" },
  adherenceBadge: { textAlign: "center", padding: "12px 20px", backgroundColor: "#f0f4f8", borderRadius: "12px" },
  adherenceBadgeValue: { fontSize: "28px", fontWeight: "bold" },
  adherenceBadgeLabel: { fontSize: "12px", color: "#888", marginTop: "4px" },
  tabs: { display: "flex", gap: "8px", marginBottom: "24px", flexWrap: "wrap" },
  tab: { padding: "10px 20px", borderRadius: "8px", border: "1px solid #ddd", backgroundColor: "white", cursor: "pointer", fontSize: "14px", color: "#333" },
  activeTab: { padding: "10px 20px", borderRadius: "8px", border: "none", backgroundColor: "#1976d2", cursor: "pointer", fontSize: "14px", color: "white" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "16px", marginBottom: "24px" },
  statCard: { backgroundColor: "white", padding: "20px", borderRadius: "12px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", borderTop: "4px solid #1976d2", textAlign: "center" },
  statValue: { fontSize: "28px", color: "#333", margin: "0 0 4px 0" },
  statLabel: { color: "#888", fontSize: "13px", margin: "0" },
  adherenceCard: { backgroundColor: "white", padding: "20px 24px", borderRadius: "12px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", marginBottom: "24px" },
  adherenceHeader: { display: "flex", justifyContent: "space-between", marginBottom: "8px" },
  adherenceLabel: { fontSize: "15px", color: "#333", fontWeight: "600" },
  adherenceValue: { fontSize: "15px", fontWeight: "bold" },
  progressBar: { backgroundColor: "#f0f4f8", borderRadius: "8px", height: "12px", marginBottom: "8px" },
  progressFill: { height: "12px", borderRadius: "8px", transition: "width 0.5s ease" },
  adherenceMsg: { color: "#666", fontSize: "13px", margin: "0" },
  sectionTitle: { fontSize: "20px", color: "#333", margin: "0 0 16px 0" },
  weekGrid: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "8px", marginBottom: "24px" },
  dayCard: { backgroundColor: "white", padding: "12px 8px", borderRadius: "10px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", textAlign: "center" },
  dayName: { fontSize: "13px", fontWeight: "bold", color: "#1976d2", marginBottom: "4px" },
  dayDate: { fontSize: "11px", color: "#888", marginBottom: "8px" },
  dayTaken: { fontSize: "12px", color: "#4caf50", marginBottom: "4px" },
  dayMissed: { fontSize: "12px", color: "#ef5350" },
  loading: { textAlign: "center", color: "#1976d2", padding: "40px", fontSize: "18px" },
  medGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "16px" },
  medCard: { backgroundColor: "white", padding: "16px", borderRadius: "12px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", borderTop: "4px solid #1976d2" },
  medName: { fontSize: "17px", color: "#333", margin: "0 0 8px 0" },
  medInfo: { color: "#666", fontSize: "14px", margin: "4px 0" },
  medNotes: { color: "#888", fontSize: "13px", fontStyle: "italic", margin: "4px 0" },
  tableWrapper: { backgroundColor: "white", borderRadius: "12px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", overflow: "auto", marginBottom: "24px" },
  table: { width: "100%", borderCollapse: "collapse" },
  tableHeader: { backgroundColor: "#1976d2" },
  th: { padding: "12px 16px", color: "white", textAlign: "left", fontSize: "14px" },
  td: { padding: "12px 16px", fontSize: "14px", color: "#333" },
  evenRow: { backgroundColor: "white" },
  oddRow: { backgroundColor: "#f9fafb" },
  takenBadge: { backgroundColor: "#e8f5e9", color: "#4caf50", padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "600" },
  missedBadge: { backgroundColor: "#fce4ec", color: "#ef5350", padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "600" },
  snoozedBadge: { backgroundColor: "#fff8e1", color: "#ff9800", padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "600" },
  pendingBadge: { backgroundColor: "#fff3e0", color: "#f57c00", padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "600" },
  patternsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "24px" },
  patternCard: { backgroundColor: "white", padding: "20px", borderRadius: "12px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", textAlign: "center" },
  patternTitle: { fontSize: "15px", color: "#666", margin: "0 0 12px 0" },
  patternValue: { fontSize: "36px", fontWeight: "bold", color: "#1976d2", margin: "0 0 8px 0" },
  patternDesc: { fontSize: "13px", color: "#888", margin: "0" },
  emptyState: { textAlign: "center", color: "#888", padding: "40px", backgroundColor: "white", borderRadius: "12px" },
};

export default CaregiverDashboard;