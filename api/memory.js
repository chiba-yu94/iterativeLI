const DIFY_API_KEY = process.env.DIFY_API_KEY;
const DIFY_API_URL = process.env.DIFY_API_URL || "https://api.dify.ai/v1";
const DIFY_DATASET_ID = process.env.DIFY_DATASET_ID;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

function getHeaders() {
  return {
    Authorization: `Bearer ${DIFY_API_KEY}`,
    "Content-Type": "application/json"
  };
}

async function saveMemory(summary, metadata = {}) {
  if (!DIFY_DATASET_ID) throw new Error("Missing DIFY_DATASET_ID");
  const res = await fetch(`${DIFY_API_URL}/datasets/${DIFY_DATASET_ID}/document/create_by_text`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      name: metadata.date || new Date().toISOString(),
      text: summary,
      indexing_technique: "economy",
      process_rule: { mode: "automatic" },
      metadata,
    })
  });
  if (!res.ok) throw new Error(`saveMemory failed: ${res.status} - ${await res.text()}`);
  return res.json();
}

async function getMemories(params = {}) {
  if (!DIFY_DATASET_ID) throw new Error("Missing DIFY_DATASET_ID");
  const url = new URL(`${DIFY_API_URL}/datasets/${DIFY_DATASET_ID}/documents`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v));
  const res = await fetch(url, { headers: getHeaders(), cache: "no-store" });
  if (!res.ok) throw new Error(`getMemories failed: ${res.status} - ${await res.text()}`);
  return res.json();
}

async function saveProfile(profileText, type = "daily_profile", metadata = {}) {
  const today = metadata.date || new Date().toISOString().slice(0, 10);
  const res = await fetch(`${DIFY_API_URL}/datasets/${DIFY_DATASET_ID}/document/create_by_text`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      name: `${type}-${today}`,
      text: profileText,
      indexing_technique: "economy",
      process_rule: { mode: "automatic" },
      metadata: { ...metadata, type, date: today }
    })
  });
  if (!res.ok) throw new Error(`saveProfile failed: ${res.status} - ${await res.text()}`);
  return res.json();
}

async function getProfile(type = "daily_profile") {
  const url = new URL(`${DIFY_API_URL}/datasets/${DIFY_DATASET_ID}/documents`);
  url.searchParams.append("metadata.type", type);
  url.searchParams.append("order_by", "-created_at");
  url.searchParams.append("limit", "1");

  const res = await fetch(url, { headers: getHeaders(), cache: "no-store" });
  if (!res.ok) throw new Error(`getProfile failed: ${res.status} - ${await res.text()}`);

  const json = await res.json();
  const profile = json?.data?.[0]?.text || "";
  return profile;
}

async function summarizeChat(chatLog) {
  const prompt = `
Summarize this conversation between I.L.I. and the user.
Focus on key emotions, preferences, goals, and insights.

${typeof chatLog === "string" ? chatLog : JSON.stringify(chatLog)}
`;
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a warm, reflective assistant creating short summaries." },
        { role: "user", content: prompt }
      ],
      max_tokens: 256,
      temperature: 0.7
    })
  });

  if (!res.ok) throw new Error(`summarizeChat failed: ${res.status} - ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}

async function summarizeAsProfile(chatLog, previousProfile = "") {
  const prompt = `
You are I.L.I., a gentle digital companion.

Create a structured daily profile based on this conversation.

Previous Profile:
${previousProfile || "(none)"}

Today's Conversation:
${typeof chatLog === "string" ? chatLog : JSON.stringify(chatLog)}

Fields:
Name:
Likes:
Dislikes:
Typical Mood/Emotion:
Current Mood/Emotion:
Recent Highlights (bullet points):
Aspirations/Concerns:
Favorite Topics:
Important Reflections (bullet points):
`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are I.L.I.'s daily profile summarizer." },
        { role: "user", content: prompt }
      ],
      max_tokens: 512,
      temperature: 0.7
    })
  });

  if (!res.ok) throw new Error(`summarizeAsProfile failed: ${res.status} - ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}

async function summarizeCoreProfile(allDailyProfilesText) {
  const prompt = `
You are I.L.I.

Create a long-term core profile from this series of daily reflections.
Capture consistent traits, growth trends, and emotional themes.

${allDailyProfilesText}
`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are I.L.I.'s identity weaver." },
        { role: "user", content: prompt }
      ],
      max_tokens: 512,
      temperature: 0.7
    })
  });

  if (!res.ok) throw new Error(`summarizeCoreProfile failed: ${res.status} - ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}

// --- API HANDLER ---
export default async function handler(req, res) {
  try {
    if (!DIFY_API_KEY || !DIFY_DATASET_ID || !OPENAI_API_KEY) {
      throw new Error("Missing required environment variables");
    }

    const { method } = req;
    if (method === "POST") {
      const { summary, chatLog, metadata, updateProfile, coreProfile } = req.body;

      if (!summary && !chatLog && !coreProfile) {
        throw new Error("No input content provided");
      }

      let result = null;
      if (summary && !coreProfile) {
        result = await saveMemory(summary, metadata);
      }

      if (updateProfile && chatLog) {
        const today = new Date().toISOString().slice(0, 10);
        const updated = await summarizeAsProfile(chatLog);
        await saveProfile(updated, "daily_profile", { date: today });
      }

      if (coreProfile) {
        const core = await summarizeCoreProfile(coreProfile);
        await saveProfile(core, "core_profile");
        return res.status(200).json({ coreSummary: core });
      }

      res.status(200).json(result || { ok: true });
    } else if (method === "GET") {
      const { type, limit } = req.query;
      if (type === "daily_profile" || type === "core_profile") {
        const profile = await getProfile(type);
        res.status(200).json({ profile });
      } else {
        const memories = await getMemories(req.query);
        res.status(200).json(memories);
      }
    } else {
      res.status(405).end();
    }
  } catch (err) {
    console.error("Handler error:", err);
    res.status(500).json({ error: err.message });
  }
}

export {
  saveMemory,
  getMemories,
  saveProfile,
  getProfile,
  summarizeChat,
  summarizeAsProfile,
  summarizeCoreProfile
};
