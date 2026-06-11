// src/pages/Home.jsx

import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { auth } from "../firebase.config";

function Home() {
  const { user } = useSelector(state => state.auth);
  const [stats, setStats] = useState({
    totalMeds: 0,
    takenToday: 0,
    missedToday: 0,
    adherenceScore: 0,
  });

  const healthTips = [
    "💡 Taking your medications at the same time every day helps maintain consistent levels in your body and improves effectiveness.",
    "💧 Drink at least 8 glasses of water daily. Staying hydrated helps medications work better.",
    "🏃 Just 30 minutes of walking daily can significantly improve your heart health and mood.",
    "😴 Getting 7-9 hours of sleep helps your body heal and medications work more effectively.",
    "🥗 Eating a balanced diet rich in vegetables and proteins supports your overall health and recovery.",
    "🧘 Managing stress through deep breathing or meditation can lower blood pressure naturally.",
  ];

  const todayTip = healthTips[new Date().getDay() % healthTips.length];

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

  const fetchStats = async () => {
    try {
      const headers = await getHeaders();
      const response = await fetch("http://localhost:5001/api/history", { headers });
      if (!response.ok) return;
      const data = await response.json();
      const logs = data.intakeLogs || [];
      const medications = data.medications || [];

      const today = new Date().toISOString().split("T")[0];
      const todayLogs = logs.filter(l => {
        const logDate = new Date(l.timestamp).toISOString().split("T")[0];
        return logDate === today;
      });

      const taken = todayLogs.filter(l => l.status === "taken").length;
      const missed = todayLogs.filter(l => l.status === "missed").length;

      setStats({
        totalMeds: medications.length,
        takenToday: taken,
        missedToday: missed,
        adherenceScore: 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  useEffect(() => {
    if (user) fetchStats();
  }, [user]);

  const userName = localStorage.getItem("userName") || user?.displayName || "User";

  return (
    <div style={styles.container}>

      {/* Welcome */}
      <div style={styles.welcomeSection}>
        <div>
          <h1 style={styles.welcome}>Welcome back, {userName} 👋</h1>
          <p style={styles.date}>
            {new Date().toLocaleDateString("en-US", {
              weekday: "long", year: "numeric",
              month: "long", day: "numeric",
            })}
          </p>
        </div>
        <div style={styles.brandBadge}>
          <span style={styles.brandIcon}>💊</span>
          <span style={styles.brandName}>MediTrack</span>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={styles.grid}>
        <div style={styles.card}>
          <div style={styles.cardIcon}>💊</div>
          <h3 style={styles.cardValue}>{stats.totalMeds}</h3>
          <p style={styles.cardLabel}>Total Medications</p>
        </div>
        <div style={{ ...styles.card, borderTop: "4px solid #4caf50" }}>
          <div style={styles.cardIcon}>✅</div>
          <h3 style={{ ...styles.cardValue, color: "#4caf50" }}>{stats.takenToday}</h3>
          <p style={styles.cardLabel}>Taken Today</p>
        </div>
        <div style={{ ...styles.card, borderTop: "4px solid #ef5350" }}>
          <div style={styles.cardIcon}>❌</div>
          <h3 style={{ ...styles.cardValue, color: "#ef5350" }}>{stats.missedToday}</h3>
          <p style={styles.cardLabel}>Missed Today</p>
        </div>
      </div>

      {/* Health Tip */}
      <h2 style={styles.sectionTitle}>Health Tip of the Day</h2>
      <div style={styles.tipCard}>
        <p style={styles.tipText}>{todayTip}</p>
      </div>

      {/* MediTrack Features */}
      <h2 style={styles.sectionTitle}>What MediTrack Does For You</h2>
      <div style={styles.featuresGrid}>
        <div style={styles.featureCard}>
          <div style={styles.featureIcon}>📱</div>
          <h3 style={styles.featureTitle}>WhatsApp Reminders</h3>
          <p style={styles.featureDesc}>Get WhatsApp notifications when it is time to take your medication</p>
        </div>
        <div style={styles.featureCard}>
          <div style={styles.featureIcon}>📊</div>
          <h3 style={styles.featureTitle}>Caregiver Reports</h3>
          <p style={styles.featureDesc}>Send medication history Excel reports to your caregiver automatically</p>
        </div>
        <div style={styles.featureCard}>
          <div style={styles.featureIcon}>🥗</div>
          <h3 style={styles.featureTitle}>Personalized Diet</h3>
          <p style={styles.featureDesc}>Get diet plans based on your health condition and test results</p>
        </div>
        <div style={styles.featureCard}>
          <div style={styles.featureIcon}>💬</div>
          <h3 style={styles.featureTitle}>Health Assistant</h3>
          <p style={styles.featureDesc}>Chat with MediTrack assistant for health tips and medication info</p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { padding: "32px", maxWidth: "1100px", margin: "0 auto" },
  welcomeSection: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", flexWrap: "wrap", gap: "16px" },
  welcome: { fontSize: "28px", color: "#333", margin: "0 0 4px 0" },
  date: { color: "#888", fontSize: "15px", margin: "0" },
  brandBadge: { display: "flex", alignItems: "center", gap: "8px", backgroundColor: "#1976d2", color: "white", padding: "10px 20px", borderRadius: "30px" },
  brandIcon: { fontSize: "20px" },
  brandName: { fontSize: "18px", fontWeight: "700", letterSpacing: "1px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px", marginBottom: "32px" },
  card: { backgroundColor: "white", padding: "24px", borderRadius: "12px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", borderTop: "4px solid #1976d2", textAlign: "center" },
  cardIcon: { fontSize: "32px", marginBottom: "8px" },
  cardValue: { fontSize: "32px", color: "#333", margin: "0 0 4px 0" },
  cardLabel: { color: "#888", fontSize: "14px", margin: "0" },
  sectionTitle: { fontSize: "20px", color: "#333", margin: "0 0 16px 0" },
  tipCard: { backgroundColor: "#e3f2fd", padding: "20px 24px", borderRadius: "12px", borderLeft: "4px solid #1976d2", marginBottom: "32px" },
  tipText: { color: "#333", fontSize: "15px", margin: "0", lineHeight: "1.6" },
  featuresGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "24px" },
  featureCard: { backgroundColor: "white", padding: "20px", borderRadius: "12px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", textAlign: "center" },
  featureIcon: { fontSize: "36px", marginBottom: "12px" },
  featureTitle: { fontSize: "16px", color: "#333", margin: "0 0 8px 0" },
  featureDesc: { fontSize: "13px", color: "#888", margin: "0", lineHeight: "1.5" },
};

export default Home;