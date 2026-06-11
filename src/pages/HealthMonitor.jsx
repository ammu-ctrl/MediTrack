// src/pages/HealthMonitor.jsx

import React, { useState } from "react";

// ═══════════════════════════════════════
// ANOMALY DETECTION — Z-Score Algorithm
// ═══════════════════════════════════════

const NORMAL_RANGES = {
  bloodSugar: { mean: 90, std: 15, unit: "mg/dL", label: "Blood Sugar" },
  systolic: { mean: 115, std: 12, unit: "mmHg", label: "Systolic BP" },
  diastolic: { mean: 75, std: 10, unit: "mmHg", label: "Diastolic BP" },
  heartRate: { mean: 72, std: 10, unit: "bpm", label: "Heart Rate" },
  temperature: { mean: 98.6, std: 0.7, unit: "°F", label: "Temperature" },
};

function calculateZScore(value, mean, std) {
  return Math.abs((value - mean) / std);
}

function getAnomalyStatus(zScore) {
  if (zScore < 1.5) return { status: "Normal", color: "#4caf50", bg: "#e8f5e9", icon: "✅" };
  if (zScore < 2.5) return { status: "Warning", color: "#ff9800", bg: "#fff3e0", icon: "⚠️" };
  return { status: "Critical", color: "#ef5350", bg: "#fce4ec", icon: "🚨" };
}

// ═══════════════════════════════════════
// SYMPTOM CHECKER — Naive Bayes Style
// ═══════════════════════════════════════

const DISEASES = {
  "Common Cold": {
    icon: "🤧",
    symptoms: ["runny nose", "sneezing", "sore throat", "cough", "mild fever", "fatigue", "headache"],
    advice: "Rest, drink warm fluids, take paracetamol for fever. See doctor if symptoms persist more than 7 days.",
    severity: "mild",
  },
  "Influenza (Flu)": {
    icon: "🤒",
    symptoms: ["high fever", "body aches", "fatigue", "headache", "cough", "chills", "sweating"],
    advice: "Rest completely, stay hydrated, take antiviral medication if prescribed. See doctor immediately.",
    severity: "moderate",
  },
  "Hypertension": {
    icon: "❤️",
    symptoms: ["headache", "dizziness", "blurred vision", "chest pain", "shortness of breath", "nosebleed"],
    advice: "Monitor BP regularly, reduce salt, exercise, take prescribed medications. See doctor immediately.",
    severity: "serious",
  },
  "Diabetes": {
    icon: "🩺",
    symptoms: ["frequent urination", "excessive thirst", "fatigue", "blurred vision", "slow healing", "weight loss"],
    advice: "Monitor blood sugar, follow diet plan, take medications on time. Consult doctor for blood tests.",
    severity: "serious",
  },
  "Migraine": {
    icon: "🧠",
    symptoms: ["severe headache", "nausea", "vomiting", "sensitivity to light", "sensitivity to sound", "blurred vision"],
    advice: "Rest in dark quiet room, take prescribed pain relievers, apply cold compress. See neurologist.",
    severity: "moderate",
  },
  "Gastritis": {
    icon: "🫃",
    symptoms: ["stomach pain", "nausea", "vomiting", "bloating", "loss of appetite", "indigestion", "burning sensation"],
    advice: "Eat small meals, avoid spicy foods, take antacids. See doctor if bleeding or severe pain.",
    severity: "moderate",
  },
  "Anemia": {
    icon: "🩸",
    symptoms: ["fatigue", "weakness", "pale skin", "shortness of breath", "dizziness", "cold hands", "headache"],
    advice: "Eat iron-rich foods, take iron supplements if prescribed. Get blood test for confirmation.",
    severity: "moderate",
  },
  "COVID-19": {
    icon: "🦠",
    symptoms: ["fever", "cough", "shortness of breath", "fatigue", "loss of smell", "loss of taste", "body aches", "sore throat"],
    advice: "Isolate immediately, get tested, monitor oxygen levels. Seek emergency care if breathing difficulty.",
    severity: "serious",
  },
  "Allergic Reaction": {
    icon: "🌿",
    symptoms: ["sneezing", "runny nose", "itchy eyes", "skin rash", "hives", "swelling", "cough"],
    advice: "Avoid allergen, take antihistamines. Seek emergency care if throat swelling or breathing difficulty.",
    severity: "mild",
  },
  "Pneumonia": {
    icon: "🫁",
    symptoms: ["high fever", "cough", "chest pain", "shortness of breath", "fatigue", "chills", "sweating"],
    advice: "Seek immediate medical attention. Requires antibiotics and possibly hospitalization.",
    severity: "serious",
  },
};

