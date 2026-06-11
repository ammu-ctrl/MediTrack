// src/pages/History.jsx

import React, { useState, useEffect } from "react";
import { auth } from "../firebase.config";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";

function History() {
  const [logs, setLogs] = useState([]);
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all");

  const getHeaders = async () => {
    const user = auth.currentUser;
    if (!user) throw new Error("User not logged in");
    const token = await user.getIdToken();
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      "X-User-ID": user.uid,
    };
  };

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const headers = await getHeaders();
      const response = await fetch("http://localhost:5001/api/history", { headers });
      if (!response.ok) throw new Error("Failed to fetch history");
      const data = await response.json();
      setLogs(data.intakeLogs || []);
      setMedications(data.medications || []);
    } catch (error) {
      toast.error("Error fetching history");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const filteredLogs = filter === "all"
    ? logs
    : logs.filter(log => log.status === filter);

  const takenCount = logs.filter(l => l.status === "taken").length;
  const missedCount = logs.filter(l => l.status === "missed").length;
  const snoozedCount = logs.filter(l => l.status === "snoozed").length;
  const adherenceScore = logs.length > 0
    ? Math.round((takenCount / logs.length) * 100)
    : 0;

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
          data.push({ "Medication Name": med.name, "Status": "NOT TAKEN YET", "Date & Time": "—" });
        }
      });
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Medication History");
      XLSX.writeFile(workbook, "medication_history.xlsx");
      toast.success("History exported successfully!");
    } catch (error) {
      toast.error("Error exporting history");
    }
  };

  const getStatusStyle = (status) => {
    if (status === "taken") return styles.takenBadge;
    if (status === "missed") return styles.missedBadge;
    if (status === "snoozed") return styles.snoozedBadge;
    return styles.takenBadge;
  };

  const getStatusIcon = (status) => {
    if (status === "taken") return "✓";
    if (status === "missed") return "✕";
    if (status === "snoozed") return "💤";
    return "•";
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>📋 Medication History</h1>
        <button style={styles.exportBtn} onClick={exportToExcel}>📊 Export to Excel</button>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <h3 style={styles.statValue}>{logs.length}</h3>
          <p style={styles.statLabel}>Total Records</p>
        </div>
        <div style={{ ...styles.statCard, borderTop: "4px solid #4caf50" }}>
          <h3 style={{ ...styles.statValue, color: "#4caf50" }}>{takenCount}</h3>
          <p style={styles.statLabel}>✓ Taken</p>
        </div>
        <div style={{ ...styles.statCard, borderTop: "4px solid #ef5350" }}>
          <h3 style={{ ...styles.statValue, color: "#ef5350" }}>{missedCount}</h3>
          <p style={styles.statLabel}>✕ Missed</p>
        </div>
        <div style={{ ...styles.statCard, borderTop: "4px solid #ff9800" }}>
          <h3 style={{ ...styles.statValue, color: "#ff9800" }}>{snoozedCount}</h3>
          <p style={styles.statLabel}>💤 Snoozed</p>
        </div>
        <div style={{ ...styles.statCard, borderTop: "4px solid #1976d2" }}>
          <h3 style={{ ...styles.statValue, color: "#1976d2" }}>{adherenceScore}%</h3>
          <p style={styles.statLabel}>Adherence Score</p>
        </div>
      </div>

      <div style={styles.adherenceCard}>
        <div style={styles.adherenceHeader}>
          <span style={styles.adherenceLabel}>Overall Adherence</span>
          <span style={styles.adherenceScore}>{adherenceScore}%</span>
        </div>
        <div style={styles.progressBar}>
          <div style={{
            ...styles.progressFill,
            width: `${adherenceScore}%`,
            backgroundColor: adherenceScore >= 80 ? "#4caf50" : adherenceScore >= 50 ? "#ff9800" : "#ef5350",
          }} />
        </div>
        <p style={styles.adherenceMsg}>
          {adherenceScore >= 80 ? "🎉 Excellent! Keep up the great work!" :
            adherenceScore >= 50 ? "👍 Good progress! Try to be more consistent." :
              "⚠️ Needs improvement. Try to take medications on time."}
        </p>
      </div>

      <div style={styles.filterRow}>
        {["all", "taken", "missed", "snoozed"].map(f => (
          <button key={f}
            style={filter === f ? styles.activeFilter : styles.filterBtn}
            onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <button style={styles.refreshBtn} onClick={fetchHistory}>🔄 Refresh</button>
      </div>

      {loading && <p style={styles.loading}>Loading history...</p>}

      {!loading && filteredLogs.length === 0 && (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>📋</div>
          <p style={styles.emptyText}>No records found.</p>
          <p style={styles.emptySubtext}>Start taking medications to see history here!</p>
        </div>
      )}

      {!loading && filteredLogs.length > 0 && (
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
              {filteredLogs.map((log, i) => (
                <tr key={log.id} style={i % 2 === 0 ? styles.evenRow : styles.oddRow}>
                  <td style={styles.td}>{i + 1}</td>
                  <td style={styles.td}><strong>{log.medName}</strong></td>
                  <td style={styles.td}>
                    <span style={getStatusStyle(log.status)}>
                      {getStatusIcon(log.status)} {log.status}
                    </span>
                  </td>
                  <td style={styles.td}>{new Date(log.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && medications.length > 0 && (
        <div style={styles.pendingSection}>
          <h3 style={styles.pendingTitle}>⏳ Medications Not Yet Logged Today</h3>
          <div style={styles.pendingGrid}>
            {medications
              .filter(med => !logs.find(l => l.medId === med.id))
              .map(med => (
                <div key={med.id} style={styles.pendingCard}>
                  <span style={styles.pendingName}>{med.name}</span>
                  <span style={styles.pendingTime}>⏰ {med.reminderTime}</span>
                  <span style={styles.pendingBadge}>Not logged</span>
                </div>
              ))}
            {medications.filter(med => !logs.find(l => l.medId === med.id)).length === 0 && (
              <p style={{ color: "#888", fontSize: "14px" }}>✅ All medications have been logged!</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { padding: "32px", maxWidth: "1100px", margin: "0 auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" },
  title: { fontSize: "28px", color: "#333", margin: "0" },
  exportBtn: { backgroundColor: "#4caf50", color: "white", border: "none", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", fontSize: "15px" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "16px", marginBottom: "24px" },
  statCard: { backgroundColor: "white", padding: "20px", borderRadius: "12px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", borderTop: "4px solid #1976d2", textAlign: "center" },
  statValue: { fontSize: "28px", color: "#333", margin: "0 0 4px 0" },
  statLabel: { color: "#888", fontSize: "13px", margin: "0" },
  adherenceCard: { backgroundColor: "white", padding: "20px 24px", borderRadius: "12px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", marginBottom: "24px" },
  adherenceHeader: { display: "flex", justifyContent: "space-between", marginBottom: "8px" },
  adherenceLabel: { fontSize: "15px", color: "#333", fontWeight: "600" },
  adherenceScore: { fontSize: "15px", color: "#1976d2", fontWeight: "bold" },
  progressBar: { backgroundColor: "#f0f4f8", borderRadius: "8px", height: "12px", marginBottom: "8px" },
  progressFill: { height: "12px", borderRadius: "8px", transition: "width 0.5s ease" },
  adherenceMsg: { color: "#666", fontSize: "13px", margin: "0" },
  filterRow: { display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" },
  filterBtn: { padding: "8px 16px", borderRadius: "8px", border: "1px solid #ddd", backgroundColor: "white", cursor: "pointer", fontSize: "14px", color: "#333" },
  activeFilter: { padding: "8px 16px", borderRadius: "8px", border: "none", backgroundColor: "#1976d2", cursor: "pointer", fontSize: "14px", color: "white" },
  refreshBtn: { padding: "8px 16px", borderRadius: "8px", border: "1px solid #ddd", backgroundColor: "#f5f5f5", cursor: "pointer", fontSize: "14px", color: "#333", marginLeft: "auto" },
  loading: { textAlign: "center", color: "#888" },
  emptyState: { textAlign: "center", color: "#888", padding: "60px 40px", backgroundColor: "white", borderRadius: "12px" },
  emptyIcon: { fontSize: "48px", marginBottom: "16px" },
  emptyText: { fontSize: "18px", color: "#555", margin: "0 0 8px 0" },
  emptySubtext: { fontSize: "14px", color: "#999", margin: "0" },
  tableWrapper: { backgroundColor: "white", borderRadius: "12px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", overflow: "auto", marginBottom: "24px" },
  table: { width: "100%", borderCollapse: "collapse" },
  tableHeader: { backgroundColor: "#1976d2" },
  th: { padding: "12px 16px", color: "white", textAlign: "left", fontSize: "14px", fontWeight: "600" },
  td: { padding: "12px 16px", fontSize: "14px", color: "#333" },
  evenRow: { backgroundColor: "white" },
  oddRow: { backgroundColor: "#f9fafb" },
  takenBadge: { backgroundColor: "#e8f5e9", color: "#4caf50", padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "600" },
  missedBadge: { backgroundColor: "#fce4ec", color: "#ef5350", padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "600" },
  snoozedBadge: { backgroundColor: "#fff8e1", color: "#ff9800", padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "600" },
  pendingSection: { backgroundColor: "white", padding: "20px 24px", borderRadius: "12px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" },
  pendingTitle: { fontSize: "16px", color: "#333", margin: "0 0 16px 0" },
  pendingGrid: { display: "flex", flexDirection: "column", gap: "10px" },
  pendingCard: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", backgroundColor: "#f9fafb", borderRadius: "8px", border: "1px solid #eee" },
  pendingName: { fontWeight: "600", color: "#333", fontSize: "14px" },
  pendingTime: { color: "#888", fontSize: "13px" },
  pendingBadge: { backgroundColor: "#fff3e0", color: "#f57c00", padding: "4px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "600" },
};

export default History;