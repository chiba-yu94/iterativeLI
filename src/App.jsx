// src/App.jsx
import React, { useState } from "react";
import SoulPrint from "./SoulPrint";
import ChatArea from "./ChatArea";
import MemoryControls from "./MemoryControls";
import AutoSaveOnClose from "./AutoSaveOnClose";
import { useFirstMessage } from "./hooks/useFirstMessage";
import { buildIntroFromMemory } from "./utils/promptBuilder";
import { MemoryProvider, useMemory } from "./MemoryProvider";
import "./App.css";

function AppInner() {
  const [pending, setPending] = useState(false);
  const [input, setInput]     = useState("");
  const [partialReply, setPartialReply] = useState("");
  const [hasFetched, setHasFetched] = useState(false);

  const isFirstMessageToday = useFirstMessage();
  const { chatLog, setChatLog, setDailyProfile, setCoreProfile, setUserFacts } =
    useMemory();

  // Inject memory on first user message of the day
  const fetchMemoryOnce = async () => {
    if (hasFetched || !isFirstMessageToday) return;
    setHasFetched(true);

    try {
      const resp = await fetch("/api/sessionStart");
      const { dailyProfile, longProfile, coreProfile } = await resp.json();

      setDailyProfile(dailyProfile);
      setCoreProfile(coreProfile);

      // extract simple key/value facts from daily
      const facts = {};
      dailyProfile.split("\n").forEach((line) => {
        const [k, ...rest] = line.split(":");
        if (k && rest.length) facts[k.trim()] = rest.join(":").trim();
      });
      setUserFacts(facts);

      // If fresh, push an intro
      if (!localStorage.getItem("ili-latest-chat")) {
        const intro = buildIntroFromMemory(coreProfile, dailyProfile);
        setChatLog([{ role: "bot", text: intro || "Hello! What’s your name?" }]);
      }
    } catch (err) {
      console.error("Memory injection failed:", err);
      setChatLog([{ role: "bot", text: "Memory load failed – starting fresh." }]);
    }
  };

  const revealReply = (full) => {
    const words = full.split(" ");
    setPartialReply("");
    let idx = 0;
    const step = () => {
      if (idx < words.length) {
        setPartialReply((p) => p + (p ? " " : "") + words[idx]);
        idx++;
        setTimeout(step, 75);
      } else {
        setChatLog((c) => [...c, { role: "bot", text: full }]);
        setPartialReply("");
        setPending(false);
      }
    };
    step();
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // On the very first user message of the day:
    if (isFirstMessageToday && !hasFetched) {
      await fetch("/api/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatLog, updateProfile: true }),
      });
      await fetchMemoryOnce();
    }

    const newLog = [...chatLog, { role: "user", text: input }];
    setChatLog(newLog);
    setPending(true);

    try {
      const { reply } = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input, chatLog: newLog }),
      }).then((r) => r.json());
      revealReply(reply || "...");      
    } catch (err) {
      console.error("Chat error:", err);
      setChatLog((c) => [...c, { role: "bot", text: "Oops, try again." }]);
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
          messages={chatLog}
          partialReply={partialReply}
          pending={pending}
          input={input}
          setInput={setInput}
          sendMessage={sendMessage}
        />
        <MemoryControls chatLog={chatLog} />
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
