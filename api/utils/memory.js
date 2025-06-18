// utils/memory.js

const DIFY_API_KEY = process.env.DIFY_API_KEY;
const DIFY_API_URL = process.env.DIFY_API_URL || "https://api.dify.ai/v1";

export async function saveMemory(summary, metadata = {}) {
  const res = await fetch(`${DIFY_API_URL}/documents`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${DIFY_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      content: summary,
      metadata: metadata
    })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Dify save failed: ${res.status} - ${text}`);
  }
  return res.json();
}

export async function getMemories(params = {}) {
  const url = new URL(`${DIFY_API_URL}/documents`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.append(key, value));
  const res = await fetch(url, {
    headers: {
      "Authorization": `Bearer ${DIFY_API_KEY}`,
      "Content-Type": "application/json"
    }
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Dify fetch failed: ${res.status} - ${text}`);
  }
  return res.json();
}
