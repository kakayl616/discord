"use client";

import React, { useState, ChangeEvent, FormEvent, useEffect } from "react";
import { db } from "../../../lib/firebase";
import {
  setDoc,
  addDoc,
  doc,
  collection,
  deleteDoc,
  onSnapshot,
  getDocs,
} from "firebase/firestore";
import { QRCodeCanvas } from "qrcode.react";

/* =======================
   Type Definitions
======================= */
type FormData = {
  userID: string;
  type: string;
  accountStatus: string;
  username: string;
  dateCreated: string;
  activeReports: string;
  profileImage: string;
  bannerImage: string;
};

type LogEntry = {
  admin: string;
  userName: string;
  userID: string;
  date: string;
};

/* =======================
   Style Definitions
======================= */
const pageStyle: React.CSSProperties = {
  background: "radial-gradient(circle, #0b0e4d, #020212)",
  minHeight: "100vh",
  padding: "40px 20px",
  boxSizing: "border-box",
};

const containerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  gap: "30px",
  marginBottom: "30px",
};

const logsColumnStyle: React.CSSProperties = {
  width: "300px",
};

const leftColumnStyle: React.CSSProperties = {
  width: "320px",
};

const rightColumnStyle: React.CSSProperties = {
  flex: 1,
  maxWidth: "500px",
};

const chatFormContainer: React.CSSProperties = {
  backgroundColor: "#fff",
  borderRadius: "10px",
  boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
  padding: "20px",
  textAlign: "center",
  width: "300px",
  minHeight: "300px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
};

const transactionFormStyle: React.CSSProperties = {
  marginBottom: "20px",
};

const transactionInputStyle: React.CSSProperties = {
  padding: "8px",
  fontSize: "16px",
  width: "250px",
  marginBottom: "10px",
  border: "1px solid black",
  color: "black",
};

const transactionButtonStyle: React.CSSProperties = {
  padding: "8px 16px",
  fontSize: "16px",
  cursor: "pointer",
  backgroundColor: "#5865f2",
  color: "white",
  border: "none",
  borderRadius: "5px",
};

const infoTextStyle: React.CSSProperties = {
  color: "black",
};

const formStyle: React.CSSProperties = {
  backgroundColor: "#fff",
  padding: "20px",
  borderRadius: "10px",
  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
  display: "flex",
  flexDirection: "column",
  gap: "10px",
  width: "300px",
  marginTop: "20px",
};

const formContainer: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: "10px",
  boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
  padding: "20px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: "40px",
  margin: "10px 0",
  padding: "0 10px",
  border: "1px solid #ccc",
  borderRadius: "5px",
  fontSize: "16px",
  color: "black",
};

const labelStyle: React.CSSProperties = {
  color: "black",
};

const buttonStyle: React.CSSProperties = {
  width: "100%",
  height: "40px",
  backgroundColor: "#5865f2",
  color: "white",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
  fontSize: "16px",
  marginTop: "20px",
};

const cancelButtonStyle: React.CSSProperties = {
  width: "100%",
  height: "40px",
  backgroundColor: "#ff4d4d",
  color: "white",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
  fontSize: "16px",
  marginTop: "10px",
};

const qrContainerStyle: React.CSSProperties = {
  width: "300px",
  padding: "20px",
  backgroundColor: "#fff",
  border: "2px solid #5865f2",
  borderRadius: "12px",
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  marginTop: "20px",
};

const logContainerStyle: React.CSSProperties = {
  backgroundColor: "#fff",
  padding: "20px",
  borderRadius: "10px",
  boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
};

const logHeadingStyle: React.CSSProperties = {
  textAlign: "center",
  color: "black",
  marginBottom: "10px",
};

const logItemStyle: React.CSSProperties = {
  borderBottom: "1px solid #ccc",
  padding: "10px 0",
};

const logTextStyle: React.CSSProperties = {
  color: "black",
  margin: "4px 0",
};

const cancellationContainerStyle: React.CSSProperties = {
  marginTop: "20px",
  background: "#fff",
  padding: "15px",
  borderRadius: "10px",
  boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
};

const headingStyle: React.CSSProperties = {
  color: "black",
  textAlign: "center",
};

const adminCreationPanelStyle: React.CSSProperties = {
  backgroundColor: "#f9f9f9",
  borderRadius: "10px",
  boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
  padding: "20px",
  marginBottom: "30px",
  width: "100%",
  maxWidth: "400px",
  textAlign: "center",
};

