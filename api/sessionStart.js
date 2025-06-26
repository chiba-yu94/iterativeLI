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

    // 1) Fetch up to 14 recent documents of daily_profile type
    // (Just in case: some days could have multiple daily_profile entries)
    let rawDaily = await getProfile("daily_profile", 14);

    // If getProfile ever returns more than just text, use .data or .map(doc => doc.name,...)
    // For now, filter for "daily_profile" in case any extra junk comes back
    const dailyArr = rawDaily.filter((entry) => {
      // Accept if it's a string and matches pattern
      if (typeof entry === "string") {
        return entry.trim().length > 0;
      }
      // If it's an object, check name starts with "daily_profile"
      if (entry && entry.name && entry.name.startsWith("daily_profile")) {
        return true;
      }
      return false;
    });

    if (!dailyArr || dailyArr.length === 0) {
      // No daily_profile files found! Trigger onboarding.
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
