"use client";

import React, {
  Suspense,
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
  updateDoc,
  deleteDoc,
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
// ChatContent Component
// ---------------------------
function ChatContent() {
  const searchParams = useSearchParams();
  const initialTx = searchParams.get("tx") || "";

  // Main state for chat
  const [transactionId, setTransactionId] = useState(initialTx);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);
  const [containerLoaded, setContainerLoaded] = useState(false);

  // State for pre-composed messages
  const [preComposedMessages, setPreComposedMessages] = useState<string[]>([
    "Hello, how can I help you today?",
    "Please provide more details.",
    "I'll look into that for you.",
  ]);
  const [newPreComposedMessage, setNewPreComposedMessage] = useState("");

  // State for editing a message
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingMessageText, setEditingMessageText] = useState("");

  // For auto-scrolling messages
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Trigger container animation on mount
  useEffect(() => {
    setContainerLoaded(true);
  }, []);

  // Fetch user data based on transactionId
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

  // Auto-scroll on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // If no transaction ID, show the transaction form
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

  // Define container animation style
  const containerAnimationStyle: React.CSSProperties = {
    opacity: containerLoaded ? 1 : 0,
    transform: containerLoaded ? "translateY(0)" : "translateY(20px)",
    transition: "opacity 0.5s ease-out, transform 0.5s ease-out",
  };

  // ---------------------------
  // Message CRUD functions
  // ---------------------------
  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    try {
      await addDoc(collection(db, "messages"), {
        transactionId,
        sender: "support",
        text: trimmed,
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

  const handlePreComposedSend = async (message: string) => {
    await sendMessage(message);
  };

  const handleAddPreComposedMessage = () => {
    const trimmed = newPreComposedMessage.trim();
    if (trimmed) {
      setPreComposedMessages((prev) => [...prev, trimmed]);
      setNewPreComposedMessage("");
    }
  };

  // Editing a message
  const handleEditClick = (msg: Message) => {
    setEditingMessageId(msg.id || null);
    setEditingMessageText(msg.text);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingMessageText("");
  };

  const handleSaveEdit = async (msg: Message) => {
    if (!msg.id) return;
    try {
      const messageRef = doc(db, "messages", msg.id);
      await updateDoc(messageRef, { text: editingMessageText });
      setEditingMessageId(null);
      setEditingMessageText("");
    } catch (error) {
      console.error("Error updating message:", error);
    }
  };

  // Deleting a message
  const handleDeleteMessage = async (msg: Message) => {
    if (!msg.id) return;
    try {
      await deleteDoc(doc(db, "messages", msg.id));
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  // Render message content with support for image strings or editing mode
  const renderMessageContent = (msg: Message) => {
    if (editingMessageId === msg.id) {
      return (
        <div>
          <input
            type="text"
            value={editingMessageText}
            onChange={(e) => setEditingMessageText(e.target.value)}
            style={{ ...chatInputStyle, marginBottom: "5px" }}
          />
          <div>
            <button onClick={() => handleSaveEdit(msg)} style={preComposedButtonStyle}>
              Save
            </button>
            <button onClick={handleCancelEdit} style={{ ...preComposedButtonStyle, marginLeft: "5px" }}>
              Cancel
            </button>
          </div>
        </div>
      );
    }

    if (msg.text.startsWith("data:image/")) {
      return (
        <img
          src={msg.text}
          alt="Uploaded"
          style={{ maxWidth: "100%", borderRadius: "10px", marginTop: "5px" }}
        />
      );
    }
    return <span>{msg.text}</span>;
  };

  return (
    <div style={chatPageStyle}>
      <div style={{ ...chatWrapperStyle, ...containerAnimationStyle }}>
        {/* Chat Container */}
        <div style={chatContainerStyle}>
          <div style={chatHeaderStyle}>
            Support Chat {user ? `- ${user.username}` : ""} (TX: {transactionId})
          </div>

          {/* Chat Messages */}
          <div style={chatMessagesStyle}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={msg.sender === "support" ? supportMessageStyle : clientMessageStyle}
              >
                <strong>{msg.sender}:</strong> {renderMessageContent(msg)}
                {/* Only show edit/delete buttons for support messages when not editing */}
                {msg.sender === "support" && editingMessageId !== msg.id && (
                  <div style={{ marginTop: "5px" }}>
                    <button onClick={() => handleEditClick(msg)} style={preComposedButtonStyle}>
                      Edit
                    </button>
                    <button onClick={() => handleDeleteMessage(msg)} style={{ ...preComposedButtonStyle, marginLeft: "5px" }}>
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
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

        {/* Sidebar for Pre-composed Messages */}
        <div style={sidebarStyle}>
          <h3>Pre-composed Messages</h3>
          {preComposedMessages.map((msg, index) => (
            <button
              key={index}
              onClick={() => handlePreComposedSend(msg)}
              style={preComposedButtonStyle}
            >
              {msg}
            </button>
          ))}
          <div style={{ marginTop: "20px" }}>
            <input
              type="text"
              value={newPreComposedMessage}
              onChange={(e) => setNewPreComposedMessage(e.target.value)}
              placeholder="Add new message"
              style={preComposedInputStyle}
            />
            <button onClick={handleAddPreComposedMessage} style={preComposedAddButtonStyle}>
              Add
            </button>
          </div>
        </div>
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

const sidebarStyle: React.CSSProperties = {
  width: "300px",
  padding: "10px",
  backgroundColor: "#f9f9f9",
  borderLeft: "1px solid #ccc",
  display: "flex",
  flexDirection: "column",
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

const preComposedButtonStyle: React.CSSProperties = {
  marginBottom: "10px",
  padding: "10px",
  fontSize: "14px",
  cursor: "pointer",
};

const preComposedInputStyle: React.CSSProperties = {
  width: "calc(100% - 60px)",
  padding: "8px",
  fontSize: "14px",
};

const preComposedAddButtonStyle: React.CSSProperties = {
  padding: "8px 12px",
  marginLeft: "8px",
  cursor: "pointer",
};
