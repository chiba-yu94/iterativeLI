// src/utils/memoryUtils.js

export const DEFAULT_PROFILES = {
  daily_profile: `
Name: unknown
Typical Mood/Emotion: unknown
Current Mood/Emotion: unknown
Likes: unknown
Dislikes: unknown
Recent Highlights (bullet points): unknown
Aspirations/Concerns: unknown
Important Reflections (bullet points): unknown
`.trim(),
  long_term_profile: `
Name: unknown
Typical Mood/Emotion: unknown
Likes: unknown
Dislikes: unknown
Recent Highlights (bullet points): unknown
Aspirations/Concerns: unknown
Favorite Topics: unknown
Important Reflections (bullet points): unknown
`.trim(),
  core_profile: `
Name: unknown
Preferred tone: unknown
Known interests: unknown
Important reflections: unknown
`.trim()
};

const DIFY_API_KEY    = process.env.DIFY_API_KEY;
const DIFY_API_URL    = process.env.DIFY_API_URL || "https://api.dify.ai/v1";
const DIFY_DATASET_ID = process.env.DIFY_DATASET_ID;
const OPENAI_API_KEY  = process.env.OPENAI_API_KEY;

function getHeaders() {
  return {
    Authorization: `Bearer ${DIFY_API_KEY}`,
    "Content-Type": "application/json",
  };
}

export async function saveProfile(content, type = "daily_profile", metadata = {}) {
  if (!content || typeof content !== "string" || !content.trim()) {
    throw new Error("Cannot saveProfile: 'summary' or 'text' is missing or empty");
  }
  const date = metadata.date || new Date().toISOString().slice(0, 10);
  const name = (type === "core_profile" || type === "long_term_profile")
    ? type
    : `${type}-${date}`;
  const res = await fetch(
    `${DIFY_API_URL}/datasets/${DIFY_DATASET_ID}/document/create_by_text`,
    {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        name,
        text: content,
        indexing_technique: "economy",
        process_rule: { mode: "automatic" },
        metadata: { ...metadata, type, date },
      }),
    }
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Dify saveProfile failed: ${res.status} – ${body}`);
  }
  return res.json();
}

export async function getProfile(type = "daily_profile", limit = 1) {
  const url = new URL(`${DIFY_API_URL}/datasets/${DIFY_DATASET_ID}/documents`);
  url.searchParams.append("metadata.type", type);
  url.searchParams.append("order_by", "-created_at");
  url.searchParams.append("limit", limit.toString());

  const res = await fetch(url.toString(), { headers: getHeaders(), cache: "no-store" });
  const text = await res.text();
  if (!res.ok) throw new Error(`getProfile ${type} failed: ${res.status} – ${text}`);
  const data = JSON.parse(text);
  const profiles = data.data.map((d) => d.text).filter(Boolean);
  // If no profile found, use default
  if (!profiles.length) {
    return [DEFAULT_PROFILES[type] || ""];
  }
  return profiles;
}

// Summarize chat log into daily profile fields (structured summary)
export async function summarizeAsProfile(chatLog) {
  const prompt = `
You are I.L.I., a gentle digital companion.
Summarize the following conversation into a daily user profile.
For each field, if not clearly mentioned, write "unknown".

Conversation:
${JSON.stringify(chatLog)}

Format:
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
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.6,
      max_tokens: 512,
    }),
  });
  const j = await res.json();
  return j.choices[0].message.content.trim();
}

export async function summarizeFuse(primary, secondary, promptLabel = "Fuse and summarize these profiles:") {
  const prompt = `
${promptLabel}
===
PRIMARY:
${primary || "(unknown)"}

SECONDARY:
${secondary || "(unknown)"}

Summarize them into the structure below.
If any field is missing, write "unknown". Do not invent data.

[use previous profile's structure here if you want fields to match]
  `;
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 1024,
    }),
  });
  const j = await res.json();
  return j.choices[0].message.content.trim();
}