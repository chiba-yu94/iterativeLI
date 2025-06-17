export default function OpenChatLine({ msg }) {
  return (
    <div
      className={"open-chat-line " + (msg.role === "user" ? "user" : "bot")}
    >
      <b>{msg.role === "user" ? "You" : "I.L.I."}:</b> {msg.text}
    </div>
  );
}
