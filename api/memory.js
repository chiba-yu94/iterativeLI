// api/memory.js
import {
  saveProfile,
  getProfile,
  DEFAULT_PROFILES,
  summarizeAsProfile,
  summarizeFuse
} from "../src/utils/memoryUtils.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { chatLog } = req.body;

    // 1. Summarize chatLog as daily_profile
    let dailySummary = "";
    if (Array.isArray(chatLog) && chatLog.length > 0) {
      dailySummary = await summarizeAsProfile(chatLog);
    }
    if (!dailySummary || !dailySummary.trim()) {
      dailySummary = DEFAULT_PROFILES.daily_profile;
    }
    await saveProfile(dailySummary, "daily_profile");

    // 2. Get previous long/core
    let [prevLong = DEFAULT_PROFILES.long_term_profile] = await getProfile("long_term_profile", 1);
    let [prevCore = DEFAULT_PROFILES.core_profile] = await getProfile("core_profile", 1);

    // 3. Fuse daily + prevLong → new long_term_profile
    let longSummary = await summarizeFuse(dailySummary, prevLong, "Fuse daily memory and previous long-term memory.");
    await saveProfile(longSummary, "long_term_profile");

    // 4. Fuse new long_term + prevCore → new core_profile
    let coreSummary = await summarizeFuse(longSummary, prevCore, "Fuse long-term and previous core memory.");
    await saveProfile(coreSummary, "core_profile");

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("[api/memory] error:", err);
    res.status(500).json({ error: err.message });
  }
}
