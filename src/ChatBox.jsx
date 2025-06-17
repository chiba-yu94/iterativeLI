export default function ChatBox({ messages, leavingMsg, pending }) {
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
    <div
      className="chat-window"
      style={{
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
        height: 100,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        overflow: "hidden"
      }}
    >
      {leavingMsg && (
        <div
          key={leavingMsg.text + "_leaving"}
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
      {messages.length > 0 ? (
        <div
          key={messages[messages.length - 1].text}
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
  );
}
