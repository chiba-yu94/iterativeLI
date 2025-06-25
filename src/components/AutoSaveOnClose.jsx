import { useMemory } from "./MemoryProvider";
import { useEffect } from "react";

export default function AutoSaveOnClose() {
  const { dailyProfile } = useMemory();

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (dailyProfile && dailyProfile.length > 0) {
        const data = JSON.stringify({
          summary: dailyProfile,
          metadata: {
            type: "daily_profile",
            date: new Date().toISOString().slice(0, 10),
          },
        });
        const blob = new Blob([data], { type: "application/json" });
        navigator.sendBeacon("/api/memory", blob);
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [dailyProfile]);

  return null;
}
