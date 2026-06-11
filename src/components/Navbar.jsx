// src/components/Navbar.jsx

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase.config";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../store/authSlice";
import { toast } from "react-toastify";

function Navbar() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      dispatch(logout());
      toast.success("Logged out successfully!");
      navigate("/login");
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (!user) return null;

  return (
    <nav style={styles.navbar}>
      <Link to="/" style={styles.logo}>
        💊 MediTrack
      </Link>

      <div style={styles.desktopMenu}>
        <Link to="/" style={styles.navLink}>Home</Link>
        <Link to="/medications" style={styles.navLink}>Medications</Link>
        <Link to="/chat" style={styles.navLink}>Chat</Link>
        <Link to="/diet" style={styles.navLink}>Diet</Link>
        <Link to="/exercise" style={styles.navLink}>Exercise</Link>
        <Link to="/history" style={styles.navLink}>History</Link>
        <Link to="/health-monitor" style={styles.navLinkHighlight}>🔬 Health Monitor</Link>
        <Link to="/caregiver" style={styles.navLink}>Caregiver</Link>
        <Link to="/profile" style={styles.navLink}>Profile</Link>
        <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
      </div>

      <button style={styles.hamburger} onClick={() => setMenuOpen(!menuOpen)}>
        ☰ Menu
      </button>

      {menuOpen && (
        <div style={styles.mobileMenu}>
          <Link to="/" style={styles.mobileLink} onClick={() => setMenuOpen(false)}>Home</Link>
          <Link to="/medications" style={styles.mobileLink} onClick={() => setMenuOpen(false)}>Medications</Link>
          <Link to="/chat" style={styles.mobileLink} onClick={() => setMenuOpen(false)}>Chat</Link>
          <Link to="/diet" style={styles.mobileLink} onClick={() => setMenuOpen(false)}>Diet</Link>
          <Link to="/exercise" style={styles.mobileLink} onClick={() => setMenuOpen(false)}>Exercise</Link>
          <Link to="/history" style={styles.mobileLink} onClick={() => setMenuOpen(false)}>History</Link>
          <Link to="/health-monitor" style={styles.mobileLinkHighlight} onClick={() => setMenuOpen(false)}>🔬 Health Monitor</Link>
          <Link to="/caregiver" style={styles.mobileLink} onClick={() => setMenuOpen(false)}>Caregiver</Link>
          <Link to="/profile" style={styles.mobileLink} onClick={() => setMenuOpen(false)}>Profile</Link>
          <button onClick={handleLogout} style={styles.mobileLogoutBtn}>Logout</button>
        </div>
      )}
    </nav>
  );
}

const styles = {
  navbar: {
    backgroundColor: "#1976d2",
    padding: "12px 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    position: "sticky",
    top: 0,
    zIndex: 1000,
    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
  },
  logo: {
    color: "white",
    fontSize: "20px",
    fontWeight: "bold",
    textDecoration: "none",
  },
  desktopMenu: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
  },
  navLink: {
    color: "white",
    textDecoration: "none",
    fontSize: "13px",
    padding: "6px 10px",
    borderRadius: "6px",
  },
  navLinkHighlight: {
    color: "#fff",
    textDecoration: "none",
    fontSize: "13px",
    padding: "6px 10px",
    borderRadius: "6px",
    backgroundColor: "rgba(255,255,255,0.2)",
    fontWeight: "600",
  },
  logoutBtn: {
    backgroundColor: "#ef5350",
    color: "white",
    border: "none",
    padding: "6px 14px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "13px",
  },
  hamburger: {
    display: "none",
    backgroundColor: "transparent",
    border: "1px solid white",
    color: "white",
    fontSize: "14px",
    cursor: "pointer",
    padding: "6px 12px",
    borderRadius: "6px",
  },
  mobileMenu: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    paddingTop: "12px",
  },
  mobileLink: {
    color: "white",
    textDecoration: "none",
    fontSize: "15px",
    padding: "8px 12px",
    borderRadius: "6px",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  mobileLinkHighlight: {
    color: "white",
    textDecoration: "none",
    fontSize: "15px",
    padding: "8px 12px",
    borderRadius: "6px",
    backgroundColor: "rgba(255,255,255,0.25)",
    fontWeight: "600",
  },
  mobileLogoutBtn: {
    backgroundColor: "#ef5350",
    color: "white",
    border: "none",
    padding: "8px 14px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "15px",
    textAlign: "left",
  },
};

export default Navbar;