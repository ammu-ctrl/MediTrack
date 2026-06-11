import React, { useEffect, useState, useRef } from "react";

export default function Medications() {
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [alarmMed, setAlarmMed] = useState(null);
  const [snoozed, setSnoozed] = useState({});
  const firedAlarms = useRef(new Set());
  const alarmSound = useRef(null);

  const [form, setForm] = useState({
    name: "", dosage: "", frequency: "Once daily",
    reminderTime: "", notes: ""
  });

  const getHeaders = () => {
    const token = localStorage.getItem("token") || "dummy-token";
    const userId = localStorage.getItem("userId") || "guest-user";
    return {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      "X-User-ID": userId,
    };
  };

  const fetchMedications = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("http://localhost:5001/api/medications", { headers: getHeaders() });
      if (!response.ok) throw new Error("Failed to fetch medications");
      const data = await response.json();
      setMedications(data.medications || []);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addMedication = async () => {
    if (!form.name || !form.dosage || !form.reminderTime) {
      alert("Please fill in name, dosage and reminder time");
      return;
    }
    try {
      const response = await fetch("http://localhost:5001/api/medications", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(form),
      });
      if (!response.ok) throw new Error("Failed to add medication");
      setForm({ name: "", dosage: "", frequency: "Once daily", reminderTime: "", notes: "" });
      setShowForm(false);
      fetchMedications();
    } catch (err) {
      alert(err.message);
    }
  };

  const deleteMedication = async (id) => {
    if (!window.confirm("Delete this medication?")) return;
    try {
      await fetch(`http://localhost:5001/api/medications/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      fetchMedications();
    } catch (err) {
      alert("Failed to delete");
    }
  };

  const markTaken = async (id) => {
    try {
      await fetch(`http://localhost:5001/api/medications/${id}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({ status: "taken" }),
      });
      await fetch("http://localhost:5001/api/history", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ medId: id, status: "taken", timestamp: new Date().toISOString() }),
      });
      fetchMedications();
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const playSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      [0, 0.4].forEach(offset => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.5, ctx.currentTime + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.3);
        osc.start(ctx.currentTime + offset);
        osc.stop(ctx.currentTime + offset + 0.3);
      });
    } catch (e) {}
  };

  const startSound = () => {
    playSound();
    alarmSound.current = setInterval(playSound, 2500);
  };

  const stopSound = () => {
    clearInterval(alarmSound.current);
    alarmSound.current = null;
  };

  const sendWhatsApp = async (med) => {
    try {
      const userPhone = localStorage.getItem("userPhone");
      if (!userPhone) return;
      await fetch("http://localhost:5001/api/notify/sms", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ userPhone, medName: med.name, dosage: med.dosage }),
      });
    } catch (err) {
      console.error("WhatsApp notification failed:", err);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      if (now.getSeconds() !== 0) return;
      const hh = String(now.getHours()).padStart(2, "0");
      const mm = String(now.getMinutes()).padStart(2, "0");
      const current = `${hh}:${mm}`;
      medications.forEach(med => {
        const key = med.id + current;
        if (firedAlarms.current.has(key)) return;
        const snoozeUntil = snoozed[med.id];
        if (snoozeUntil && Date.now() < snoozeUntil) return;
        let medTime = med.reminderTime || "";
        if (medTime.includes("AM") || medTime.includes("PM") ||
            medTime.includes("am") || medTime.includes("pm")) {
          const [time, modifier] = medTime.toUpperCase()
            .replace("AM", "|AM").replace("PM", "|PM").split("|");
          let [h, m] = time.trim().split(":");
          h = parseInt(h);
          m = m ? m.trim() : "00";
          if (modifier === "AM" && h === 12) h = 0;
          if (modifier === "PM" && h !== 12) h += 12;
          medTime = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
        } else {
          medTime = medTime.substring(0, 5);
        }
        if (medTime === current) {
          firedAlarms.current.add(key);
          setAlarmMed(med);
          startSound();
          sendWhatsApp(med);
          if (Notification.permission === "granted") {
            new Notification("💊 MediTrack Reminder", {
              body: `Time to take ${med.name} – ${med.dosage}`,
            });
          }
        }
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [medications, snoozed]);

useEffect(() => {
    fetchMedications();
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
    // Unlock audio context on first user interaction
    const unlock = () => {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      ctx.resume();
      document.removeEventListener("click", unlock);
    };
    document.addEventListener("click", unlock);
  }, []);

  const dismissAlarm = (status) => {
    stopSound();
    if (alarmMed && status === "taken") markTaken(alarmMed.id);
    setAlarmMed(null);
  };

  const snoozeAlarm = () => {
    stopSound();
    if (alarmMed) {
      setSnoozed(prev => ({ ...prev, [alarmMed.id]: Date.now() + 5 * 60 * 1000 }));
    }
    setAlarmMed(null);
  };

  if (loading) return <div style={styles.center}>Loading medications...</div>;
  if (error) return <div style={styles.error}>Error: {error}</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>💊 Medications</h2>
        <button style={styles.addBtn} onClick={() => setShowForm(!showForm)}>
          {showForm ? "✕ Cancel" : "+ Add Medication"}
        </button>
      </div>

      {showForm && (
        <div style={styles.form}>
          <h3 style={styles.formTitle}>Add New Medication</h3>
          <input style={styles.input} placeholder="Medication Name *"
            value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <input style={styles.input} placeholder="Dosage * (e.g. 500mg)"
            value={form.dosage} onChange={e => setForm({ ...form, dosage: e.target.value })} />
          <select style={styles.input} value={form.frequency}
            onChange={e => setForm({ ...form, frequency: e.target.value })}>
            <option>Once daily</option>
            <option>Twice daily</option>
            <option>Three times daily</option>
            <option>Weekly</option>
          </select>
          <input style={styles.input} type="time"
            value={form.reminderTime} onChange={e => setForm({ ...form, reminderTime: e.target.value })} />
          <input style={styles.input} placeholder="Notes (optional)"
            value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          <button style={styles.addBtn} onClick={addMedication}>Save Medication</button>
        </div>
      )}

      {medications.length === 0 ? (
        <p style={styles.empty}>No medications added yet. Click + Add Medication to start.</p>
      ) : (
        <div style={styles.list}>
          {medications.map(med => (
            <div key={med.id} style={styles.card}>
              <div style={styles.cardInfo}>
                <h3 style={styles.medName}>{med.name}</h3>
                <p style={styles.medDetail}>💊 {med.dosage}</p>
                <p style={styles.medDetail}>🔁 {med.frequency}</p>
                <p style={styles.medDetail}>⏰ {med.reminderTime}</p>
                {med.notes && <p style={styles.medDetail}>📝 {med.notes}</p>}
                <span style={med.status === "taken" ? styles.badgeTaken : styles.badgePending}>
                  {med.status === "taken" ? "✓ Taken" : "⏳ Pending"}
                </span>
              </div>
              <div style={styles.cardActions}>
                <button style={styles.takenBtn} onClick={() => markTaken(med.id)}>✓ Taken</button>
                <button style={styles.deleteBtn} onClick={() => deleteMedication(med.id)}>🗑 Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {alarmMed && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalBox}>
            <div style={styles.bellIcon}>🔔</div>
            <h2 style={styles.modalTitle}>MediTrack Reminder</h2>
            <p style={styles.modalMed}>{alarmMed.name}</p>
            <p style={styles.modalDetail}>{alarmMed.dosage} • {alarmMed.frequency}</p>
            <p style={styles.modalHint}>Check your WhatsApp for reminder!</p>
            <button style={styles.takenBtn} onClick={() => dismissAlarm("taken")}>✓ Mark as Taken</button>
            <button style={styles.snoozeBtn} onClick={snoozeAlarm}>💤 Snooze 5 min</button>
            <button style={styles.dismissBtn} onClick={() => dismissAlarm("missed")}>✕ Dismiss</button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { maxWidth: "800px", margin: "0 auto", padding: "24px" },
  center: { textAlign: "center", padding: "40px", color: "#666" },
  error: { textAlign: "center", padding: "40px", color: "red" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" },
  title: { fontSize: "24px", color: "#1976d2" },
  addBtn: { background: "#1976d2", color: "white", border: "none", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", fontSize: "14px" },
  form: { background: "#f0f4f8", padding: "24px", borderRadius: "12px", marginBottom: "24px" },
  formTitle: { marginBottom: "16px", color: "#333" },
  input: { width: "100%", padding: "10px 12px", marginBottom: "12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "14px", boxSizing: "border-box" },
  list: { display: "flex", flexDirection: "column", gap: "16px" },
  card: { background: "white", border: "1px solid #e0e0e0", borderRadius: "12px", padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
  cardInfo: { flex: 1 },
  medName: { fontSize: "18px", color: "#333", marginBottom: "8px" },
  medDetail: { fontSize: "14px", color: "#666", margin: "4px 0" },
  cardActions: { display: "flex", flexDirection: "column", gap: "8px", marginLeft: "16px" },
  takenBtn: { background: "#1976d2", color: "white", border: "none", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontSize: "13px", width: "100%", marginBottom: "4px" },
  deleteBtn: { background: "#ff5252", color: "white", border: "none", padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontSize: "13px", width: "100%" },
  badgeTaken: { display: "inline-block", background: "#e8f5e9", color: "#388e3c", padding: "4px 10px", borderRadius: "20px", fontSize: "12px", marginTop: "8px" },
  badgePending: { display: "inline-block", background: "#fff3e0", color: "#f57c00", padding: "4px 10px", borderRadius: "20px", fontSize: "12px", marginTop: "8px" },
  empty: { textAlign: "center", color: "#999", padding: "40px" },
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 },
  modalBox: { background: "white", borderRadius: "16px", padding: "40px 32px", textAlign: "center", maxWidth: "360px", width: "90%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" },
  bellIcon: { fontSize: "52px", marginBottom: "12px", display: "block" },
  modalTitle: { fontSize: "22px", color: "#333", marginBottom: "12px" },
  modalMed: { fontSize: "20px", color: "#1976d2", fontWeight: "700", marginBottom: "6px" },
  modalDetail: { fontSize: "14px", color: "#888", marginBottom: "8px" },
  modalHint: { fontSize: "12px", color: "#43a047", marginBottom: "20px" },
  snoozeBtn: { background: "#fff3cd", color: "#856404", border: "1px solid #ffc107", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", fontSize: "14px", width: "100%", marginBottom: "8px" },
  dismissBtn: { background: "none", color: "#aaa", border: "1px solid #ddd", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", fontSize: "14px", width: "100%" },
};