import { useState } from "react";

export default function SaveReflectionButton({ messages, pending, onSaved }) {
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const res = await fetch("/api/memory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chatLog: messages,
        metadata: {
          date: new Date().toISOString().split("T")[0],
          type: "daily_summary"
        },
        updateProfile: true
      })
    });
    setSaving(false);
    if (res.ok) {
      alert("Reflection saved to I.L.I.'s memory!");
      onSaved && onSaved();
    } else {
      const err = await res.json();
      alert("Error saving memory: " + (err?.error || res.status));
    }
  }

  return (
    <button
      style={{
        margin: "18px auto 0 auto",
        display: "block",
        background: "#181833",
        color: "#9ff",
        border: "1px solid #3b5bdb",
        borderRadius: "6px",
        fontSize: "1.1rem",
        padding: "10px 18px",
        cursor: "pointer",
        fontWeight: "bold",
        opacity: saving || pending || messages.length === 0 ? 0.5 : 1,
        transition: "background 0.2s, color 0.2s"
      }}
      disabled={saving || pending || messages.length === 0}
      onClick={handleSave}
    >
      {saving ? "Saving…" : "Save Reflection"}
    </button>
  );
}
