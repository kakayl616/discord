"use client";

import Head from "next/head";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";

type UserData = {
  userID: string;
  username: string;
  // add other fields if needed
};

export default function UserPage() {
  const { id } = useParams();
  const [data, setData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    async function fetchData() {
      if (!id) {
        setError("No user ID provided in the URL.");
        setLoading(false);
        return;
      }
      // Log the id for debugging
      console.log("Fetched id:", id);
      const userId = Array.isArray(id) ? id[0] : id;
      try {
        const docRef = doc(db, "users", userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setData(docSnap.data() as UserData);
        } else {
          setError("User not found.");
        }
      } catch (err) {
        console.error("Error fetching user:", err);
        setError("Error fetching user data.");
      }
      setLoading(false);
    }
    fetchData();
  }, [id]);

  return (
    <>
      <Head>
        {/* When data is available, the title becomes "Discord | Username" */}
        <title>{data ? `Discord | ${data.username}` : "Discord"}</title>
        <link rel="icon" href="/img/discord.png" />
      </Head>
      <div>
        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p style={{ color: "red" }}>{error}</p>
        ) : data ? (
          <h1>Welcome, {data.username}!</h1>
        ) : (
          <p>No data available.</p>
        )}
      </div>
    </>
  );
}
