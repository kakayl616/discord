"use client";
import React, { useEffect, useState } from "react"; // ✅ Removed useRef
import { useParams } from "next/navigation";
import { db } from "../../lib/firebase"; // Firestore instance
import { doc, getDoc } from "firebase/firestore";

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

export default function UserPage() {
  const { id } = useParams();
  const [data, setData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      // Ensure we use a string rather than an array
      const userId = Array.isArray(id) ? id[0] : id;
      const docRef = doc(db, "users", userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setData(docSnap.data() as UserData);
      } else {
        setData(null);
      }
      setLoading(false);
    }
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <h2 style={{ color: "white", textAlign: "center", marginTop: "50px" }}>
        Loading...
      </h2>
    );
  }
  if (!data) {
    return (
      <h2 style={{ color: "red", textAlign: "center", marginTop: "50px" }}>
        User not found!
      </h2>
    );
  }

  // Determine additional styling for account status based on value
  let statusStyle = {};
  const statusLower = data.accountStatus.toLowerCase();
  if (statusLower === "good") {
    statusStyle = { backgroundColor: "rgba(0, 128, 0, 0.2)", color: "green" };
  } else if (statusLower === "pending") {
    statusStyle = { backgroundColor: "rgba(255, 165, 0, 0.2)", color: "#FFA500" };
  } else if (statusLower === "banned") {
    statusStyle = { backgroundColor: "rgba(255, 0, 0, 0.2)", color: "red" };
  }

  return (
    <div>
      <h1>{data.username}</h1>
      <p>User ID: {data.userID}</p>
      <p>Type: {data.type}</p>
      <p style={{ ...statusStyle }}>Account Status: {data.accountStatus}</p>
      <p>Date Created: {data.dateCreated}</p>
      <p>Active Reports: {data.activeReports}</p>
    </div>
  );
}
