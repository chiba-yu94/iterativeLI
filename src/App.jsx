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
  const [awaitingMood, setAwaitingMood] = useState(false);
  const [userName, setUserName] = useState("");
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

  // --- Name extraction using GPT ---
  async function extractNameFromInput(inputText) {
    // Note: You may want to move your OpenAI key into a backend API for security
    const prompt = `
Extract only the user's preferred name from this message.
Example: "Call me Yuichi" → "Yuichi", "You can call me Anna" → "Anna", "Yuichi" → "Yuichi".
If no clear name, just return the input as is.
Input: ${inputText}
Name:`;
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0,
        max_tokens: 16,
      }),
    });
    const data = await res.json();
    return data?.choices?.[0]?.message?.content?.trim() || inputText;
  }

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

    // Step 1: User is answering onboarding name
    if (awaitingName) {
      const userMsg = { role: "user", text: input.trim() };
      const extractedName = await extractNameFromInput(input.trim());
      setUserName(extractedName);
      const newLog = [...chatLog, userMsg, { role: "bot", text: `Hi, ${extractedName}! How are you feeling today?` }];
      setChatLog(newLog);

      setAwaitingName(false);
      setAwaitingMood(true);
      setInput("");
      return;
    }

    // Step 2: User is answering mood
    if (awaitingMood) {
      const moodMsg = { role: "user", text: input.trim() };
      const fullLog = [...chatLog, moodMsg];
      setChatLog(fullLog);

      // Compose summary
      const summary = `Name: ${userName}
Likes:
Dislikes:
Typical Mood/Emotion: ${input.trim()}
Current Mood/Emotion: ${input.trim()}
Recent Highlights (bullet points):
Aspirations/Concerns:
Favorite Topics:
Important Reflections (bullet points):`;

      // Save as first daily_profile and build memory
      await fetch("/api/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatLog: fullLog, summary, updateProfile: true }),
      });

      setAwaitingMood(false);
      setInput("");
      window.location.reload(); // now triggers memory boot as usual
      return;
    }

    // --- Existing daily_profile: normal chat send ---
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
