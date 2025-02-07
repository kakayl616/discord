/* eslint-disable @typescript-eslint/no-unused-vars */


"use client";
import React, { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "../../lib/firebase"; // your Firestore instance
import { doc, getDoc } from "firebase/firestore";

type UserData = {
  userID: string;
  type: string;
  accountStatus: string;
  username: string;
  dateCreated: string;
  activeReports: string;
  profileImage: string;
  bannerImage: string;
};

export default function UserPage() {
  const { id } = useParams();
  const [data, setData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      // Ensure we use a string rather than an array
      const userId = Array.isArray(id) ? id[0] : id;
      const docRef = doc(db, "users", userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setData(docSnap.data() as UserData);
      } else {
        setData(null);
      }
      setLoading(false);
    }
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <h2 style={{ color: "white", textAlign: "center", marginTop: "50px" }}>
        Loading...
      </h2>
    );
  }
  if (!data) {
    return (
      <h2 style={{ color: "red", textAlign: "center", marginTop: "50px" }}>
        User not found!
      </h2>
    );
  }

  // Determine additional styling for account status based on value
  let statusStyle = {};
  const statusLower = data.accountStatus.toLowerCase();
  if (statusLower === "good") {
    statusStyle = { backgroundColor: "rgba(0, 128, 0, 0.2)", color: "green" };
  } else if (statusLower === "pending") {
    statusStyle = { backgroundColor: "rgba(255, 165, 0, 0.2)", color: "#FFA500" };
  } else if (statusLower === "banned") {
    statusStyle = { backgroundColor: "rgba(255, 0, 0, 0.2)", color: "red" };
  }

  return (
    <div style={pageStyle}>
      <div style={outerContainer}>
        {/* Decorative .box-4s */}
        <img
          src="https://cdn.prod.website-files.com/6257adef93867e50d84d30e2/6630f482123160b94617877a_Box%20(1).webp"
          alt=""
          style={box4s}
          loading="lazy"
        />

        {/* Left Container */}
        <div style={leftContainer}>
          <div style={profileHeader}>
            <img
              className="banner"
              src={data.bannerImage}
              alt="Banner Image"
              style={banner}
            />
            <img
              className="profile"
              src={data.profileImage}
              alt={`${data.username}'s Profile Image`}
              style={profile}
            />
            <h2 style={username}>{data.username}</h2>
          </div>
          <div style={infoContainer}>
            <div style={infoRow}>
              <img
                src="https://img.icons8.com/ios-filled/50/5865f2/user.png"
                alt="User Icon"
                style={iconStyle}
              />
              <span style={label}>User ID:</span>
              <span style={value}>{data.userID}</span>
            </div>
            <div style={infoRow}>
              <img
                src="https://img.icons8.com/ios-filled/50/5865f2/certificate.png"
                alt="Type Icon"
                style={iconStyle}
              />
              <span style={label}>Type:</span>
              <span style={value}>{data.type}</span>
            </div>
            <div style={infoRow}>
              <img
                src="https://img.icons8.com/ios-filled/50/5865f2/shield.png"
                alt="Shield Icon"
                style={iconStyle}
              />
              <span style={label}>Account Status:</span>
              <span style={{ ...value, ...status, ...statusStyle }}>
                {data.accountStatus}
              </span>
            </div>
            <div style={infoRow}>
              <img
                src="https://img.icons8.com/ios-filled/50/5865f2/calendar.png"
                alt="Calendar Icon"
                style={iconStyle}
              />
              <span style={label}>Date Created:</span>
              <span style={value}>{data.dateCreated}</span>
            </div>
            <div style={infoRow}>
              <img
                src="https://img.icons8.com/ios-filled/50/5865f2/flag.png"
                alt="Flag Icon"
                style={iconStyle}
              />
              <span style={label}>Active Reports:</span>
              <span style={value}>{data.activeReports}</span>
            </div>
          </div>
        </div>

        {/* Right Text */}
        <div style={rightText}>
          <h1 style={rightHeading}>Account Suspension Appeal</h1>
          <p style={rightTextP}>
            If you believe you’ve been falsely accused, you have the opportunity
            to cancel your pending ban report. Follow the steps below to appeal:
          </p>
          <h2 style={rightSubHeading}>How It Works:</h2>
          <h3 style={rightStepHeading}>Step 1: Submit Your Appeal</h3>
          <p style={rightTextP}>
            Provide all necessary details to verify that the report is false.
          </p>
          <h3 style={rightStepHeading}>Step 2: Review Process</h3>
          <p style={rightTextP}>
            Our Report Assistance Team will carefully review your appeal and
            confirm your information.
          </p>
          <h3 style={rightStepHeading}>Step 3: Report Cancellation</h3>
          <p style={rightTextP}>
            Once your appeal is approved, your pending ban report will be
            canceled.
          </p>
          <h2 style={rightSubHeading}>Important Notice:</h2>
          <p style={rightTextP}>
            Feature Restrictions: If you do not submit an appeal, you may lose
            access to certain features such as playing on secured servers,
            trading items, and using the in-game market.
          </p>
          <p style={rightTextP}>
            Support Inquiries: Contacting support will not cancel the suspension,
            as a dedicated team is already handling this matter.
          </p>
          <p style={rightTextP}>
            Take action now to cancel your pending ban report before it’s
            finalized!
          </p>
        </div>
      </div>
      {/* Chat Widget integrated into the page */}
      <ChatWidget />
    </div>
  );
}

