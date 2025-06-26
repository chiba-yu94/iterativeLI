// pages/api/sessionStart.js
import memory from "../../src/utils/memory.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  try {
    const today = new Date().toISOString().slice(0, 10);

    // 1️⃣ Always fetch today's daily_profile
    const [dailyArr, longArr, coreArr] = await Promise.all([
      memory.getProfile("daily_profile", 1),
      memory.getProfile("long_term_profile", 1),
      memory.getProfile("core_profile", 1),
    ]);
    let dailyProfile = dailyArr[0] || "";
    let longProfile  = longArr[0]  || "";
    let coreProfile  = coreArr[0]  || "";

    // 2️⃣ If missing long or core → regenerate
    if (!longProfile || !coreProfile) {
      // last 7 daily summaries (could be fewer)
      const last7 = await memory.getProfile("daily_profile", 7);

      // create new long-term
      longProfile = await memory.summarizeLongTermProfile(last7);
      await memory.saveProfile(longProfile, "long_term_profile", { date: today });

      // include previous core for continuity
      const prevCoreArr = await memory.getProfile("core_profile", 1);
      const prevCoreTxt = prevCoreArr[0] || "";

      // create new core
      coreProfile = await memory.summarizeCoreProfile(longProfile + "\n" + prevCoreTxt);
      await memory.saveProfile(coreProfile, "core_profile", { date: today });
    }

    res.status(200).json({ dailyProfile, longProfile, coreProfile });
  } catch (err) {
    console.error("[sessionStart] Error:", err);
    res.status(500).json({ error: err.message });
  }
}
