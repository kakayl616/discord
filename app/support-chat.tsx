"use client";

import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
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
  CollectionReference
} from "firebase/firestore";
import { db } from "../lib/firebase";

type Message = {
  id?: string;
  sender: string;
  text: string;
  timestamp?: Timestamp;
  transactionId: string;
};

export default function SupportChat() {
  const searchParams = useSearchParams();
  const transactionId = searchParams.get("tx") || "";  // Get transaction ID from URL
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState("");

  const searchParams = useSearchParams();
  const transactionId = searchParams.get("tx") || "";  // Get transaction ID from URL

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

  return (
    <div style={chatPageStyle}>
      <div style={chatContainerStyle}>
        <div style={chatHeaderStyle}>
          Support Chat (TX: {transactionId})
        </div>
        <div style={chatMessagesStyle}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={
                msg.sender === "support"
                  ? supportMessageStyle
                  : clientMessageStyle
              }
            >
              {msg.sender}: {msg.text}
            </div>
          ))}
        </div>
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
   Styling (inline)
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
  backgroundColor: "white",
  border: "1px solid #ccc",
  borderRadius: "10px",
  boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
  display: "flex",
  flexDirection: "column",
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
};

const chatSendStyle: React.CSSProperties = {
  border: "none",
  backgroundColor: "#5865f2",
  color: "white",
  padding: "10px 20px",
  cursor: "pointer",
  fontSize: "16px",
};
