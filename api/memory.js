// /api/memory.js
const DIFY_API_KEY = process.env.DIFY_API_KEY;
const DIFY_API_URL = process.env.DIFY_API_URL || "https://api.dify.ai/v1";
const DIFY_DATASET_ID = process.env.DIFY_DATASET_ID; // e.g. "3a101068-7573-4354-a7b5-5a85c52ca746"
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

function getHeaders() {
  return {
    "Authorization": `Bearer ${DIFY_API_KEY}`,
    "Content-Type": "application/json"
  };
}

async function saveMemory(summary, metadata = {}) {
  if (!DIFY_DATASET_ID) throw new Error("Missing DIFY_DATASET_ID environment variable");
  const res = await fetch(
    `${DIFY_API_URL}/datasets/${DIFY_DATASET_ID}/document/create_by_text`,
    {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        name: metadata.date || new Date().toISOString(),
        text: summary,
        indexing_technique: "economical",
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

async function getMemories(params = {}) {
  if (!DIFY_DATASET_ID) throw new Error("Missing DIFY_DATASET_ID environment variable");
  const url = new URL(`${DIFY_API_URL}/datasets/${DIFY_DATASET_ID}/documents`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v));
  const res = await fetch(url, { headers: getHeaders() });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Dify fetch failed: ${res.status} - ${err}`);
  }
  return res.json();
}

async function summarizeChat(chatLog) {
  const prompt = `
Summarize this conversation between I.L.I. and the user.
Focus on important topics, emotional shifts, and new insights.
Give 3-5 sentences in plain English.

${JSON.stringify(chatLog)}
  `;
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a gentle digital companion who creates concise daily reflections for the user." },
        { role: "user", content: prompt }
      ],
      max_tokens: 256,
      temperature: 0.7
    })
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI summarize failed: ${res.status} - ${errText}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}

// Main API handler
export default async function handler(req, res) {
  if (req.method === "POST") {
    const { summary, chatLog, metadata } = req.body;
    try {
      let finalSummary = summary;
      if (!finalSummary && chatLog) {
        finalSummary = await summarizeChat(chatLog);
      }
      if (!finalSummary) throw new Error("No summary or chatLog provided.");
      const result = await saveMemory(finalSummary, metadata);
      res.status(200).json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  } else if (req.method === "GET") {
    try {
      const memories = await getMemories(req.query);
      res.status(200).json(memories);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  } else {
    res.status(405).end();
  }
}
