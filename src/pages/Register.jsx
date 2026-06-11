// src/pages/Register.jsx

import React, { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase.config";
import { useDispatch } from "react-redux";
import { setUser } from "../store/authSlice";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";

function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    age: "",
    conditions: "",
  });
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      await updateProfile(userCredential.user, {
        displayName: formData.name,
      });

      await setDoc(doc(db, "users", userCredential.user.uid), {
        name: formData.name,
        email: formData.email,
        age: formData.age,
        conditions: formData.conditions.split(",").map((c) => c.trim()),
        createdAt: new Date().toISOString(),
        medications: [],
        caregiverIds: [],
        routinePreferences: {
          wakeTime: "07:00",
          breakfastTime: "08:00",
          lunchTime: "13:00",
          dinnerTime: "19:00",
          sleepTime: "22:00",
        },
      });

      // ✅ Save age and conditions to localStorage for Diet page
      localStorage.setItem("userAge", formData.age);
      localStorage.setItem("userConditions", formData.conditions);
      localStorage.setItem("userName", formData.name);

      dispatch(setUser({
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: formData.name,
      }));

      toast.success("Account created successfully!");
      navigate("/");
    } catch (error) {
      toast.error(error.message);
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.logo}>💊 HealthCare Assistant</h1>
          <p style={styles.subtitle}>Your Personal Health Companion</p>
        </div>

        <h2 style={styles.title}>Create Account</h2>
        <p style={styles.desc}>Start managing your health today</p>

        <form onSubmit={handleRegister}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Full Name</label>
            <input
              type="text"
              name="name"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={handleChange}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Age</label>
            <input
              type="number"
              name="age"
              placeholder="Enter your age"
              value={formData.age}
              onChange={handleChange}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Medical Conditions (optional)</label>
            <input
              type="text"
              name="conditions"
              placeholder="e.g. Diabetes, Hypertension (comma separated)"
              value={formData.conditions}
              onChange={handleChange}
              style={styles.input}
            />
            <span style={styles.hint}>You can enter test results in Diet page for auto-detection</span>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              name="password"
              placeholder="Create a password"
              value={formData.password}
              onChange={handleChange}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              style={styles.input}
              required
            />
          </div>

          <button
            type="submit"
            style={loading ? styles.buttonDisabled : styles.button}
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <p style={styles.loginText}>
          Already have an account?{" "}
          <Link to="/login" style={styles.link}>
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#f0f4f8",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
  },
  card: {
    backgroundColor: "white",
    padding: "40px",
    borderRadius: "16px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
    width: "100%",
    maxWidth: "420px",
  },
  header: {
    textAlign: "center",
    marginBottom: "24px",
  },
  logo: {
    fontSize: "24px",
    color: "#1976d2",
    margin: "0",
  },
  subtitle: {
    color: "#666",
    fontSize: "14px",
    margin: "4px 0 0 0",
  },
  title: {
    fontSize: "22px",
    color: "#333",
    margin: "0 0 8px 0",
  },
  desc: {
    color: "#666",
    fontSize: "14px",
    margin: "0 0 24px 0",
  },
  inputGroup: {
    marginBottom: "16px",
  },
  label: {
    display: "block",
    fontSize: "14px",
    color: "#333",
    marginBottom: "6px",
    fontWeight: "500",
  },
  input: {
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
  },
  hint: {
    fontSize: "11px",
    color: "#999",
    marginTop: "4px",
    display: "block",
  },
  button: {
    width: "100%",
    padding: "12px",
    backgroundColor: "#1976d2",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    cursor: "pointer",
    marginTop: "8px",
  },
  buttonDisabled: {
    width: "100%",
    padding: "12px",
    backgroundColor: "#90caf9",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    cursor: "not-allowed",
    marginTop: "8px",
  },
  loginText: {
    textAlign: "center",
    marginTop: "20px",
    fontSize: "14px",
    color: "#666",
  },
  link: {
    color: "#1976d2",
    textDecoration: "none",
    fontWeight: "500",
  },
};

export default Register;