import ChatBox from "./ChatBox";
import InputBar from "./InputBar";
import ChatLog from "./ChatLog";
import { useState } from "react";

export default function ChatArea({
  messages,
  partialReply,
  pending,
  input,
  setInput,
  sendMessage,
}) {
  const [showLog, setShowLog] = useState(false);

  // Prepare messages for animation (last user and partial bot, or last bot if done)
  const chatMsgs = (() => {
    if (pending && partialReply) {
      let prev = messages.length > 0 ? messages[messages.length - 1] : null;
      return [prev, { role: "bot", text: partialReply }].filter(Boolean);
    }
    return messages.slice(-2);
  })();

  return (
    <div>
      <ChatBox messages={chatMsgs} pending={pending} />
      <InputBar
        value={input}
        onChange={e => setInput(e.target.value)}
        onSubmit={sendMessage}
        pending={pending}
      />
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
        onClick={() => setShowLog(v => !v)}
      >
        {showLog ? "Hide Conversation Log" : "Show Conversation Log"}
      </button>
      {showLog && <ChatLog messages={messages} show={showLog} onToggle={() => setShowLog(false)} />}
    </div>
  );
}
