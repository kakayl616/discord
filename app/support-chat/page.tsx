"use client";

import React, {
  Suspense,
  useState,
  useEffect,
  ChangeEvent,
  FormEvent,
  useRef,
} from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  Timestamp,
  QuerySnapshot,
  CollectionReference,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// ---------------------------
// Data Types
// ---------------------------
type Message = {
  id?: string;
  sender: string; // always "support"
  text: string;
  messageType?: "text" | "secure_form_request" | "secure_form_response";
  timestamp?: Timestamp;
  transactionId: string;
};

type UserData = {
  userID: string;
  username: string;
};

type PreComposedMessage = {
  id: string;
  text: string;
};

interface TransactionFormProps {
  onSubmit: (tx: string) => void;
}

// ---------------------------
// TransactionForm Component
// ---------------------------
function TransactionForm({ onSubmit }: TransactionFormProps) {
  const [input, setInput] = useState("");
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (trimmed) onSubmit(trimmed);
  };
  return (
    <form onSubmit={handleSubmit} style={{ textAlign: "center", marginTop: "50px" }}>
      <h2 style={{ color: "black" }}>Please enter a valid transaction ID:</h2>
      <input
        type="text"
        value={input}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
        placeholder="Enter Transaction ID"
        style={{ padding: "10px", fontSize: "16px", color: "black" }}
      />
      <button type="submit" style={{ padding: "10px 20px", marginLeft: "10px" }}>
        Submit
      </button>
    </form>
  );
}

// ---------------------------
// ChatContent Component (Support)
// ---------------------------
function ChatContent() {
  const searchParams = useSearchParams();
  const initialTx = searchParams.get("tx") || "";
  const role = "support"; // Hardcoded

  const [transactionId, setTransactionId] = useState(initialTx);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);
  const [containerLoaded, setContainerLoaded] = useState(false);
  const [preComposedMessages, setPreComposedMessages] = useState<PreComposedMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { setContainerLoaded(true); }, []);

  useEffect(() => {
    async function fetchUserData() {
      setLoading(true);
      try {
        const userDoc = await getDoc(doc(db, "users", transactionId));
        if (userDoc.exists()) {
          setUser(userDoc.data() as UserData);
        } else {
          setUser(null);
          console.error("User not found in Firestore");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
      setLoading(false);
    }
    if (transactionId) fetchUserData();
  }, [transactionId]);

  useEffect(() => {
    if (!transactionId) return;
    const messagesRef = collection(db, "messages") as CollectionReference<Message>;
    const q = query(messagesRef, where("transactionId", "==", transactionId), orderBy("timestamp", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot: QuerySnapshot<Message>) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
    });
    return () => unsubscribe();
  }, [transactionId]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const containerAnimationStyle: React.CSSProperties = {
    opacity: containerLoaded ? 1 : 0,
    transform: containerLoaded ? "translateY(0)" : "translateY(20px)",
    transition: "opacity 0.5s ease-out, transform 0.5s ease-out",
  };

  const sendMessage = async (text: string, messageType: Message["messageType"] = "text") => {
    const trimmed = text.trim();
    if (!trimmed) return;
    try {
      await addDoc(collection(db, "messages"), {
        transactionId,
        sender: role,
        text: trimmed,
        messageType,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    await sendMessage(chatInput);
    setChatInput("");
  };

  // When support clicks this button, a secure form request message is sent.
  const handleSendSecureFormRequest = async () => {
    await sendMessage(
      "Secure form request: Please fill out the secure form on the client website.",
      "secure_form_request"
    );
  };

  const renderMessageContent = (msg: Message) => {
    if (msg.text.startsWith("data:image/")) {
      return (
        <Image
          src={msg.text}
          alt="Uploaded"
          width={300}
          height={200}
          style={{ borderRadius: "10px", marginTop: "5px" }}
        />
      );
    }
    return <span>{msg.text}</span>;
  };

  return (
    <div style={chatPageStyle}>
      {!transactionId || transactionId === "support-chat" ? (
        <TransactionForm onSubmit={(tx) => setTransactionId(tx)} />
      ) : loading ? (
        <h2 style={{ textAlign: "center", marginTop: "50px", color: "black" }}>Loading...</h2>
      ) : (
        <div style={{ ...chatWrapperStyle, ...containerAnimationStyle }}>
          <div style={chatContainerStyle}>
            <div style={chatHeaderStyle}>
              Support Chat {user ? `- ${user.username}` : ""} (TX: {transactionId})
            </div>
            <div style={chatMessagesStyle}>
              {messages.map(msg => (
                <div
                  key={msg.id}
                  style={{
                    margin: "10px",
                    padding: "10px 15px",
                    borderRadius: "15px",
                    maxWidth: "70%",
                    wordWrap: "break-word",
                    fontSize: "15px",
                    backgroundColor: "#5865f2",
                    color: "white",
                    alignSelf: "flex-end",
                  }}
                >
                  <strong>{msg.sender}:</strong> {renderMessageContent(msg)}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSend} style={chatInputContainerStyle}>
              <input
                type="text"
                value={chatInput}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setChatInput(e.target.value)}
                placeholder="Type your message..."
                style={{ ...chatInputStyle, color: "black" }}
              />
              <button type="submit" style={chatSendStyle}>Send</button>
              <button
                type="button"
                onClick={handleSendSecureFormRequest}
                style={{ ...chatSendStyle, marginLeft: "5px", backgroundColor: "#28a745" }}
              >
                Secure Form
              </button>
            </form>
          </div>
          {/* (Sidebar for pre-composed messages can be added here if desired.) */}
        </div>
      )}
    </div>
  );
}

export default function SupportChat() {
  return (
    <Suspense fallback={<div style={{ textAlign: "center", marginTop: "50px", color: "black" }}>Loading chat...</div>}>
      <ChatContent />
    </Suspense>
  );
}

/* ----------------------
   Styling
---------------------- */
const chatPageStyle: React.CSSProperties = {
  margin: 0,
  fontFamily: "sans-serif",
  backgroundColor: "#f1f1f1",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  height: "100vh",
};

const chatWrapperStyle: React.CSSProperties = {
  display: "flex",
  width: "800px",
  height: "600px",
  boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
};

const chatContainerStyle: React.CSSProperties = {
  width: "500px",
  height: "100%",
  backgroundColor: "white",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
};

const chatHeaderStyle: React.CSSProperties = {
  backgroundColor: "#5865f2",
  color: "white",
  padding: "15px",
  textAlign: "center",
  fontSize: "18px",
};

const chatMessagesStyle: React.CSSProperties = {
  flex: 1,
  padding: "10px",
  overflowY: "auto",
  background: "#fafafa",
};

const chatInputContainerStyle: React.CSSProperties = {
  display: "flex",
  borderTop: "1px solid #ccc",
  alignItems: "center",
};

const chatInputStyle: React.CSSProperties = {
  flex: 1,
  border: "none",
  padding: "10px",
  fontSize: "16px",
  outline: "none",
  color: "black",
};

const chatSendStyle: React.CSSProperties = {
  border: "none",
  backgroundColor: "#5865f2",
  color: "white",
  padding: "10px 20px",
  cursor: "pointer",
  fontSize: "16px",
};
