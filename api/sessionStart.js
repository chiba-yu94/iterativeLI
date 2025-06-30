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

    // 1. Fetch latest daily profile (just 1)
    let [latestDaily = DEFAULT_PROFILES.daily_profile] = await getProfile("daily_profile", 1);

    // 2. Fetch long-term and core (1 each)
    let [longTerm = DEFAULT_PROFILES.long_term_profile] = await getProfile("long_term_profile", 1);
    let [core = DEFAULT_PROFILES.core_profile] = await getProfile("core_profile", 1);

    // 3. If long/core are default, fuse to create them
    let didFuse = false;
    if (longTerm === DEFAULT_PROFILES.long_term_profile || core === DEFAULT_PROFILES.core_profile) {
      // a) Fuse today's daily and previous long-term to make new long-term
      longTerm = await summarizeFuse(latestDaily, longTerm, "Fuse daily memory and previous long-term memory.");
      await saveProfile(longTerm, "long_term_profile", { date: today });

      // b) Fuse new long-term and previous core to make new core
      core = await summarizeFuse(longTerm, core, "Fuse long-term and previous core memory.");
      await saveProfile(core, "core_profile", { date: today });
      didFuse = true;
    }

    res.status(200).json({
      onboarding: false,
      dailyProfile: latestDaily,
      longProfile: longTerm,
      coreProfile: core,
      didFuse
    });
  } catch (err) {
    console.error("[api/sessionStart] error:", err);
    res.status(500).json({ error: err.message });
  }
}
