// src/pages/Login.jsx

import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase.config";
import { useDispatch } from "react-redux";
import { setUser } from "../store/authSlice";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // ── Save token and userId to localStorage so all pages can use them ──
      const token = await user.getIdToken();
      localStorage.setItem("token", token);
      localStorage.setItem("userId", user.uid);
      localStorage.setItem("userEmail", user.email);

      dispatch(setUser({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
      }));

      toast.success("Login successful!");
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
          <h1 style={styles.logo}>HealthCare Assistant</h1>
          <p style={styles.subtitle}>Your Personal Health Companion</p>
        </div>

        <h2 style={styles.title}>Welcome Back</h2>
        <p style={styles.desc}>Login to manage your health routines</p>

        <form onSubmit={handleLogin}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email Address</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              required
            />
          </div>

          <button
            type="submit"
            style={loading ? styles.buttonDisabled : styles.button}
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p style={styles.registerText}>
          Do not have an account?{" "}
          <Link to="/register" style={styles.link}>
            Register here
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
  registerText: {
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

export default Login;