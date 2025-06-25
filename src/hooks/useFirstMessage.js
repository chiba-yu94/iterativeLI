import { useEffect, useRef, useState } from "react";

export function useFirstMessage() {
  const [isFirstMessage, setIsFirstMessage] = useState(false);
  const hasTriggered = useRef(false);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const stored = localStorage.getItem("ili-last-message-date");

    if (stored !== today && !hasTriggered.current) {
      hasTriggered.current = true;
      setIsFirstMessage(true);
      localStorage.setItem("ili-last-message-date", today);
    }
  }, []);

  return isFirstMessage;
}
