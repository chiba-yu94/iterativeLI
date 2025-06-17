import { useState } from "react";
import SoulPrint from "./SoulPrint";
import OpenChatLine from "./OpenChatLine";
import ChatLog from "./ChatLog";
import "./App.css";

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [partialReply, setPartialReply] = useState("");
  const [showLog, setShowLog] = useState(false);

  const revealReply = (fullText) => {
    const words = fullText.split(" ");
    setPartialReply("");
    let index = 0;
    const showNextWord = () => {
      if (index < words.length) {
        setPartialReply((prev) => prev + (prev ? " " : "") + words[index]);
        index++;
        setTimeout(showNextWord, 60);
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
        body: JSON.stringify({ message: input }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      revealReply(data.reply || "…");
    } catch (err) {
      setMessages((msgs) => [
        ...msgs,
        { role: "bot", text: "Oops—something went wrong. Try again." },
      ]);
      setPending(false);
      setPartialReply("");
    }

    setInput("");
  };

  // For chat flow, show last two turns, with partial typing if needed
  const lastTwo = (() => {
    if (pending && partialReply) {
      let prev = messages.length > 0 ? messages[messages.length - 1] : null;
      return [prev, { role: "bot", text: partialReply }].filter(Boolean);
    }
    return messages.slice(-2);
  })();

  return (
    <div
      className={
        (input.length > 0 && !pending ? "soulprint-storm-slow " : "") +
        (pending ? "soulprint-core-glow " : "")
      }
      style={{
        maxWidth: 480,
        width: "100%",
        minWidth: 0,
        margin: "2rem auto",
        fontFamily: "sans-serif",
        backgroundColor: "#000",
        color: "#fff",
        minHeight: "100vh",
        padding: "1rem",
        boxSizing: "border-box",
      }}
    >
      <header style={{ textAlign: "center", marginBottom: "1rem" }}>
        <SoulPrint
          slowStorm={input.length > 0 && !pending}
          coreGlow={pending}
        />
      </header>

      <div>
        {lastTwo.map((msg, idx) => (
          <OpenChatLine key={idx} msg={msg} />
        ))}
        {pending && !partialReply && (
          <div className="loading">I.L.I. is thinking…</div>
        )}
      </div>

      <form onSubmit={sendMessage} style={{ display: "flex", gap: "8px", marginTop: 18 }}>
        <input
          style={{
            flex: 1,
            padding: 8,
            fontSize: 16,
            background: "#222",
            color: "#fff",
            border: "1px solid #555",
          }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your question…"
          disabled={pending}
        />
        <button
          style={{
            padding: 8,
            fontSize: 16,
            background: "#3b5bdb",
            color: "#fff",
            border: "none",
          }}
          disabled={pending}
        >
          Send
        </button>
      </form>

      <button
        style={{
          margin: "18px auto 0 auto",
          display: "block",
          background: "none",
          color: "#ccc",
          border: "none",
          fontSize: "1rem",
          cursor: "pointer",
        }}
        onClick={() => setShowLog((v) => !v)}
      >
        {showLog ? "Hide Conversation Log" : "Show Conversation Log"}
      </button>
      {showLog && <ChatLog messages={messages} />}
    </div>
  );
}
