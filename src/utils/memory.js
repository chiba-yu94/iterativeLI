// src/utils/memory.js
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

// 1) Save a single profile document (daily, long_term, or core)
export async function saveProfile(text, type = "daily_profile", metadata = {}) {
  const date = metadata.date || new Date().toISOString().slice(0, 10);
  // overwrite long_term_profile & core_profile each day; accumulate daily_profile
  const name =
    type === "daily_profile"
      ? `${type}-${date}`
      : type; 

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
    throw new Error(`saveProfile failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

// 2) Fetch the most-recent N profiles of a given type
export async function getProfile(profileType = "daily_profile", limit = 1) {
  const url = new URL(`${DIFY_API_URL}/datasets/${DIFY_DATASET_ID}/documents`);
  url.searchParams.set("metadata.type", profileType);
  url.searchParams.set("order_by", "-created_at");
  url.searchParams.set("limit", String(limit));

  const res = await fetch(url.toString(), {
    headers: getHeaders(),
    cache: "no-store",
  });
  if (!res.ok) {
    const raw = await res.text();
    throw new Error(`getProfile ${profileType} failed: ${res.status} ${raw}`);
  }
  const { data } = await res.json();
  return data.map((d) => d.text);
}

// 3) Summarizers
export async function summarizeAsProfile(chatLog, prev = "") {
  const prompt = `
You are I.L.I., a gentle digital companion.
Create a new daily user profile based on today's conversation.

Profile so far:
${prev || "(empty)"}

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
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 512,
    }),
  });
  const j = await r.json();
  return j.choices?.[0]?.message?.content?.trim() || "";
}

export async function summarizeLongTermProfile(profiles) {
  const prompt = `
You are I.L.I.
Here are up to 7 daily user profiles.

Please summarize their themes, recurring emotions, patterns, and reflections.
Preserve structure in the same format as daily.

${profiles.join("\n\n---\n\n")}
`;
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
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
  const j = await r.json();
  return j.choices?.[0]?.message?.content?.trim() || "";
}

export async function summarizeCoreProfile(longTermText) {
  const prompt = `
You are I.L.I.
The following is a long-term memory of the user.

Please extract the most essential facts that define their core personality and preferences,
merging with any existing core if provided.

${longTermText}
`;
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json`,
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.6,
      max_tokens: 1024,
    }),
  });
  const j = await r.json();
  return j.choices?.[0]?.message?.content?.trim() || "";
}
