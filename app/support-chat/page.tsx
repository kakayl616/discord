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
    <form
      onSubmit={handleSubmit}
      style={{ textAlign: "center", marginTop: "50px" }}
    >
      <h2 style={{ color: "#5865F2" }}>
        Please enter a valid transaction ID:
      </h2>
      <input
        type="text"
        value={input}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setInput(e.target.value)}
        placeholder="Enter Transaction ID"
        style={{
          padding: "10px",
          fontSize: "16px",
          color: "black",
          border: "1px solid #ccc",
          borderRadius: "4px",
          width: "80%",
          maxWidth: "300px",
        }}
      />
      <button
        type="submit"
        style={{
          padding: "10px 20px",
          marginLeft: "10px",
          border: "none",
          backgroundColor: "#5865F2",
          color: "#fff",
          borderRadius: "4px",
          cursor: "pointer",
          transition: "background-color 0.3s ease",
        }}
      >
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

  // Pre-composed messages state and editing controls
  const [preComposedMessages, setPreComposedMessages] = useState<PreComposedMessage[]>([]);
  const [newPreComposed, setNewPreComposed] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setContainerLoaded(true);
  }, []);

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
    const q = query(
      messagesRef,
      where("transactionId", "==", transactionId),
      orderBy("timestamp", "asc")
    );
    const unsubscribe = onSnapshot(q, (snapshot: QuerySnapshot<Message>) => {
      const msgs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
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

  // Optimistic message sending (no delay)
  const sendMessage = async (
    text: string,
    messageType: Message["messageType"] = "text"
  ) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    // Optimistically add the message locally
    const optimisticMessage: Message = {
      id: "temp-" + Date.now(),
      sender: role,
      text: trimmed,
      messageType,
      timestamp: Timestamp.now(),
      transactionId,
    };
    setMessages((prev) => [...prev, optimisticMessage]);

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
    if (chatInputRef.current) {
      chatInputRef.current.style.height = "auto";
    }
  };

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

  // Handle auto-resizing of the textarea
  const handleChatInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setChatInput(e.target.value);
    if (chatInputRef.current) {
      chatInputRef.current.style.height = "auto";
      chatInputRef.current.style.height = chatInputRef.current.scrollHeight + "px";
    }
  };

  // Pre-composed messages functions
  const addPreComposedMessage = () => {
    const trimmed = newPreComposed.trim();
    if (!trimmed) return;
    const newMsg: PreComposedMessage = { id: Date.now().toString(), text: trimmed };
    setPreComposedMessages((prev) => [...prev, newMsg]);
    setNewPreComposed("");
  };

  const editPreComposedMessage = (id: string) => {
    const msg = preComposedMessages.find((m) => m.id === id);
    if (msg) {
      setEditingId(id);
      setEditingText(msg.text);
    }
  };

  const saveEditedPreComposedMessage = (id: string) => {
    setPreComposedMessages((prev) =>
      prev.map((msg) => (msg.id === id ? { ...msg, text: editingText } : msg))
    );
    setEditingId(null);
    setEditingText("");
  };

  const deletePreComposedMessage = (id: string) => {
    setPreComposedMessages((prev) => prev.filter((msg) => msg.id !== id));
  };

  return (
    <div style={chatPageStyle}>
      {!transactionId || transactionId === "support-chat" ? (
        <TransactionForm onSubmit={(tx) => setTransactionId(tx)} />
      ) : loading ? (
        <h2 style={{ textAlign: "center", marginTop: "50px", color: "#5865F2" }}>
          Loading...
        </h2>
      ) : (
        <div style={{ ...chatWrapperStyle, ...containerAnimationStyle }}>
          {/* Pre-Composed Messages Panel */}
          <div style={preComposedContainerStyle}>
            <h3 style={{ textAlign: "center", color: "#5865F2", marginBottom: "20px" }}>
              Scripts
            </h3>
            {preComposedMessages.map((msg) => (
              <div key={msg.id} style={preComposedMessageStyle}>
                {editingId === msg.id ? (
                  <>
                    <input
                      type="text"
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      style={{
                        flex: 1,
                        marginRight: "5px",
                        padding: "5px",
                        borderRadius: "4px",
                        border: "1px solid #ccc",
                      }}
                    />
                    <button
                      onClick={() => saveEditedPreComposedMessage(msg.id)}
                      style={preComposedButtonStyle}
                    >
                      Save
                    </button>
                  </>
                ) : (
                  <>
                    <span
                      style={{ flex: 1, cursor: "pointer" }}
                      onClick={() => sendMessage(msg.text)}
                    >
                      {msg.text}
                    </span>
                    <button
                      onClick={() => editPreComposedMessage(msg.id)}
                      style={preComposedButtonStyle}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deletePreComposedMessage(msg.id)}
                      style={preComposedButtonStyle}
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            ))}
            <div style={{ marginTop: "20px" }}>
              <input
                type="text"
                value={newPreComposed}
                onChange={(e) => setNewPreComposed(e.target.value)}
                placeholder="New script message"
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                }}
              />
              <button
                onClick={addPreComposedMessage}
                style={{
                  width: "100%",
                  padding: "8px",
                  marginTop: "8px",
                  borderRadius: "4px",
                  backgroundColor: "#5865F2",
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                  transition: "background-color 0.3s ease",
                }}
              >
                Add
              </button>
            </div>
          </div>

          {/* Chat Container */}
          <div style={chatContainerStyle}>
            <div style={chatHeaderStyle}>
              Support Chat {user ? `- ${user.username}` : ""} (TX: {transactionId})
            </div>
            <div style={chatMessagesStyle}>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    margin: "10px 0",
                    padding: "10px 15px",
                    borderRadius: "15px",
                    maxWidth: "70%",
                    wordWrap: "break-word",
                    fontSize: "15px",
                    backgroundColor: "#5865F2",
                    color: "#fff",
                    alignSelf: "flex-end",
                    transition: "transform 0.2s ease",
                  }}
                >
                  <strong>{msg.sender}:</strong> {renderMessageContent(msg)}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSend} style={chatInputContainerStyle}>
              <textarea
                ref={chatInputRef}
                value={chatInput}
                onChange={handleChatInputChange}
                placeholder="Type your message..."
                style={chatInputStyle}
                rows={1}
              />
              <button type="submit" style={chatSendStyle}>
                Send
              </button>
              <button
                type="button"
                onClick={handleSendSecureFormRequest}
                style={{
                  ...chatSendStyle,
                  backgroundColor: "#28a745",
                  marginLeft: "10px",
                }}
              >
                Secure Form
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SupportChat() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            textAlign: "center",
            marginTop: "50px",
            color: "#5865F2",
          }}
        >
          Loading chat...
        </div>
      }
    >
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
  backgroundColor: "#E0E3FF", // Light Blurple
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "100vh",
  padding: "20px",
  boxSizing: "border-box",
};

