import { useState } from "react";

export default function WeeklyReflectionButton({ onSaved }) {
  const [processing, setProcessing] = useState(false);
  const [weekly, setWeekly] = useState(null);

  async function handleWeekly() {
    setProcessing(true);
    // 1. Fetch last 7 daily profiles
    const res = await fetch("/api/memory?type=daily_profile&limit=7");
    const data = await res.json();
    const docs = data.profiles || [];
    if (!docs.length) {
      alert("No daily profiles found!");
      setProcessing(false);
      return;
    }
    // 2. Combine their texts
    const combinedDailyProfilesText = docs.map(d => d.text).join("\n\n");

    // 3. POST to /api/memory to create core (long-term) profile
    const res2 = await fetch("/api/memory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        coreProfile: combinedDailyProfilesText
      })
    });
    if (res2.ok) {
      const result = await res2.json();
      setWeekly(result.coreSummary || "Long-term profile saved!");
      onSaved && onSaved();
    } else {
      const err = await res2.json();
      setWeekly("Error saving core profile: " + (err?.error || res2.status));
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
        {processing ? "Summarizing…" : "Summarize to Long-term Profile"}
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
          <b>Long-term Profile:</b>
          <div style={{ marginTop: 5 }}>{weekly}</div>
        </div>
      )}
    </div>
  );
}
