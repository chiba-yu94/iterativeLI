import { useState } from "react";

export default function WeeklyReflectionButton({ onSaved }) {
  const [processing, setProcessing] = useState(false);
  const [weekly, setWeekly] = useState(null);

  async function handleWeekly() {
    setProcessing(true);
    // 1. Fetch last 7 daily reflections
    const res = await fetch("/api/memory?type=daily_summary&limit=7");
    const data = await res.json();
    const docs = data.data || data.documents || [];
    if (!docs.length) {
      alert("No daily summaries found!");
      setProcessing(false);
      return;
    }
    // 2. Compose summaries
    const daysText = docs.map(d => `${d.metadata?.date || ""}: ${d.content}`).join("\n");
    // 3. Send to backend for OpenAI summarization (reuse /api/memory)
    const res2 = await fetch("/api/memory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chatLog: daysText,
        metadata: {
          date: new Date().toISOString().split("T")[0],
          type: "weekly_summary"
        }
      })
    });
    if (res2.ok) {
      const saved = await res2.json();
      setWeekly(saved.content || "Weekly summary saved!");
      onSaved && onSaved();
    } else {
      const err = await res2.json();
      setWeekly("Error saving weekly summary: " + (err?.error || res2.status));
    }
    setProcessing(false);
  }

  return (
    <div style={{ margin: "18px 0" }}>
      <button
        style={{
          background: "#333",
          color: "#ffd180",
          border: "1px solid #ffd180",
          borderRadius: 6,
          padding: "8px 16px",
          fontWeight: "bold",
          fontSize: "1rem",
          cursor: "pointer"
        }}
        disabled={processing}
        onClick={handleWeekly}
      >
        {processing ? "Summarizing…" : "Create Weekly Reflection"}
      </button>
      {weekly && (
        <div style={{
          background: "#232350",
          color: "#ffe2b0",
          borderRadius: 8,
          padding: 10,
          marginTop: 10,
          fontSize: "1.07rem"
        }}>
          <b>Weekly Reflection:</b>
          <div style={{ marginTop: 5 }}>{weekly}</div>
        </div>
      )}
    </div>
  );
}
