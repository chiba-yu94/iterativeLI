// src/App.jsx
import React, { useEffect, useState } from "react";
import { MemoryProvider, useMemory } from "./MemoryProvider";
import SoulPrint from "./SoulPrint";
import ChatArea from "./ChatArea";
import AutoSaveOnClose from "./AutoSaveOnClose";
import MemoryControls from "./MemoryControls";
import { buildIntroFromMemory } from "./utils/promptBuilder";
import "./App.css";

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

  const today = new Date().toISOString().slice(0,10);
  const [loadedDate, setLoadedDate] = useState(localStorage.getItem("ili-memory-date"));

  // On mount: either hydrate from localStorage or call sessionStart
  useEffect(() => {
    async function initMemory() {
      if (loadedDate === today) {
        // use cached profiles
        const daily = localStorage.getItem("ili-daily") || "";
        const core  = localStorage.getItem("ili-core")  || "";
        setDailyProfile(daily);
        setCoreProfile(core);
        extractFacts(daily);
        const intro = buildIntroFromMemory(core, daily);
        setChatLog([{ role: "bot", text: intro }]);
      } else {
        // fetch from server and cache
        try {
          const res = await fetch("/api/sessionStart");
          const { dailyProfile, coreProfile } = await res.json();
          setDailyProfile(dailyProfile);
          setCoreProfile(coreProfile);
          extractFacts(dailyProfile);

          localStorage.setItem("ili-daily", dailyProfile);
          localStorage.setItem("ili-core", coreProfile);
          localStorage.setItem("ili-memory-date", today);
          setLoadedDate(today);

          const intro = buildIntroFromMemory(coreProfile, dailyProfile);
          setChatLog([{ role: "bot", text: intro }]);
        } catch {
          setChatLog([{ role: "bot", text: "Memory load failed—starting fresh." }]);
        }
      }
    }

    function extractFacts(dailyText) {
      const facts = {};
      dailyText.split("\n").forEach(line => {
        const [k, ...rest] = line.split(":");
        if (k && rest.length) facts[k.trim()] = rest.join(":").trim();
      });
      setUserFacts(facts);
    }

    initMemory();
  }, []);

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

  const sendMessage = async e => {
    e.preventDefault();
    if (!input.trim()) return;

    // Before the very first user message of the day, save & rebuild profiles
    if (loadedDate !== today) {
      await fetch("/api/memory", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ chatLog, updateProfile: true }),
      });
      // now re-run sessionStart logic
      localStorage.removeItem("ili-memory-date");
      window.location.reload();
      return;
    }

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
