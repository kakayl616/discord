"use client";

import React, {
  useState,
  useEffect,
  ChangeEvent,
  FormEvent,
  useRef,
} from "react";
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

// Message type for chat messages
type Message = {
  id?: string;
  sender: string; // "support" or "client"
  text: string;
  timestamp?: Timestamp;
  transactionId: string;
};

// User data type from the user information form
type UserData = {
  userID: string;
  username: string;
};

interface TransactionFormProps {
  onSubmit: (tx: string) => void;
}

function TransactionForm({ onSubmit }: TransactionFormProps) {
  const [input, setInput] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (trimmed !== "") {
      onSubmit(trimmed);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ textAlign: "center", marginTop: "50px" }}
    >
      <h2>Please enter a valid transaction ID:</h2>
      <input
        type="text"
        value={input}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          setInput(e.target.value)
        }
        placeholder="Enter Transaction ID"
        style={{ padding: "10px", fontSize: "16px" }}
      />
      <button
        type="submit"
        style={{ padding: "10px 20px", marginLeft: "10px" }}
      >
        Submit
      </button>
    </form>
  );
}

export default function SupportChat() {
  const searchParams = useSearchParams();
  const initialTx = searchParams.get("tx") || "";
  const [transactionId, setTransactionId] = useState(initialTx);

  // If the transactionId is missing or equals "support-chat", prompt for a valid one.
  if (!transactionId || transactionId === "support-chat") {
    return <TransactionForm onSubmit={(tx) => setTransactionId(tx)} />;
  }

  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  // A ref to auto-scroll to the bottom
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Fetch user data (optional, for displaying username)
  useEffect(() => {
    async function fetchUserData() {
      if (!transactionId) {
        setLoading(false);
        return;
      }
      try {
        const userDoc = await getDoc(doc(db, "users", transactionId));
        if (userDoc.exists()) {
          setUser(userDoc.data() as UserData);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
      setLoading(false);
    }
    fetchUserData();
  }, [transactionId]);

  // Listen for chat messages in Firestore
  useEffect(() => {
    if (!transactionId) return;

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

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

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

  if (loading) {
    return (
      <h2 style={{ color: "black", textAlign: "center", marginTop: "50px" }}>
        Loading...
      </h2>
    );
  }

  return (
    <div style={chatPageStyle}>
      <div style={chatContainerStyle}>
        <div style={chatHeaderStyle}>
          Support Chat {user ? `- ${user.username}` : ""} (TX: {transactionId})
        </div>
        {/* Messages area (scrollable) */}
        <div style={chatMessagesStyle}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={
                msg.sender === "support" ? supportMessageStyle : clientMessageStyle
              }
            >
              {msg.sender}: {msg.text}
            </div>
          ))}
          {/* A dummy div to anchor auto-scroll */}
          <div ref={messagesEndRef} />
        </div>
        {/* Input area */}
        <form onSubmit={handleSend} style={chatInputContainerStyle}>
          <input
            type="text"
            value={chatInput}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setChatInput(e.target.value)
            }
            placeholder="Type your message..."
            style={chatInputStyle}
          />
          <button type="submit" style={chatSendStyle}>
            Send
          </button>
        </form>
      </div>
    </div>
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

/**
 * 
 *  1) We set a FIXED width & height so it DOES NOT EXPAND
 *  2) display flex column
 *  3) overflow hidden ensures the container won't grow
 */
const chatContainerStyle: React.CSSProperties = {
  width: "500px",
  height: "600px", // FIXED height - no expansion
  backgroundColor: "white",
  border: "1px solid #ccc",
  borderRadius: "10px",
  boxShadow: "0 4px 8px rgba(0,0,0,0.2)",

  display: "flex",
  flexDirection: "column",

  // Do not let it expand beyond 600px:
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

/**
 * 
 *  1) flex: 1 => takes remaining space
 *  2) overflowY: auto => scrollable inside this area
 */
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
};

const chatSendStyle: React.CSSProperties = {
  border: "none",
  backgroundColor: "#5865f2",
  color: "white",
  padding: "10px 20px",
  cursor: "pointer",
  fontSize: "16px",
};
