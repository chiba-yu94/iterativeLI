import { saveMemory, getMemories } from './utils/difyMemory';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Summarize chat log with OpenAI
async function summarizeChat(chatLog) {
  const prompt = `
Summarize this conversation between I.L.I. and the user.
Focus on important topics, emotional shifts, and new insights.
Give 3-5 sentences in plain English.

${JSON.stringify(chatLog)}
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

export default async function handler(req, res) {
  if (req.method === "POST") {
    // Accepts: { summary?, chatLog?, metadata }
    const { summary, chatLog, metadata } = req.body;
    try {
      let finalSummary = summary;
      if (!finalSummary && chatLog) {
        finalSummary = await summarizeChat(chatLog);
      }
      if (!finalSummary) throw new Error("No summary or chatLog provided.");
      const result = await saveMemory(finalSummary, metadata);
      res.status(200).json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  } else if (req.method === "GET") {
    try {
      // e.g., /api/memory?type=daily_summary
      const memories = await getMemories(req.query);
      res.status(200).json(memories);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  } else {
    res.status(405).end();
  }
}
