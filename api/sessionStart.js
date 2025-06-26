// api/sessionStart.js
import {
  getProfile,
  summarizeLongTermProfile,
  summarizeCoreProfile,
  saveProfile
} from "../src/utils/memory.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const today = new Date().toISOString().slice(0,10);

    // 1) Always load today's daily (if any)
    const dailyArr = await getProfile("daily_profile", 1);
    const dailyProfile = dailyArr[0] || "";

    // 2) Try to load existing long & core
    let longArr = await getProfile("long_term_profile", 1);
    let coreArr = await getProfile("core_profile", 1);

    let longProfile = longArr[0] || "";
    let coreProfile = coreArr[0] || "";

    // 3) If missing either, regenerate now
    if (!longProfile || !coreProfile) {
      // fetch last 7 daily
      const last7 = await getProfile("daily_profile", 7);

      // rebuild long + save
      longProfile = await summarizeLongTermProfile(last7);
      await saveProfile(longProfile, "long_term_profile", { date: today });

      // rebuild core + save
      const prevCore = coreProfile;
      coreProfile = await summarizeCoreProfile(longProfile, prevCore);
      await saveProfile(coreProfile, "core_profile", { date: today });
    }

    res.status(200).json({ dailyProfile, longProfile, coreProfile });
  } catch (err) {
    console.error("[api/sessionStart] error:", err);
    res.status(500).json({ error: err.message });
  }
}