/* ------------------------- */
/* Chat Widget Component     */
/* ------------------------- */
function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<
    { text: string; sender: "bot" | "user" }[]
  >([{ text: "Hello! How can we assist you today?", sender: "bot" }]);
  const [input, setInput] = useState("");
  // Generate a unique transaction ID for this session.
  const transactionId = useRef(
    `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`
  ).current;
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    const channel = new BroadcastChannel("chat_channel");
    channelRef.current = channel;
    channel.onmessage = (e) => {
      if (e.data.sender === "support" && e.data.transactionId === transactionId) {
        setMessages((prev) => [
          ...prev,
          { text: e.data.text, sender: "bot" },
        ]);
      }
    };

    return () => {
      channel.close();
    };
  }, [transactionId]);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { text: input, sender: "user" }]);
    channelRef.current?.postMessage({
      sender: "client",
      text: input,
      transactionId,
    });
    setInput("");
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={chatWidgetStyle}>
      {/* Chat Window */}
      <div style={{ ...chatWindowStyle, display: isOpen ? "block" : "none" }}>
        <div style={chatHeaderStyle}>
          <div style={chatHeaderInfoStyle}>
            <img
              src="https://cdn.prod.website-files.com/6257adef93867e50d84d30e2/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png"
              alt="Discord Logo"
              style={chatLogoStyle}
            />
            <div style={chatTitleStyle}>
              <div style={chatTitleMainStyle}>Discord</div>
              <div style={chatTitleSubStyle}>Customer Service</div>
              <div style={transactionIdStyle}>
                Transaction: {transactionId}
              </div>
            </div>
          </div>
          <button style={chatMinimizeBtnStyle} onClick={() => setIsOpen(false)}>
            –
          </button>
        </div>
        <div style={chatBodyStyle}>
          <div style={chatMessagesStyle}>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={
                  msg.sender === "bot"
                    ? chatBubbleBotStyle
                    : chatBubbleUserStyle
                }
              >
                {msg.text}
              </div>
            ))}
          </div>
          <div style={chatInputAreaStyle}>
            <input
              type="text"
              id="chat-input"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              style={chatInputStyle}
            />
            <button style={chatSendBtnStyle} onClick={handleSend}>
              Send
            </button>
          </div>
        </div>
      </div>
      {/* Chat Toggle Button (always visible) */}
      <div style={chatToggleStyle}>
        <button style={chatToggleBtnStyle} onClick={() => setIsOpen(true)}>
          Chat
        </button>
      </div>
    </div>
  );
}

/* ------------------------- */
/* Global & Component Styles */
/* ------------------------- */
const pageStyle: React.CSSProperties = {
  background: "url('img/background.png') no-repeat center center fixed",
  backgroundSize: "cover",
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  margin: 0,
  overflow: "hidden",
};

const outerContainer: React.CSSProperties = {
  position: "relative",
  top: 0,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "20px",
  width: "90%",
  maxWidth: "1200px",
  padding: "20px",
  background:
    "linear-gradient(145deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))",
  borderRadius: "30px",
  boxShadow: "0 8px 20px rgba(0, 0, 0, 0.2)",
  backdropFilter: "blur(20px)",
};

const box4s: React.CSSProperties = {
  zIndex: 3,
  pointerEvents: "none",
  maxWidth: "14.6875rem",
  marginTop: "-7.3rem",
  marginRight: "-2.5rem",
  position: "absolute",
  top: 0,
  right: 0,
};

const leftContainer: React.CSSProperties = {
  width: "48%",
  padding: "20px",
  background: "linear-gradient(145deg, #afb5f7 20%, #808aff 80%)",
  borderRadius: "20px",
  backdropFilter: "blur(40px)",
  textAlign: "center",
  color: "white",
};

const rightText: React.CSSProperties = {
  width: "48%",
  padding: "20px",
  color: "white",
  textAlign: "left",
};

