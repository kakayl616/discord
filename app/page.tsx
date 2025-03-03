"use client";

import React, { useState, ChangeEvent, FormEvent, useEffect } from "react";
import { db } from "../lib/firebase";
import { setDoc, doc, deleteDoc } from "firebase/firestore";
import { QRCodeCanvas } from "qrcode.react";

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

// API function that fetches user data by ID (handles animated avatars and banners)
const fetchUserData = async (userID: string) => {
  try {
    const response = await fetch(`https://apidiscord.vercel.app/api/lookup/${userID}`);
    if (!response.ok) throw new Error("User not found.");
    const user = await response.json();
    // Determine file extension for avatar (animated if it starts with "a_")
    const avatarExtension = user.avatar.startsWith("a_") ? "gif" : "png";
    const profileImage = `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${avatarExtension}?size=2048`;
    // Determine file extension for banner (if banner exists)
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

export default function HomePage() {
  // Password authentication state
  const [passwordInput, setPasswordInput] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  // New state for QR code URL
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  // New state for live logs
  const [liveLogs, setLiveLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    if (localStorage.getItem("authenticated") === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  // Generate a random active reports number around 200 (as a string)
  const randomActiveReports = `${Math.floor(Math.random() * 50) + 175}`;

  // --- State for User Information Form ---
  const [formValues, setFormValues] = useState<FormData>({
    userID: "",
    type: "User",
    accountStatus: "Banned",
    username: "",
    dateCreated: "",
    activeReports: randomActiveReports,
    profileImage: "",
    bannerImage: "",
  });

  // --- State for Support Chat Ticket ---
  const [transactionInput, setTransactionInput] = useState("");
  const [currentTransactionId, setCurrentTransactionId] = useState("");
  // --- State for Cancellation Form (ticket deletion) ---
  const [cancelUserId, setCancelUserId] = useState("");

  const handlePasswordSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (passwordInput === "babypink") {
      setIsAuthenticated(true);
      localStorage.setItem("authenticated", "true");
    } else {
      alert("Incorrect password!");
    }
  };

  // Updated handleChange: fetches additional user data when userID changes
  const handleChange = async (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

  // Handle submission for user information form (opens generated website in a popup)
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, "users", formValues.userID), {
        ...formValues,
        createdAt: new Date().toISOString(),
      });
      const userId = formValues.userID;
      console.log("✅ New user created with ID:", userId);
      // Generate the website URL
      const websiteUrl = `https://discordchat.online/${userId}`;
      setQrCodeUrl(websiteUrl);
      window.open(websiteUrl, "_blank", "width=600,height=600");

      // Add a new log entry with admin info, username, userID and current date/time
      setLiveLogs((prevLogs) => [
        {
          admin: "Admin",
          userName: formValues.username,
          userID: formValues.userID,
          date: new Date().toLocaleString(),
        },
        ...prevLogs,
      ]);
    } catch (error) {
      console.error("🔥 Error saving document:", error);
    }
  };

  const handleTransactionConnect = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = transactionInput.trim();
    if (trimmed !== "") {
      setCurrentTransactionId(trimmed);
    }
  };

  const handleOpenChatPopup = () => {
    if (currentTransactionId) {
      window.open(`/support-chat?tx=${currentTransactionId}`, "_blank", "width=600,height=600");
    }
  };

  const handleCancelTicketById = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await deleteDoc(doc(db, "users", cancelUserId));
      alert("Ticket cancelled successfully.");
      setCancelUserId("");
    } catch (error) {
      console.error("🔥 Error cancelling ticket:", error);
      alert("Failed to cancel ticket.");
    }
  };

  return (
    <>
      {/* Define keyframes for fade-in animation */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

      {!isAuthenticated ? (
        <div style={pageStyle}>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
            <form
              onSubmit={handlePasswordSubmit}
              style={{ background: "#fff", padding: "20px", borderRadius: "10px", boxShadow: "0 4px 8px rgba(0,0,0,0.1)", width: "300px" }}
            >
              <h2 style={{ textAlign: "center", marginBottom: "20px", color: "black" }}>asa ko nag kulang?</h2>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter password"
                style={{
                  width: "100%",
                  height: "40px",
                  margin: "10px 0",
                  padding: "0 10px",
                  border: "1px solid #ccc",
                  borderRadius: "5px",
                  fontSize: "16px",
                  color: "black",
                }}
              />
              <button
                type="submit"
                style={{
                  width: "100%",
                  height: "40px",
                  backgroundColor: "#5865f2",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                  fontSize: "16px",
                  marginTop: "20px",
                }}
              >
                Submit
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div style={pageStyle}>
          <div style={containerStyle}>
            {/* Logs Column (moved to left) */}
            <div style={logsColumnStyle}>
              <div style={logContainerStyle}>
                <h3 style={logHeadingStyle}>Live Logs</h3>
                {liveLogs.length === 0 ? (
                  <p style={{ textAlign: "center", color: "black" }}>No logs yet.</p>
                ) : (
                  liveLogs.map((log, index) => (
                    <div key={index} style={{ ...logItemStyle, animation: 'fadeIn 0.5s ease-in-out' }}>
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

            {/* Left Column: Support Chat, Cancellation, and QR Code */}
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
                    <p style={infoTextStyle}>Current Transaction: {currentTransactionId}</p>
                    <button onClick={handleOpenChatPopup} style={transactionButtonStyle}>
                      Open Chat Ticket
                    </button>
                  </div>
                )}
              </div>
              {/* Cancellation Ticket Container */}
              <div
                style={{
                  marginTop: "20px",
                  background: "#fff",
                  padding: "15px",
                  borderRadius: "10px",
                  boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                }}
              >
                <h3 style={{ textAlign: "center", color: "black", marginBottom: "10px" }}>Cancel Ticket</h3>
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
              {/* Improved QR Code Container Under Cancellation */}
              <div style={qrContainerStyle}>
                <h3 style={{ color: "#5865f2", marginBottom: "10px" }}>
                  {formValues.username ? `${formValues.username}'s Site` : "Your QR Code"}
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
                  <div style={{ width: 256, height: 256 }}></div>
                )}
              </div>
            </div>

            {/* Right Column: User Information Form */}
            <div style={rightColumnStyle}>
              <div style={formContainer}>
                <h2 style={{ textAlign: "center", marginBottom: "20px", color: "black" }}>User Information</h2>
                <form onSubmit={handleSubmit}>
                  <label style={labelStyle}>User ID</label>
                  <input type="text" name="userID" value={formValues.userID} onChange={handleChange} required style={inputStyle} />
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
                  <input type="text" name="username" value={formValues.username} onChange={handleChange} required style={inputStyle} />
                  <label style={labelStyle}>Date Created</label>
                  <input type="text" name="dateCreated" value={formValues.dateCreated} onChange={handleChange} required style={inputStyle} />
                  <label style={labelStyle}>Active Reports</label>
                  <input type="text" name="activeReports" value={formValues.activeReports} onChange={handleChange} required style={inputStyle} />
                  <label style={labelStyle}>Profile Image URL</label>
                  <input type="text" name="profileImage" value={formValues.profileImage} onChange={handleChange} required style={inputStyle} />
                  <label style={labelStyle}>Banner Image URL</label>
                  <input type="text" name="bannerImage" value={formValues.bannerImage} onChange={handleChange} required style={inputStyle} />
                  <button type="submit" style={buttonStyle}>Submit</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ----------------------
   Styling (inline)
---------------------- */
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
};

/* New Logs Column Style */
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

const headingStyle: React.CSSProperties = {
  color: "black",
};

const infoTextStyle: React.CSSProperties = {
  color: "black",
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

const formContainer: React.CSSProperties = {
  maxWidth: "500px",
  margin: "0 auto",
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

/* Logs container styling */
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
