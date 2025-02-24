"use client";

import React, { Suspense, useState, useEffect, ChangeEvent, FormEvent, useRef } from "react";
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
  sender: string; // "support" | "client"
  text: string;
  timestamp?: Timestamp;
  transactionId: string;
};

type UserData = {
  userID: string;
  username: string;
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
    if (trimmed) {
      onSubmit(trimmed);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ textAlign: "center", marginTop: "50px" }}>
      <h2>Please enter a valid transaction ID:</h2>
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
// ChatContent Component (Inner Component)
// Contains all logic that uses useSearchParams and Firebase hooks
// ---------------------------
function ChatContent() {
  const searchParams = useSearchParams();
  const initialTx = searchParams.get("tx") || "";

  // 1) Define hooks at the top
  const [transactionId, setTransactionId] = useState(initialTx);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);

  // Animation state for the container
  const [containerLoaded, setContainerLoaded] = useState(false);

  // For auto-scrolling
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Trigger container animation on mount
  useEffect(() => {
    setContainerLoaded(true);
  }, []);

  // 2) useEffect: Fetch user data if we have a transactionId
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

    if (transactionId) {
      fetchUserData();
    }
  }, [transactionId]);

  // 3) useEffect: Listen for chat messages in Firestore
  useEffect(() => {
    if (!transactionId) return; // no subscription if empty

    const messagesRef = collection(db, "messages") as CollectionReference<Message>;
    const q = query(
      messagesRef,
      where("transactionId", "==", transactionId),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot: QuerySnapshot<Message>) => {
      const msgs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [transactionId]);

  // 4) useEffect: Auto-scroll on messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // 5) Conditional rendering after all hooks are defined
  if (!transactionId || transactionId === "support-chat") {
    return <TransactionForm onSubmit={(tx) => setTransactionId(tx)} />;
  }

  if (loading) {
    return (
      <h2 style={{ color: "black", textAlign: "center", marginTop: "50px" }}>
        Loading...
      </h2>
    );
  }

  // 6) Handler for sending a message
  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = chatInput.trim();
    if (!trimmed) return;

    try {
      await addDoc(collection(db, "messages"), {
        transactionId,
        sender: "support",
        text: trimmed,
        timestamp: serverTimestamp(),
      });
      setChatInput("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // Animation styles for the container
  const containerAnimationStyle: React.CSSProperties = {
    opacity: containerLoaded ? 1 : 0,
    transform: containerLoaded ? "translateY(0)" : "translateY(20px)",
    transition: "opacity 0.5s ease-out, transform 0.5s ease-out",
  };

  // 7) Return the chat UI
  return (
    <div style={chatPageStyle}>
      <div style={{ ...chatContainerStyle, ...containerAnimationStyle }}>
        <div style={chatHeaderStyle}>
          Support Chat {user ? `- ${user.username}` : ""} (TX: {transactionId})
        </div>

        {/* Messages area */}
        <div style={chatMessagesStyle}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={msg.sender === "support" ? supportMessageStyle : clientMessageStyle}
            >
              {msg.sender}: {msg.text}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <form onSubmit={handleSend} style={chatInputContainerStyle}>
          <input
            type="text"
            value={chatInput}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setChatInput(e.target.value)}
            placeholder="Type your message..."
            style={{ ...chatInputStyle, color: "black" }}
          />
          <button type="submit" style={chatSendStyle}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

// ---------------------------
// SupportChat Component (Wrapper with Suspense)
// ---------------------------
export default function SupportChat() {
  return (
    <Suspense fallback={<div style={{ textAlign: "center", marginTop: "50px" }}>Loading chat...</div>}>
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

const chatContainerStyle: React.CSSProperties = {
  width: "500px",
  height: "600px",
  backgroundColor: "white",
  border: "1px solid #ccc",
  borderRadius: "10px",
  boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
};

const chatHeaderStyle: React.CSSProperties = {
  backgroundColor: "#5865f2",
  color: "white",
  padding: "15px",
  borderRadius: "10px 10px 0 0",
  textAlign: "center",
  fontSize: "18px",
};

const chatMessagesStyle: React.CSSProperties = {
  flex: 1,
  padding: "10px",
  overflowY: "auto",
  background: "#fafafa",
};

const supportMessageStyle: React.CSSProperties = {
  margin: "10px",
  padding: "10px 15px",
  borderRadius: "15px",
  maxWidth: "70%",
  wordWrap: "break-word",
  fontSize: "15px",
  backgroundColor: "#5865f2",
  color: "white",
  alignSelf: "flex-end",
};

const clientMessageStyle: React.CSSProperties = {
  margin: "10px",
  padding: "10px 15px",
  borderRadius: "15px",
  maxWidth: "70%",
  wordWrap: "break-word",
  fontSize: "15px",
  backgroundColor: "#e0e0e0",
  color: "black",
  alignSelf: "flex-start",
};

const chatInputContainerStyle: React.CSSProperties = {
  display: "flex",
  borderTop: "1px solid #ccc",
};

const chatInputStyle: React.CSSProperties = {
  flex: 1,
  border: "none",
  padding: "10px",
  fontSize: "16px",
  outline: "none",
  // Ensure text is black when typing:
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
