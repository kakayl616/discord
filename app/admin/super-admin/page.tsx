"use client";

import React, { useState, FormEvent, useEffect } from "react";
import { db } from "../../../lib/firebase";
import { collection, getDocs, setDoc, doc } from "firebase/firestore";

export default function SuperAdminPage() {
  // Super admin authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [superAdminPassword, setSuperAdminPassword] = useState("");
  const [loginMessage, setLoginMessage] = useState("");

  // Admin creation form states
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [creationMessage, setCreationMessage] = useState("");
  const [adminCount, setAdminCount] = useState(0);

  // Hardcoded super admin password
  const SUPER_ADMIN_PASSWORD = "yawagiatay";

  // Function to fetch the current count of admin accounts from Firestore
  const fetchAdminCount = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "admins"));
      setAdminCount(querySnapshot.size);
    } catch (error) {
      console.error("Error fetching admin count:", error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchAdminCount();
    }
  }, [isAuthenticated]);

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    if (superAdminPassword === SUPER_ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setLoginMessage("");
    } else {
      setLoginMessage("Incorrect super admin password.");
    }
  };

  const handleAdminCreation = async (e: FormEvent) => {
    e.preventDefault();
    if (adminCount >= 4) {
      setCreationMessage("Maximum admin accounts reached. Cannot create more than 4 admins.");
      return;
    }
    if (!adminUsername || !adminPassword) {
      setCreationMessage("Please provide both username and password.");
      return;
    }
    try {
      // Create admin document in "admins" collection with the username as the document ID
      await setDoc(doc(db, "admins", adminUsername), {
        username: adminUsername,
        password: adminPassword,
      });
      setCreationMessage(`Admin "${adminUsername}" created successfully.`);
      setAdminUsername("");
      setAdminPassword("");
      // Refresh the admin count
      fetchAdminCount();
    } catch (error) {
      console.error("Error creating admin:", error);
      setCreationMessage("Failed to create admin.");
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={superAdminPageStyle}>
        <h2 style={headingStyle}>Super Admin Login</h2>
        <form onSubmit={handleLogin} style={formStyle}>
          <input
            type="password"
            placeholder="Enter super admin password"
            value={superAdminPassword}
            onChange={(e) => setSuperAdminPassword(e.target.value)}
            style={inputStyle}
          />
          <button type="submit" style={buttonStyle}>Login</button>
        </form>
        {loginMessage && <p style={{ color: "red", textAlign: "center" }}>{loginMessage}</p>}
      </div>
    );
  }

  return (
    <div style={superAdminPageStyle}>
      <h2 style={headingStyle}>Super Admin Dashboard</h2>
      <p style={{ textAlign: "center", color: "black" }}>
        Current number of admins: {adminCount} / 4
      </p>
      <form onSubmit={handleAdminCreation} style={formStyle}>
        <input
          type="text"
          placeholder="Admin Username"
          value={adminUsername}
          onChange={(e) => setAdminUsername(e.target.value)}
          style={inputStyle}
        />
        <input
          type="password"
          placeholder="Admin Password"
          value={adminPassword}
          onChange={(e) => setAdminPassword(e.target.value)}
          style={inputStyle}
        />
        <button type="submit" style={buttonStyle}>Create Admin</button>
      </form>
      {creationMessage && <p style={{ color: "green", textAlign: "center" }}>{creationMessage}</p>}
      {/* Optionally add a section here to view logs from all admins */}
    </div>
  );
}

/* ----- Inline Styling ----- */
const superAdminPageStyle: React.CSSProperties = {
  background: "radial-gradient(circle, #0b0e4d, #020212)",
  minHeight: "100vh",
  padding: "40px 20px",
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
};

const formStyle: React.CSSProperties = {
  backgroundColor: "#fff",
  padding: "20px",
  borderRadius: "10px",
  boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
  display: "flex",
  flexDirection: "column",
  gap: "10px",
  width: "300px",
  marginTop: "20px",
};

const headingStyle: React.CSSProperties = {
  color: "black",
  textAlign: "center",
};

const inputStyle: React.CSSProperties = {
  padding: "10px",
  fontSize: "16px",
  border: "1px solid #ccc",
  borderRadius: "5px",
};

const buttonStyle: React.CSSProperties = {
  padding: "10px",
  fontSize: "16px",
  backgroundColor: "#5865f2",
  color: "white",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
};
