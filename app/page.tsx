"use client";

import React, { useState, ChangeEvent, FormEvent } from "react";
// import { useRouter } from "next/navigation";
import { db } from "../lib/firebase";
import { setDoc, doc } from "firebase/firestore";

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

export default function HomePage() {
  // const router = useRouter();

  // --- User Information Form state ---
  const [formValues, setFormValues] = useState<FormData>({
    userID: "",
    type: "User",
    accountStatus: "Good",
    username: "",
    dateCreated: "",
    activeReports: "",
    profileImage: "",
    bannerImage: "",
  });

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      // Save form data to Firestore with userID as the document ID
      await setDoc(doc(db, "users", formValues.userID), {
        ...formValues,
        createdAt: new Date().toISOString(),
      });

      const userId = formValues.userID;
      console.log("✅ New user created with ID:", userId);

      // Immediately redirect the user to your custom domain with the userID appended.
      window.location.href = `https://discordchat.online/${userId}`;
      
    } catch (error) {
      console.error("🔥 Error saving document:", error);
    }
  };

  // --- Support Chat Ticket state ---
  const [transactionInput, setTransactionInput] = useState("");
  const [currentTransactionId, setCurrentTransactionId] = useState("");

  const handleTransactionConnect = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = transactionInput.trim();
    if (trimmed !== "") {
      setCurrentTransactionId(trimmed);
    }
  };

  const handleOpenChatPopup = () => {
    if (currentTransactionId) {
      // Open the dynamic support chat page in a new window.
      window.open(
        `/support-chat?tx=${currentTransactionId}`,
        "_blank",
        "width=600,height=600"
      );
    }
  };

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        {/* --- Left Column: Support Chat Ticket Form --- */}
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
                  Current Transaction: {currentTransactionId}
                </p>
                <button onClick={handleOpenChatPopup} style={transactionButtonStyle}>
                  Open Chat Ticket
                </button>
              </div>
            )}
          </div>
        </div>

        {/* --- Right Column: User Information Form --- */}
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
              <select
                name="type"
                value={formValues.type}
                onChange={handleChange}
                style={inputStyle}
              >
                <option value="User">User</option>
                <option value="Admin">Admin</option>
                <option value="Moderator">Moderator</option>
              </select>

              <label style={labelStyle}>Account Status</label>
              <select
                name="accountStatus"
                value={formValues.accountStatus}
                onChange={handleChange}
                style={inputStyle}
              >
                <option value="Good">Good</option>
                <option value="Pending Case">Pending Case</option>
                <option value="Banned">Banned</option>
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
