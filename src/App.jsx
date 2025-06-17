import { useState } from "react";
import { ReactComponent as SoulPrint } from './assets/ILI-SOUL.svg';
import "./App.css";

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);

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
    } catch (err) {
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

      {/* Chat window */}
      <div
        style={{
          border: "1px solid #555",
          borderRadius: 12,
          padding: 16,
          minHeight: 240,
          marginBottom: 12,
          background: "#111",
          color: "#eee",
        }}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              textAlign: msg.role === "user" ? "right" : "left",
              color: msg.role === "user" ? "#3b5bdb" : "#eee",
              margin: "8px 0",
            }}
          >
            <b>{msg.role === "user" ? "You" : "I.L.I."}:</b> {msg.text}
          </div>
        ))}
        {pending && <div className="loading">I.L.I. is thinking…</div>}
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
