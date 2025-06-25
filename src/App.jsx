import React, { useState } from "react";
import SoulPrint from "./SoulPrint";
import ChatArea from "./ChatArea";
import MemoryControls from "./MemoryControls";
import { MemoryProvider, useMemory } from "./MemoryProvider";
import AutoSaveOnClose from "./AutoSaveOnClose";
import { useFirstMessage } from "./hooks/useFirstMessage";
import { buildMemoryIntro } from "./utils/promptBuilder";
import "./App.css";

function AppInner() {
  const [pending, setPending] = useState(false);
  const [input, setInput] = useState("");
  const [partialReply, setPartialReply] = useState("");
  const [reloadFlag, setReloadFlag] = useState(false);
  const [hasFetchedMemory, setHasFetchedMemory] = useState(false);

  const {
    chatLog = [],
    setChatLog,
    setDailyProfile,
    setCoreProfile,
    setUserFacts,
  } = useMemory();

  const isFirstMessageToday = useFirstMessage();

  const WORD_INTERVAL = 90;
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

  const fetchMemoryOnce = async () => {
    if (hasFetchedMemory || !isFirstMessageToday) return;
    setHasFetchedMemory(true);
    try {
      const [dailyRes, coreRes] = await Promise.all([
        fetch("/api/memory?type=daily_profile&limit=1"),
        fetch("/api/memory?type=core_profile&limit=1"),
      ]);
      const daily = await dailyRes.json();
      const core = await coreRes.json();
      const dailyText = daily?.profiles?.[0]?.text || "";
      const coreText = core?.profiles?.[0]?.text || "";
      setDailyProfile(dailyText);
      setCoreProfile(coreText);

      // extract structured user facts from daily profile
      const facts = {};
      dailyText.split("\n").forEach((line) => {
        const [key, ...rest] = line.split(":");
        if (key && rest.length > 0) {
          facts[key.trim()] = rest.join(":").trim();
        }
      });
      setUserFacts(facts);

      // inject memory summary or icebreaker
      const cached = localStorage.getItem("ili-latest-chat");
      if (!cached) {
        const intro = buildMemoryIntro(dailyText, coreText);
        if (intro) {
          setChatLog([{ role: "bot", text: intro }]);
        } else {
          setChatLog([
            {
              role: "bot",
              text:
                "This is your first conversation with me.\nI'd love to get to know you—what’s your name, and how are you feeling today?",
            },
          ]);
        }
      }
    } catch (err) {
      console.error("Memory injection failed:", err);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    if (isFirstMessageToday && !hasFetchedMemory) {
      await fetchMemoryOnce();
    }

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
