// api/sessionStart.js

/*
  /api/sessionStart

  - Fetches up to 14 latest daily_profile docs from Dify memory.
  - If no daily_profile exists:
      - Returns default profiles (all "unknown" fields), no onboarding.
  - If daily profiles exist:
      - Fetches most recent long_term_profile and core_profile.
      - If either is missing, generates them:
          - long_term_profile: summarizes last 7 daily profiles.
          - core_profile: fuses long_term_profile and previous core.
      - Saves new profiles back to Dify.
  - Returns all profiles as JSON for frontend use.
  - Local storage is NOT used in this file; only on the frontend.
*/


import {
  getProfile,
  summarizeLongTermProfile,
  summarizeCoreProfile,
  saveProfile,
  DEFAULT_PROFILES
} from "../src/utils/memoryUtils.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const today = new Date().toISOString().slice(0,10);

    let rawDaily = await getProfile("daily_profile", 14);
    const dailyArr = rawDaily.filter(entry => {
      if (typeof entry === "string") return entry.trim().length > 0;
      if (entry && entry.name && entry.name.startsWith("daily_profile")) return true;
      return false;
    });

    // NEW: If empty, return defaults
    if (!dailyArr || dailyArr.length === 0) {
      return res.status(200).json({
        onboarding: false,
        dailyProfile: DEFAULT_PROFILES.daily_profile,
        longProfile: DEFAULT_PROFILES.long_term_profile,
        coreProfile: DEFAULT_PROFILES.core_profile
      });
    }

    let longArr = await getProfile("long_term_profile", 1);
    let coreArr = await getProfile("core_profile", 1);
    let longProfile = longArr[0] || "";
    let coreProfile = coreArr[0] || "";

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
