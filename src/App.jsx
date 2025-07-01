// src/App.jsx
import React, { useEffect, useState } from "react";
import { MemoryProvider } from "./MemoryProvider";
import SoulPrint from "./SoulPrint";
import ChatArea from "./ChatArea";
import AutoSaveOnClose from "./AutoSaveOnClose";
import MemoryControls from "./MemoryControls";
import "./App.css";

const ROLLING_CHAT_LIMIT = 10;

function parseFacts(profileText) {
  const facts = {};
  (profileText || "").split("\n").forEach(line => {
    const [k, ...rest] = line.split(":");
    if (k && rest.length) facts[k.trim()] = rest.join(":").trim();
  });
  return facts;
}

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
  const [chatLog, setChatLog] = useState([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [dailyProfile, setDailyProfile] = useState("");
  const [coreProfile, setCoreProfile] = useState("");
  const [longProfile, setLongProfile] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch everything from the backend on load
  useEffect(() => {
    async function fetchMemory() {
      setLoading(true);
      try {
        const res = await fetch("/api/sessionStart");
        const data = await res.json();
        setDailyProfile(data.dailyProfile || "");
        setCoreProfile(data.coreProfile || "");
        setLongProfile(data.longProfile || "");
        let logArr = [];
        // Try to parse recent_log field (from dailyProfile metadata or as a separate field)
        if (data.recentLog && Array.isArray(data.recentLog)) {
          logArr = data.recentLog;
        } else if (data.recent_log && Array.isArray(data.recent_log)) {
          logArr = data.recent_log;
        }
        setChatLog(logArr);

        // Intro on load
        const intro = buildFriendlyIntro(data.coreProfile, data.dailyProfile);
        if (!logArr.length) setChatLog([{ role: "bot", text: intro }]);
      } catch (e) {
        setChatLog([{ role: "bot", text: "Memory load failed—starting fresh." }]);
      }
      setLoading(false);
    }
    fetchMemory();
  }, []);

  // --- Gradual bot reply ---
  const revealReply = (text) => {
    setPending(true);
    const words = text.split(" ");
    let i = 0, out = "";
    const step = () => {
      if (i < words.length) {
        out += (i ? " " : "") + words[i++];
        setChatLog(cl => [...cl.filter(m => m.role !== "typing"), { role: "typing", text: out }]);
        setTimeout(step, 80);
      } else {
        setChatLog(cl => [...cl.filter(m => m.role !== "typing"), { role: "bot", text }]);
        setPending(false);
      }
    };
    step();
  };

  // --- Main sendMessage logic ---
  const sendMessage = async e => {
    e.preventDefault();
    if (!input.trim()) return;

    // Always keep only last N turns (for rolling recent_log)
    const newUserTurn = { role: "user", text: input.trim() };
    const truncatedLog = [...chatLog, newUserTurn].slice(-ROLLING_CHAT_LIMIT);
    setChatLog(truncatedLog);

    try {
      setPending(true);
      const res = await fetch("/api/chat", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          message: input,
          chatLog: truncatedLog,
        }),
      });
      const { reply } = await res.json();
      const upd = [...truncatedLog, { role: "bot", text: reply || "…" }].slice(-ROLLING_CHAT_LIMIT);
      setChatLog(upd);
      setPending(false);

      // Save to Firestore: update dailyProfile summary + rolling chat log (recent_log)
      await fetch("/api/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatLog: upd }),
      });
    } catch (err) {
      setChatLog(cl => [...cl, { role: "bot", text: "Oops—something went wrong." }]);
      setPending(false);
    }
    setInput("");
  };

  if (loading) return <div>Loading...</div>;

  return (
    <>
      <AutoSaveOnClose />
      <div className="ili-container">
        <SoulPrint breathing={pending} coreGlow={pending} />
        <ChatArea
          messages={chatLog.filter(m => m.role !== "typing")}
          partialReply={chatLog.find(m => m.role === "typing")?.text || ""}
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
