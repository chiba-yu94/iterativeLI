// src/utils/memory.js

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
  // Accepts either summary or text as content
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
  return data.data.map((d) => d.text);
}

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
      max_tokens: 512,
    }),
  });
  const j = await res.json();
  return j.choices[0].message.content.trim();
}

// --- GUARD AGAINST EMPTY OR SINGLE PROFILE ---
export async function summarizeLongTermProfile(profiles) {
  if (!profiles || profiles.length === 0) {
    // Nothing to summarize—don't hallucinate!
    return "No long-term memory yet. (Please complete onboarding!)";
  }
  if (profiles.length === 1) {
    // Just return the single profile (don't call GPT)
    return profiles[0];
  }
  const prompt = `
You are I.L.I.
Here are up to 7 daily user profiles.

Please summarize their themes, recurring emotions, patterns, and reflections.
If any field is missing, leave it blank. Do not invent new names or details.

Preserve structure and return in this format:

Name:
Likes:
Dislikes:
Typical Mood/Emotion:
Recent Highlights (bullet points):
Aspirations/Concerns:
Favorite Topics:
Important Reflections (bullet points):

${profiles.join("\n\n---\n\n")}
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

export async function summarizeCoreProfile(longProfiles, prevCore = "") {
  // Accept either a string or an array
  let longText = Array.isArray(longProfiles)
    ? longProfiles.join("\n\n")
    : (longProfiles || "");
  if (!longText || longText.trim().length === 0) {
    // Nothing to summarize
    return "No core memory yet.";
  }
  const prompt = `
You are I.L.I.
The following is the user's long-term memory and/or previous core memory.

${longText}
${prevCore ? `\n\nPrevious core:\n${prevCore}` : ""}

Please extract only the most essential facts, leaving blank anything not present.
Do not invent data or names.

Format:
Name:
Likes:
Dislikes:
Typical Mood/Emotion:
Aspirations/Concerns:
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
      max_tokens: 1024,
    }),
  });
  const j = await res.json();
  return j.choices[0].message.content.trim();
}
