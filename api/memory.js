// api/memory.js
import {
  summarizeAsProfile,
  getProfile,
  summarizeLongTermProfile,
  summarizeCoreProfile,
  saveProfile,
} from "../src/utils/memoryUtils.js"; // << updated import!

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const today = new Date().toISOString().slice(0, 10);
    const { chatLog, text, summary, updateProfile = false } = req.body;

    // Accept either 'summary', 'text', or fallback to summarized chatLog
    let content = "";
    if (typeof summary === "string" && summary.trim()) {
      content = summary.trim();
    } else if (typeof text === "string" && text.trim()) {
      content = text.trim();
    } else if (Array.isArray(chatLog) && chatLog.length > 0) {
      content = (await summarizeAsProfile(chatLog)).trim();
    }

    if (!content) {
      return res.status(400).json({
        error:
          "No valid memory content provided: please include 'summary', 'text', or a non-empty chatLog.",
      });
    }

    // Save daily profile
    await saveProfile(content, "daily_profile", { date: today });

    let coreSummary = null;
    if (updateProfile) {
      const last7 = await getProfile("daily_profile", 7);
      const longText = await summarizeLongTermProfile(last7);
      await saveProfile(longText, "long_term_profile", { date: today });

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
