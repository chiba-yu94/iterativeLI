// SaveReflectionButton.jsx
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
        margin: "12px auto 0 auto",
        display: "block",
        background: "transparent",
        color: "#888",
        border: "1px solid #444",
        borderRadius: "4px",
        fontSize: "0.85rem",
        padding: "4px 10px",
        cursor: "pointer",
        fontWeight: "normal",
        opacity: saving || pending || messages.length === 0 ? 0.4 : 1,
        transition: "opacity 0.2s, color 0.2s"
      }}
      disabled={saving || pending || messages.length === 0}
      onClick={handleSave}
    >
      {saving ? "Saving…" : "Save Reflection"}
    </button>
  );
}
