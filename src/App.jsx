import React, { useState, useEffect } from "react";
import SoulPrint from "./SoulPrint";
import ChatArea from "./ChatArea";
import MemoryControls from "./MemoryControls";
import { MemoryProvider, useMemory } from "./MemoryProvider";
import "./App.css";

// Helper: Auto-save on tab close
function AutoSaveOnClose() {
  const { chatLog } = useMemory();

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (chatLog && chatLog.length > 0) {
        const data = JSON.stringify({
          chatLog,
          metadata: {
            type: "daily_summary",
            date: new Date().toISOString().slice(0, 10),
          },
        });
        const blob = new Blob([data], { type: "application/json" });
        navigator.sendBeacon("/api/memory", blob);
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [chatLog]);

  return null;
}

function StartConversationButton({ onStart, loading }) {
  return (
    <div className="ili-start-container">
      <button className="ili-start-button" onClick={onStart} disabled={loading}>
        {loading ? "Loading..." : "Start Conversation"}
      </button>
    </div>
  );
}

function AppInner() {
  const [started, setStarted] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [pending, setPending] = useState(false);
  const [input, setInput] = useState("");
  const [partialReply, setPartialReply] = useState("");
  const [reloadFlag, setReloadFlag] = useState(false);

  const {
    chatLog = [],
    setChatLog,
    setDailyProfile,
    setCoreProfile
  } = useMemory();

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
        body: JSON.stringify({
          message: input,
          chatLog: newLog,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      revealReply(data.reply || "…");
    } catch (err) {
      console.error("Chat error:", err);
      setChatLog((msgs) => [...msgs, { role: "bot", text: "Oops—something went wrong. Try again." }]);
      setPartialReply("");
      setPending(false);
    }

    setInput("");
  };

  const startConversation = async () => {
    try {
      setLoadingProfile(true);
      const res = await fetch("/api/memory?type=daily_profile&limit=1");
      if (!res.ok) throw new Error("Failed to fetch daily profile (" + res.status + ")");
      const data = await res.json();
      setDailyProfile(data?.profiles?.[0]?.text || "");

      const coreRes = await fetch("/api/memory?type=core_profile&limit=1");
      if (!coreRes.ok) throw new Error("Failed to fetch core profile (" + coreRes.status + ")");
      const coreData = await coreRes.json();
      setCoreProfile(coreData?.profiles?.[0]?.text || "");

      setLoadingProfile(false);
      setStarted(true);
    } catch (err) {
      setLoadingProfile(false);
      alert("Failed to start conversation: " + err.message);
      console.error("Start conversation error:", err);
    }
  };

  if (!started) {
    return <StartConversationButton onStart={startConversation} loading={loadingProfile} />;
  }

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
