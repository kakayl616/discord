import Head from "next/head";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";

type UserData = {
  userID: string;
  username: string;
  // ... other fields
};

export default function UserPage() {
  const { id } = useParams();
  const [data, setData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      try {
        const docRef = doc(db, "users", Array.isArray(id) ? id[0] : id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setData(docSnap.data() as UserData);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }
      setLoading(false);
    }
    fetchData();
  }, [id]);

  return (
    <>
      <Head>
        {/* If the username is available, the title becomes "Discord | Username" */}
        <title>{data ? `Discord | ${data.username}` : "Discord"}</title>
        <link rel="icon" href="/img/discord.png" />
      </Head>
      <div>
        {/* Your page content goes here */}
        {loading ? (
          <p>Loading...</p>
        ) : data ? (
          <h1>Welcome, {data.username}!</h1>
        ) : (
          <p>User not found.</p>
        )}
      </div>
    </>
  );
}
