import React, { useState } from "react";
import SoulPrint from "./SoulPrint";
import ChatArea from "./ChatArea";
import MemoryControls from "./MemoryControls";
import { MemoryProvider, useMemory } from "./MemoryProvider";
import AutoSaveOnClose from "./AutoSaveOnClose";
import "./App.css";

function StartConversationButton({ onStart, loading }) {
  return (
    <div className="ili-start-container">
      <button className="ili-start-button" onClick={onStart} disabled={loading}>
        {loading ? "Loading..." : "Start Conversation"}
      </button>
    </div>
  );
}

function AppInner() {
  const [started, setStarted] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const { setCoreProfile, setDailyProfile } = useMemory();

  const startConversation = async () => {
    try {
      setLoadingProfile(true);

      // Fetch today's daily profile from backend
      const res = await fetch("/api/memory?type=daily_profile&limit=1");
      if (!res.ok) throw new Error("Failed to fetch daily profile (" + res.status + ")");
      const data = await res.json();
      const dailyProfiles = data?.profiles || [];
      setDailyProfile(dailyProfiles[0]?.text || "");

      // Fetch core profile (weekly summary)
      const coreRes = await fetch("/api/memory?type=core_profile&limit=1");
      if (!coreRes.ok) throw new Error("Failed to fetch core profile (" + coreRes.status + ")");
      const coreData = await coreRes.json();
      const coreProfiles = coreData?.profiles || [];
      setCoreProfile(coreProfiles[0]?.text || "");

      setLoadingProfile(false);
      setStarted(true);
    } catch (err) {
      setLoadingProfile(false);
      alert("Failed to start conversation: " + err.message);
      console.error("Start conversation error:", err);
    }
  };

  if (!started) {
    return <StartConversationButton onStart={startConversation} loading={loadingProfile} />;
  }

  // Main chat UI
  return (
    <>
      <AutoSaveOnClose />
      <div className="ili-container">
        <header style={{ textAlign: "center", marginBottom: "1rem" }}>
          <SoulPrint />
        </header>
        <ChatArea />
        <MemoryControls />
      </div>
    </>
  );
}

export default function App() {
  return (
    <MemoryProvider>
      <AppInner />
    </MemoryProvider>
  );
}