const chatWrapperStyle: React.CSSProperties = {
  display: "flex",
  width: "100%",
  maxWidth: "1200px",
  height: "80vh",
  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
  borderRadius: "8px",
  overflow: "hidden",
  backgroundColor: "#fff",
};

const preComposedContainerStyle: React.CSSProperties = {
  width: "30%",
  minWidth: "250px",
  backgroundColor: "#E0E3FF", // Light Blurple
  padding: "20px",
  overflowY: "auto",
  borderRight: "2px solid #5865F2",
  transition: "all 0.3s ease",
};

const preComposedMessageStyle: React.CSSProperties = {
  padding: "10px",
  marginBottom: "10px",
  backgroundColor: "#fff",
  borderRadius: "5px",
  cursor: "pointer",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  transition: "transform 0.2s ease",
};

const preComposedButtonStyle: React.CSSProperties = {
  border: "none",
  backgroundColor: "#5865F2",
  color: "#fff",
  padding: "6px 10px",
  borderRadius: "4px",
  cursor: "pointer",
  fontSize: "14px",
  marginLeft: "5px",
  transition: "background-color 0.3s ease, transform 0.2s ease",
};

const chatContainerStyle: React.CSSProperties = {
  width: "70%",
  display: "flex",
  flexDirection: "column",
  backgroundColor: "#fff",
};

const chatHeaderStyle: React.CSSProperties = {
  backgroundColor: "#5865F2",
  color: "#fff",
  padding: "15px",
  textAlign: "center",
  fontSize: "20px",
  fontWeight: "bold",
  transition: "background-color 0.3s ease",
};

const chatMessagesStyle: React.CSSProperties = {
  flex: 1,
  padding: "20px",
  overflowY: "auto",
  backgroundColor: "#f9f9f9",
};

const chatInputContainerStyle: React.CSSProperties = {
  display: "flex",
  borderTop: "1px solid #ccc",
  alignItems: "center",
  padding: "10px",
  transition: "all 0.3s ease",
};

const chatInputStyle: React.CSSProperties = {
  flex: 1,
  border: "1px solid #ccc",
  borderRadius: "4px",
  padding: "10px",
  fontSize: "16px",
  outline: "none",
  transition: "all 0.3s ease",
  resize: "none",
};

const chatSendStyle: React.CSSProperties = {
  border: "none",
  backgroundColor: "#5865F2",
  color: "#fff",
  padding: "10px 20px",
  marginLeft: "10px",
  cursor: "pointer",
  fontSize: "16px",
  borderRadius: "4px",
  transition: "background-color 0.3s ease, transform 0.2s ease",
};
