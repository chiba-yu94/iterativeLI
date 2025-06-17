import { useState } from "react";
import SoulPrint from "./SoulPrint";
import ChatBox from "./ChatBox";
import ChatLog from "./ChatLog";
import InputBar from "./InputBar";
import "./App.css";

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [leavingMsg, setLeavingMsg] = useState(null);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    if (messages.length > 0) {
      setLeavingMsg(messages[messages.length - 1]);
      setTimeout(() => setLeavingMsg(null), 700);
    }

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

  // All container styling stays the same
  return (
    <div style={{
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
    }}>
      <header style={{ textAlign: "center", marginBottom: "1rem" }}>
        <SoulPrint width={120} height={120} />
      </header>
      <ChatBox messages={messages} leavingMsg={leavingMsg} pending={pending} />
      <InputBar
        value={input}
        onChange={e => setInput(e.target.value)}
        onSubmit={sendMessage}
        pending={pending}
      />
      <ChatLog
        messages={messages}
        show={showLog}
        onToggle={() => setShowLog(v => !v)}
      />
      {/* Animations */}
      <style>
        {`
        @keyframes fadeUpOut {
          from { opacity: 1; transform: translateY(0);}
          to   { opacity: 0; transform: translateY(-32px);}
        }
        @keyframes fadein {
          from { opacity: 0; transform: translateY(24px);}
          to   { opacity: 1; transform: translateY(0);}
        }
        @media (max-width: 600px) {
          .chat-window {
            padding: 8px !important;
            font-size: 1rem !important;
          }
        }
        `}
      </style>
    </div>
  );
}

export default App;
