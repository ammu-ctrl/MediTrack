/**
 * HealthRecommendation.jsx
 * Dynamic Diet & Exercise Recommendation System
 * 
 * Features:
 * - Health condition form with validation
 * - Real-time recommendations based on health metrics
 * - Saves data to Firestore
 * - Responsive design with card layout
 */

import React, { useState, useEffect } from "react";
import { collection, addDoc, doc, getDoc, setDoc, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase.config";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import {
  generateDietPlan,
  generateExercisePlan,
  validateHealthData,
} from "../utils/recommendationHelpers";
import "../styles/HealthRecommendation.css";

function HealthRecommendation() {
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [healthData, setHealthData] = useState({
    condition: "Diabetes",
    fastingsugarLevel: "",
    postMealSugarLevel: "",
    bloodPressure: "",
    age: "",
    weight: "",
  });

  const [dietPlan, setDietPlan] = useState(null);
  const [exercisePlan, setExercisePlan] = useState(null);
  const [savedData, setSavedData] = useState(null);

  // Fetch existing health data on component mount
  useEffect(() => {
    if (user) {
      fetchHealthData();
    }
  }, [user]);

  // Generate recommendations whenever health data changes
  useEffect(() => {
    if (
      healthData.condition &&
      healthData.age &&
      healthData.weight &&
      !showForm
    ) {
      generateRecommendations();
    }
  }, [healthData, showForm]);

  /**
   * Fetch health data from Firestore
   */
  const fetchHealthData = async () => {
    try {
      const docRef = doc(db, "users", user.uid, "healthData", "current");
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setHealthData(data);
        setSavedData(data);
        generateRecommendations();
      }
    } catch (error) {
      console.error("Error fetching health data:", error);
    }
  };

  /**
   * Handle form input changes and generate recommendations in real-time
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedData = { ...healthData, [name]: value };
    setHealthData(updatedData);

    // Validate and generate recommendations in real-time
    const validation = validateHealthData(updatedData);
    if (validation.isValid && updatedData.condition && updatedData.age && updatedData.weight) {
      const diet = generateDietPlan(updatedData);
      const exercise = generateExercisePlan(updatedData);
      setDietPlan(diet);
      setExercisePlan(exercise);
    }
  };

  /**
   * Generate health recommendations
   */
  const generateRecommendations = () => {
    const validation = validateHealthData(healthData);

    if (!validation.isValid) {
      console.warn("Validation errors:", validation.errors);
      return;
    }

    const diet = generateDietPlan(healthData);
    const exercise = generateExercisePlan(healthData);

    setDietPlan(diet);
    setExercisePlan(exercise);
  };

  /**
   * Save health data to Firestore
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const validation = validateHealthData(healthData);
    if (!validation.isValid) {
      validation.errors.forEach((error) => toast.error(error));
      setLoading(false);
      return;
    }

    try {
      const docRef = doc(db, "users", user.uid, "healthData", "current");
      await setDoc(docRef, {
        ...healthData,
        updatedAt: new Date().toISOString(),
        userId: user.uid,
      });

      // Also add to history
      await addDoc(collection(db, "users", user.uid, "healthDataHistory"), {
        ...healthData,
        createdAt: new Date().toISOString(),
      });

      setSavedData(healthData);
      setShowForm(false);
      toast.success("Health data saved successfully!");
    } catch (error) {
      console.error("Error saving health data:", error);
      toast.error("Error saving health data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="health-recommendation-container">
      <div className="health-recommendation-header">
        <h1>🏥 AI-Powered Health Recommendations</h1>
        <p>Get personalized diet and exercise recommendations based on your health metrics</p>
        <button
          className="btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "✕ Cancel" : "+ Check My Health"}
        </button>
      </div>

      {/* Health Input Form */}
      {showForm && (
        <div className="health-form-card">
          <h2>📋 Health Information Form</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              {/* Health Condition Dropdown */}
              <div className="form-group">
                <label htmlFor="condition">Health Condition *</label>
                <select
                  id="condition"
                  name="condition"
                  value={healthData.condition}
                  onChange={handleChange}
                  required
                >
                  <option value="Diabetes">Diabetes</option>
                  <option value="HighBloodPressure">High Blood Pressure</option>
                  <option value="Thyroid">Thyroid</option>
                  <option value="Obesity">Obesity</option>
                </select>
              </div>

              {/* Age Input */}
              <div className="form-group">
                <label htmlFor="age">Age (years) *</label>
                <input
                  id="age"
                  type="number"
                  name="age"
                  min="0"
                  max="150"
                  value={healthData.age}
                  onChange={handleChange}
                  placeholder="Enter your age"
                  required
                />
              </div>

              {/* Weight Input */}
              <div className="form-group">
                <label htmlFor="weight">Weight (kg) *</label>
                <input
                  id="weight"
                  type="number"
                  name="weight"
                  min="0"
                  step="0.1"
                  value={healthData.weight}
                  onChange={handleChange}
                  placeholder="Enter your weight"
                  required
                />
              </div>

              {/* Fasting Sugar Level */}
              {healthData.condition === "Diabetes" && (
                <div className="form-group">
                  <label htmlFor="fastingsugarLevel">Fasting Sugar Level (mg/dL)</label>
                  <input
                    id="fastingsugarLevel"
                    type="number"
                    name="fastingsugarLevel"
                    min="0"
                    value={healthData.fastingsugarLevel}
                    onChange={handleChange}
                    placeholder="e.g., 110"
                  />
                </div>
              )}

              {/* Post Meal Sugar Level */}
              {healthData.condition === "Diabetes" && (
                <div className="form-group">
                  <label htmlFor="postMealSugarLevel">Post-Meal Sugar Level (mg/dL)</label>
                  <input
                    id="postMealSugarLevel"
                    type="number"
                    name="postMealSugarLevel"
                    min="0"
                    value={healthData.postMealSugarLevel}
                    onChange={handleChange}
                    placeholder="e.g., 160"
                  />
                </div>
              )}

              {/* Blood Pressure */}
              {(healthData.condition === "HighBloodPressure" ||
                healthData.condition === "Diabetes") && (
                <div className="form-group">
                  <label htmlFor="bloodPressure">Blood Pressure (Systolic/Diastolic)</label>
                  <input
                    id="bloodPressure"
                    type="text"
                    name="bloodPressure"
                    value={healthData.bloodPressure}
                    onChange={handleChange}
                    placeholder="e.g., 120/80"
                  />
                </div>
              )}
            </div>

            <button type="submit" className="btn-success" disabled={loading}>
              {loading ? "Saving..." : "✓ Save & Get Recommendations"}
            </button>
          </form>
        </div>
      )}

      {/* Recommendations Display */}
      {dietPlan && exercisePlan && (
        <div className="recommendations-section">
          {/* Diet Plan Card */}
          <div className="recommendation-card diet-card">
            <div className="card-header">
              <h2>🥗 {dietPlan.title}</h2>
              <span className="condition-badge">{healthData.condition}</span>
            </div>

            {/* Priority Alerts */}
            {dietPlan.priority && dietPlan.priority.length > 0 && (
              <div className="priority-section">
                <h3>⚠️ Important:</h3>
                <ul>
                  {dietPlan.priority.map((item, idx) => (
                    <li key={idx} className="priority-item">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* General Recommendations */}
            {dietPlan.items && dietPlan.items.length > 0 && (
              <div className="recommendations-group">
                <h3>📌 Key Points:</h3>
                <ul>
                  {dietPlan.items.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Foods to Include */}
            {dietPlan.includeFoods && dietPlan.includeFoods.length > 0 && (
              <div className="food-list">
                <h3>✅ Include These Foods:</h3>
                <div className="food-chips">
                  {dietPlan.includeFoods.map((food, idx) => (
                    <span key={idx} className="food-chip include">
                      {food}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Foods to Avoid */}
            {dietPlan.avoidFoods && dietPlan.avoidFoods.length > 0 && (
              <div className="food-list">
                <h3>❌ Avoid These Foods:</h3>
                <div className="food-chips">
                  {dietPlan.avoidFoods.map((food, idx) => (
                    <span key={idx} className="food-chip avoid">
                      {food}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Exercise Plan Card */}
          <div className="recommendation-card exercise-card">
            <div className="card-header">
              <h2>🏃 {exercisePlan.title}</h2>
              <span className="intensity-badge">{exercisePlan.intensity}</span>
            </div>

            {/* Weekly Routine */}
            {exercisePlan.weekly && exercisePlan.weekly.length > 0 && (
              <div className="recommendations-group">
                <h3>📅 Weekly Routine:</h3>
                <ul>
                  {exercisePlan.weekly.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Targets */}
            {exercisePlan.targets && exercisePlan.targets.length > 0 && (
              <div className="targets-section">
                <h3>🎯 Targets:</h3>
                <ul>
                  {exercisePlan.targets.map((target, idx) => (
                    <li key={idx}>{target}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Precautions */}
            {exercisePlan.precautions && exercisePlan.precautions.length > 0 && (
              <div className="precautions-section">
                <h3>⚠️ Important Precautions:</h3>
                <ul>
                  {exercisePlan.precautions.map((precaution, idx) => (
                    <li key={idx} className="precaution-item">
                      {precaution}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* No Data State */}
      {!dietPlan && !exercisePlan && !showForm && (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h2>No Health Data Yet</h2>
          <p>Click "Check My Health" to add your health information and get personalized recommendations.</p>
        </div>
      )}
    </div>
  );
}

export default HealthRecommendation;
