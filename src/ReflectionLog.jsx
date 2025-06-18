import { useState } from "react";

export default function ReflectionLog({ reloadFlag }) {
  const [reflections, setReflections] = useState([]);
  const [loading, setLoading] = useState(false);

  async function fetchReflections() {
    setLoading(true);
    const res = await fetch("/api/memory?type=daily_summary");
    if (res.ok) {
      const data = await res.json();
      setReflections(data.data || data.documents || []);
    } else {
      setReflections([]);
    }
    setLoading(false);
  }

  return (
    <div style={{ margin: "18px 0" }}>
      <button
        style={{
          margin: "0 auto",
          display: "block",
          background: "#222",
          color: "#9ff",
          border: "1px solid #3b5bdb",
          borderRadius: "6px",
          fontSize: "1.05rem",
          padding: "8px 12px",
          cursor: "pointer"
        }}
        onClick={fetchReflections}
        disabled={loading}
      >
        {loading ? "Loading…" : "Show Reflection Log"}
      </button>
      {reflections.length > 0 && (
        <div style={{
          background: "#181833",
          color: "#fff",
          borderRadius: 8,
          padding: 12,
          marginTop: 12,
          maxHeight: 280,
          overflowY: "auto",
          textAlign: "left",
          border: "1px solid #333",
          boxShadow: "0 2px 12px rgba(0,0,0,0.11)",
          fontSize: "1rem"
        }}>
          {reflections.map((ref, i) => (
            <div key={ref.id || i} style={{ margin: "8px 0", color: "#b7ecfc" }}>
              <b>{ref.metadata?.date || ref.created_at?.slice(0, 10) || "Date unknown"}:</b>
              <div style={{ color: "#fff", marginTop: 4, marginBottom: 6 }}>
                {ref.content}
              </div>
              <hr style={{ border: "none", borderTop: "1px solid #333" }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
