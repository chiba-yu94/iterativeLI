import { useEffect, useRef, useState } from "react";

export default function useFirstMessageToday() {
  const [isFirstMessage, setIsFirstMessage] = useState(false);
  const triggeredRef = useRef(false);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const lastSent = localStorage.getItem("ili_last_message_date");

    if (lastSent !== today) {
      setIsFirstMessage(true);
      localStorage.setItem("ili_last_message_date", today);
    } else {
      setIsFirstMessage(false);
    }
    triggeredRef.current = true;
  }, []);

  return isFirstMessage;
}
