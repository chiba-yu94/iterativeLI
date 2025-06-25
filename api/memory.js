const DIFY_API_KEY = process.env.DIFY_API_KEY;
const DIFY_API_URL = process.env.DIFY_API_URL || "https://api.dify.ai/v1";
const DIFY_DATASET_ID = process.env.DIFY_DATASET_ID;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

function getHeaders() {
  return {
    "Authorization": `Bearer ${DIFY_API_KEY}`,
    "Content-Type": "application/json"
  };
}

// Save a profile (daily or core)
async function saveProfile(profileContent, profileType = "daily_profile", metadata = {}) {
  const today = metadata.date || new Date().toISOString().slice(0, 10);
  const res = await fetch(`${DIFY_API_URL}/datasets/${DIFY_DATASET_ID}/document/create_by_text`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      name: profileType + "-" + today,
      text: profileContent,
      indexing_technique: "economy",
      process_rule: { mode: "automatic" },
      metadata: { ...metadata, type: profileType, date: today }
    })
  });
  if (!res.ok) throw new Error(`saveProfile failed: ${res.status} - ${await res.text()}`);
  return res.json();
}

// Fetch most recent profile by type
async function getProfile(profileType = "daily_profile") {
  const url = new URL(`${DIFY_API_URL}/datasets/${DIFY_DATASET_ID}/documents`);
  url.searchParams.append("metadata.type", profileType);
  url.searchParams.append("order_by", "-created_at");
  url.searchParams.append("limit", "1");

  const res = await fetch(url, {
    headers: getHeaders(),
    cache: "no-store"
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`[getProfile] Failed to fetch ${profileType}:`, text);
    return "";
  }

  const data = await res.json();
  return data?.data?.[0]?.text || "";
}

// Save chat memory + optionally summarize as profile
async function summarizeChat(chatLog) {
  const prompt = `
Summarize this conversation between I.L.I. and the user.
Focus on insights, moods, values, and new ideas shared.

Return in this format:
- Name:
- Likes:
- Dislikes:
- Current Mood:
- Aspirations:
- Reflections (bullet points):
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
        { role: "system", content: "You are I.L.I.’s memory summarizer." },
        { role: "user", content: prompt + "\n\n" + JSON.stringify(chatLog) }
      ],
      temperature: 0.7,
      max_tokens: 512
    })
  });

  if (!res.ok) throw new Error(`summarizeChat failed: ${res.status} - ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}

export {
  getProfile,
  saveProfile,
  summarizeChat,
};

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const { type = "daily_profile", limit = "1" } = req.query;
      const profile = await getProfile(type);
      res.status(200).json({ text: profile });
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch memory." });
    }
  } else if (req.method === "POST") {
    try {
      const { chatLog, updateProfile } = req.body;

      let summary = "";
      if (updateProfile && chatLog?.length > 0) {
        summary = await summarizeChat(chatLog);
        await saveProfile(summary, "daily_profile");
      }

      res.status(200).json({ ok: true, summary });
    } catch (err) {
      console.error("POST /memory error:", err);
      res.status(500).json({ error: "Memory update failed." });
    }
  } else {
    res.status(405).end();
  }
}
