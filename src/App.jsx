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
    setLoadingProfile(true);
    // Fetch today's daily profile from backend
    const res = await fetch("/api/memory?type=daily_profile&limit=1");
    const data = await res.json();
    setDailyProfile(data.profiles?.[0]?.text || "");
    // Optionally fetch core profile (weekly summary)
    const coreRes = await fetch("/api/memory?type=core_profile&limit=1");
    const coreData = await coreRes.json();
    setCoreProfile(coreData.profiles?.[0]?.text || "");
    setLoadingProfile(false);
    setStarted(true);
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
