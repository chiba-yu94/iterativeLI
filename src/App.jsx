// src/App.jsx
import React, { useEffect, useState } from "react";
import { MemoryProvider, useMemory } from "./MemoryProvider";
import SoulPrint from "./SoulPrint";
import ChatArea from "./ChatArea";
import AutoSaveOnClose from "./AutoSaveOnClose";
import MemoryControls from "./MemoryControls";
import { buildIntroFromMemory } from "./utils/promptBuilder";
import "./App.css";

const onboardingGreetings = [
  "Welcome! How should I call you?",
  "Hi there. What name or nickname would you like me to use?",
  "Hello! What would you like me to call you today?",
  "Hey, before we begin, how do you prefer I address you?",
  "It’s nice to meet you. May I ask what name I should use?"
];

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
  const [awaitingName, setAwaitingName] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const [loadedDate, setLoadedDate] = useState(localStorage.getItem("ili-memory-date"));

  // On mount: check memory, or trigger onboarding greeting
  useEffect(() => {
    async function initMemory() {
      if (loadedDate === today) {
        const daily = localStorage.getItem("ili-daily") || "";
        const core  = localStorage.getItem("ili-core")  || "";
        setDailyProfile(daily);
        setCoreProfile(core);
        extractFacts(daily);
        const intro = buildIntroFromMemory(core, daily);
        setChatLog([{ role: "bot", text: intro }]);
      } else {
        try {
          const res = await fetch("/api/sessionStart");
          const data = await res.json();
          if (data.onboarding) {
            // Choose random onboarding greeting
            const onboardingMsg = onboardingGreetings[Math.floor(Math.random() * onboardingGreetings.length)];
            setChatLog([{ role: "bot", text: onboardingMsg }]);
            setAwaitingName(true);
          } else {
            setDailyProfile(data.dailyProfile);
            setCoreProfile(data.coreProfile);
            extractFacts(data.dailyProfile);
            localStorage.setItem("ili-daily", data.dailyProfile);
            localStorage.setItem("ili-core", data.coreProfile);
            localStorage.setItem("ili-memory-date", today);
            setLoadedDate(today);
            const intro = buildIntroFromMemory(data.coreProfile, data.dailyProfile);
            setChatLog([{ role: "bot", text: intro }]);
          }
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

    // If awaiting user name for onboarding:
    if (awaitingName) {
      const userMsg = { role: "user", text: input.trim() };
      const newLog = [...chatLog, userMsg];
      setChatLog(newLog);
      
    // Compose formatted daily profile string!
    const name = input.trim();
    const summary = `Name: ${name}
Likes:
Dislikes:
Typical Mood/Emotion:
Current Mood/Emotion:
Recent Highlights (bullet points):
Aspirations/Concerns:
Favorite Topics:
Important Reflections (bullet points):`;
      
      // Save as first daily_profile and build memory
      await fetch("/api/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatLog: [userMsg], updateProfile: true }),
      });
      setAwaitingName(false);
      setInput("");
      window.location.reload(); // will now trigger memory boot as usual
      return;
    }

    // Normal chat send
    if (loadedDate !== today) {
      await fetch("/api/memory", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ chatLog, updateProfile: true }),
      });
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
