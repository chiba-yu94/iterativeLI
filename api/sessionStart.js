// api/sessionStart.js
import {
  getProfile,
  saveProfile,
  summarizeFuse,
  DEFAULT_PROFILES
} from "../src/utils/memoryUtils.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const today = new Date().toISOString().slice(0, 10);

    // 1. Fetch current profiles
    let [dailyProfile = DEFAULT_PROFILES.daily_profile] = await getProfile("daily_profile", 1);
    let [longProfile = DEFAULT_PROFILES.long_term_profile] = await getProfile("long_term_profile", 1);
    let [coreProfile = DEFAULT_PROFILES.core_profile] = await getProfile("core_profile", 1);

    let didFuse = false;

    // Only update/fuse if dailyProfile is NOT the default (real summary)
    const isDefaultDaily = !dailyProfile || dailyProfile.trim() === "" || dailyProfile.trim() === DEFAULT_PROFILES.daily_profile;
    if (!isDefaultDaily) {
      // a) Fuse today's daily and previous long-term to make new long-term
      longProfile = await summarizeFuse(dailyProfile, longProfile, "Fuse daily memory and previous long-term memory.");
      await saveProfile(longProfile, "long_term_profile", { date: today });

      // b) Fuse new long-term and previous core to make new core
      coreProfile = await summarizeFuse(longProfile, coreProfile, "Fuse long-term and previous core memory.");
      await saveProfile(coreProfile, "core_profile", { date: today });
      didFuse = true;
    }

    res.status(200).json({
      onboarding: false,
      dailyProfile,
      longProfile,
      coreProfile,
      didFuse
    });
  } catch (err) {
    console.error("[api/sessionStart] error:", err);
    res.status(500).json({ error: err.message });
  }
}
