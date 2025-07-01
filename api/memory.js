// api/memory.js
// CORRECT for API!
import {
  saveProfile,
  getProfile,
  DEFAULT_PROFILES,
  summarizeAsProfile,
  summarizeFuse
} from "../src/utils/memoryUtils.server.js";

// Use real userId from Auth in the future; for now, default is fine
const RECENT_LOG_LIMIT = 10;
const USER_ID = "default"; // Replace with actual user ID for multi-user

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { chatLog } = req.body;

    // 1. Keep the last N chat turns as rolling log
    let rollingLog = Array.isArray(chatLog) && chatLog.length > 0
      ? chatLog.slice(-RECENT_LOG_LIMIT)
      : [];

    // 2. Summarize chatLog as daily_profile (if available)
    let dailySummary = "";
    if (rollingLog.length > 0) {
      dailySummary = await summarizeAsProfile(rollingLog);
    }
    if (!dailySummary || !dailySummary.trim()) {
      // No real chat? Don't update daily/long/core—just keep previous memory
      return res.status(200).json({ ok: true, info: "No real conversation to save." });
    }

    // 3. Save daily_profile (with recent_log as metadata for session restore)
    await saveProfile(dailySummary, "daily_profile", { recent_log: JSON.stringify(rollingLog), userId: USER_ID });

    // 4. Get previous long/core profiles (from Firestore)
    let [prevLong = DEFAULT_PROFILES.long_term_profile] = await getProfile("long_term_profile", 1, USER_ID);
    let [prevCore = DEFAULT_PROFILES.core_profile] = await getProfile("core_profile", 1, USER_ID);

    // 5. Fuse daily + prevLong → new long_term_profile
    let longSummary = await summarizeFuse(dailySummary, prevLong, "Fuse daily memory and previous long-term memory.");
    await saveProfile(longSummary, "long_term_profile", { userId: USER_ID });

    // 6. Fuse new long_term + prevCore → new core_profile
    let coreSummary = await summarizeFuse(longSummary, prevCore, "Fuse long-term and previous core memory.");
    await saveProfile(coreSummary, "core_profile", { userId: USER_ID });

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("[api/memory] error:", err);
    res.status(500).json({ error: err.message });
  }
}
