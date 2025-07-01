// src/utils/memoryUtils.js

import { db } from './firebase';
import { doc, setDoc, getDoc } from "firebase/firestore";

// For now, use a single user ID ("default").
// Swap to real Auth UID for multi-user.
const USER_ID = "default";

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

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// --- FIRESTORE CRUD ---

// Save/overwrite a profile (daily, long, core)
// metadata can include { recent_log: JSON.stringify([...]) }
export async function saveProfile(profileText, type = "daily_profile", metadata = {}) {
  const docId = `${USER_ID}_${type}`; // e.g. "default_daily_profile"
  const data = { text: profileText, ...metadata, type };
  await setDoc(doc(db, "profiles", docId), data);
  return data;
}

// Save daily profile with chat log attached (for continuity)
export async function saveDailyProfileWithLog(profileText, chatLogArr = []) {
  return saveProfile(profileText, "daily_profile", { recent_log: JSON.stringify(chatLogArr) });
}

// Get daily profile (with chat log if present)
export async function getDailyProfileWithLog() {
  const docId = `${USER_ID}_daily_profile`;
  const docSnap = await getDoc(doc(db, "profiles", docId));
  if (!docSnap.exists()) return { text: DEFAULT_PROFILES.daily_profile, recent_log: [] };
  const data = docSnap.data();
  let logArr = [];
  try { logArr = JSON.parse(data.recent_log || "[]"); } catch { logArr = []; }
  return { text: data.text || DEFAULT_PROFILES.daily_profile, recent_log: logArr };
}

// Get profile of any type (daily, long_term, core) - returns [profileText]
export async function getProfile(type = "daily_profile", limit = 1) {
  const docId = `${USER_ID}_${type}`;
  const docSnap = await getDoc(doc(db, "profiles", docId));
  if (!docSnap.exists()) return [DEFAULT_PROFILES[type] || ""];
  return [docSnap.data().text];
}

// --- SUMMARIZATION (unchanged) ---

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

// Fuse and summarize two profile texts into one, structure only
export async function summarizeFuse(primary, secondary, promptLabel = "Fuse and summarize these profiles:") {
  const prompt = `
${promptLabel}

Merge the two user memory profiles below into a single, up-to-date summary in the structure provided.
- Output ONLY the merged summary. Do NOT include both input blocks or any "Profile 1", "Profile 2", "PRIMARY", or "SECONDARY" sections.
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

${primary || ""}
${secondary || ""}
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
