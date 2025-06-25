import { useMemory } from "./MemoryProvider";
import { useEffect } from "react";

export default function AutoSaveOnClose() {
  const { chatLog } = useMemory();

  useEffect(() => {
    const saveAndExit = () => {
      if (!chatLog || chatLog.length === 0) return;

      const payload = {
        chatLog,
        updateProfile: true,
        metadata: {
          type: "daily_profile",
          date: new Date().toISOString().slice(0, 10),
        }
      };

      const blob = new Blob([JSON.stringify(payload)], {
        type: "application/json"
      });

      navigator.sendBeacon("/api/memory", blob);
    };

    window.addEventListener("beforeunload", saveAndExit);
    window.addEventListener("unload", saveAndExit);

    return () => {
      window.removeEventListener("beforeunload", saveAndExit);
      window.removeEventListener("unload", saveAndExit);
    };
  }, [chatLog]);

  return null;
}
