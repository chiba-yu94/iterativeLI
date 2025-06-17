import { useState } from "react";
import { ReactComponent as SoulPrint } from './assets/ILI-SOUL.svg';
import "./App.css";

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [fadeKey, setFadeKey] = useState(0);

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
      setMessages((msgs) => [
        ...msgs,
        { role: "bot", text: data.reply || "…" },
      ]);
      setFadeKey((k) => k + 1); // triggers fade
    } catch (err) {
      console.error("Error fetching /api/chat:", err);
      setMessages((msgs) => [
        ...msgs,
        { role: "bot", text: "Oops—something went wrong. Try again." },
      ]);
    }

    setInput("");
    setPending(false);
    setFadeKey((k) => k + 1); // triggers fade on user message too
  };

  // Animation styles
  const fadeInStyle = {
    animation: "fadein 1s",
    WebkitAnimation: "fadein 1s"
  };

  return (
    <div
      style={{
        maxWidth: 480,
        margin: "2rem auto",
        fontFamily: "sans-serif",
        backgroundColor: "#000",
        color: "#fff",
        minHeight: "100vh",
        padding: "1rem",
      }}
    >
      {/* Header with soul print */}
      <header
        style={{
          textAlign: "center",
          marginBottom: "1rem",
        }}
      >
        <SoulPrint
          width={120}
          height={120}
          style={{ display: "block", margin: "0 auto" }}
        />
      </header>

      {/* Conversational main view: only the last 2 messages */}
      <div
        className="chat-window"
        key={fadeKey} // reset animation on message change
        style={{
          border: "1px solid #555",
          borderRadius: 12,
          padding: 16,
          minHeight: 80,
          marginBottom: 12,
          background: "#111",
          color: "#eee",
          ...fadeInStyle,
        }}
      >
        {messages.length === 0 ? (
          <div style={{ textAlign: "center", color: "#888" }}>
            I.L.I. is waiting for you...
          </div>
        ) : (
          messages.slice(-2).map((msg, i) => (
            <div
              key={i}
              style={{
                textAlign: msg.role === "user" ? "right" : "left",
                color: msg.role === "user" ? "#3b5bdb" : "#eee",
                margin: "8px 0",
                fontSize: "1.12rem",
                opacity: 1,
                transition: "opacity 0.7s",
              }}
            >
              <b>{msg.role === "user" ? "You" : "I.L.I."}:</b> {msg.text}
            </div>
          ))
        )}
        {pending && <div className="loading" style={{ color: "#aaa" }}>I.L.I. is thinking…</div>}
      </div>

      {/* Input form */}
      <form onSubmit={sendMessage} style={{ display: "flex", gap: "8px" }}>
        <input
          style={{
            flex: 1,
            padding: 8,
            fontSize: 16,
            background: "#222",
            color: "#fff",
            border: "1px solid #555",
            borderRadius: 4,
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
            borderRadius: 4,
          }}
          disabled={pending}
        >
          Send
        </button>
      </form>

      {/* Optional: Collapsible chat log viewer */}
      <div style={{ marginTop: 24, textAlign: "center" }}>
        <button
          style={{
            background: "#222",
            color: "#fff",
            border: "1px solid #3b5bdb",
            borderRadius: 4,
            padding: "4px 16px",
            cursor: "pointer",
            fontSize: 14,
          }}
          onClick={() => setShowLog((v) => !v)}
        >
          {showLog ? "Hide Chat Log" : "Show Chat Log"}
        </button>
        {showLog && (
          <div
            style={{
              background: "#181833",
              color: "#eee",
              borderRadius: 8,
              padding: 12,
              marginTop: 12,
              maxHeight: 220,
              overflowY: "auto",
              textAlign: "left",
              border: "1px solid #333",
              boxShadow: "0 2px 12px rgba(0,0,0,0.12)",
              fontSize: "0.98rem",
            }}
          >
            {messages.map((msg, i) => (
              <div key={i} style={{
                textAlign: msg.role === "user" ? "right" : "left",
                color: msg.role === "user" ? "#4e83ee" : "#eee",
                margin: "6px 0",
              }}>
                <b>{msg.role === "user" ? "You" : "I.L.I."}:</b> {msg.text}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CSS keyframes for fadein animation */}
      <style>
        {`
        @keyframes fadein {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        `}
      </style>
    </div>
  );
}

export default App;
