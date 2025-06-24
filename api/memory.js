// /api/memory.js
const DIFY_API_KEY = process.env.DIFY_API_KEY;
const DIFY_API_URL = process.env.DIFY_API_URL || "https://api.dify.ai/v1";
const DIFY_DATASET_ID = process.env.DIFY_DATASET_ID;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// --- Helpers ---
function getHeaders() {
  return {
    "Authorization": `Bearer ${DIFY_API_KEY}`,
    "Content-Type": "application/json"
  };
}

// Save a memory chunk (daily/weekly summary)
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
        indexing_technique: "economy",
        process_rule: { mode: "automatic" },
        metadata,
      })
    }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Dify save failed: ${res.status} - ${err}`);
  }
  return res.json();
}

// Fetch memories (logs, summaries, etc)
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

// Save a profile (user or I.L.I.)
async function saveProfile(profileContent, profileType = "user_profile") {
  if (!DIFY_DATASET_ID) throw new Error("Missing DIFY_DATASET_ID env");
  const res = await fetch(
    `${DIFY_API_URL}/datasets/${DIFY_DATASET_ID}/document/create_by_text`,
    {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        name: profileType,
        text: profileContent,
        indexing_technique: "economy",
        process_rule: { mode: "automatic" },
        metadata: { type: profileType }
      })
    }
  );
  if (!res.ok) throw new Error(`Dify saveProfile failed: ${res.status} - ${await res.text()}`);
  return res.json();
}

// Fetch the latest profile (user or I.L.I.)
async function getProfile(profileType = "user_profile") {
  if (!DIFY_DATASET_ID) throw new Error("Missing DIFY_DATASET_ID env");
  const url = new URL(`${DIFY_API_URL}/datasets/${DIFY_DATASET_ID}/documents`);
  url.searchParams.append("metadata.type", profileType);
  url.searchParams.append("order_by", "-created_at");
  url.searchParams.append("limit", "1");
  const res = await fetch(url, { headers: getHeaders() });
  if (!res.ok) throw new Error(`Dify getProfile failed: ${res.status} - ${await res.text()}`);
  const data = await res.json();
  return data.data?.[0]?.text || "";
}

// Create/Update a user profile with the latest chat log
async function summarizeAsProfile(chatLog, prevProfile = "") {
  const prompt = `
You are I.L.I., a gentle digital companion.

Update the following user profile from today's conversation log.
If nothing has changed for a field, keep it as before.

Profile so far:
${prevProfile || "(empty)"}

Conversation:
${typeof chatLog === "string" ? chatLog : JSON.stringify(chatLog)}

Fill out or update these fields:
Name:
Likes:
Dislikes:
Typical Mood/Emotion:
Current Mood/Emotion:
Recent Highlights (bullet points):
Aspirations/Concerns:
Favorite Topics:
Important Reflections (bullet points):

Return the full updated profile in the same format.
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
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: prompt }
      ],
      max_tokens: 512,
      temperature: 0.7
    })
  });
  if (!res.ok) throw new Error(`OpenAI summarizeAsProfile failed: ${res.status} - ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}

// Optionally: Add similar function for ili_profile (I.L.I.'s self-profile)

// Default summary function for logs
async function summarizeChat(chatLog) {
  const prompt = `
Summarize this conversation between I.L.I. and the user.
Focus on important topics, emotional shifts, and new insights.
Give 3-5 sentences in plain English.

${typeof chatLog === "string" ? chatLog : JSON.stringify(chatLog)}
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

export {
  saveMemory,
  getMemories,
  saveProfile,
  getProfile,
  summarizeAsProfile,
};

export default async function handler(req, res) {
  if (!DIFY_API_KEY || !DIFY_DATASET_ID || !OPENAI_API_KEY) {
    res.status(500).json({
      error: "Missing one or more required environment variables. Check DIFY_API_KEY, DIFY_DATASET_ID, OPENAI_API_KEY."
    });
    return;
  }

  if (req.method === "POST") {
    const { summary, chatLog, metadata, updateProfile } = req.body;
    try {
      let finalSummary = summary;
      if (!finalSummary && chatLog) {
        finalSummary = await summarizeChat(chatLog);
      }
      if (!finalSummary) throw new Error("No summary or chatLog provided.");
      const result =  saveMemory(finalSummary, metadata);

      // If updateProfile flag, also update the user_profile
      if (updateProfile && chatLog) {
        const prevProfile = await getProfile("user_profile");
        const updatedProfile = await summarizeAsProfile(chatLog, prevProfile);
        await saveProfile(updatedProfile, "daily_profile", { date: new Date().toISOString().slice(0,10) });
      }

      res.status(200).json(result);
    } catch (err) {
      console.error("Handler error:", err);
      res.status(500).json({ error: err.message });
    }
  } else if (req.method === "GET") {
    try {
      // GET memory OR profile based on query param
      const { type } = req.query;
      if (type === "user_profile" || type === "ili_profile") {
        const text = await getProfile(type);
        res.status(200).json({ text });
      } else {
        const memories = await getMemories(req.query);
        res.status(200).json(memories);
      }
    } catch (err) {
      console.error("Handler error:", err);
      res.status(500).json({ error: err.message });
    }
  } else {
    res.status(405).end();
  }
}
