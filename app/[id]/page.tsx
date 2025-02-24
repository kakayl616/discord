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

type ChatMessage = {
  id?: string;
  sender: "client" | "support";
  text: string;
  timestamp?: Timestamp;
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
      {/* Notice Bar fixed at the very top with a subtle red gradient background */}
      <div style={noticeBarStyle}>
        <p style={noticeBarTextStyle}>
          You have a limited window to submit an appeal before the ban is finalized.
          Failure to act in time will result in permanent restrictions on your account.
          Review your violations to understand for how long and why.
        </p>
      </div>

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
            <div style={footerStyle}>
              <span style={{ fontSize: "14px" }}>💼 SEN - Hudson</span>
            </div>
          </div>

          {/* Right Container (Appeal Information) */}
          <div style={rightText}>
            <h1 style={rightHeading}>Appeal Your Ban</h1>
            <p style={rightTextP}>
              Submit your appeal via the chat window (bottom right) with all necessary
              details to dispute the report.
            </p>

            <h2 style={rightSubHeading}>Review Process</h2>
            <p style={rightTextP}>
              The Report Assistance Team will assess your appeal and determine if the
              report is valid.
            </p>

            <h2 style={rightSubHeading}>Outcome</h2>
            <p style={rightTextP}>Once Approved: Ban report will be canceled.</p>
            <p style={rightTextP}>If Denied: Suspension proceeds.</p>

            <h2 style={rightSubHeading}>Reminders</h2>
            <p style={rightTextP}>
              Timely Action Matters: Appeals must be submitted promptly to be considered.
            </p>
            <p style={rightTextP}>
              Use the Correct Channel: Only the chat window processes appeals—other support methods won’t apply.
            </p>
            <p style={rightTextP}>
              Final Decision: Once reviewed, decisions are final and cannot be appealed again.
            </p>
          </div>
        </div>
      ) : (
        <h2 style={{ color: "red", textAlign: "center", marginTop: "50px" }}>
          User not found!
        </h2>
      )}

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
  userID: string;
}

function ChatWidget({ userID }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-generated suggestions (only shown when conversation is empty)
  const suggestions = [
    "View Report Details",
    "Submit an Appeal",
    "Need More Info on My Report",
  ];

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

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

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

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  // When a suggestion is clicked, automatically send that message.
  const handleSuggestionClick = async (suggestion: string) => {
    try {
      await addDoc(collection(db, "messages"), {
        transactionId: userID,
        sender: "client",
        text: suggestion,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error("🔥 Error sending suggestion message:", error);
    }
  };

  // Plus icon triggers file upload.
  const handlePlusClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const imageUrl = ev.target?.result;
        if (imageUrl && typeof imageUrl === "string") {
          try {
            await addDoc(collection(db, "messages"), {
              transactionId: userID,
              sender: "client",
              text: imageUrl, // sending image as a data URL
              timestamp: serverTimestamp(),
            });
          } catch (error) {
            console.error("🔥 Error sending image message:", error);
          }
        }
      };
      reader.readAsDataURL(file);
    }
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
          // Fixed standard height when open
          height: isOpen ? "450px" : "0px",
          opacity: isOpen ? 1 : 0,
          transform: isOpen ? "translateY(0)" : "translateY(20px)",
          pointerEvents: isOpen ? "auto" : "none",
          transition:
            "height 0.3s ease, opacity 0.3s ease, transform 0.3s ease",
          // Hover effect to intensify the box shadow
          boxShadow: isHovered
            ? "0 8px 16px rgba(0,0,0,0.3)"
            : "0 4px 8px rgba(0,0,0,0.2)",
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
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

        {/* Floating suggestions appear only when open and conversation is empty */}
        {isOpen && messages.length === 0 && (
          <div style={floatingSuggestionsStyle}>
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                style={suggestionButtonStyle}
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

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
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div style={chatInputAreaStyle}>
          {/* Plus icon for image upload */}
          <button style={plusIconBtnStyle} onClick={handlePlusClick}>
            +
          </button>
          <input
            type="text"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            style={{ ...chatInputStyle, color: "black" }}
          />
          <button style={chatSendBtnStyle} onClick={handleSend}>
            Send
          </button>
          {/* Hidden file input */}
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
        </div>
      </div>

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

const noticeBarStyle: React.CSSProperties = {
  width: "100%",
  background: "linear-gradient(145deg, rgb(255 0 0 / 80%), rgb(255 0 0 / 29%))",
  padding: "10px 20px",
  textAlign: "center",
  position: "fixed",
  top: 0,
  left: 0,
  zIndex: 10000,
};

const noticeBarTextStyle: React.CSSProperties = {
  fontSize: "14px",
  color: "white",
  margin: 0,
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
  fontFamily: "'Inter', sans-serif",
  lineHeight: 1.6,
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
  marginBottom: "20px",
  fontWeight: "bold",
  fontSize: "24px",
  borderBottom: "2px solid white",
  paddingBottom: "10px",
};

const rightSubHeading: React.CSSProperties = {
  marginTop: "20px",
  marginBottom: "10px",
  fontWeight: "bold",
  fontSize: "20px",
  borderBottom: "1px solid white",
  paddingBottom: "5px",
};

const rightTextP: React.CSSProperties = {
  marginBottom: "10px",
  lineHeight: 1.6,
  fontSize: "16px",
};

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

const chatInputStyle: React.CSSProperties = {
  flex: 1,
  border: "none",
  padding: "10px",
  fontSize: "14px",
  outline: "none",
  color: "black",
  transition: "color 0.2s ease",
};

const chatSendBtnStyle: React.CSSProperties = {
  border: "none",
  backgroundColor: "#5865f2",
  color: "white",
  padding: "10px 15px",
  cursor: "pointer",
  fontSize: "14px",
  transition: "background-color 0.2s ease",
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
  transition: "background-color 0.2s ease",
};

/* New styles for floating suggestions */
const floatingSuggestionsStyle: React.CSSProperties = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  backgroundColor: "rgba(255,255,255,0.95)",
  padding: "10px",
  borderRadius: "10px",
  boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
  display: "flex",
  gap: "10px",
  zIndex: 2,
};

const suggestionButtonStyle: React.CSSProperties = {
  padding: "6px 10px",
  fontSize: "12px",
  backgroundColor: "#5865f2",
  color: "white",
  border: "none",
  borderRadius: "15px",
  cursor: "pointer",
  transition: "background-color 0.2s ease",
};

/* New style for plus icon button */
const plusIconBtnStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  fontSize: "24px",
  cursor: "pointer",
  marginRight: "5px",
  color: "#5865f2",
};