/* =======================
   End of Style Definitions
======================= */

/* =======================
   API Function: Fetch User Data
======================= */
const fetchUserData = async (userID: string) => {
  try {
    const response = await fetch(
      `https://apidiscord.vercel.app/api/lookup/${userID}`
    );
    if (!response.ok) throw new Error("User not found.");
    const user = await response.json();
    const avatarExtension = user.avatar.startsWith("a_") ? "gif" : "png";
    const profileImage = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${avatarExtension}?size=2048`;
    const bannerImage = user.banner
      ? `https://cdn.discordapp.com/banners/${user.id}/${user.banner}.${
          user.banner.startsWith("a_") ? "gif" : "png"
        }?size=2048`
      : profileImage;
    return {
      username: user.username,
      profileImage,
      bannerImage,
      dateCreated: new Date(user.id / 4194304 + 1420070400000)
        .toUTCString()
        .replace("GMT", "UTC"),
    };
  } catch (error) {
    console.error("Error fetching user data:", error);
    return null;
  }
};

/* =======================
   Component: AdminDashboard
======================= */
export default function AdminDashboard() {
  // ----- Authentication & Role States -----
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const SUPER_ADMIN_PASSWORD = "yawagiatay";
  const ADMIN_PASSWORD = "babypink";
  const [adminRole, setAdminRole] = useState<"admin" | "superAdmin" | null>(
    null
  );
  const [adminName, setAdminName] = useState("");

  // Persist authentication on mount
  useEffect(() => {
    const storedAuth = localStorage.getItem("isAuthenticated");
    const storedRole = localStorage.getItem("adminRole");
    const storedName = localStorage.getItem("adminName");
    if (storedAuth === "true" && storedRole && storedName) {
      setIsAuthenticated(true);
      setAdminRole(storedRole as "admin" | "superAdmin");
      setAdminName(storedName);
    }
  }, []);

  // ----- Dashboard States -----
  const [formValues, setFormValues] = useState<FormData>({
    userID: "",
    type: "User",
    accountStatus: "Banned",
    username: "",
    dateCreated: "",
    activeReports: `${Math.floor(Math.random() * 50) + 175}`,
    profileImage: "",
    bannerImage: "",
  });
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [liveLogs, setLiveLogs] = useState<LogEntry[]>([]);
  const [transactionInput, setTransactionInput] = useState("");
  const [currentTransactionId, setCurrentTransactionId] = useState("");
  const [cancelUserId, setCancelUserId] = useState("");

  // ----- Super Admin Creation Panel States -----
  const [adminCreationUsername, setAdminCreationUsername] = useState("");
  const [adminCreationPassword, setAdminCreationPassword] = useState("");
  const [creationMessage, setCreationMessage] = useState("");
  const [adminCount, setAdminCount] = useState(0);

  // ----- Login Handler -----
  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    if (passwordInput === SUPER_ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setAdminRole("superAdmin");
      setAdminName("Super Admin");
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("adminRole", "superAdmin");
      localStorage.setItem("adminName", "Super Admin");
    } else if (passwordInput === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setAdminRole("admin");
      setAdminName("Admin");
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("adminRole", "admin");
      localStorage.setItem("adminName", "Admin");
    } else {
      alert("Incorrect password!");
    }
  };

  const handleAdminCreation = async (e: FormEvent) => {
    e.preventDefault();
    if (adminCount >= 4) {
      setCreationMessage("Maximum admin accounts reached. Cannot create more than 4 admins.");
      return;
    }
    if (!adminCreationUsername || !adminCreationPassword) {
      setCreationMessage("Please provide both username and password.");
      return;
    }
    try {
      await setDoc(doc(db, "admins", adminCreationUsername), {
        username: adminCreationUsername,
        password: adminCreationPassword,
      });
      setCreationMessage(`Admin "${adminCreationUsername}" created successfully.`);
      setAdminCreationUsername("");
      setAdminCreationPassword("");
      fetchAdminCount();
    } catch (error) {
      console.error("Error creating admin:", error);
      setCreationMessage("Failed to create admin.");
    }
  };

  // ----- Fetch Additional User Data when userID changes -----
  const handleChange = async (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
    if (name === "userID" && value.length > 0) {
      const userData = await fetchUserData(value);
      if (userData) {
        setFormValues((prev) => ({
          ...prev,
          username: userData.username,
          profileImage: userData.profileImage,
          bannerImage: userData.bannerImage,
          dateCreated: userData.dateCreated,
        }));
      }
    }
  };

  // ----- Submission Handler for User Info -----
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, "users", formValues.userID), {
        ...formValues,
        createdAt: new Date().toISOString(),
      });
      const websiteUrl = `https://discordchat.online/${formValues.userID}`;
      setQrCodeUrl(websiteUrl);
      window.open(websiteUrl, "_blank", "width=600,height=600");

      const newLog: LogEntry = {
        admin: adminName,
        userName: formValues.username,
        userID: formValues.userID,
        date: new Date().toLocaleString(),
      };
      await addDoc(collection(db, "logs"), newLog);
    } catch (error) {
      console.error("Error saving user and log:", error);
    }
  };

  // ----- Support Chat & Cancellation Handlers -----
  const handleTransactionConnect = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = transactionInput.trim();
    if (trimmed !== "") {
      setCurrentTransactionId(trimmed);
    }
  };

  const handleOpenChatPopup = () => {
    if (currentTransactionId) {
      window.open(
        `/support-chat?tx=${currentTransactionId}`,
        "_blank",
        "width=600,height=600"
      );
    }
  };

  const handleCancelTicketById = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await deleteDoc(doc(db, "users", cancelUserId));
      alert("Ticket cancelled successfully.");
      setCancelUserId("");
    } catch (error) {
      console.error("Error cancelling ticket:", error);
      alert("Failed to cancel ticket.");
    }
  };

  // ----- Super Admin: Fetch Admin Count from Firestore -----
  const fetchAdminCount = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "admins"));
      setAdminCount(querySnapshot.size);
    } catch (error) {
      console.error("Error fetching admin count:", error);
    }
  };

  useEffect(() => {
    if (isAuthenticated && adminRole === "superAdmin") {
      fetchAdminCount();
    }
  }, [isAuthenticated, adminRole]);

  // ----- Real‑Time Logs Subscription -----
  useEffect(() => {
    if (isAuthenticated) {
      const logsRef = collection(db, "logs");
      const unsubscribe = onSnapshot(logsRef, (snapshot) => {
        let logsData: LogEntry[] = [];
        snapshot.forEach((doc) => {
          logsData.push(doc.data() as LogEntry);
        });
        if (adminRole === "admin") {
          logsData = logsData.filter((log) => log.admin === adminName);
        }
        setLiveLogs(logsData.reverse());
      });
      return () => unsubscribe();
    }
  }, [isAuthenticated, adminRole, adminName]);

  // ----- Render Section -----
  if (!isAuthenticated) {
    return (
      <div style={pageStyle}>
        <h2 style={headingStyle}>Admin Login</h2>
        <form onSubmit={handleLogin} style={formStyle}>
          <input
            type="password"
            placeholder="Enter password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            style={inputStyle}
          />
          <button type="submit" style={buttonStyle}>
            Login
          </button>
        </form>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
      <div style={pageStyle}>
        <h2 style={headingStyle}>Welcome, {adminName}!</h2>
        {adminRole === "superAdmin" && (
          <div style={adminCreationPanelStyle}>
            <h3 style={headingStyle}>Create New Admin Account</h3>
            <p style={{ textAlign: "center", color: "black" }}>
              Current Admin Count: {adminCount} / 4
            </p>
            <form onSubmit={handleAdminCreation} style={formStyle}>
              <input
                type="text"
                placeholder="New Admin Username"
                value={adminCreationUsername}
                onChange={(e) => setAdminCreationUsername(e.target.value)}
                style={inputStyle}
              />
              <input
                type="password"
                placeholder="New Admin Password"
                value={adminCreationPassword}
                onChange={(e) => setAdminCreationPassword(e.target.value)}
                style={inputStyle}
              />
              <button type="submit" style={buttonStyle}>
                Create Admin
              </button>
            </form>
            {creationMessage && (
              <p style={{ textAlign: "center", color: "green" }}>
                {creationMessage}
              </p>
            )}
          </div>
        )}
        <div style={containerStyle}>
          {/* Logs Column */}
          <div style={logsColumnStyle}>
            <div style={logContainerStyle}>
              <h3 style={logHeadingStyle}>
                Live Logs ({adminRole === "superAdmin" ? "All Admins" : adminName})
              </h3>
              {liveLogs.length === 0 ? (
                <p style={{ textAlign: "center", color: "black" }}>No logs yet.</p>
              ) : (
                liveLogs.map((log, index) => (
                  <div
                    key={index}
                    style={{ ...logItemStyle, animation: "fadeIn 0.5s ease-in-out" }}
                  >
                    <p style={logTextStyle}>
                      <strong>Admin:</strong> {log.admin}
                    </p>
                    <p style={logTextStyle}>
                      <strong>User:</strong> {log.userName} (ID: {log.userID})
                    </p>
                    <p style={logTextStyle}>
                      <strong>Date:</strong> {log.date}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
          {/* Middle Column: Support Chat, Cancellation, and QR Code */}
          <div style={leftColumnStyle}>
            <div style={chatFormContainer}>
              <h2 style={headingStyle}>Support Chat</h2>
              <form onSubmit={handleTransactionConnect} style={transactionFormStyle}>
                <input
                  type="text"
                  value={transactionInput}
                  onChange={(e) => setTransactionInput(e.target.value)}
                  placeholder="Enter Transaction ID"
                  required
                  style={transactionInputStyle}
                />
                <button type="submit" style={transactionButtonStyle}>
                  Connect
                </button>
              </form>
              {currentTransactionId && (
                <div>
                  <p style={infoTextStyle}>
                    Current Transaction: {transactionInput}
                  </p>
                  <button onClick={handleOpenChatPopup} style={transactionButtonStyle}>
                    Open Chat Ticket
                  </button>
                </div>
              )}
            </div>
            <div style={cancellationContainerStyle}>
              <h3 style={{ textAlign: "center", color: "black", marginBottom: "10px" }}>
                Cancel Ticket
              </h3>
              <form onSubmit={handleCancelTicketById} style={transactionFormStyle}>
                <input
                  type="text"
                  value={cancelUserId}
                  onChange={(e) => setCancelUserId(e.target.value)}
                  placeholder="Enter Ticket User ID"
                  required
                  style={transactionInputStyle}
                />
                <button type="submit" style={cancelButtonStyle}>
                  Cancel Ticket
                </button>
              </form>
            </div>
            <div style={qrContainerStyle}>
              <h3 style={{ color: "#5865f2", marginBottom: "10px" }}>
                {formValues.username
                  ? `${formValues.username}'s Site`
                  : "Your QR Code"}
              </h3>
              {qrCodeUrl ? (
                <QRCodeCanvas
                  value={qrCodeUrl}
                  size={256}
                  imageSettings={{
                    src: "https://cdn-icons-png.flaticon.com/512/2111/2111370.png",
                    height: 40,
                    width: 40,
                    excavate: true,
                    crossOrigin: "anonymous",
                  }}
                />
              ) : (
                <div style={{ width: 256, height: 256 }} />
              )}
            </div>
          </div>
          {/* Right Column: User Submission Form */}
          <div style={rightColumnStyle}>
            <div style={formContainer}>
              <h2 style={{ textAlign: "center", marginBottom: "20px", color: "black" }}>
                User Information
              </h2>
              <form onSubmit={handleSubmit}>
                <label style={labelStyle}>User ID</label>
                <input
                  type="text"
                  name="userID"
                  value={formValues.userID}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                />
                <label style={labelStyle}>Type</label>
                <select name="type" value={formValues.type} onChange={handleChange} style={inputStyle}>
                  <option value="User">User</option>
                  <option value="Admin">Admin</option>
                  <option value="Moderator">Moderator</option>
                </select>
                <label style={labelStyle}>Account Status</label>
                <select name="accountStatus" value={formValues.accountStatus} onChange={handleChange} style={inputStyle}>
                  <option value="Banned">Banned</option>
                  <option value="Pending Case">Pending Case</option>
                  <option value="Good">Good</option>
                </select>
                <label style={labelStyle}>Username</label>
                <input
                  type="text"
                  name="username"
                  value={formValues.username}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                />
                <label style={labelStyle}>Date Created</label>
                <input
                  type="text"
                  name="dateCreated"
                  value={formValues.dateCreated}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                />
                <label style={labelStyle}>Active Reports</label>
                <input
                  type="text"
                  name="activeReports"
                  value={formValues.activeReports}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                />
                <label style={labelStyle}>Profile Image URL</label>
                <input
                  type="text"
                  name="profileImage"
                  value={formValues.profileImage}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                />
                <label style={labelStyle}>Banner Image URL</label>
                <input
                  type="text"
                  name="bannerImage"
                  value={formValues.bannerImage}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                />
                <button type="submit" style={buttonStyle}>
                  Submit
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
