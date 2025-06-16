// src/App.jsx
import { useState } from "react";
// Use URL import for SVG to avoid SVGR build issues
import ILIlogoUrl from "./assets/ILI-soulprint.svg";

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    setMessages((msgs) => [...msgs, { role: "user", text: input }]);
    setPending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });
      const data = await res.json();
      setMessages((msgs) => [
        ...msgs,
        { role: "bot", text: data.reply || "…" },
      ]);
    } catch (err) {
      // Log error to console for debugging
      console.error("Error fetching /api/chat:", err);
      setMessages((msgs) => [
        ...msgs,
        { role: "bot", text: "Oops—something went wrong. Try again." },
      ]);
    }

    setInput("");
    setPending(false);
  };

  return (
    <div style={{ maxWidth: 480, margin: "2rem auto", fontFamily: "sans-serif" }}>
      <header style={{ textAlign: "center", marginBottom: "1rem" }}>
        {/* Render SVG as an <img> to avoid Rollup errors */}
        <img
          src={ILIlogoUrl}
          alt="I.L.I. logo"
          width={80}
          height={80}
          style={{ margin: "0 auto", display: "block" }}
        />
        <h1>I.L.I. Chat</h1>
      </header>

      <div
        style={{
          border: "1px solid #ccc",
          borderRadius: 12,
          padding: 16,
          minHeight: 240,
          marginBottom: 12,
          background: "#f9f9fe",
        }}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              textAlign: msg.role === "user" ? "right" : "left",
              color: msg.role === "user" ? "#3b5bdb" : "#555",
              margin: "8px 0",
            }}
          >
            <b>{msg.role === "user" ? "You" : "I.L.I."}:</b> {msg.text}
          </div>
        ))}
        {pending && <div style={{ color: "#aaa" }}>I.L.I. is thinking…</div>}
      </div>

      <form onSubmit={sendMessage}>
        <input
          style={{ width: "70%", padding: 8, fontSize: 16 }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your question…"
          disabled={pending}
        />
        <button style={{ padding: 8, fontSize: 16, marginLeft: 8 }} disabled={pending}>
          Send
        </button>
      </form>
    </div>
  );
}

export default App;