const ALL_SYMPTOMS = [
  "fever", "high fever", "mild fever", "cough", "headache", "severe headache",
  "fatigue", "weakness", "nausea", "vomiting", "body aches", "chills",
  "sore throat", "runny nose", "sneezing", "shortness of breath", "chest pain",
  "dizziness", "blurred vision", "stomach pain", "bloating", "loss of appetite",
  "frequent urination", "excessive thirst", "weight loss", "skin rash", "hives",
  "swelling", "pale skin", "cold hands", "itchy eyes", "loss of smell",
  "loss of taste", "sweating", "indigestion", "burning sensation", "nosebleed",
  "sensitivity to light", "sensitivity to sound", "slow healing",
];

function predictDiseases(selectedSymptoms) {
  if (selectedSymptoms.length === 0) return [];

  const results = Object.entries(DISEASES).map(([disease, data]) => {
    const matchedSymptoms = selectedSymptoms.filter(s => data.symptoms.includes(s));
    const probability = (matchedSymptoms.length / data.symptoms.length) * 100;
    const coverage = (matchedSymptoms.length / selectedSymptoms.length) * 100;
    const score = (probability + coverage) / 2;

    return {
      disease,
      icon: data.icon,
      score: Math.round(score),
      matchedSymptoms,
      totalSymptoms: data.symptoms.length,
      advice: data.advice,
      severity: data.severity,
    };
  });

  return results
    .filter(r => r.score > 10)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

// ═══════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════

export default function HealthMonitor() {
  const [activeTab, setActiveTab] = useState("anomaly");

  // Anomaly Detection State
  const [readings, setReadings] = useState({
    bloodSugar: "", systolic: "", diastolic: "",
    heartRate: "", temperature: "",
  });
  const [anomalyResults, setAnomalyResults] = useState(null);
  const [readingHistory, setReadingHistory] = useState([]);

  // Symptom Checker State
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [predictions, setPredictions] = useState(null);
  const [symptomInput, setSymptomInput] = useState("");

  // ── ANOMALY DETECTION ──
  const analyzeReadings = () => {
    const results = {};
    let hasCritical = false;
    let hasWarning = false;

    Object.entries(NORMAL_RANGES).forEach(([key, range]) => {
      const value = parseFloat(readings[key]);
      if (!value) return;

      const zScore = calculateZScore(value, range.mean, range.std);
      const status = getAnomalyStatus(zScore);
      results[key] = { value, zScore: zScore.toFixed(2), ...status, ...range };

      if (status.status === "Critical") hasCritical = true;
      if (status.status === "Warning") hasWarning = true;
    });

    const overallStatus = hasCritical ? "Critical" : hasWarning ? "Warning" : "Normal";

    // Save to history
    const historyEntry = {
      id: Date.now(),
      time: new Date().toLocaleString(),
      readings: { ...readings },
      overallStatus,
    };
    setReadingHistory(prev => [historyEntry, ...prev.slice(0, 4)]);
    setAnomalyResults({ results, overallStatus });
  };

  // ── SYMPTOM CHECKER ──
  const toggleSymptom = (symptom) => {
    setSelectedSymptoms(prev =>
      prev.includes(symptom)
        ? prev.filter(s => s !== symptom)
        : [...prev, symptom]
    );
    setPredictions(null);
  };

  const addCustomSymptom = () => {
    const s = symptomInput.trim().toLowerCase();
    if (s && !selectedSymptoms.includes(s)) {
      setSelectedSymptoms(prev => [...prev, s]);
      setSymptomInput("");
      setPredictions(null);
    }
  };

  const analyzeSymptoms = () => {
    const results = predictDiseases(selectedSymptoms);
    setPredictions(results);
  };

  const getSeverityStyle = (severity) => {
    if (severity === "mild") return { bg: "#e8f5e9", color: "#2e7d32", label: "Mild" };
    if (severity === "moderate") return { bg: "#fff3e0", color: "#e65100", label: "Moderate" };
    return { bg: "#fce4ec", color: "#c62828", label: "Serious — See Doctor" };
  };

  const filteredSymptoms = ALL_SYMPTOMS.filter(s =>
    s.includes(symptomInput.toLowerCase()) && !selectedSymptoms.includes(s)
  );

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🔬 Health Monitor</h1>
      </div>

     

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          style={activeTab === "anomaly" ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab("anomaly")}>
          📊 Anomaly Detection
        </button>
        <button
          style={activeTab === "symptom" ? styles.activeTab : styles.tab}
          onClick={() => setActiveTab("symptom")}>
          🩺 Symptom Checker
        </button>
      </div>

      {/* ── ANOMALY DETECTION TAB ── */}
      {activeTab === "anomaly" && (
        <div>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>📊 Enter Your Health Readings</h2>


            <div style={styles.formGrid}>
              {Object.entries(NORMAL_RANGES).map(([key, range]) => (
                <div key={key} style={styles.inputGroup}>
                  <label style={styles.label}>{range.label} ({range.unit})</label>
                  <input
                    style={styles.input}
                    type="number"
                    placeholder={`Normal: ~${range.mean}`}
                    value={readings[key]}
                    onChange={e => setReadings({ ...readings, [key]: e.target.value })}
                  />
                </div>
              ))}
            </div>

            <button style={styles.analyzeBtn} onClick={analyzeReadings}>
              🔍 Analyze 
            </button>
          </div>

          {/* Results */}
          {anomalyResults && (
            <div>
              <div style={{
                ...styles.overallStatus,
                backgroundColor: anomalyResults.overallStatus === "Critical" ? "#fce4ec" :
                  anomalyResults.overallStatus === "Warning" ? "#fff3e0" : "#e8f5e9",
                borderLeft: `4px solid ${anomalyResults.overallStatus === "Critical" ? "#ef5350" :
                  anomalyResults.overallStatus === "Warning" ? "#ff9800" : "#4caf50"}`
              }}>
                <strong>Overall Status: {anomalyResults.overallStatus === "Critical" ? "🚨 Critical" :
                  anomalyResults.overallStatus === "Warning" ? "⚠️ Warning" : "✅ Normal"}</strong>
                {anomalyResults.overallStatus === "Critical" && (
                  <p style={styles.criticalMsg}>Please consult your doctor immediately!</p>
                )}
              </div>

              <div style={styles.resultsGrid}>
                {Object.entries(anomalyResults.results).map(([key, result]) => (
                  <div key={key} style={{ ...styles.resultCard, backgroundColor: result.bg, borderLeft: `4px solid ${result.color}` }}>
                    <div style={styles.resultHeader}>
                      <span style={styles.resultIcon}>{result.icon}</span>
                      <span style={styles.resultLabel}>{result.label}</span>
                      <span style={{ ...styles.resultStatus, color: result.color }}>{result.status}</span>
                    </div>
                    <div style={styles.resultValue}>{result.value} {result.unit}</div>
                    <div style={styles.resultZScore}>Z-Score: {result.zScore} {parseFloat(result.zScore) > 2.5 ? "🚨" : parseFloat(result.zScore) > 1.5 ? "⚠️" : "✅"}</div>
                    <div style={styles.resultNormal}>Normal: ~{result.mean} {result.unit}</div>
                  </div>
                ))}
              </div>

              {/* How it works */}
              
            </div>
          )}

          {/* Reading History */}
          {readingHistory.length > 0 && (
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>📈 Reading History</h3>
              {readingHistory.map(h => (
                <div key={h.id} style={styles.historyItem}>
                  <span style={styles.historyTime}>{h.time}</span>
                  <span style={{
                    ...styles.historyStatus,
                    color: h.overallStatus === "Critical" ? "#ef5350" :
                      h.overallStatus === "Warning" ? "#ff9800" : "#4caf50"
                  }}>
                    {h.overallStatus === "Critical" ? "🚨" : h.overallStatus === "Warning" ? "⚠️" : "✅"} {h.overallStatus}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── SYMPTOM CHECKER TAB ── */}
      {activeTab === "symptom" && (
        <div>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>🩺 Symptom Checker</h2>

            {/* Search and add symptoms */}
            <div style={styles.symptomSearch}>
              <input
                style={styles.symptomInput}
                placeholder="Type a symptom..."
                value={symptomInput}
                onChange={e => setSymptomInput(e.target.value)}
                onKeyPress={e => e.key === "Enter" && addCustomSymptom()}
              />
              <button style={styles.addSymptomBtn} onClick={addCustomSymptom}>+ Add</button>
            </div>

            {/* Suggestions */}
            {symptomInput && filteredSymptoms.length > 0 && (
              <div style={styles.suggestions}>
                {filteredSymptoms.slice(0, 6).map(s => (
                  <button key={s} style={styles.suggestionBtn} onClick={() => {
                    toggleSymptom(s);
                    setSymptomInput("");
                  }}>
                    + {s}
                  </button>
                ))}
              </div>
            )}

            {/* Common Symptoms Grid */}
            <h3 style={styles.sectionLabel}>Common Symptoms:</h3>
            <div style={styles.symptomsGrid}>
              {ALL_SYMPTOMS.slice(0, 24).map(symptom => (
                <button
                  key={symptom}
                  style={{
                    ...styles.symptomChip,
                    ...(selectedSymptoms.includes(symptom) ? styles.symptomChipSelected : {})
                  }}
                  onClick={() => toggleSymptom(symptom)}>
                  {selectedSymptoms.includes(symptom) ? "✓ " : ""}{symptom}
                </button>
              ))}
            </div>

            {/* Selected Symptoms */}
            {selectedSymptoms.length > 0 && (
              <div style={styles.selectedBox}>
                <strong>Selected Symptoms ({selectedSymptoms.length}):</strong>
                <div style={styles.selectedChips}>
                  {selectedSymptoms.map(s => (
                    <span key={s} style={styles.selectedChip}>
                      {s} <button style={styles.removeBtn} onClick={() => toggleSymptom(s)}>✕</button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button
              style={selectedSymptoms.length === 0 ? styles.analyzeBtnDisabled : styles.analyzeBtn}
              onClick={analyzeSymptoms}
              disabled={selectedSymptoms.length === 0}>
              🤖 Predict Possible Conditions
            </button>
          </div>

          {/* Predictions */}
          {predictions && (
            <div>
              <h2 style={styles.predictionsTitle}>
                {predictions.length > 0 ? "🔍 Predicted Conditions" : "No strong matches found"}
              </h2>

              {predictions.length === 0 && (
                <div style={styles.noPrediction}>
                  Your symptoms do not strongly match any known condition. Please consult a doctor for proper diagnosis.
                </div>
              )}

              {predictions.map((pred, i) => {
                const sev = getSeverityStyle(pred.severity);
                return (
                  <div key={i} style={styles.predictionCard}>
                    <div style={styles.predictionHeader}>
                      <span style={styles.predictionRank}>#{i + 1}</span>
                      <span style={styles.predictionIcon}>{pred.icon}</span>
                      <div style={styles.predictionInfo}>
                        <h3 style={styles.predictionName}>{pred.disease}</h3>
                        <span style={{ ...styles.severityBadge, backgroundColor: sev.bg, color: sev.color }}>
                          {sev.label}
                        </span>
                      </div>
                      <div style={styles.predictionScore}>
                        <div style={styles.scoreValue}>{pred.score}%</div>
                        <div style={styles.scoreLabel}>Match</div>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div style={styles.progressBar}>
                      <div style={{
                        ...styles.progressFill,
                        width: `${pred.score}%`,
                        backgroundColor: pred.score > 60 ? "#ef5350" : pred.score > 30 ? "#ff9800" : "#4caf50"
                      }} />
                    </div>

                    <div style={styles.matchedSymptoms}>
                      <strong>Matched symptoms:</strong> {pred.matchedSymptoms.join(", ")}
                    </div>

                    <div style={{ ...styles.adviceBox, backgroundColor: sev.bg }}>
                      <strong>💡 Advice:</strong> {pred.advice}
                    </div>
                  </div>
                );
              })}

             

              
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { padding: "32px", maxWidth: "1100px", margin: "0 auto" },
  header: { marginBottom: "16px" },
  title: { fontSize: "28px", color: "#333", margin: "0 0 8px 0" },
  subtitle: { color: "#666", fontSize: "15px", margin: 0 },
  mlBadge: { display: "flex", flexDirection: "column", gap: "4px", backgroundColor: "#e8eaf6", padding: "12px 20px", borderRadius: "8px", marginBottom: "24px", borderLeft: "4px solid #3f51b5" },
  mlBadgeSub: { fontSize: "12px", color: "#666" },
  tabs: { display: "flex", gap: "8px", marginBottom: "24px" },
  tab: { padding: "12px 24px", borderRadius: "8px", border: "1px solid #ddd", backgroundColor: "white", cursor: "pointer", fontSize: "15px", color: "#333" },
  activeTab: { padding: "12px 24px", borderRadius: "8px", border: "none", backgroundColor: "#1976d2", cursor: "pointer", fontSize: "15px", color: "white", fontWeight: "600" },
  card: { backgroundColor: "white", padding: "28px", borderRadius: "12px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", marginBottom: "24px" },
  cardTitle: { fontSize: "20px", color: "#333", margin: "0 0 8px 0" },
  cardSubtitle: { color: "#888", fontSize: "14px", margin: "0 0 24px 0" },
  formGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" },
  inputGroup: { display: "flex", flexDirection: "column", gap: "4px" },
  label: { fontSize: "14px", color: "#333", fontWeight: "500" },
  input: { padding: "10px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "14px" },
  analyzeBtn: { backgroundColor: "#1976d2", color: "white", border: "none", padding: "14px 32px", borderRadius: "8px", cursor: "pointer", fontSize: "16px", width: "100%" },
  analyzeBtnDisabled: { backgroundColor: "#90caf9", color: "white", border: "none", padding: "14px 32px", borderRadius: "8px", cursor: "not-allowed", fontSize: "16px", width: "100%" },
  overallStatus: { padding: "16px 20px", borderRadius: "8px", marginBottom: "20px" },
  criticalMsg: { color: "#ef5350", margin: "4px 0 0 0", fontSize: "14px" },
  resultsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" },
  resultCard: { padding: "16px", borderRadius: "12px" },
  resultHeader: { display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" },
  resultIcon: { fontSize: "20px" },
  resultLabel: { flex: 1, fontSize: "14px", fontWeight: "600", color: "#333" },
  resultStatus: { fontSize: "13px", fontWeight: "700" },
  resultValue: { fontSize: "24px", fontWeight: "bold", color: "#333", marginBottom: "4px" },
  resultZScore: { fontSize: "13px", color: "#666", marginBottom: "2px" },
  resultNormal: { fontSize: "12px", color: "#999" },
  algoBox: { backgroundColor: "#e8eaf6", padding: "16px 20px", borderRadius: "8px", marginBottom: "24px" },
  algoTitle: { fontSize: "15px", color: "#3f51b5", margin: "0 0 8px 0" },
  algoText: { fontSize: "13px", color: "#444", margin: "0 0 8px 0", fontFamily: "monospace" },
  algoLegend: { display: "flex", gap: "20px", fontSize: "13px", fontWeight: "600" },
  historyItem: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f0f0f0" },
  historyTime: { fontSize: "13px", color: "#666" },
  historyStatus: { fontSize: "13px", fontWeight: "600" },
  symptomSearch: { display: "flex", gap: "8px", marginBottom: "12px" },
  symptomInput: { flex: 1, padding: "10px 14px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "14px" },
  addSymptomBtn: { backgroundColor: "#1976d2", color: "white", border: "none", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", fontSize: "14px" },
  suggestions: { display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "16px" },
  suggestionBtn: { backgroundColor: "#e3f2fd", color: "#1976d2", border: "1px solid #90caf9", padding: "4px 12px", borderRadius: "20px", cursor: "pointer", fontSize: "13px" },
  sectionLabel: { fontSize: "14px", color: "#666", margin: "0 0 12px 0" },
  symptomsGrid: { display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "20px" },
  symptomChip: { backgroundColor: "#f5f5f5", color: "#333", border: "1px solid #ddd", padding: "6px 14px", borderRadius: "20px", cursor: "pointer", fontSize: "13px" },
  symptomChipSelected: { backgroundColor: "#1976d2", color: "white", border: "1px solid #1976d2" },
  selectedBox: { backgroundColor: "#e3f2fd", padding: "12px 16px", borderRadius: "8px", marginBottom: "16px" },
  selectedChips: { display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px" },
  selectedChip: { backgroundColor: "#1976d2", color: "white", padding: "4px 10px", borderRadius: "20px", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" },
  removeBtn: { background: "none", border: "none", color: "white", cursor: "pointer", fontSize: "12px", padding: "0" },
  predictionsTitle: { fontSize: "20px", color: "#333", margin: "0 0 16px 0" },
  noPrediction: { backgroundColor: "#fff3e0", padding: "16px", borderRadius: "8px", color: "#e65100", marginBottom: "16px" },
  predictionCard: { backgroundColor: "white", padding: "20px", borderRadius: "12px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", marginBottom: "16px" },
  predictionHeader: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" },
  predictionRank: { width: "28px", height: "28px", borderRadius: "50%", backgroundColor: "#1976d2", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: "bold", flexShrink: 0 },
  predictionIcon: { fontSize: "32px" },
  predictionInfo: { flex: 1 },
  predictionName: { fontSize: "18px", color: "#333", margin: "0 0 4px 0" },
  severityBadge: { padding: "2px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600" },
  predictionScore: { textAlign: "center" },
  scoreValue: { fontSize: "24px", fontWeight: "bold", color: "#1976d2" },
  scoreLabel: { fontSize: "12px", color: "#888" },
  progressBar: { backgroundColor: "#f0f4f8", borderRadius: "8px", height: "8px", marginBottom: "12px" },
  progressFill: { height: "8px", borderRadius: "8px", transition: "width 0.5s ease" },
  matchedSymptoms: { fontSize: "13px", color: "#666", marginBottom: "12px" },
  adviceBox: { padding: "12px 16px", borderRadius: "8px", fontSize: "14px", color: "#333" },
  disclaimer: { backgroundColor: "#fff8e1", padding: "16px", borderRadius: "8px", fontSize: "13px", color: "#5d4037", marginTop: "16px" },
};