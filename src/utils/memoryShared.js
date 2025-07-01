// src/utils/memoryShared.js

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

// Summarization helper for OpenAI (no Firebase used here)
export async function summarizeAsProfile(chatLog, apiKey) {
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
      Authorization: `Bearer ${apiKey}`,
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

export async function summarizeFuse(primary, secondary, apiKey, promptLabel = "Fuse and summarize these profiles:") {
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
      Authorization: `Bearer ${apiKey}`,
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
