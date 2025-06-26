// api/sessionStart.js
import {
  saveProfile,
  getProfile,
  summarizeLongTermProfile,
  summarizeCoreProfile,
} from "../src/utils/memory.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).end();
  }

  const today = new Date().toISOString().slice(0, 10);

  try {
    // 1) Fetch today’s daily (if any)
    const dailyArr = await getProfile("daily_profile", 1);
    const dailyProfile = dailyArr[0] || "";

    // 2) Fetch today’s long & core
    let longArr = await getProfile("long_term_profile", 1);
    let coreArr = await getProfile("core_profile", 1);
    let longProfile = longArr[0] || "";
    let coreProfile = coreArr[0] || "";

    // 3) If missing, regenerate now
    if (!longProfile || !coreProfile) {
      const last7 = await getProfile("daily_profile", 7);
      longProfile = await summarizeLongTermProfile(last7);
      await saveProfile(longProfile, "long_term_profile", { date: today });

      const prevCore = coreProfile;
      coreProfile = await summarizeCoreProfile(longProfile + "\n" + prevCore);
      await saveProfile(coreProfile, "core_profile", { date: today });
    }

    res.status(200).json({ dailyProfile, longProfile, coreProfile });
  } catch (err) {
    console.error("[api/sessionStart] error:", err);
    res.status(500).json({ error: err.message });
  }
}
