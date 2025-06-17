// src/App.jsx
import { useState } from "react";
import { ReactComponent as SoulPrint } from "./assets/ILI-SOUL.svg";
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
    } catch {
      setMessages((msgs) => [
        ...msgs,
        { role: "bot", text: "Oops—something went wrong. Try again." },
      ]);
    }

    setInput("");
    setPending(false);
  };

  return (
    <div className="app-container">
      <header className="soul-header">
        <SoulPrint
          className="soulprint"
          width={120}
          height={120}
          aria-label="I.L.I. soul print"
        />
      </header>

      <div className="chat-window">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            <b>{msg.role === "user" ? "You" : "I.L.I."}:</b> {msg.text}
          </div>
        ))}
        {pending && <div className="loading">I.L.I. is thinking…</div>}
      </div>

      <form className="chat-form" onSubmit={sendMessage}>
        <input
          className="chat-input"      
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your question…"
          disabled={pending}
        />
        <button className="chat-button" disabled={pending}>
          Send
        </button>
      </form>
    </div>
  );
}

export default App;
