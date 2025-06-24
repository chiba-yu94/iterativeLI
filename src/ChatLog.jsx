// ChatLog.jsx
export default function ChatLog({ messages, show, onToggle }) {
  return (
    <div style={{ marginTop: 24, textAlign: "center", maxWidth: "100%" }}>
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
        onClick={onToggle}
      >
        {show ? "Hide Chat Log" : "Show Chat Log"}
      </button>
      {show && (
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
            maxWidth: "100%", // 🔧 New
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
              overflowWrap: "break-word",
            }}>
              <b>{msg.role === "user" ? "You" : "I.L.I."}:</b> {msg.text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
