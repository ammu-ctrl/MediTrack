import React, { useState, useEffect } from "react";

const GROQ_API_KEY = "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";
const GROQ_MODEL = "llama-3.3-70b-versatile";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

function getAgeTips(age) {
  const a = parseInt(age);
  if (!a) return null;
  if (a < 18) return "🧒 Young users: Focus on balanced nutrition for growth. Avoid crash diets.";
  if (a < 40) return "👨 Adults (18–40): Maintain active lifestyle with balanced diet.";
  if (a < 60) return "🧑 Middle-aged (40–60): Focus on heart health, reduce processed foods.";
  return "👴 Seniors (60+): Prioritize protein intake, calcium, vitamin D, and stay hydrated.";
}

export default function Diet() {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState({ age: "", weight: "", height: "" });
  const [testResults, setTestResults] = useState({
    bloodSugar: "", hba1c: "", systolic: "", diastolic: "",
    cholesterol: "", ldl: "", creatinine: "", bmi: "",
  });
  const [dietPlan, setDietPlan] = useState("");
  const [loading, setLoading] = useState(false);
  const [conditions, setConditions] = useState([]);

  useEffect(() => {
    const savedAge = localStorage.getItem("userAge");
    const savedProfile = localStorage.getItem("healthProfile");
    if (savedAge) setProfile(prev => ({ ...prev, age: savedAge }));
    if (savedProfile) {
      const p = JSON.parse(savedProfile);
      setProfile(p);
      if (p.testResults) setTestResults(p.testResults);
    }
  }, []);

  const detectConditions = () => {
    const detected = [];
    const { bloodSugar, hba1c, systolic, diastolic, cholesterol, ldl, creatinine, bmi } = testResults;
    if ((bloodSugar && parseFloat(bloodSugar) > 126) || (hba1c && parseFloat(hba1c) > 6.5)) detected.push("Diabetes");
    if ((systolic && parseFloat(systolic) > 140) || (diastolic && parseFloat(diastolic) > 90)) detected.push("Hypertension");
    if ((cholesterol && parseFloat(cholesterol) > 200) || (ldl && parseFloat(ldl) > 130)) detected.push("High Cholesterol / Heart Disease Risk");
    if (creatinine && parseFloat(creatinine) > 1.2) detected.push("Chronic Kidney Disease");
    if (bmi && parseFloat(bmi) > 30) detected.push("Obesity");
    return detected;
  };

  const calculateBMI = () => {
    if (profile.weight && profile.height) {
      const heightM = parseFloat(profile.height) / 100;
      return (parseFloat(profile.weight) / (heightM * heightM)).toFixed(1);
    }
    return testResults.bmi || "";
  };

  const generateDietPlan = async () => {
    setLoading(true);
    setStep(2);
    const bmi = calculateBMI();
    const detectedConditions = detectConditions();
    setConditions(detectedConditions);
    localStorage.setItem("healthProfile", JSON.stringify({ ...profile, testResults: { ...testResults, bmi } }));

    const prompt = `You are a clinical dietitian. Generate a detailed, personalized diet plan based on the following patient data:

Patient Profile:
- Age: ${profile.age || "Not provided"} years
- Weight: ${profile.weight || "Not provided"} kg
- Height: ${profile.height || "Not provided"} cm
- BMI: ${bmi || "Not provided"}

Test Results:
- Fasting Blood Sugar: ${testResults.bloodSugar || "Not provided"} mg/dL (Normal: <100)
- HbA1c: ${testResults.hba1c || "Not provided"}% (Normal: <5.7)
- Systolic BP: ${testResults.systolic || "Not provided"} mmHg (Normal: <120)
- Diastolic BP: ${testResults.diastolic || "Not provided"} mmHg (Normal: <80)
- Total Cholesterol: ${testResults.cholesterol || "Not provided"} mg/dL (Normal: <200)
- LDL Cholesterol: ${testResults.ldl || "Not provided"} mg/dL (Normal: <100)
- Creatinine: ${testResults.creatinine || "Not provided"} mg/dL (Normal: 0.6-1.2)

Detected Conditions: ${detectedConditions.length > 0 ? detectedConditions.join(", ") : "No specific conditions detected"}

Generate a personalized diet plan with:
1. Health Summary
2. Key Dietary Principles
3. Foods to Eat
4. Foods to Avoid
5. Daily Meal Plan - Breakfast, Lunch, Dinner, Snacks
6. Special Recommendations

Be specific to the actual numbers provided.`;

    try {
      const response = await fetch(GROQ_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [
            { role: "system", content: "You are healthassistant, a clinical dietitian. Generate detailed personalized diet plans." },
            { role: "user", content: prompt },
          ],
          max_tokens: 1500,
        }),
      });
      const data = await response.json();
      if (data.choices && data.choices[0]) {
        setDietPlan(data.choices[0].message.content);
      } else {
        setDietPlan("Failed to generate diet plan. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setDietPlan("Error generating diet plan. Please check your connection and try again.");
    }
    setLoading(false);
  };

  const ageTip = getAgeTips(profile.age);
  const bmi = calculateBMI();

  const renderDietPlan = (text) => {
    return text.split("\n").map((line, i) => {
      if (line.startsWith("## ") || line.startsWith("# ")) return <h2 key={i} style={styles.planH2}>{line.replace(/##?\s/, "")}</h2>;
      if (line.startsWith("**") && line.endsWith("**")) return <h3 key={i} style={styles.planH3}>{line.replace(/\*\*/g, "")}</h3>;
      if (line.match(/\*\*(.*?)\*\*/)) return <p key={i} style={styles.planP} dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />;
      if (line.startsWith("- ") || line.startsWith("* ")) return <li key={i} style={styles.planLi}>{line.replace(/^[-*]\s/, "")}</li>;
      if (line.match(/^\d+\./)) return <li key={i} style={styles.planLi}>{line.replace(/^\d+\.\s/, "")}</li>;
      if (line.trim() === "") return <br key={i} />;
      return <p key={i} style={styles.planP}>{line}</p>;
    });
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>🥗 AI-Powered Personalized Diet Plan</h1>
        <p style={styles.subtitle}>Enter your health details and test results to get a diet plan tailored to your exact values</p>
      </div>

      <div style={styles.stepRow}>
        {["Health Profile & Tests", "Your Personalized Diet Plan"].map((label, i) => (
          <div key={i} style={{ ...styles.step, ...(step === i + 1 ? styles.activeStep : step > i + 1 ? styles.doneStep : {}) }}>
            <div style={styles.stepNum}>{step > i + 1 ? "✓" : i + 1}</div>
            <span style={styles.stepLabel}>{label}</span>
          </div>
        ))}
      </div>

      {step === 1 && (
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>📋 Your Health Profile & Test Results</h2>
          <p style={styles.cardSubtitle}>The more accurate your values the more personalized your diet plan will be</p>
          {ageTip && <div style={styles.ageTip}>{ageTip}</div>}

          <h3 style={styles.sectionTitle}>👤 Basic Info</h3>
          <div style={styles.formGrid}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Age (years)</label>
              <input style={styles.input} type="number" placeholder="e.g. 45" value={profile.age} onChange={e => setProfile({ ...profile, age: e.target.value })} />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Weight (kg)</label>
              <input style={styles.input} type="number" placeholder="e.g. 70" value={profile.weight} onChange={e => setProfile({ ...profile, weight: e.target.value })} />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Height (cm)</label>
              <input style={styles.input} type="number" placeholder="e.g. 165" value={profile.height} onChange={e => setProfile({ ...profile, height: e.target.value })} />
              <span style={styles.hint}>BMI will be calculated automatically</span>
            </div>
          </div>

          <h3 style={styles.sectionTitle}>🧪 Test Results</h3>
          <div style={styles.formGrid}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Fasting Blood Sugar (mg/dL)</label>
              <input style={styles.input} type="number" placeholder="Normal: less than 100" value={testResults.bloodSugar} onChange={e => setTestResults({ ...testResults, bloodSugar: e.target.value })} />
              <span style={styles.hint}>Diabetes: greater than 126</span>
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>HbA1c (%)</label>
              <input style={styles.input} type="number" placeholder="Normal: less than 5.7" value={testResults.hba1c} onChange={e => setTestResults({ ...testResults, hba1c: e.target.value })} />
              <span style={styles.hint}>Diabetes: greater than 6.5%</span>
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Systolic BP (mmHg)</label>
              <input style={styles.input} type="number" placeholder="Normal: less than 120" value={testResults.systolic} onChange={e => setTestResults({ ...testResults, systolic: e.target.value })} />
              <span style={styles.hint}>Hypertension: greater than 140</span>
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Diastolic BP (mmHg)</label>
              <input style={styles.input} type="number" placeholder="Normal: less than 80" value={testResults.diastolic} onChange={e => setTestResults({ ...testResults, diastolic: e.target.value })} />
              <span style={styles.hint}>Hypertension: greater than 90</span>
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Total Cholesterol (mg/dL)</label>
              <input style={styles.input} type="number" placeholder="Normal: less than 200" value={testResults.cholesterol} onChange={e => setTestResults({ ...testResults, cholesterol: e.target.value })} />
              <span style={styles.hint}>High: greater than 200</span>
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>LDL Cholesterol (mg/dL)</label>
              <input style={styles.input} type="number" placeholder="Normal: less than 100" value={testResults.ldl} onChange={e => setTestResults({ ...testResults, ldl: e.target.value })} />
              <span style={styles.hint}>High: greater than 130</span>
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Creatinine (mg/dL)</label>
              <input style={styles.input} type="number" placeholder="Normal: 0.6 to 1.2" value={testResults.creatinine} onChange={e => setTestResults({ ...testResults, creatinine: e.target.value })} />
              <span style={styles.hint}>Kidney issue: greater than 1.2</span>
            </div>
          </div>

          <button onClick={generateDietPlan} style={styles.generateBtn}>
            🤖 Generate My Personalized Diet Plan
          </button>
        </div>
      )}

      {step === 2 && (
        <div>
          <button onClick={() => setStep(1)} style={styles.backBtn}>← Edit Profile</button>
          {bmi && (
            <div style={styles.bmiCard}>
              <strong>Your BMI: {bmi}</strong> —
              {parseFloat(bmi) < 18.5 ? " Underweight" : parseFloat(bmi) < 25 ? " ✅ Normal" : parseFloat(bmi) < 30 ? " ⚠️ Overweight" : " ❗ Obese"}
            </div>
          )}
          {conditions.length > 0 && (
            <div style={styles.conditionsBox}><strong>🔍 Detected Conditions:</strong> {conditions.join(", ")}</div>
          )}
          {conditions.length === 0 && !loading && (
            <div style={styles.normalBox}>✅ No critical conditions detected. Diet plan is based on general wellness.</div>
          )}
          {ageTip && <div style={styles.ageTip}>{ageTip}</div>}

          <div style={styles.planCard}>
            <h2 style={styles.planHeader}>🥗 Your Personalized Diet Plan</h2>
            {loading ? (
              <div style={styles.loadingBox}>
                <p style={styles.loadingText}>⏳ Generating your personalized diet plan...</p>
                <p style={styles.loadingSubtext}>This may take a few seconds</p>
              </div>
            ) : (
              <div style={styles.planContent}>{renderDietPlan(dietPlan)}</div>
            )}
          </div>

          {!loading && (
            <>
              <div style={styles.disclaimer}>
                ⚠️ <strong>Disclaimer:</strong> This AI-generated diet plan is based on your test values. Always consult your doctor before making significant dietary changes.
              </div>
              <button onClick={() => window.print()} style={styles.printBtn}>🖨️ Print Diet Plan</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { padding: "32px", maxWidth: "1000px", margin: "0 auto" },
  header: { marginBottom: "24px" },
  title: { fontSize: "28px", color: "#333", margin: "0 0 8px 0" },
  subtitle: { color: "#666", fontSize: "15px", margin: 0 },
  stepRow: { display: "flex", gap: "16px", marginBottom: "28px", flexWrap: "wrap" },
  step: { display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px", backgroundColor: "#f5f5f5", borderRadius: "8px", flex: 1, minWidth: "150px" },
  activeStep: { backgroundColor: "#e3f2fd", border: "2px solid #1976d2" },
  doneStep: { backgroundColor: "#e8f5e9", border: "2px solid #4caf50" },
  stepNum: { width: "28px", height: "28px", borderRadius: "50%", backgroundColor: "#1976d2", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: "bold" },
  stepLabel: { fontSize: "13px", color: "#333", fontWeight: "500" },
  card: { backgroundColor: "white", padding: "28px", borderRadius: "12px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", marginBottom: "24px" },
  cardTitle: { fontSize: "20px", color: "#333", margin: "0 0 8px 0" },
  cardSubtitle: { color: "#888", fontSize: "14px", margin: "0 0 24px 0" },
  sectionTitle: { fontSize: "16px", color: "#1976d2", margin: "20px 0 12px 0", borderBottom: "1px solid #e3f2fd", paddingBottom: "8px" },
  formGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px", marginBottom: "24px" },
  inputGroup: { display: "flex", flexDirection: "column", gap: "4px" },
  label: { fontSize: "14px", color: "#333", fontWeight: "500" },
  input: { padding: "10px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "14px" },
  hint: { fontSize: "11px", color: "#999" },
  ageTip: { backgroundColor: "#e8f5e9", padding: "12px 16px", borderRadius: "8px", fontSize: "14px", color: "#2e7d32", marginBottom: "20px", border: "1px solid #c8e6c9" },
  bmiCard: { backgroundColor: "#f3e5f5", padding: "12px 16px", borderRadius: "8px", fontSize: "14px", color: "#6a1b9a", marginBottom: "16px" },
  conditionsBox: { backgroundColor: "#fff3e0", padding: "12px 16px", borderRadius: "8px", fontSize: "14px", color: "#e65100", marginBottom: "16px", border: "1px solid #ffe0b2" },
  normalBox: { backgroundColor: "#e8f5e9", padding: "12px 16px", borderRadius: "8px", fontSize: "14px", color: "#2e7d32", marginBottom: "16px", border: "1px solid #c8e6c9" },
  generateBtn: { backgroundColor: "#7b1fa2", color: "white", border: "none", padding: "14px 32px", borderRadius: "8px", cursor: "pointer", fontSize: "16px", width: "100%" },
  backBtn: { backgroundColor: "#757575", color: "white", border: "none", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", fontSize: "14px", marginBottom: "16px" },
  printBtn: { backgroundColor: "#4caf50", color: "white", border: "none", padding: "12px 24px", borderRadius: "8px", cursor: "pointer", fontSize: "15px", marginTop: "16px" },
  planCard: { backgroundColor: "white", padding: "28px", borderRadius: "12px", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", marginBottom: "16px" },
  planHeader: { fontSize: "22px", color: "#1976d2", margin: "0 0 20px 0", borderBottom: "2px solid #e3f2fd", paddingBottom: "12px" },
  planContent: { lineHeight: "1.8" },
  planH2: { fontSize: "18px", color: "#1976d2", margin: "20px 0 8px 0" },
  planH3: { fontSize: "16px", color: "#333", margin: "16px 0 8px 0", fontWeight: "600" },
  planLi: { fontSize: "14px", color: "#444", margin: "6px 0 6px 20px", lineHeight: "1.6" },
  planP: { fontSize: "14px", color: "#444", margin: "8px 0", lineHeight: "1.7" },
  loadingBox: { textAlign: "center", padding: "40px 20px" },
  loadingText: { fontSize: "16px", color: "#333", margin: "0 0 8px 0" },
  loadingSubtext: { fontSize: "13px", color: "#888", margin: "0" },
  disclaimer: { backgroundColor: "#fff8e1", padding: "16px", borderRadius: "8px", fontSize: "13px", color: "#5d4037", marginTop: "8px" },
};

