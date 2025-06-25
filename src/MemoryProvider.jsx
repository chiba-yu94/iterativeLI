import React, { createContext, useState, useEffect, useContext } from "react";

const MemoryContext = createContext();

export function MemoryProvider({ children }) {
  const [chatLog, setChatLog] = useState([]);
  const [coreProfile, setCoreProfile] = useState("");
  const [dailyProfile, setDailyProfile] = useState("");
  const [userFacts, setUserFactsState] = useState(() => {
    const saved = localStorage.getItem("userFacts");
    return saved ? JSON.parse(saved) : {};
  });
  const [sessionSummary, setSessionSummary] = useState("");
  const [loading, setLoading] = useState(false);

  const setUserFacts = (facts) => {
    setUserFactsState(facts);
    localStorage.setItem("userFacts", JSON.stringify(facts));
  };

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
        userFacts,
        setUserFacts,
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
