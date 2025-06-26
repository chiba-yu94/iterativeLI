import memory from "../src/utils/memory.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const today = new Date().toISOString().slice(0, 10);

    // Always fetch today's daily
    const dailyProfileArr = await memory.getProfile("daily_profile", 1);
    const dailyProfile = dailyProfileArr[0] || "";

    // Fetch today's long/core, or generate if missing
    let longProfileArr = await memory.getProfile("long_term_profile", 1);
    let coreProfileArr = await memory.getProfile("core_profile", 1);

    let longProfile = longProfileArr[0] || "";
    let coreProfile = coreProfileArr[0] || "";

    // If today's long/core are missing, generate them now!
    if (!longProfile || !coreProfile) {
      // Fetch up to last 7 daily profiles for summarization
      const last7Daily = await memory.getProfile("daily_profile", 7);
      // Summarize into long-term
      longProfile = await memory.summarizeLongTermProfile(last7Daily);
      await memory.saveProfile(longProfile, "long_term_profile", { date: today });

      // Use previous core profile for continuity
      const prevCoreArr = await memory.getProfile("core_profile", 1);
      const prevCore = prevCoreArr[0] || "";

      // Summarize new core from long + previous core
      coreProfile = await memory.summarizeCoreProfile(longProfile + "\n" + prevCore);
      await memory.saveProfile(coreProfile, "core_profile", { date: today });
    }

    res.status(200).json({
      dailyProfile,
      longProfile,
      coreProfile,
    });
  } catch (error) {
    console.error("[sessionStart] Error:", error.message);
    res.status(500).json({ error: error.message });
  }
}