const profileHeader: React.CSSProperties = {
  position: "relative",
  marginBottom: "20px",
  borderRadius: "15px 15px 0 0",
  overflow: "hidden",
};

const banner: React.CSSProperties = {
  display: "block",
  width: "100%",
  height: "150px",
  objectFit: "cover",
};

const profile: React.CSSProperties = {
  width: "80px",
  height: "80px",
  borderRadius: "50%",
  objectFit: "cover",
  marginTop: "-40px",
  border: "3px solid white",
  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
};

const username: React.CSSProperties = {
  fontWeight: "bold",
  marginTop: "10px",
};

const infoContainer: React.CSSProperties = {
  padding: "20px",
  textAlign: "left",
};

const infoRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "10px 0",
  borderBottom: "1px solid #e0e0e0",
};

const iconStyle: React.CSSProperties = {
  width: "16px",
  height: "16px",
};

const label: React.CSSProperties = {
  fontWeight: "bold",
  color: "#5865f2",
  minWidth: "100px",
};

const value: React.CSSProperties = {
  color: "#23272a",
};

const status: React.CSSProperties = {
  padding: "2px 6px",
  borderRadius: "4px",
  display: "inline-block",
};

const rightHeading: React.CSSProperties = {
  marginBottom: "15px",
  fontWeight: "bold",
};

const rightSubHeading: React.CSSProperties = {
  marginTop: "20px",
  marginBottom: "10px",
  fontWeight: "bold",
};

const rightStepHeading: React.CSSProperties = {
  marginTop: "15px",
  marginBottom: "5px",
  fontWeight: "bold",
};

const rightTextP: React.CSSProperties = {
  marginBottom: "15px",
  lineHeight: 1.5,
};

/* Chat Widget Styles */
const chatWidgetStyle: React.CSSProperties = {
  position: "fixed",
  bottom: "20px",
  right: "20px",
  fontFamily: "'Lato', sans-serif",
  zIndex: 9999,
};

const chatWindowStyle: React.CSSProperties = {
  width: "300px",
  backgroundColor: "#ffffff",
  border: "1px solid #ccc",
  borderRadius: "10px",
  boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
  overflow: "hidden",
  marginBottom: "5px",
};

const chatHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  backgroundColor: "#5865f2",
  color: "white",
  padding: "10px",
};

const chatHeaderInfoStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
};

const chatLogoStyle: React.CSSProperties = {
  width: "30px",
  height: "30px",
  marginRight: "10px",
};

const chatTitleStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  lineHeight: 1,
};

const chatTitleMainStyle: React.CSSProperties = {
  fontWeight: "bold",
  fontSize: "16px",
};

const chatTitleSubStyle: React.CSSProperties = {
  fontSize: "12px",
};

const transactionIdStyle: React.CSSProperties = {
  fontSize: "10px",
  opacity: 0.8,
  marginTop: "5px",
};

const chatMinimizeBtnStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "white",
  fontSize: "20px",
  cursor: "pointer",
};

const chatBodyStyle: React.CSSProperties = {
  backgroundColor: "#f1f1f1",
  maxHeight: "300px",
  display: "flex",
  flexDirection: "column",
  padding: "10px",
  overflowY: "auto",
};

const chatMessagesStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
};

const chatBubbleBaseStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "8px 12px",
  borderRadius: "15px",
  margin: "5px",
  maxWidth: "80%",
  wordWrap: "break-word",
};

const chatBubbleBotStyle: React.CSSProperties = {
  ...chatBubbleBaseStyle,
  backgroundColor: "#e0e0e0",
  color: "#333",
  alignSelf: "flex-start",
};

const chatBubbleUserStyle: React.CSSProperties = {
  ...chatBubbleBaseStyle,
  backgroundColor: "#5865f2",
  color: "white",
  alignSelf: "flex-end",
};

const chatInputAreaStyle: React.CSSProperties = {
  display: "flex",
  borderTop: "1px solid #ccc",
};

const chatInputStyle: React.CSSProperties = {
  flex: 1,
  border: "none",
  padding: "10px",
  fontSize: "14px",
};

const chatSendBtnStyle: React.CSSProperties = {
  border: "none",
  backgroundColor: "#5865f2",
  color: "white",
  padding: "10px 15px",
  cursor: "pointer",
  fontSize: "14px",
};

const chatToggleStyle: React.CSSProperties = {
  textAlign: "center",
  backgroundColor: "#5865f2",
  borderRadius: "10px",
};

const chatToggleBtnStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "white",
  width: "100%",
  padding: "10px",
  cursor: "pointer",
  fontSize: "16px",
};
