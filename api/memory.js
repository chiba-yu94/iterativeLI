// api/memory.js
import {
  summarizeAsProfile,
  getProfile,
  summarizeLongTermProfile,
  summarizeCoreProfile,
  saveProfile,
} from "../src/utils/memory.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const today = new Date().toISOString().slice(0,10);
    const { chatLog, updateProfile = false } = req.body;
    if (!Array.isArray(chatLog) || chatLog.length === 0) {
      return res.status(400).json({ error: "Invalid or empty chatLog" });
    }

    // 1) Generate & save today's daily_summary
    const dailyText = await summarizeAsProfile(chatLog);
    await saveProfile(dailyText, "daily_profile", { date: today });

    let coreSummary = null;
    if (updateProfile) {
      // 2) Build long_term from last 7 daily
      const last7 = await getProfile("daily_profile", 7);
      const longText = await summarizeLongTermProfile(last7);
      await saveProfile(longText, "long_term_profile", { date: today });

      // 3) Build new core from (long + previous core)
      const prevCoreArr = await getProfile("core_profile", 1);
      const prevCore = prevCoreArr[0] || "";
      coreSummary = await summarizeCoreProfile(longText, prevCore);
      await saveProfile(coreSummary, "core_profile", { date: today });
    }

    res.status(200).json({ ok: true, coreSummary });
  } catch (err) {
    console.error("[api/memory] error:", err);
    res.status(500).json({ error: err.message });
  }
}
