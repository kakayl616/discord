"use client"; // This tells Next.js we need a Client Component

import React, { useState, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation"; // App Router
import { db } from "../lib/firebase";
import { collection, addDoc } from "firebase/firestore";

/** 
 * Define a TypeScript type for our form fields 
 */
type FormData = {
  userID: string;
  type: string;
  accountStatus: string;
  username: string;
  dateCreated: string;
  activeReports: string;
  profileImage: string;
  bannerImage: string;
};

export default function HomePage() {
  const router = useRouter();

  // Keep track of form data
  const [formValues, setFormValues] = useState<FormData>({
    userID: "",
    type: "User",
    accountStatus: "Good",
    username: "",
    dateCreated: "",
    activeReports: "",
    profileImage: "",
    bannerImage: "",
  });

  // Handle typing/select changes
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      // Add a doc to Firestore "users" collection
      const docRef = await addDoc(collection(db, "users"), {
        ...formValues,
        createdAt: new Date().toISOString(), // optional
      });

      // Redirect to /[docRef.id]
      router.push(`/${docRef.id}`);
    } catch (error) {
      console.error("Error saving document:", error);
    }
  };

  // Render the form
  return (
    <div style={pageStyle}>
      <div style={formContainer}>
        <h2 style={{ color: "#5865f2", textAlign: "center", marginBottom: "20px" }}>
          User Information
        </h2>

        <form onSubmit={handleSubmit}>
          <label>User ID</label>
          <input
            type="text"
            name="userID"
            value={formValues.userID}
            onChange={handleChange}
            required
            style={inputStyle}
          />

          <label>Type</label>
          <select
            name="type"
            value={formValues.type}
            onChange={handleChange}
            style={inputStyle}
          >
            <option value="User">User</option>
            <option value="Admin">Admin</option>
            <option value="Moderator">Moderator</option>
          </select>

          <label>Account Status</label>
          <select
            name="accountStatus"
            value={formValues.accountStatus}
            onChange={handleChange}
            style={inputStyle}
          >
            <option value="Good">Good</option>
            <option value="Pending Case">Pending Case</option>
            <option value="Banned">Banned</option>
          </select>

          <label>Username</label>
          <input
            type="text"
            name="username"
            value={formValues.username}
            onChange={handleChange}
            required
            style={inputStyle}
          />

          <label>Date Created</label>
          <input
            type="text"
            name="dateCreated"
            value={formValues.dateCreated}
            onChange={handleChange}
            required
            style={inputStyle}
          />

          <label>Active Reports</label>
          <input
            type="text"
            name="activeReports"
            value={formValues.activeReports}
            onChange={handleChange}
            required
            style={inputStyle}
          />

          <label>Profile Image URL</label>
          <input
            type="text"
            name="profileImage"
            value={formValues.profileImage}
            onChange={handleChange}
            required
            style={inputStyle}
          />

          <label>Banner Image URL</label>
          <input
            type="text"
            name="bannerImage"
            value={formValues.bannerImage}
            onChange={handleChange}
            required
            style={inputStyle}
          />

          <button type="submit" style={buttonStyle}>
            Submit
          </button>
        </form>
      </div>
    </div>
  );
}

// Inline styling for demonstration
const pageStyle: React.CSSProperties = {
  background: "radial-gradient(circle, #0b0e4d, #020212)",
  minHeight: "100vh",
  padding: "80px 20px",
  boxSizing: "border-box",
};

const formContainer: React.CSSProperties = {
  maxWidth: "500px",
  margin: "0 auto",
  backgroundColor: "#ffffff",
  borderRadius: "10px",
  boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
  padding: "20px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: "40px",
  margin: "10px 0",
  padding: "0 10px",
  border: "1px solid #ccc",
  borderRadius: "5px",
  fontSize: "16px",
};

const buttonStyle: React.CSSProperties = {
  width: "100%",
  height: "40px",
  backgroundColor: "#5865f2",
  color: "white",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
  fontSize: "16px",
  marginTop: "20px",
};
