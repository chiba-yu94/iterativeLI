// src/utils/memory.js

// ==== CONFIG ====
const DIFY_API_KEY = process.env.DIFY_API_KEY;
const DIFY_API_URL = process.env.DIFY_API_URL || "https://api.dify.ai/v1";
const DIFY_DATASET_ID = process.env.DIFY_DATASET_ID;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// ==== HELPERS ====
function getHeaders() {
  return {
    Authorization: `Bearer ${DIFY_API_KEY}`,
    "Content-Type": "application/json",
  };
}

// ==== DIFY SAVE/GET ====

async function saveMemory(summary, metadata = {}) {
  const res = await fetch(
    `${DIFY_API_URL}/datasets/${DIFY_DATASET_ID}/document/create_by_text`,
    {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        name: metadata.date || new Date().toISOString(),
        text: summary,
        indexing_technique: "economy",
        process_rule: { mode: "automatic" },
        metadata,
      }),
    }
  );
  if (!res.ok) throw new Error(`Dify saveMemory failed: ${res.status} - ${await res.text()}`);
  return res.json();
}

// Save structured profile (daily, long_term, or core)
async function saveProfile(text, type = "daily_profile", metadata = {}) {
  const date = metadata.date || new Date().toISOString().slice(0, 10);
  // Only core/long_term use fixed name (overwritten); daily uses date-based (accumulates)
  const random = Math.random().toString(36).slice(2, 7); // prevents Dify name collision if saving multiple daily
  const name = ["core_profile", "long_term_profile"].includes(type)
    ? type
    : `${type}-${date}-${random}`;

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
    throw new Error(`Dify saveProfile failed: ${res.status} - ${await res.text()}`);
  }
  return res.json();
}

// Fetch profiles by type (daily, long_term, core)
async function getProfile(profileType = "daily_profile", limit = 1) {
  const url = new URL(`${DIFY_API_URL}/datasets/${DIFY_DATASET_ID}/documents`);
  url.searchParams.append("metadata.type", profileType);
  url.searchParams.append("order_by", "-created_at");
  url.searchParams.append("limit", limit.toString());

  const res = await fetch(url.toString(), {
    headers: getHeaders(),
    cache: "no-store",
  });
  const raw = await res.text();
  if (!res.ok) throw new Error(`getProfile ${profileType} failed: ${res.status} - ${raw}`);
  const data = JSON.parse(raw);
  return data?.data?.map((d) => d.text) || [];
}

// Fetch all memories with any Dify search param
async function getMemories(params = {}) {
  const url = new URL(`${DIFY_API_URL}/datasets/${DIFY_DATASET_ID}/documents`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v));
  const res = await fetch(url.toString(), {
    headers: getHeaders(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Dify getMemories failed: ${res.status} - ${await res.text()}`);
  return res.json();
}

// ==== GPT SUMMARIZERS ====

// 1. Summarize today's chat log into a daily profile
async function summarizeAsProfile(chatLog) {
  const prompt = `
You are I.L.I., a reflective digital companion. Summarize the following conversation log as a daily personal profile. 
Use the format below. Only fill in what is mentioned in the conversation.

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

Conversation Log:
${typeof chatLog === "string" ? chatLog : JSON.stringify(chatLog, null, 2)}
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
      temperature: 0.5,
      max_tokens: 800,
    }),
  });
  const data = await res.json();
  return data?.choices?.[0]?.message?.content?.trim() || "";
}

// 2. Summarize the last 7 daily profiles into long-term memory
async function summarizeLongTermProfile(dailyProfiles) {
  const joined = Array.isArray(dailyProfiles) ? dailyProfiles.join("\n---\n") : String(dailyProfiles);
  const prompt = `
You are I.L.I., a gentle digital companion. Below are the last 7 daily profiles.
Synthesize these into a single, coherent long-term memory. 
Avoid repeating the same name multiple times. Summarize recurring themes, emotions, and important changes.

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

Daily Profiles:
${joined}
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
      temperature: 0.5,
      max_tokens: 1200,
    }),
  });
  const data = await res.json();
  return data?.choices?.[0]?.message?.content?.trim() || "";
}

// 3. Summarize long-term memory into persistent core identity
async function summarizeCoreProfile(longTermText) {
  const prompt = `
You are I.L.I. The following is a long-term memory of the user.
Please extract the most essential facts that define their core personality and preferences.
Keep format below, bullet where appropriate.

Format:
Name:
Likes:
Dislikes:
Typical Mood/Emotion:
Aspirations/Concerns:
Important Reflections (bullet points):

${longTermText}
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
      temperature: 0.5,
      max_tokens: 1024,
    }),
  });
  const data = await res.json();
  return data?.choices?.[0]?.message?.content?.trim() || "";
}

// ==== EXPORT ====
export default {
  saveMemory,
  getMemories,
  saveProfile,
  getProfile,
  summarizeAsProfile,
  summarizeLongTermProfile,
  summarizeCoreProfile,
};
