// src/utils/memory.js
const DIFY_API_KEY    = process.env.DIFY_API_KEY;
const DIFY_API_URL    = process.env.DIFY_API_URL || "https://api.dify.ai/v1";
const DIFY_DATASET_ID = process.env.DIFY_DATASET_ID;
const OPENAI_API_KEY  = process.env.OPENAI_API_KEY;

function getHeaders() {
  return {
    Authorization: `Bearer ${DIFY_API_KEY}`,
    "Content-Type":  "application/json",
  };
}

export async function saveProfile(text, type = "daily_profile", metadata = {}) {
  // Defensive check
  if (!text || typeof text !== "string" || text.trim() === "") {
    throw new Error("Cannot saveProfile: 'text' is missing or empty");
  }
  const date = metadata.date || new Date().toISOString().slice(0,10);
  const name = (type === "core_profile" || type === "long_term_profile")
    ? type
    : `${type}-${date}`;
  const res = await fetch(
    `${DIFY_API_URL}/datasets/${DIFY_DATASET_ID}/document/create_by_text`,
    {
      method:  "POST",
      headers: getHeaders(),
      body:    JSON.stringify({
        name,
        text,
        indexing_technique: "economy",
        process_rule:      { mode: "automatic" },
        metadata:          { ...metadata, type, date },
      }),
    }
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Dify saveProfile failed: ${res.status} – ${body}`);
  }
  return res.json();
}

// ...rest of your code (unchanged, summarization and getProfile) ...
