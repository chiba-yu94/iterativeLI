import { useState } from "react";
import { ReactComponent as SoulPrint } from './assets/ILI-SOUL.svg';
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

    // Animate out the last visible message (if any)
    if (messages.length > 0) {
      setLeavingMsg(messages[messages.length - 1]);
      setTimeout(() => setLeavingMsg(null), 700); // match animation duration
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

  // Responsive container style
  const containerStyle = {
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
  };

  // Chat window style (fixed width, always wraps)
  const chatWindowStyle = {
    border: "1px solid #555",
    borderRadius: 12,
    padding: 16,
    minHeight: 80,
    marginBottom: 12,
    background: "#111",
    color: "#eee",
    width: "100%",
    boxSizing: "border-box",
    overflowWrap: "break-word",
    position: "relative",
    height: 100, // fixed height for smooth animation
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    overflow: "hidden"
  };

  // Message text style
  const msgTextStyle = (role) => ({
    textAlign: role === "user" ? "right" : "left",
    color: role === "user" ? "#3b5bdb" : "#eee",
    margin: "6px 0",
    fontSize: "1.15rem",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    width: "100%",
    padding: 0,
    background: "none",
  });

  return (
    <div style={containerStyle}>
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

      {/* Main chat: only last message fades in, old floats up and out */}
      <div className="chat-window" style={chatWindowStyle}>
        {/* Fade out the old message, floating upward */}
        {leavingMsg && (
          <div
            key={leavingMsg.text + "_leaving"}
            className="msg-leaving"
            style={{
              ...msgTextStyle(leavingMsg.role),
              opacity: 1,
              animation: "fadeUpOut 0.7s forwards",
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 16,
              pointerEvents: "none",
              zIndex: 1,
            }}
          >
            <b>{leavingMsg.role === "user" ? "You" : "I.L.I."}:</b> {leavingMsg.text}
          </div>
        )}
        {/* Newest message, fade in from below */}
        {messages.length > 0 ? (
          <div
            key={messages[messages.length - 1].text}
            className="msg-in"
            style={{
              ...msgTextStyle(messages[messages.length - 1].role),
              opacity: 1,
              animation: "fadein 0.7s",
              position: "relative",
              zIndex: 2,
            }}
          >
            <b>{messages[messages.length - 1].role === "user" ? "You" : "I.L.I."}:</b> {messages[messages.length - 1].text}
          </div>
        ) : (
          <div style={{ textAlign: "center", color: "#888", width: "100%" }}>
            I.L.I. is waiting for you...
          </div>
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
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
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

      {/* Collapsible chat log viewer at the bottom */}
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
            width: "auto",
            marginBottom: 8,
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
              width: "100%",
              boxSizing: "border-box",
              marginLeft: "auto",
              marginRight: "auto",
              minWidth: 0,
            }}
          >
            {messages.map((msg, i) => (
              <div key={i} style={{
                textAlign: msg.role === "user" ? "right" : "left",
                color: msg.role === "user" ? "#4e83ee" : "#eee",
                margin: "6px 0",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}>
                <b>{msg.role === "user" ? "You" : "I.L.I."}:</b> {msg.text}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CSS keyframes for fade animations */}
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
