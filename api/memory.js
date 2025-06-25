const DIFY_API_KEY = process.env.DIFY_API_KEY;
const DIFY_API_URL = process.env.DIFY_API_URL || "https://api.dify.ai/v1";
const DIFY_DATASET_ID = process.env.DIFY_DATASET_ID;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// ----------- UTILITY HELPERS -----------
function getHeaders() {
  return {
    "Authorization": `Bearer ${DIFY_API_KEY}`,
    "Content-Type": "application/json"
  };
}

// Save a memory chunk (e.g. daily summary paragraph)
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
    const text = await res.text();
    throw new Error(`Dify fetch failed: ${res.status} - ${text}`);
  }
  return res.json();
}

// Fetch any memories/documents
async function getMemories(params = {}) {
  if (!DIFY_DATASET_ID) throw new Error("Missing DIFY_DATASET_ID environment variable");
  const url = new URL(`${DIFY_API_URL}/datasets/${DIFY_DATASET_ID}/documents`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v));
  const res = await fetch(url, {
    headers: getHeaders(),
    cache: "no-store", // ✅ Prevent 304 caching
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Dify fetch failed: ${res.status} - ${err}`);
  }
  return res.json();
}

// Save a structured profile (one per day, with type)
async function saveProfile(profileContent, profileType = "daily_profile", metadata = {}) {
  if (!DIFY_DATASET_ID) throw new Error("Missing DIFY_DATASET_ID env");
  const today = metadata.date || new Date().toISOString().slice(0, 10);
  const res = await fetch(
    `${DIFY_API_URL}/datasets/${DIFY_DATASET_ID}/document/create_by_text`,
    {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        name: profileType + "-" + today,
        text: profileContent,
        indexing_technique: "economy",
        process_rule: { mode: "automatic" },
        metadata: { ...metadata, type: profileType, date: today }
      })
    }
  );
  if (!res.ok) throw new Error(`Dify saveProfile failed: ${res.status} - ${await res.text()}`);
  return res.json();
}

// Fetch the latest profile of a given type
async function getProfile(profileType = "daily_profile") {
  if (!DIFY_DATASET_ID) throw new Error("Missing DIFY_DATASET_ID env");
  const url = new URL(`${DIFY_API_URL}/datasets/${DIFY_DATASET_ID}/documents`);
  url.searchParams.append("metadata.type", profileType);
  url.searchParams.append("order_by", "-created_at");
  url.searchParams.append("limit", "1");
  const res = await fetch(url, {
    headers: getHeaders(),
    cache: "no-store", // ✅ Prevent 304 caching
  });
  if (!res.ok) throw new Error(`Dify getProfile failed: ${res.status} - ${await res.text()}`);
  const data = await res.json();
  return data.data?.[0]?.text || "";
}

// GPT: Generate a structured daily profile
async function summarizeAsProfile(chatLog, prevProfile = "") {
  const prompt = `
You are I.L.I., a gentle digital companion.

Create a new daily user profile based on today's conversation log.
Each day, save a *new* profile (do not overwrite).
Fill out these fields; if something was not mentioned, leave it blank.

Profile so far:
${prevProfile || "(empty)"}

Conversation:
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

Return the full daily profile, in this format.
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

// Optionally, for weekly/long-term summary:
async function summarizeCoreProfile(dailyProfilesText) {
  const prompt = `
You are I.L.I.

Summarize these daily user profiles into a single, long-term identity profile.
Highlight repeated themes, emotional trends, likes/dislikes, and growth.
Return the summary in the same fields as before.

${dailyProfilesText}
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
        { role: "system", content: "You are I.L.I.'s memory summarizer." },
        { role: "user", content: prompt }
      ],
      max_tokens: 512,
      temperature: 0.7
    })
  });
  if (!res.ok) throw new Error(`OpenAI summarizeCoreProfile failed: ${res.status} - ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}

export {
  saveMemory,
  getMemories,
  saveProfile,
  getProfile,
  summarizeAsProfile,
  summarizeCoreProfile,
};

// --- API HANDLER ---
export default async function handler(req, res) {
  if (!DIFY_API_KEY || !DIFY_DATASET_ID || !OPENAI_API_KEY) {
    res.status(500).json({
      error: "Missing one or more required environment variables. Check DIFY_API_KEY, DIFY_DATASET_ID, OPENAI_API_KEY."
    });
    return;
  }

  if (req.method === "POST") {
    const { summary, chatLog, metadata, updateProfile, coreProfile } = req.body;
    try {
      let finalSummary = summary;
      if (!finalSummary && chatLog) {
        finalSummary = await summarizeChat(chatLog);
      }
      if (!finalSummary) throw new Error("No summary or chatLog provided.");

      // Optionally save daily summary paragraph
      let result;
      if (!coreProfile) {
        result = await saveMemory(finalSummary, metadata);
      }

      // Save daily profile (always as new doc)
      if (updateProfile && chatLog) {
        const today = new Date().toISOString().slice(0,10);
        const updatedProfile = await summarizeAsProfile(chatLog);
        await saveProfile(updatedProfile, "daily_profile", { date: today });
      }

      // If building a long-term/core profile from daily stack
      if (coreProfile) {
        const coreSummary = await summarizeCoreProfile(coreProfile);
        await saveProfile(coreSummary, "core_profile");
        res.status(200).json({ coreSummary });
        return;
      }

      res.status(200).json(result || { ok: true });
    } catch (err) {
      console.error("Handler error:", err);
      res.status(500).json({ error: err.message });
    }
  } else if (req.method === "GET") {
    try {
      // GET memory OR profile(s)
      const { type, limit } = req.query;
      if (type === "core_profile" || type === "daily_profile") {
        const url = new URL(`${DIFY_API_URL}/datasets/${DIFY_DATASET_ID}/documents`);
        url.searchParams.append("metadata.type", type);
        url.searchParams.append("order_by", "-created_at");
        if (limit) url.searchParams.append("limit", limit);
        const resp = await fetch(url, {
          headers: getHeaders(),
          cache: "no-store" // ✅ prevent stale or empty 304 response
        });
        if (!resp.ok) throw new Error("Failed to fetch profiles.");
        const data = await resp.json();
        res.status(200).json({ profiles: data.data || [] });
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

// For backward-compatibility: simple summary
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
