// /api/sessionStart.js
import { getProfile } from "./memory.js";

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    // Fetch the latest daily profile ("daily_profile")
    const dailyProfile = await getProfile("daily_profile");
    // Fetch the latest core profile ("core_profile")
    const coreProfile = await getProfile("core_profile");

    res.status(200).json({
      dailyProfile: dailyProfile || "",
      coreProfile: coreProfile || ""
    });
  } catch (error) {
    console.error("[sessionStart] Error:", error);
    res.status(500).json({ error: error.message });
  }
}
