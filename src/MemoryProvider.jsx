import React, { createContext, useState, useEffect, useContext } from "react";

const MemoryContext = createContext();

export function MemoryProvider({ children }) {
  const [chatLog, setChatLog] = useState([]);           // Session (short-term)
  const [coreProfile, setCoreProfile] = useState("");   // Long-term memory (weekly summary)
  const [dailyProfile, setDailyProfile] = useState(""); // Daily memory
  const [sessionSummary, setSessionSummary] = useState(""); // Optional, per-session
  const [loading, setLoading] = useState(false);

  // Fetch core/long-term memory on mount (most recent 7-day summary)
  useEffect(() => {
    async function fetchCoreProfile() {
      setLoading(true);
      try {
        const res = await fetch("/api/memory?type=core_profile&limit=1");
        const data = await res.json();
        setCoreProfile(data.profiles?.[0]?.text || "");
      } catch (err) {
        setCoreProfile("");
      }
      setLoading(false);
    }
    fetchCoreProfile();
  }, []);

  // Fetch latest daily profile on mount
  useEffect(() => {
    async function fetchDailyProfile() {
      try {
        const res = await fetch("/api/memory?type=daily_profile&limit=1");
        const data = await res.json();
        setDailyProfile(data.profiles?.[0]?.text || "");
      } catch (err) {
        setDailyProfile("");
      }
    }
    fetchDailyProfile();
  }, []);

  const addMessage = (msg) => setChatLog((log) => [...log, msg]);
  const setMessages = (messages) => setChatLog(messages);
  const clearMemory = () => setChatLog([]);

  return (
    <MemoryContext.Provider
      value={{
        chatLog,
        setChatLog,
        addMessage,
        setMessages,
        clearMemory,
        coreProfile,
        setCoreProfile,
        dailyProfile,
        setDailyProfile,
        sessionSummary,
        setSessionSummary,
        loading
      }}
    >
      {children}
    </MemoryContext.Provider>
  );
}

export function useMemory() {
  return useContext(MemoryContext);
}
