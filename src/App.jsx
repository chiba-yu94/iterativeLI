// src/App.jsx
import React, { useEffect, useState } from "react";
import { MemoryProvider, useMemory } from "./MemoryProvider";
import SoulPrint from "./SoulPrint";
import ChatArea from "./ChatArea";
import AutoSaveOnClose from "./AutoSaveOnClose";
import MemoryControls from "./MemoryControls";
import "./App.css";

// Helper: parse facts from profile text
function parseFacts(profileText) {
  const facts = {};
  (profileText || "").split("\n").forEach(line => {
    const [k, ...rest] = line.split(":");
    if (k && rest.length) facts[k.trim()] = rest.join(":").trim();
  });
  return facts;
}

// Friendly intro builder
function buildFriendlyIntro(core, daily) {
  const facts = parseFacts(core + "\n" + daily);
  const name = !facts.Name || facts.Name === "unknown" ? "friend" : facts.Name;
  const highlights = facts["Recent Highlights (bullet points)"];
  if (name === "friend" && (!highlights || highlights === "unknown")) {
    return `Welcome! I'm I.L.I.—here to help you explore, reflect, and grow. What would you like to talk about today?`;
  } else {
    return `Welcome back. Hello again, ${name}. You've been reflecting on things like ${!highlights || highlights === "unknown" ? "many topics" : highlights}. Would you like to continue where we left off, or explore something new today?`;
  }
}

function AppInner() {
  const mem = useMemory() || {};
  const chatLog = mem.chatLog ?? [];
  const setChatLog = mem.setChatLog;
  const setDailyProfile = mem.setDailyProfile;
  const setCoreProfile = mem.setCoreProfile;
  const setUserFacts = mem.setUserFacts;

  const safeChatLog = Array.isArray(chatLog) ? chatLog : [];
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const [loadedDate, setLoadedDate] = useState(localStorage.getItem("ili-memory-date"));

  useEffect(() => {
    async function initMemory() {
      if (loadedDate === today) {
        const daily = localStorage.getItem("ili-daily") || "";
        const core  = localStorage.getItem("ili-core")  || "";
        setDailyProfile(daily);
        setCoreProfile(core);
        extractFacts(daily);
        const intro = buildFriendlyIntro(core, daily);
        setChatLog([{ role: "bot", text: intro }]);
      } else {
        try {
          const res = await fetch("/api/sessionStart");
          const data = await res.json();
          setDailyProfile(data.dailyProfile);
          setCoreProfile(data.coreProfile);
          extractFacts(data.dailyProfile);
          localStorage.setItem("ili-daily", data.dailyProfile);
          localStorage.setItem("ili-core", data.coreProfile);
          localStorage.setItem("ili-memory-date", today);
          setLoadedDate(today);
          const intro = buildFriendlyIntro(data.coreProfile, data.dailyProfile);
          setChatLog([{ role: "bot", text: intro }]);
        } catch {
          setChatLog([{ role: "bot", text: "Memory load failed—starting fresh." }]);
        }
      }
    }

    function extractFacts(dailyText) {
      const facts = parseFacts(dailyText);
      setUserFacts(facts);
    }

    initMemory();
  }, []);

  // --- Gradual bot reply ---
  const revealReply = (text) => {
    setPending(true);
    const words = text.split(" ");
    let i = 0, out = "";
    const step = () => {
      if (i < words.length) {
        out += (i ? " " : "") + words[i++];
        setChatLog(cl => [...cl.filter(m=>m.role!=="typing"), { role: "typing", text: out }]);
        setTimeout(step, 80);
      } else {
        setChatLog(cl => [...cl.filter(m=>m.role!=="typing"), { role: "bot", text }]);
        setPending(false);
      }
    };
    step();
  };

  // --- Main sendMessage logic ---
  const sendMessage = async e => {
    e.preventDefault();
    if (!input.trim()) return;

    // Normal send
    const upd = [...chatLog, { role: "user", text: input }];
    setChatLog(upd);
    try {
      const res = await fetch("/api/chat", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ message: input, chatLog: upd }),
      });
      const { reply } = await res.json();
      revealReply(reply || "…");
    } catch {
      setChatLog(cl => [...cl, { role: "bot", text: "Oops—something went wrong." }]);
      setPending(false);
    }
    setInput("");

    // Save the full chat log on each message (or use AutoSaveOnClose)
    await fetch("/api/memory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatLog: upd }),
    });
  };

  return (
    <>
      <AutoSaveOnClose />
      <div className="ili-container">
        <SoulPrint breathing={pending} coreGlow={pending} />
        <ChatArea
          messages={safeChatLog.filter(m => m.role !== "typing")}
          partialReply={safeChatLog.find(m => m.role === "typing")?.text || ""}
          pending={pending}
          input={input}
          setInput={setInput}
          sendMessage={sendMessage}
        />
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