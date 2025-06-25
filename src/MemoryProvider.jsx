import React, { createContext, useContext, useState, useEffect } from "react";

const MemoryContext = createContext();

export function MemoryProvider({ children }) {
  const [chatLog, setChatLog] = useState([]);
  const [dailyProfile, setDailyProfile] = useState("");
  const [longTermProfile, setLongTermProfile] = useState("");
  const [coreProfile, setCoreProfile] = useState("");
  const [userFacts, setUserFacts] = useState({});
  const [lastSavedDate, setLastSavedDate] = useState("");

  // Load previous chat from localStorage
  useEffect(() => {
    const cached = localStorage.getItem("ili-latest-chat");
    if (cached) {
      try {
        setChatLog(JSON.parse(cached));
      } catch (err) {
        console.warn("[MemoryProvider] Failed to parse local chat cache");
      }
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (chatLog.length > 0) {
      localStorage.setItem("ili-latest-chat", JSON.stringify(chatLog));
    }
  }, [chatLog]);

  const value = {
    chatLog,
    setChatLog,
    dailyProfile,
    setDailyProfile,
    longTermProfile,
    setLongTermProfile,
    coreProfile,
    setCoreProfile,
    userFacts,
    setUserFacts,
    lastSavedDate,
    setLastSavedDate,
  };

  return <MemoryContext.Provider value={value}>{children}</MemoryContext.Provider>;
}

export function useMemory() {
  return useContext(MemoryContext);
}
