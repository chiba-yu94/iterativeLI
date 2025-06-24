import { useState, useEffect } from "react";
import SoulPrint from "./SoulPrint";
import ChatArea from "./ChatArea";
import MemoryControls from "./MemoryControls";
import { MemoryProvider, useMemory } from "./MemoryProvider";
import "./App.css";

// Helper: Only handles sendBeacon if chatLog is non-empty and defined
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

  return null; // This component has no visible UI
}

export default function App() {
  const [messages, setMessages] = useState([]);
  const [pending, setPending] = useState(false);
  const [input, setInput] = useState("");
  const [partialReply, setPartialReply] = useState("");
  const [reloadFlag, setReloadFlag] = useState(false);

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
        setMessages((msgs) => [...msgs, { role: "bot", text: fullText }]);
        setPartialReply("");
        setPending(false);
      }
    };
    showNextWord();
  };

const sendMessage = async (e) => {
  e.preventDefault();
  if (!input.trim()) return;
  setMessages((msgs) => [...msgs, { role: "user", text: input }]);
  setPending(true);
  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: input }),  // <--- Update this line!
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    revealReply(data.reply || "…");
  } catch {
    setMessages((msgs) => [
      ...msgs,
      { role: "bot", text: "Oops—something went wrong. Try again." },
    ]);
    setPartialReply("");
    setPending(false);
  }
  setInput("");
};

  return (
    <MemoryProvider>
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
          messages={messages}
          partialReply={partialReply}
          pending={pending}
          input={input}
          setInput={setInput}
          sendMessage={sendMessage}
        />
        <MemoryControls
          messages={messages}
          pending={pending}
          reloadFlag={reloadFlag}
          setReloadFlag={setReloadFlag}
        />
      </div>
    </MemoryProvider>
  );
}
