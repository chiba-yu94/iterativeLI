// api/sessionStart.js
import { getProfile, DEFAULT_PROFILES } from "../src/utils/memoryUtils.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    // Fetch one of each (if not found, use default)
    let [dailyProfile = DEFAULT_PROFILES.daily_profile] = await getProfile("daily_profile", 1);
    let [longProfile = DEFAULT_PROFILES.long_term_profile] = await getProfile("long_term_profile", 1);
    let [coreProfile = DEFAULT_PROFILES.core_profile] = await getProfile("core_profile", 1);

    res.status(200).json({
      onboarding: false,
      dailyProfile,
      longProfile,
      coreProfile,
    });
  } catch (err) {
    console.error("[api/sessionStart] error:", err);
    res.status(500).json({ error: err.message });
  }
}
