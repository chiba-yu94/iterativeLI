// api/memory.js
import {
  saveProfile,
  getProfile,
  summarizeAsProfile,
  summarizeLongTermProfile,
  summarizeCoreProfile,
} from "../src/utils/memory.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end();
  }

  const { chatLog, updateProfile = false } = req.body;
  if (!Array.isArray(chatLog) || chatLog.length === 0) {
    return res.status(400).json({ error: "chatLog must be a non-empty array" });
  }

  const today = new Date().toISOString().slice(0, 10);

  try {
    // 1) Daily
    const dailyText = await summarizeAsProfile(chatLog);
    await saveProfile(dailyText, "daily_profile", { date: today });

    let coreSummary = null;

    // 2) If requested, regenerate long-term & core
    if (updateProfile) {
      const last7 = await getProfile("daily_profile", 7);
      const longText = await summarizeLongTermProfile(last7);
      await saveProfile(longText, "long_term_profile", { date: today });

      const prevCoreArr = await getProfile("core_profile", 1);
      const prevCore = prevCoreArr[0] || "";
      const newCore = await summarizeCoreProfile(longText + "\n" + prevCore);
      await saveProfile(newCore, "core_profile", { date: today });
      coreSummary = newCore;
    }

    return res.status(200).json({ ok: true, coreSummary });
  } catch (err) {
    console.error("[api/memory] error:", err);
    return res.status(500).json({ error: err.message });
  }
}
