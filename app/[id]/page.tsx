/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @next/next/no-img-element */
"use client";

import React, {
  useEffect,
  useState,
  useRef,
  ChangeEvent,
  FormEvent,
} from "react";
import { useParams } from "next/navigation";
import { db } from "../../lib/firebase";
// Import Timestamp to avoid using `any` for Firestore timestamps:
import {
  doc,
  getDoc,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  CollectionReference,
  QuerySnapshot,
  Timestamp,
} from "firebase/firestore";

// ------------ 1) FIRESTORE DATA TYPES --------------
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

// Updated to use `Timestamp` instead of `any`.
type ChatMessage = {
  id?: string;
  sender: "client" | "support";
  text: string;
  timestamp?: Timestamp; // <-- Fixes the "any" type error
  transactionId: string;
};

// ------------ 2) MAIN USER PAGE COMPONENT --------------
export default function UserPage() {
  const { id } = useParams();
  const [data, setData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!id) {
        console.error("🚨 No ID provided in the URL parameters.");
        setLoading(false);
        return;
      }
      // Ensure we use a string rather than an array
      const userId = Array.isArray(id) ? id[0] : id;
      console.log("🔍 Fetching user document for ID:", userId);

      try {
        const docRef = doc(db, "users", userId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          console.log("✅ Document data:", docSnap.data());
          setData(docSnap.data() as UserData);
        } else {
          console.error("❌ No document found for ID:", userId);
          setData(null);
        }
      } catch (error) {
        console.error("🔥 Error fetching document:", error);
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

  return (
    <div style={pageStyle}>
      {data ? (
        <div style={outerContainer}>
          {/* Decorative image */}
          <img
            src="https://cdn.prod.website-files.com/6257adef93867e50d84d30e2/6630f482123160b94617877a_Box%20(1).webp"
            alt=""
            style={box4s}
            loading="lazy"
          />

          {/* Left Container (User's Information) */}
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
                <span
                  style={{
                    ...value,
                    marginLeft: "auto",
                    marginRight: "10px",
                    textAlign: "right",
                  }}
                >
                  {data.userID}
                </span>
              </div>
              <div style={infoRow}>
                <img
                  src="https://img.icons8.com/ios-filled/50/5865f2/certificate.png"
                  alt="Type Icon"
                  style={iconStyle}
                />
                <span style={label}>Type:</span>
                <span
                  style={{
                    ...value,
                    marginLeft: "auto",
                    marginRight: "10px",
                    textAlign: "right",
                  }}
                >
                  {data.type}
                </span>
              </div>
              <div style={infoRow}>
                <img
                  src="https://img.icons8.com/ios-filled/50/5865f2/shield.png"
                  alt="Shield Icon"
                  style={iconStyle}
                />
                <span style={label}>Account Status:</span>
                <span
                  style={{
                    ...value,
                    marginLeft: "auto",
                    marginRight: "10px",
                    textAlign: "right",
                    ...getStatusStyle(data.accountStatus),
                  }}
                >
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
                <span
                  style={{
                    ...value,
                    marginLeft: "auto",
                    marginRight: "10px",
                    textAlign: "right",
                  }}
                >
                  {data.dateCreated}
                </span>
              </div>
              <div style={infoRow}>
                <img
                  src="https://img.icons8.com/ios-filled/50/5865f2/flag.png"
                  alt="Flag Icon"
                  style={iconStyle}
                />
                <span style={label}>Active Reports:</span>
                <span
                  style={{
                    ...value,
                    marginLeft: "auto",
                    marginRight: "10px",
                    textAlign: "right",
                  }}
                >
                  {data.activeReports}
                </span>
              </div>
            </div>
            {/* Footer with support's ID */}
            <div style={footerStyle}>
              <span style={{ fontSize: "14px" }}>💼 SEN - Hudson</span>
            </div>
          </div>

          {/* Right Container (Appeal Information) */}
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
      ) : (
        <h2 style={{ color: "red", textAlign: "center", marginTop: "50px" }}>
          User not found!
        </h2>
      )}

      {/* Chat Widget always rendered, but only works if we have a valid user */}
      {data && <ChatWidget userID={data.userID} />}
    </div>
  );
}

// ------------ 3) STYLING HELPERS + STATUS FUNCTION --------------
function getStatusStyle(accountStatus: string) {
  const statusLower = accountStatus.toLowerCase();
  if (statusLower === "good") {
    return {
      backgroundColor: "rgba(0, 128, 0, 0.2)",
      color: "green",
      borderRadius: "10px",
      padding: "2px 6px",
    };
  } else if (statusLower.includes("pending")) {
    return {
      backgroundColor: "rgba(255, 165, 0, 0.2)",
      color: "orange",
      borderRadius: "10px",
      padding: "2px 6px",
    };
  } else if (statusLower === "banned") {
    return {
      backgroundColor: "rgba(255, 0, 0, 0.2)",
      color: "red",
      borderRadius: "10px",
      padding: "2px 6px",
    };
  }
  return {};
}

// ------------ 4) CHAT WIDGET USING FIRESTORE --------------
interface ChatWidgetProps {
  userID: string; // We'll use this as the transactionId
}

function ChatWidget({ userID }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");

  // We'll auto-scroll to the newest message using this ref
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Listen to Firestore for messages
  useEffect(() => {
    if (!userID) return;

    const messagesRef = collection(
      db,
      "messages"
    ) as CollectionReference<ChatMessage>;
    const q = query(
      messagesRef,
      where("transactionId", "==", userID),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot: QuerySnapshot<ChatMessage>) => {
      const msgs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [userID]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Send a message to Firestore (as "client")
  const handleSend = async () => {
    if (!input.trim()) return;
    try {
      await addDoc(collection(db, "messages"), {
        transactionId: userID,
        sender: "client",
        text: input.trim(),
        timestamp: serverTimestamp(),
      });
      setInput("");
    } catch (error) {
      console.error("🔥 Error sending message:", error);
    }
  };

  // For handling Enter key
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiClick = () => {
    setInput((prev) => prev + " 😊");
  };

  return (
    <div style={chatWidgetStyle}>
      <div
        style={{
          ...chatWindowStyle,
          width: "320px",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",

          // By default, it's collapsed (maxHeight=0). If isOpen is true, show up to 450px
          maxHeight: isOpen ? "450px" : "0px",
          opacity: isOpen ? 1 : 0,
          transform: isOpen ? "translateY(0)" : "translateY(20px)",
          pointerEvents: isOpen ? "auto" : "none",

          transition:
            "max-height 0.3s ease, opacity 0.3s ease, transform 0.3s ease",
        }}
      >
        {/* --- Chat Header --- */}
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
              <div style={transactionIdStyle}>Transaction: {userID}</div>
            </div>
          </div>
          <button style={chatMinimizeBtnStyle} onClick={() => setIsOpen(false)}>
            –
          </button>
        </div>

        {/* --- Body + Messages (Scrollable) --- */}
        <div style={chatBodyStyle}>
          <div style={chatMessagesStyle}>
            {messages.map((msg) => {
              const key = msg.id || Math.random().toString(36).substr(2, 9);
              const isSupport = msg.sender === "support";
              return (
                <div
                  key={key}
                  style={isSupport ? chatBubbleBotStyle : chatBubbleUserStyle}
                >
                  {msg.text}
                </div>
              );
            })}
            {/* A dummy div at the bottom to auto-scroll into view */}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* --- Input Area --- */}
        <div style={chatInputAreaStyle}>
          <button style={chatEmojiBtnStyle} onClick={handleEmojiClick}>
            😊
          </button>
          <input
            type="text"
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

      {/* Toggle Button to open chat */}
      <div style={chatToggleStyle}>
        <button style={chatToggleBtnStyle} onClick={() => setIsOpen(true)}>
          Chat
        </button>
      </div>
    </div>
  );
}

/* ----------------------
   Inline Styles
---------------------- */
const pageStyle: React.CSSProperties = {
  background: "url('/img/background.png') no-repeat center center fixed",
  backgroundSize: "cover",
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
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
  width: "40%",
  padding: "20px",
  background: "linear-gradient(145deg, #afb5f7 20%, #808aff 80%)",
  borderRadius: "20px",
  backdropFilter: "blur(40px)",
  textAlign: "center",
  color: "white",
};

const rightText: React.CSSProperties = {
  width: "55%",
  padding: "20px",
  color: "white",
  textAlign: "left",
};

const profileHeader: React.CSSProperties = {
  position: "relative",
  marginBottom: "20px",
  borderRadius: "20px 20px 0 0",
  overflow: "hidden",
};

const banner: React.CSSProperties = {
  display: "block",
  width: "100%",
  height: "150px",
  objectFit: "cover",
  borderRadius: "20px 20px 0 0",
};

const profile: React.CSSProperties = {
  width: "80px",
  height: "80px",
  borderRadius: "50%",
  objectFit: "cover",
  marginTop: "-40px",
  marginLeft: "auto",
  marginRight: "auto",
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

const footerStyle: React.CSSProperties = {
  marginTop: "20px",
  borderTop: "1px solid rgba(255,255,255,0.3)",
  paddingTop: "10px",
  textAlign: "center",
  fontSize: "14px",
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

// ---- Chat Widget Styles ----
const chatWidgetStyle: React.CSSProperties = {
  position: "fixed",
  bottom: "20px",
  right: "20px",
  fontFamily: "'Lato', sans-serif",
  zIndex: 9999,
};

const chatWindowStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  border: "1px solid #ccc",
  borderRadius: "10px",
  boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
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
  flex: 1,
  backgroundColor: "#f1f1f1",
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

const chatEmojiBtnStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  fontSize: "20px",
  cursor: "pointer",
  marginRight: "5px",
};

const chatInputStyle: React.CSSProperties = {
  flex: 1,
  border: "none",
  padding: "10px",
  fontSize: "14px",
  outline: "none",
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
