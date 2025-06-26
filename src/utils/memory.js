const DIFY_API_KEY = process.env.DIFY_API_KEY;
const DIFY_API_URL = process.env.DIFY_API_URL || "https://api.dify.ai/v1";
const DIFY_DATASET_ID = process.env.DIFY_DATASET_ID;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

function getHeaders() {
  return {
    Authorization: `Bearer ${DIFY_API_KEY}`,
    "Content-Type": "application/json",
  };
}

// Save memory chunk (short-term summary)
async function saveMemory(summary, metadata = {}) {
  const res = await fetch(
    `${DIFY_API_URL}/datasets/${DIFY_DATASET_ID}/document/create_by_text`,
    {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        name: metadata.date || new Date().toISOString(),
        text: summary,
        indexing_technique: "economy",
        process_rule: { mode: "automatic" },
        metadata,
      }),
    }
  );
  if (!res.ok) throw new Error(`Dify saveMemory failed: ${res.status} - ${await res.text()}`);
  return res.json();
}

// Save structured profile (daily, long_term, or core)
async function saveProfile(text, type = "daily_profile", metadata = {}) {
  const date = metadata.date || new Date().toISOString().slice(0, 10);
  // Only core and long_term use fixed name (overwritten); daily uses date-based (accumulates)
  const name = ["core_profile", "long_term_profile"].includes(type)
    ? type
    : `${type}-${date}`;

  const res = await fetch(
    `${DIFY_API_URL}/datasets/${DIFY_DATASET_ID}/document/create_by_text`,
    {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        name,
        text,
        indexing_technique: "economy",
        process_rule: { mode: "automatic" },
        metadata: { ...metadata, type, date },
      }),
    }
  );

  if (!res.ok) {
    throw new Error(`Dify saveProfile failed: ${res.status} - ${await res.text()}`);
  }

  return res.json();
}

// Fetch profiles by type (daily, long_term, core)
async function getProfile(profileType = "daily_profile", limit = 1) {
  const url = new URL(`${DIFY_API_URL}/datasets/${DIFY_DATASET_ID}/documents`);
  url.searchParams.append("metadata.type", profileType);
  url.searchParams.append("order_by", "-created_at");
  url.searchParams.append("limit", limit.toString());

  const res = await fetch(url.toString(), {
    headers: getHeaders(),
    cache: "no-store",
  });

  const raw = await res.text();
  if (!res.ok) throw new Error(`getProfile ${profileType} failed: ${res.status} - ${raw}`);
  const data = JSON.parse(raw);
  return data?.data?.map((d) => d.text) || [];
}

// ... keep the rest of your summarizer logic unchanged
// (summarizeAsProfile, summarizeLongTermProfile, summarizeCoreProfile)

export default {
  saveMemory,
  saveProfile,
  getProfile,
  summarizeAsProfile,
  summarizeLongTermProfile,
  summarizeCoreProfile,
};

