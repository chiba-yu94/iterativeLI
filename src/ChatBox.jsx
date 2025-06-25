// ChatBox.jsx
export default function ChatBox({ messages, leavingMsg, pending }) {
  const safeMessages = messages || [];

  const msgTextStyle = (role) => ({
    textAlign: role === "user" ? "right" : "left",
    color: role === "user" ? "#3b5bdb" : "#eee",
    margin: "6px 0",
    fontSize: "1.15rem",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    overflowWrap: "break-word",
    background: "none",
    padding: 0,
    width: "100%",
    maxWidth: "100%",
    boxSizing: "border-box",
  });

  return (
    <div
      style={{
        minHeight: 80,
        marginBottom: 20,
        width: "100%",
        maxWidth: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        position: "relative",
        boxSizing: "border-box",
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
            bottom: 0,
            pointerEvents: "none",
            zIndex: 1,
          }}
        >
          <b>{leavingMsg.role === "user" ? "You" : "I.L.I."}:</b> {leavingMsg.text}
        </div>
      )}
      {safeMessages.length > 0 ? (
        <div
          key={safeMessages[safeMessages.length - 1].text}
          style={{
            ...msgTextStyle(safeMessages[safeMessages.length - 1].role),
            opacity: 1,
            animation: "fadein 0.7s",
            position: "relative",
            zIndex: 2,
          }}
        >
          <b>{safeMessages[safeMessages.length - 1].role === "user" ? "You" : "I.L.I."}:</b>{" "}
          {safeMessages[safeMessages.length - 1].text}
        </div>
      ) : (
        <div style={{ textAlign: "center", color: "#888", width: "100%" }}>
          I.L.I. is waiting for you...
        </div>
      )}
      {pending && (
        <div className="loading" style={{ color: "#aaa" }}>
          I.L.I. is thinking…
        </div>
      )}
    </div>
  );
}
