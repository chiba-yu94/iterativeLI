// api/memory.js
import {
  saveProfile,
  getProfile,
  DEFAULT_PROFILES
} from "../src/utils/memoryUtils.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const today = new Date().toISOString().slice(0, 10);
    const { summary } = req.body;

    // 1. Save daily-profile
    await saveProfile(summary, "daily_profile", { date: today });

    // 2. Ensure long/core profiles exist as default if missing
    let [longTerm] = await getProfile("long_term_profile", 1);
    if (!longTerm || longTerm.trim() === "") {
      await saveProfile(DEFAULT_PROFILES.long_term_profile, "long_term_profile", { date: today });
    }
    let [core] = await getProfile("core_profile", 1);
    if (!core || core.trim() === "") {
      await saveProfile(DEFAULT_PROFILES.core_profile, "core_profile", { date: today });
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("[api/memory] error:", err);
    res.status(500).json({ error: err.message });
  }
}
