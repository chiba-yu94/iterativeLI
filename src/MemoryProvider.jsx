// MemoryProvider.jsx
import React, { createContext, useState, useEffect, useContext } from "react";

// Create context
const MemoryContext = createContext();

// Provider component
export function MemoryProvider({ children }) {
  const [chatLog, setChatLog] = useState([]);           // Session (short-term) memory
  const [coreProfile, setCoreProfile] = useState("");   // Long-term (core) profile
  const [loading, setLoading] = useState(true);

  // Fetch long-term memory silently from Dify at session start
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

  // Add a message (user or I.L.I.) to the short-term memory
  const addMessage = (msg) => setChatLog((log) => [...log, msg]);

  // Replace chat log (e.g., when loading history)
  const setMessages = (messages) => setChatLog(messages);

  // Clear short-term memory (when user logs out, resets, etc.)
  const clearMemory = () => setChatLog([]);

  // Optionally: update the core profile (e.g., after summarizing new identity)
  const updateCoreProfile = (text) => setCoreProfile(text);

  return (
    <MemoryContext.Provider
      value={{
        chatLog,
        addMessage,
        setMessages,
        clearMemory,
        coreProfile,
        setCoreProfile: updateCoreProfile,
        loading
      }}
    >
      {children}
    </MemoryContext.Provider>
  );
}

// Custom hook for using memory context in components
export function useMemory() {
  return useContext(MemoryContext);
}
