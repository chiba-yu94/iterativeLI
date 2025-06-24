// MemoryProvider.jsx
import React, { createContext, useState, useEffect, useContext } from "react";

// Create context
const MemoryContext = createContext();

// GPT-powered session summary (optional auto-update)
async function generateSessionSummary(chatLog) {
  if (!process.env.OPENAI_API_KEY) return "";
  const prompt = `
Summarize the following conversation in 2-3 sentences, focusing on important topics and emotional shifts:

${chatLog.map(m => `${m.role === "user" ? "User" : "I.L.I."}: ${m.text}`).join("\n")}
  `;
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: prompt }
      ],
      max_tokens: 150,
      temperature: 0.5
    })
  });
  if (!res.ok) return "";
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}

// Provider component
export function MemoryProvider({ children, autoSummarize = false, summaryInterval = 5 }) {
  const [chatLog, setChatLog] = useState([]);            // Session (short-term) memory
  const [coreProfile, setCoreProfile] = useState("");    // Long-term (core) profile
  const [sessionSummary, setSessionSummary] = useState(""); // Short session summary
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

  // Optionally: auto-update session summary via GPT when chatLog grows
  useEffect(() => {
    if (
      autoSummarize &&
      chatLog.length > 0 &&
      chatLog.length % summaryInterval === 0
    ) {
      (async () => {
        const summary = await generateSessionSummary(chatLog);
        setSessionSummary(summary);
      })();
    }
    // eslint-disable-next-line
  }, [chatLog, autoSummarize, summaryInterval]);

  // Add a message (user or I.L.I.) to the short-term memory
  const addMessage = (msg) => setChatLog((log) => [...log, msg]);

  // Replace chat log (e.g., when loading history)
  const setMessages = (messages) => setChatLog(messages);

  // Clear short-term memory (when user logs out, resets, etc.)
  const clearMemory = () => setChatLog([]);

  // Optionally: update the core profile (e.g., after summarizing new identity)
  const updateCoreProfile = (text) => setCoreProfile(text);

  // Manually set or clear the session summary
  const manualSetSessionSummary = (summary) => setSessionSummary(summary);
  const clearSessionSummary = () => setSessionSummary("");

  return (
    <MemoryContext.Provider
      value={{
        chatLog,
        addMessage,
        setMessages,
        clearMemory,
        coreProfile,
        setCoreProfile: updateCoreProfile,
        sessionSummary,
        setSessionSummary: manualSetSessionSummary,
        clearSessionSummary,
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
