// src/pages/Exercise.jsx

import React, { useState } from "react";

function Exercise() {
  const [level, setLevel] = useState("beginner");
  const [condition, setCondition] = useState("general");

  const exercisePlans = {
    general: {
      beginner: [
        { name: "Morning Walk", duration: "20 mins", time: "6:00 AM", description: "Brisk walk in fresh air. Start slow and gradually increase pace.", icon: "🚶" },
        { name: "Surya Namaskar", duration: "10 mins", time: "6:30 AM", description: "5 rounds of Surya Namaskar. Great for full body stretching.", icon: "🧘" },
        { name: "Deep Breathing", duration: "5 mins", time: "7:00 AM", description: "Anulom Vilom and Kapalbhati pranayama for lung health.", icon: "🌬️" },
        { name: "Evening Walk", duration: "15 mins", time: "6:00 PM", description: "Light evening walk after dinner helps digestion.", icon: "🌅" },
      ],
      intermediate: [
        { name: "Jogging", duration: "30 mins", time: "6:00 AM", description: "Jog at a comfortable pace. Maintain steady breathing throughout.", icon: "🏃" },
        { name: "Surya Namaskar", duration: "15 mins", time: "6:30 AM", description: "10 rounds of Surya Namaskar for strength and flexibility.", icon: "🧘" },
        { name: "Bodyweight Exercises", duration: "20 mins", time: "7:00 AM", description: "20 squats, 15 pushups, 20 lunges, 30 second plank.", icon: "💪" },
        { name: "Evening Yoga", duration: "20 mins", time: "6:00 PM", description: "Gentle yoga stretches to relax muscles after the day.", icon: "🧘" },
      ],
      advanced: [
        { name: "Running", duration: "45 mins", time: "6:00 AM", description: "Run at moderate to fast pace. Include intervals for better results.", icon: "🏃" },
        { name: "Strength Training", duration: "30 mins", time: "7:00 AM", description: "40 squats, 30 pushups, 20 pullups, 1 min plank, lunges.", icon: "💪" },
        { name: "Cycling", duration: "30 mins", time: "5:00 PM", description: "Cycle in your area or use a stationary cycle for cardio.", icon: "🚴" },
        { name: "Night Yoga", duration: "15 mins", time: "8:00 PM", description: "Relaxing yoga and stretching before bed for recovery.", icon: "🧘" },
      ],
    },
    diabetes: {
      beginner: [
        { name: "Morning Walk", duration: "30 mins", time: "6:00 AM", description: "Walk after breakfast helps control blood sugar levels effectively.", icon: "🚶" },
        { name: "Leg Exercises", duration: "10 mins", time: "10:00 AM", description: "Seated leg raises and ankle rotations. Good for circulation.", icon: "🦵" },
        { name: "Pranayama", duration: "10 mins", time: "6:00 PM", description: "Anulom Vilom breathing reduces stress and helps blood sugar.", icon: "🌬️" },
        { name: "Post Dinner Walk", duration: "15 mins", time: "8:00 PM", description: "Light walk after dinner significantly lowers blood sugar.", icon: "🌙" },
      ],
      intermediate: [
        { name: "Brisk Walking", duration: "40 mins", time: "6:00 AM", description: "Fast-paced walk. Check blood sugar before and after exercise.", icon: "🚶" },
        { name: "Resistance Band", duration: "20 mins", time: "10:00 AM", description: "Light resistance band exercises to build muscle and control sugar.", icon: "💪" },
        { name: "Swimming", duration: "30 mins", time: "5:00 PM", description: "Swimming is excellent low-impact exercise for diabetics.", icon: "🏊" },
        { name: "Post Dinner Walk", duration: "20 mins", time: "8:00 PM", description: "Brisk walk after dinner for better blood sugar management.", icon: "🌙" },
      ],
      advanced: [
        { name: "Jogging", duration: "30 mins", time: "6:00 AM", description: "Moderate jogging. Always carry glucose tablets while exercising.", icon: "🏃" },
        { name: "Strength Training", duration: "30 mins", time: "7:00 AM", description: "Moderate weight training helps improve insulin sensitivity.", icon: "💪" },
        { name: "Cycling", duration: "30 mins", time: "5:00 PM", description: "Cycling improves cardiovascular health and manages blood sugar.", icon: "🚴" },
        { name: "Yoga", duration: "20 mins", time: "8:00 PM", description: "Yoga poses like Vajrasana after meals help digestion and sugar.", icon: "🧘" },
      ],
    },
    hypertension: {
      beginner: [
        { name: "Morning Walk", duration: "20 mins", time: "6:00 AM", description: "Gentle walk. Avoid exertion. Monitor BP before exercise.", icon: "🚶" },
        { name: "Deep Breathing", duration: "10 mins", time: "7:00 AM", description: "Slow deep breathing reduces blood pressure naturally.", icon: "🌬️" },
        { name: "Gentle Stretching", duration: "10 mins", time: "10:00 AM", description: "Light stretching to keep muscles flexible. No strain.", icon: "🤸" },
        { name: "Evening Walk", duration: "15 mins", time: "6:00 PM", description: "Relaxing evening walk to reduce daily stress and BP.", icon: "🌅" },
      ],
      intermediate: [
        { name: "Brisk Walking", duration: "30 mins", time: "6:00 AM", description: "Moderate pace walking. Excellent for lowering blood pressure.", icon: "🚶" },
        { name: "Yoga", duration: "20 mins", time: "7:00 AM", description: "Yoga poses like Shavasana and Balasana reduce hypertension.", icon: "🧘" },
        { name: "Swimming", duration: "20 mins", time: "5:00 PM", description: "Swimming is one of the best exercises for high BP patients.", icon: "🏊" },
        { name: "Pranayama", duration: "15 mins", time: "8:00 PM", description: "Bhramari and Anulom Vilom significantly reduce blood pressure.", icon: "🌬️" },
      ],
      advanced: [
        { name: "Jogging", duration: "25 mins", time: "6:00 AM", description: "Light jogging. Stop immediately if you feel dizzy or chest pain.", icon: "🏃" },
        { name: "Cycling", duration: "20 mins", time: "7:00 AM", description: "Light cycling. Keep intensity moderate for BP management.", icon: "🚴" },
        { name: "Yoga", duration: "30 mins", time: "5:00 PM", description: "Full yoga session focusing on relaxation and breathing.", icon: "🧘" },
        { name: "Meditation", duration: "15 mins", time: "8:00 PM", description: "Daily meditation lowers stress hormones and reduces BP.", icon: "🧠" },
      ],
    },
  };

  const tips = {
    general: [
      "Exercise for at least 30 minutes, 5 days a week",
      "Warm up for 5 minutes before and cool down after exercise",
      "Stay hydrated - drink water before, during, and after exercise",
      "Listen to your body and rest when needed",
    ],
    diabetes: [
      "Always check blood sugar before exercising",
      "Carry glucose tablets or a snack during exercise",
      "Exercise after meals helps lower blood sugar effectively",
      "Never exercise if blood sugar is below 100 mg/dL",
    ],
    hypertension: [
      "Always monitor BP before and after exercise",
      "Avoid heavy weight lifting and holding breath",
      "Stop exercising if you feel dizzy, chest pain, or headache",
      "Avoid exercising in extreme heat or cold",
    ],
  };

  const currentPlan = exercisePlans[condition]?.[level] || exercisePlans.general[level];
  const currentTips = tips[condition] || tips.general;

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Personalized Exercise Plan</h1>
      <p style={styles.subtitle}>Select your condition and fitness level for a customized plan</p>

      {/* Condition Selector */}
      <div style={styles.selectorRow}>
        <div>
          <p style={styles.selectorLabel}>Health Condition:</p>
          <div style={styles.btnGroup}>
            {["general", "diabetes", "hypertension"].map((key) => (
              <button
                key={key}
                style={condition === key ? styles.activeBtn : styles.conditionBtn}
                onClick={() => setCondition(key)}
              >
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p style={styles.selectorLabel}>Fitness Level:</p>
          <div style={styles.btnGroup}>
            {["beginner", "intermediate", "advanced"].map((key) => (
              <button
                key={key}
                style={level === key ? styles.activeBtn : styles.conditionBtn}
                onClick={() => setLevel(key)}
              >
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Exercise Cards */}
      <h2 style={styles.sectionTitle}>Daily Exercise Routine</h2>
      <div style={styles.exerciseGrid}>
        {currentPlan.map((exercise, i) => (
          <div key={i} style={styles.exerciseCard}>
            <div style={styles.exerciseIcon}>{exercise.icon}</div>
            <div style={styles.exerciseInfo}>
              <h3 style={styles.exerciseName}>{exercise.name}</h3>
              <div style={styles.exerciseMeta}>
                <span style={styles.metaTag}>⏱ {exercise.duration}</span>
                <span style={styles.metaTag}>🕐 {exercise.time}</span>
              </div>
              <p style={styles.exerciseDesc}>{exercise.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Safety Tips */}
      <h2 style={styles.sectionTitle}>Safety Tips</h2>
      <div style={styles.tipsCard}>
        {currentTips.map((tip, i) => (
          <div key={i} style={styles.tipItem}>
            <span>⚠️ </span>
            <span>{tip}</span>
          </div>
        ))}
      </div>

      {/* Weekly Goal */}
      <div style={styles.goalCard}>
        <h3 style={styles.goalTitle}>Weekly Exercise Goal</h3>
        <div style={styles.goalGrid}>
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => (
            <div key={i} style={styles.dayCard}>
              <div style={styles.dayName}>{day}</div>
              <div style={i === 6 ? styles.restDay : styles.activeDay}>
                {i === 6 ? "Rest" : "Active"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { padding: "32px", maxWidth: "1100px", margin: "0 auto" },
  title: { fontSize: "28px", color: "#333", margin: "0 0 4px 0" },
  subtitle: { color: "#888", fontSize: "15px", margin: "0 0 24px 0" },
  selectorRow: { display: "flex", gap: "32px", flexWrap: "wrap", marginBottom: "32px" },
  selectorLabel: { fontSize: "14px", color: "#555", fontWeight: "600", margin: "0 0 8px 0" },
  btnGroup: { display: "flex", gap: "8px", flexWrap: "wrap" },
  conditionBtn: { padding: "8px 16px", borderRadius: "8px", border: "1px solid #ddd", backgroundColor: "white", cursor: "pointer", fontSize: "14px", color: "#333" },
  activeBtn: { padding: "8px 16px", borderRadius: "8px", border: "none", backgroundColor: "#1976d2", cursor: "pointer", fontSize: "14px", color: "white" },
  sectionTitle: { fontSize: "22px", color: "#333", margin: "0 0 16px 0" },
  exerciseGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px", marginBottom: "32px" },
  exerciseCard: { backgroundColor: "white", padding: "20px", borderRadius: "12px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", borderTop: "4px solid #1976d2", display: "flex", gap: "16px" },
  exerciseIcon: { fontSize: "36px" },
  exerciseInfo: { flex: 1 },
  exerciseName: { fontSize: "17px", color: "#333", margin: "0 0 8px 0" },
  exerciseMeta: { display: "flex", gap: "8px", marginBottom: "8px" },
  metaTag: { backgroundColor: "#e3f2fd", color: "#1976d2", padding: "2px 8px", borderRadius: "12px", fontSize: "12px" },
  exerciseDesc: { color: "#666", fontSize: "13px", margin: "0", lineHeight: "1.5" },
  tipsCard: { backgroundColor: "#fff8e1", padding: "20px 24px", borderRadius: "12px", borderLeft: "4px solid #ff9800", marginBottom: "32px" },
  tipItem: { display: "flex", gap: "8px", marginBottom: "10px", fontSize: "14px", color: "#444" },
  goalCard: { backgroundColor: "white", padding: "20px 24px", borderRadius: "12px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" },
  goalTitle: { fontSize: "18px", color: "#333", margin: "0 0 16px 0" },
  goalGrid: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "8px" },
  dayCard: { textAlign: "center" },
  dayName: { fontSize: "13px", color: "#666", marginBottom: "6px", fontWeight: "600" },
  activeDay: { backgroundColor: "#e8f5e9", color: "#4caf50", padding: "6px 4px", borderRadius: "8px", fontSize: "12px", fontWeight: "600" },
  restDay: { backgroundColor: "#fce4ec", color: "#ef5350", padding: "6px 4px", borderRadius: "8px", fontSize: "12px", fontWeight: "600" },
};

export default Exercise;