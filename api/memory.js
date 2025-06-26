// /api/memory.js
import memory from "../src/utils/memory.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const today = new Date().toISOString().slice(0, 10);
    const { chatLog, updateProfile = false, coreProfile = null } = req.body;

    if (!Array.isArray(chatLog) || chatLog.length === 0) {
      return res.status(400).json({ error: "Invalid or empty chatLog" });
    }

    // 1. Generate daily profile
    const dailyText = await memory.summarizeAsProfile(chatLog);
    const dailySave = await memory.saveProfile(dailyText, "daily_profile", { date: today });

    let coreSummary = null;

    // 2. Optionally generate long-term and core profile
    if (updateProfile && coreProfile === null) {
      const past7 = await memory.getProfile("daily_profile", 7);
      const longTerm = await memory.summarizeLongTermProfile(past7);
      await memory.saveProfile(longTerm, "long_term_profile", { date: today });

      coreSummary = await memory.summarizeCoreProfile(longTerm);
      await memory.saveProfile(coreSummary, "core_profile", { date: today });
    }

    res.status(200).json({ ok: true, coreSummary });
  } catch (err) {
    console.error("[memory.js] Error saving memory:", err);
    res.status(500).json({ error: err.message });
  }
}
