"use client";
import React, { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "../../lib/firebase"; // Firestore instance
import { doc, getDoc } from "firebase/firestore";
import Image from "next/image"; // ✅ Import Next.js Image component

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
    return <h2 style={{ color: "white", textAlign: "center", marginTop: "50px" }}>Loading...</h2>;
  }

  if (!data) {
    return <h2 style={{ color: "red", textAlign: "center", marginTop: "50px" }}>User not found!</h2>;
  }

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
    <div style={pageStyle}>
      <div style={outerContainer}>
        {/* ✅ Optimized decorative image */}
        <Image
          src="https://cdn.prod.website-files.com/6257adef93867e50d84d30e2/6630f482123160b94617877a_Box%20(1).webp"
          alt="Decorative box"
          width={235}
          height={150}
          style={box4s}
        />

        {/* Left Container */}
        <div style={leftContainer}>
          <div style={profileHeader}>
            {/* ✅ Optimized banner image */}
            <Image className="banner" src={data.bannerImage} alt="Banner Image" width={600} height={150} style={banner} />
            {/* ✅ Optimized profile image */}
            <Image className="profile" src={data.profileImage} alt={`${data.username}'s Profile Image`} width={80} height={80} style={profile} />
            <h2 style={username}>{data.username}</h2>
          </div>
          <div style={infoContainer}>
            <div style={infoRow}>
              {/* ✅ Optimized User ID Icon */}
              <Image src="https://img.icons8.com/ios-filled/50/5865f2/user.png" alt="User Icon" width={16} height={16} style={iconStyle} />
              <span style={label}>User ID:</span>
              <span style={value}>{data.userID}</span>
            </div>
            <div style={infoRow}>
              <Image src="https://img.icons8.com/ios-filled/50/5865f2/certificate.png" alt="Type Icon" width={16} height={16} style={iconStyle} />
              <span style={label}>Type:</span>
              <span style={value}>{data.type}</span>
            </div>
            <div style={infoRow}>
              <Image src="https://img.icons8.com/ios-filled/50/5865f2/shield.png" alt="Shield Icon" width={16} height={16} style={iconStyle} />
              <span style={label}>Account Status:</span>
              <span style={{ ...value, ...status, ...statusStyle }}>{data.accountStatus}</span>
            </div>
            <div style={infoRow}>
              <Image src="https://img.icons8.com/ios-filled/50/5865f2/calendar.png" alt="Calendar Icon" width={16} height={16} style={iconStyle} />
              <span style={label}>Date Created:</span>
              <span style={value}>{data.dateCreated}</span>
            </div>
            <div style={infoRow}>
              <Image src="https://img.icons8.com/ios-filled/50/5865f2/flag.png" alt="Flag Icon" width={16} height={16} style={iconStyle} />
              <span style={label}>Active Reports:</span>
              <span style={value}>{data.activeReports}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------- */
/* Component Styles          */
/* ------------------------- */
const pageStyle: React.CSSProperties = {
  background: "url('img/background.png') no-repeat center center fixed",
  backgroundSize: "cover",
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  margin: 0,
  overflow: "hidden",
};

const outerContainer: React.CSSProperties = {
  position: "relative",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "20px",
  width: "90%",
  maxWidth: "1200px",
  padding: "20px",
};

const box4s: React.CSSProperties = {
  zIndex: 3,
  pointerEvents: "none",
  position: "absolute",
  top: 0,
  right: 0,
};

const leftContainer: React.CSSProperties = {
  width: "48%",
  padding: "20px",
  background: "linear-gradient(145deg, #afb5f7 20%, #808aff 80%)",
  borderRadius: "20px",
  textAlign: "center",
  color: "white",
};

const profileHeader: React.CSSProperties = {
  position: "relative",
  marginBottom: "20px",
};

const banner: React.CSSProperties = {
  display: "block",
  width: "100%",
  height: "150px",
  objectFit: "cover",
};

const profile: React.CSSProperties = {
  width: "80px",
  height: "80px",
  borderRadius: "50%",
  objectFit: "cover",
  marginTop: "-40px",
  border: "3px solid white",
};

const username: React.CSSProperties = { fontWeight: "bold", marginTop: "10px" };

const infoContainer: React.CSSProperties = { padding: "20px", textAlign: "left" };

const infoRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  padding: "10px 0",
  borderBottom: "1px solid #e0e0e0",
};

const iconStyle: React.CSSProperties = { width: "16px", height: "16px" };

const label: React.CSSProperties = { fontWeight: "bold", color: "#5865f2", minWidth: "100px" };

const value: React.CSSProperties = { color: "#23272a" };

const status: React.CSSProperties = { padding: "2px 6px", borderRadius: "4px", display: "inline-block" };
