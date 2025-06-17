export default function InputBar({ value, onChange, onSubmit, pending }) {
  return (
    <form onSubmit={onSubmit} style={{ display: "flex", gap: "8px", width: "100%" }}>
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
        value={value}
        onChange={onChange}
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
  );
}
