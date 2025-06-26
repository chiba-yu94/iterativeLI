export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const DIFY_API_KEY = process.env.DIFY_API_KEY;
  const DIFY_API_URL = process.env.DIFY_API_URL || "https://api.dify.ai/v1";
  const DIFY_DATASET_ID = process.env.DIFY_DATASET_ID;

  async function getProfile(profileType = "daily_profile", limit = 1) {
    const url = new URL(`${DIFY_API_URL}/datasets/${DIFY_DATASET_ID}/documents`);
    url.searchParams.append("metadata.type", profileType);
    url.searchParams.append("order_by", "-created_at");
    url.searchParams.append("limit", limit.toString());

    const headers = {
      Authorization: `Bearer ${DIFY_API_KEY}`,
      "Content-Type": "application/json",
    };

    const r = await fetch(url.toString(), { headers });
    const raw = await r.text();
    if (!r.ok) throw new Error(`getProfile ${profileType} failed: ${r.status} - ${raw}`);
    const data = JSON.parse(raw);
    return data?.data?.map((d) => d.text) || [];
  }

  try {
    const dailyProfile = await getProfile("daily_profile");
    const coreProfile = await getProfile("core_profile");

    res.status(200).json({
      dailyProfile: dailyProfile || "",
      coreProfile: coreProfile || "",
    });
  } catch (error) {
    console.error("[sessionStart] Error:", error.message);
    res.status(500).json({ error: error.message });
  }
}
