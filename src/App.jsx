// App.jsx
import React, { useEffect, useState } from "react";
import SoulPrint from "./SoulPrint";
import ChatArea from "./ChatArea";
import MemoryControls from "./MemoryControls";
import { MemoryProvider, useMemory } from "./MemoryProvider";
import AutoSaveOnClose from "./AutoSaveOnClose";
import { buildIntroFromMemory } from "./utils/promptBuilder";
import "./App.css";

function AppInner() {
  const [pending, setPending] = useState(false);
  const [input, setInput] = useState("");
  const [partialReply, setPartialReply] = useState("");
  const [reloadFlag, setReloadFlag] = useState(false);

  const {
    chatLog = [],
    setChatLog,
    setDailyProfile,
    setCoreProfile,
    setUserFacts,
  } = useMemory();

  const WORD_INTERVAL = 90;

  // Robust boot: prefer localStorage, fall back to Dify
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const cachedCore = localStorage.getItem("ili-core-profile");
    const cachedLong = localStorage.getItem("ili-long-profile");
    const cachedDaily = localStorage.getItem("ili-daily-profile");
    const cachedDate = localStorage.getItem("ili-memory-date");

    // Helper: parse and append facts from daily summary
    function extractFacts(dailyText) {
      const facts = {};
      dailyText.split("\n").forEach((line) => {
        const [key, ...rest] = line.split(":");
        if (key && rest.length > 0) {
          facts[key.trim()] = rest.join(":").trim();
        }
      });
      setUserFacts(facts);
    }

    // Step 1: Prefer localStorage (if today's)
    if (cachedCore && cachedLong && cachedDaily && cachedDate === today) {
      setCoreProfile(cachedCore);
      setDailyProfile(cachedDaily);
      extractFacts(cachedDaily);

      const intro = buildIntroFromMemory(cachedCore, cachedDaily);
      setChatLog([{ role: "bot", text: intro }]);
      // Optionally append last session's chat log
      const cachedLog = localStorage.getItem("ili-latest-chat");
      if (cachedLog) {
        try {
          setChatLog((old) => [...old, ...JSON.parse(cachedLog)]);
        } catch (e) {}
      }
    } else {
      // Step 2: Otherwise, fetch from Dify
      fetch("/api/sessionStart")
        .then((res) => res.json())
        .then((json) => {
          const dailyText = json.dailyProfile || "";
          const coreText = json.coreProfile || "";
          const longText = json.longProfile || "";

          setDailyProfile(dailyText);
          setCoreProfile(coreText);
          extractFacts(dailyText);

          // Cache all profiles for this session/day
          localStorage.setItem("ili-core-profile", coreText);
          localStorage.setItem("ili-long-profile", longText);
          localStorage.setItem("ili-daily-profile", dailyText);
          localStorage.setItem("ili-memory-date", today);

          const intro = buildIntroFromMemory(coreText, dailyText);
          setChatLog([{ role: "bot", text: intro }]);

          const cachedLog = localStorage.getItem("ili-latest-chat");
          if (cachedLog) {
            try {
              setChatLog((old) => [...old, ...JSON.parse(cachedLog)]);
            } catch (e) {}
          }
        })
        .catch((err) => {
          setChatLog([
            { role: "bot", text: "Memory load failed. Let's start fresh!" },
          ]);
        });
    }
  }, []);

  const revealReply = (fullText) => {
    const words = fullText.split(" ");
    setPartialReply("");
    let idx = 0;
    const showNextWord = () => {
      if (idx < words.length) {
        setPartialReply((prev) => prev + (prev ? " " : "") + words[idx]);
        idx++;
        setTimeout(showNextWord, WORD_INTERVAL);
      } else {
        setChatLog((msgs) => [...msgs, { role: "bot", text: fullText }]);
        setPartialReply("");
        setPending(false);
      }
    };
    showNextWord();
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newLog = [...chatLog, { role: "user", text: input }];
    setChatLog(newLog);
    setPending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input, chatLog: newLog }),
      });
      const data = await res.json();
      revealReply(data.reply || "…");
    } catch (err) {
      console.error("Chat error:", err);
      setChatLog((msgs) => [
        ...msgs,
        { role: "bot", text: "Oops—something went wrong. Try again." },
      ]);
      setPartialReply("");
      setPending(false);
    }

    setInput("");
  };

  return (
    <>
      <AutoSaveOnClose />
      <div
        className={
          "ili-container " +
          (input.length > 0 && !pending ? "soulprint-storm-slow " : "") +
          (pending ? "soulprint-core-glow " : "")
        }
      >
        <header style={{ textAlign: "center", marginBottom: "1rem" }}>
          <SoulPrint
            slowStorm={input.length > 0 && !pending}
            coreGlow={pending}
            breathing={pending}
          />
        </header>
        <ChatArea
          messages={chatLog}
          partialReply={partialReply}
          pending={pending}
          input={input}
          setInput={setInput}
          sendMessage={sendMessage}
        />
        <MemoryControls
          messages={chatLog}
          pending={pending}
          reloadFlag={reloadFlag}
          setReloadFlag={setReloadFlag}
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
