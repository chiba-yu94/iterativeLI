import { useEffect } from "react";
import { useMemory } from "./MemoryProvider";

export default function AutoSaveOnClose() {
  const { chatLog, dailyProfile, longTermProfile, setLastSavedDate } = useMemory();

  useEffect(() => {
    const saveMemory = async () => {
      try {
        const today = new Date().toISOString().slice(0, 10);
        const savedDate = localStorage.getItem("ili-last-saved-date");

        const res = await fetch("/api/memory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chatLog,
            updateProfile: true,
            coreProfile: !savedDate || savedDate !== today ? longTermProfile : null,
          }),
        });

        const data = await res.json();
        if (data.coreSummary || data.ok) {
          localStorage.setItem("ili-last-saved-date", today);
          setLastSavedDate(today);
        }
      } catch (err) {
        console.error("[AutoSave] Memory upload failed:", err);
      }
    };

    const handleUnload = () => {
      if (chatLog.length > 0) saveMemory();
    };

    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [chatLog, dailyProfile, longTermProfile]);

  return null;
}
