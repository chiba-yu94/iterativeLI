// api/sessionStart.js
import {
  getProfile,
  saveProfile,
  summarizeFuse,
  DEFAULT_PROFILES
} from "../src/utils/memoryUtils.js";

// Helper to extract ISO date from a profile's name or metadata
function extractDateFromNameOrMetadata(nameOrDoc) {
  if (!nameOrDoc) return "";
  // Try ISO string in name (e.g. "daily_profile-2025-06-30")
  if (typeof nameOrDoc === "string") {
    const match = nameOrDoc.match(/\d{4}-\d{2}-\d{2}/);
    return match ? match[0] : "";
  }
  // If doc object with metadata.date
  if (nameOrDoc.metadata && nameOrDoc.metadata.date) return nameOrDoc.metadata.date;
  return "";
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const today = new Date().toISOString().slice(0, 10);

    // 1. Fetch latest daily profile (1)
    let [latestDaily = DEFAULT_PROFILES.daily_profile] = await getProfile("daily_profile", 1);

    // 2. Fetch long-term and core profile (1 each)
    let [longTerm = DEFAULT_PROFILES.long_term_profile] = await getProfile("long_term_profile", 1);
    let [core = DEFAULT_PROFILES.core_profile] = await getProfile("core_profile", 1);

    // For date comparison: fetch names as well
    // If your getProfile can return objects, fetch those, else just parse from name string.
    // If not, you can add a getProfileDoc() that returns {name, text, metadata}
    // For now, we assume name is string.

    // 3. Compare dates for update logic
    const dailyDate = extractDateFromNameOrMetadata(latestDaily.name || latestDaily);
    const longDate  = extractDateFromNameOrMetadata(longTerm.name  || longTerm);
    const coreDate  = extractDateFromNameOrMetadata(core.name  || core);

    // 4. Fuse logic: If long/core are default or latest daily is newer than long/core, update!
    let didFuse = false;
    if (
      longTerm === DEFAULT_PROFILES.long_term_profile ||
      core === DEFAULT_PROFILES.core_profile ||
      (dailyDate && dailyDate > (longDate || "")) ||
      (dailyDate && dailyDate > (coreDate || ""))
    ) {
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
      dailyProfile: typeof latestDaily === "object" ? latestDaily.text : latestDaily,
      longProfile: typeof longTerm === "object" ? longTerm.text : longTerm,
      coreProfile: typeof core === "object" ? core.text : core,
      didFuse
    });
  } catch (err) {
    console.error("[api/sessionStart] error:", err);
    res.status(500).json({ error: err.message });
  }
}
