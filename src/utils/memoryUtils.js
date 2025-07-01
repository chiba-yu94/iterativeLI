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

// Save daily profile AND recent_log together (as one file with metadata)
export async function saveDailyProfileWithLog(profileText, chatLogArr = []) {
  const name = "daily_profile";
  const res = await fetch(
    `${DIFY_API_URL}/datasets/${DIFY_DATASET_ID}/document/create_by_text`,
    {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        name,
        text: profileText,
        indexing_technique: "economy",
        process_rule: { mode: "automatic" },
        metadata: { type: "daily_profile", recent_log: JSON.stringify(chatLogArr) },
      }),
    }
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Dify saveProfile failed: ${res.status} – ${body}`);
  }
  return res.json();
}

// Fetches daily_profile and recent_log from Dify, always falls back to defaults if missing
export async function getDailyProfileWithLog() {
  const url = new URL(`${DIFY_API_URL}/datasets/${DIFY_DATASET_ID}/documents`);
  url.searchParams.append("metadata.type", "daily_profile");
  url.searchParams.append("order_by", "-created_at");
  url.searchParams.append("limit", "1");

  const res = await fetch(url.toString(), { headers: getHeaders(), cache: "no-store" });
  const text = await res.text();
  if (!res.ok) throw new Error(`getProfile daily_profile failed: ${res.status} – ${text}`);
  const data = JSON.parse(text);
  if (!data.data.length) return { text: DEFAULT_PROFILES.daily_profile, recent_log: [] };

  const doc = data.data[0];
  let logArr = [];
  try { logArr = JSON.parse(doc.metadata?.recent_log || "[]"); } catch { logArr = []; }
  return { text: doc.text || DEFAULT_PROFILES.daily_profile, recent_log: logArr };
}

// Fetches latest long/core, always falls back to defaults if missing
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

// Fuse and summarize any two profile texts into a single merged profile (no duplicate blocks)
export async function summarizeFuse(primary, secondary, promptLabel = "Fuse and summarize these profiles:") {
  const prompt = `
${promptLabel}

Merge the two user memory profiles below into a single, up-to-date summary in the structure provided.
- Output ONLY the merged summary. Do NOT include both input blocks or any "Profile 1" or "Profile 2" sections.
- If any field is missing, write "unknown".

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

Profile 1:
${primary || "(unknown)"}

Profile 2:
${secondary || "(unknown)"}
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
