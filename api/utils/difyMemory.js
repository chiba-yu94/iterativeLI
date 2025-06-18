// utils/difyMemory.js
const DIFY_API_KEY = process.env.DIFY_API_KEY;
const DIFY_API_URL = process.env.DIFY_API_URL || "https://api.dify.ai/v1";
const DIFY_DATASET_ID = process.env.DIFY_DATASET_ID; // e.g. "3a101068-7573-4354-a7b5-5a85c52ca746"

function getHeaders() {
  return {
    "Authorization": `Bearer ${DIFY_API_KEY}`,
    "Content-Type": "application/json"
  };
}

/**
 * Save a memory summary into the dataset via text ingestion API
 */
export async function saveMemory(summary, metadata = {}) {
  if (!DIFY_DATASET_ID) {
    throw new Error("Missing DIFY_DATASET_ID environment variable");
  }
  const res = await fetch(
    `${DIFY_API_URL}/datasets/${DIFY_DATASET_ID}/document/create_by_text`,
    {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        name: metadata.date || new Date().toISOString(),
        text: summary,
        indexing_technique: "economical", // economical (inverted-index) mode
        process_rule: { mode: "automatic" }
      })
    }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Dify save failed: ${res.status} - ${err}`);
  }
  return res.json();
}

/**
 * Retrieve memory documents from the dataset
 */
export async function getMemories(params = {}) {
  if (!DIFY_DATASET_ID) {
    throw new Error("Missing DIFY_DATASET_ID environment variable");
  }
  const url = new URL(
    `${DIFY_API_URL}/datasets/${DIFY_DATASET_ID}/documents`
  );
  Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v));

  const res = await fetch(url, { headers: getHeaders() });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Dify fetch failed: ${res.status} - ${err}`);
  }
  return res.json();
}
