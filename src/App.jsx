// src/App.jsx
import React, { useEffect, useState } from "react";
import SoulPrint from "./SoulPrint";
import ChatArea from "./ChatArea";
import { MemoryProvider, useMemory } from "./MemoryProvider";
import AutoSaveOnClose from "./AutoSaveOnClose";
import { buildIntroFromMemory } from "./utils/promptBuilder";
import "./App.css";

function AppInner() {
  const [pending, setPending] = useState(false);
  const [partialReply, setPartialReply] = useState("");
  const { chatLog, setChatLog, setDailyProfile, setCoreProfile, setUserFacts } = useMemory();
  const WORD_INTERVAL = 90;

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const cachedDate   = localStorage.getItem("ili-memory-date");
    const cachedCore   = localStorage.getItem("ili-core-profile");
    const cachedDaily  = localStorage.getItem("ili-daily-profile");
    const cachedLong   = localStorage.getItem("ili-long-profile");

    function extractFacts(text) {
      const facts = {};
      text.split("\n").forEach((line) => {
        const [k, ...rest] = line.split(":");
        if (k && rest.length) facts[k.trim()] = rest.join(":").trim();
      });
      setUserFacts(facts);
    }

    // 1️⃣ If we've already fetched today → use localStorage
    if (
      cachedDate === today &&
      cachedCore &&
      cachedDaily &&
      cachedLong
    ) {
      setCoreProfile(cachedCore);
      setDailyProfile(cachedDaily);
      extractFacts(cachedDaily);

      const intro = buildIntroFromMemory(cachedCore, cachedDaily);
      setChatLog([{ role: "bot", text: intro }]);
      return;
    }

    // 2️⃣ Otherwise fetch from Dify
    fetch("/api/sessionStart")
      .then((r) => r.json())
      .then(({ dailyProfile, coreProfile, longProfile }) => {
        setDailyProfile(dailyProfile);
        setCoreProfile(coreProfile);
        extractFacts(dailyProfile);

        // cache them for rest of day
        localStorage.setItem("ili-daily-profile", dailyProfile);
        localStorage.setItem("ili-long-profile", longProfile);
        localStorage.setItem("ili-core-profile", coreProfile);
        localStorage.setItem("ili-memory-date", today);

        const intro = buildIntroFromMemory(coreProfile, dailyProfile);
        setChatLog([{ role: "bot", text: intro }]);
      })
      .catch(() => {
        setChatLog([{ role: "bot", text: "Memory load failed – starting fresh." }]);
      });
  }, []);

  const revealReply = (fullText) => {
    const words = fullText.split(" ");
    setPartialReply("");
    let idx = 0;
    const step = () => {
      if (idx < words.length) {
        setPartialReply((p) => (p ? p + " " : "") + words[idx]);
        idx++;
        setTimeout(step, WORD_INTERVAL);
      } else {
        setChatLog((c) => [...c, { role: "bot", text: fullText }]);
        setPartialReply("");
        setPending(false);
      }
    };
    step();
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    // skip empty
    if (!chatLog) return;

    const userText = e.target.elements[0].value.trim();
    if (!userText) return;

    const newLog = [...chatLog, { role: "user", text: userText }];
    setChatLog(newLog);
    setPending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText, chatLog: newLog }),
      });
      const { reply } = await res.json();
      revealReply(reply || "…");
    } catch (err) {
      console.error(err);
      setChatLog((c) => [...c, { role: "bot", text: "Oops—something went wrong." }]);
      setPending(false);
    }
  };

  return (
    <>
      <AutoSaveOnClose />
      <div className={`ili-container ${pending ? "soulprint-core-glow" : ""}`}>
        <header><SoulPrint coreGlow={pending} /></header>
        <ChatArea
          messages={chatLog}
          partialReply={partialReply}
          pending={pending}
          onSend={sendMessage}
        />
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
