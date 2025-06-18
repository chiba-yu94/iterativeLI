const DIFY_API_KEY = process.env.DIFY_API_KEY;
const DIFY_API_URL = process.env.DIFY_API_URL || "https://api.dify.ai/v1";

export async function saveMemory(summary, meta = {}) {
  const res = await fetch(`${DIFY_API_URL}/documents`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${DIFY_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      content: summary,
      metadata: meta
    })
  });
  if (!res.ok) throw new Error("Failed to save memory: " + res.status);
  return res.json();
}

// More functions: fetchMemory, listMemories, etc.
