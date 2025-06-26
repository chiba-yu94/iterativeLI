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

    // 1) Fetch ALL daily_profile docs (max 7)
    const dailyArr = await getProfile("daily_profile", 7);

    if (!dailyArr || dailyArr.length === 0) {
      // No memory at all yet: trigger onboarding
      return res.status(200).json({
        onboarding: true,
        dailyProfile: "",
        longProfile: "",
        coreProfile: ""
      });
    }

    // 2) Try to load existing long & core
    let longArr = await getProfile("long_term_profile", 1);
    let coreArr = await getProfile("core_profile", 1);

    let longProfile = longArr[0] || "";
    let coreProfile = coreArr[0] || "";

    // 3) If missing either, regenerate (with guards in memory.js)
    if (!longProfile || !coreProfile) {
      longProfile = await summarizeLongTermProfile(dailyArr);
      await saveProfile(longProfile, "long_term_profile", { date: today });

      coreProfile = await summarizeCoreProfile([longProfile]);
      await saveProfile(coreProfile, "core_profile", { date: today });
    }

    res.status(200).json({
      onboarding: false,
      dailyProfile: dailyArr[0], // Most recent daily
      longProfile,
      coreProfile,
    });
  } catch (err) {
    console.error("[api/sessionStart] error:", err);
    res.status(500).json({ error: err.message });
  }
}
